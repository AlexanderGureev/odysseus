import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { toFixed } from 'utils';
import { logger } from 'utils/logger';

import { ActionPayload, FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',

  startAt: null,
  bufferingTime: 0,
  initialBufferTime: null,
  bufferedEnd: 0,
  loadedPercent: 0,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    DO_INIT: 'REBUFFERING_INIT',
  },
  REBUFFERING_INIT: {
    REBUFFERING_INIT_RESOLVE: 'DISABLED',
  },
  READY: {
    BUFFERING_START: 'BUFFERING',
    AD_BREAK_STARTED: 'DISABLED',
    BUFFER_UPDATE: null,
  },
  BUFFERING: {
    BUFFERING_END: 'READY',
    AD_BREAK_STARTED: 'DISABLED',
  },
  DISABLED: {
    START_PLAYBACK: 'READY',
    SET_INITIAL_BUFFERING_TIME: null,
  },
};

const buffering = createSlice({
  name: 'buffering',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (['RESET_PLAYBACK_RESOLVE'].includes(type)) return { ...initialState, step: 'READY' };
      if (['CHANGE_TRACK'].includes(type)) return { ...initialState, step: 'DISABLED' };
      if (next === undefined) return state;

      logger.log('[FSM]', 'buffering', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'BUFFERING_START':
          return { ...state, step, startAt: Date.now() };
        case 'BUFFERING_END':
          const { bufferingTime } = payload;

          return {
            ...state,
            step,
            startAt: null,
            initialBufferTime: state.initialBufferTime === null ? bufferingTime : state.initialBufferTime,
            bufferingTime: toFixed(state.bufferingTime + bufferingTime),
          };
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, buffering.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().buffering;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        REBUFFERING_INIT: () => {
          services.playerService.on('progress', (payload) => {
            if (getState().buffering.step === 'READY') {
              dispatch(
                sendEvent({
                  type: 'BUFFER_UPDATE',
                  payload,
                })
              );
            }
          });

          services.playerService.on('waiting', () => {
            if (getState().buffering.step === 'READY') {
              dispatch(
                sendEvent({
                  type: 'BUFFERING_START',
                })
              );
            }
          });

          services.playerService.on('canplay', () => {
            const { step, startAt, initialBufferTime } = getState().buffering;

            // при старте нет буферизации, первый ивент сразу canplay
            if (!startAt && initialBufferTime === null) {
              dispatch(
                sendEvent({
                  type: 'SET_INITIAL_BUFFERING_TIME',
                  payload: {
                    initialBufferTime: 0,
                  },
                })
              );
            }

            if (step === 'BUFFERING') {
              const diff = startAt ? (Date.now() - startAt) / 1000 : 0;

              dispatch(
                sendEvent({
                  type: 'BUFFERING_END',
                  payload: {
                    bufferingTime: diff,
                  },
                })
              );
            }
          });

          dispatch(
            sendEvent({
              type: 'REBUFFERING_INIT_RESOLVE',
            })
          );
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'buffering', step);
        effect();
      }
    },
  });

export default {
  ...buffering,
  config,
  addMiddleware,
};
