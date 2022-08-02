import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { startListening } from 'store/middleware';
import type { AppEvent, FSMConfig } from 'store/types';
import { toFixed } from 'utils';
import { logger } from 'utils/logger';

import { ActionPayload, FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',

  startAt: null,
  bufferingTime: 0,
  initialBufferTime: null,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    DO_INIT: 'REBUFFERING_INIT',
  },
  REBUFFERING_INIT: {
    REBUFFERING_INIT_RESOLVE: 'READY',
  },
  READY: {
    BUFFERING_START: 'BUFFERING',
    AD_BREAK_STARTED: 'DISABLED',
  },
  BUFFERING: {
    BUFFERING_END: 'READY',
    AD_BREAK_STARTED: 'DISABLED',
  },
  DISABLED: {
    START_PLAYBACK: 'READY',
  },
};

const buffering = createSlice({
  name: 'buffering',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<ActionPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'buffering', `${state.step} -> ${type} -> ${next}`);

      const step = next || state.step;

      switch (type) {
        case 'BUFFERING_START':
          return { ...state, step, startAt: Date.now() };
        case 'BUFFERING_END':
          const diff = state.startAt ? (Date.now() - state.startAt) / 1000 : 0;

          return {
            ...state,
            step,
            startAt: null,
            initialBufferTime: state.initialBufferTime === null ? diff : state.initialBufferTime,
            bufferingTime: toFixed(state.bufferingTime + diff),
          };
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => currentState.buffering.step !== prevState.buffering.step,
    effect: (action, api) => {
      const { dispatch, getState, extra: services } = api;

      const { step } = getState().buffering;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        REBUFFERING_INIT: () => {
          opts.services.playerService.on('waiting', () => {
            // const { step } = getState().playback;
            // if (step === 'AD_BREAK') return;

            dispatch(
              sendEvent({
                type: 'BUFFERING_START',
              })
            );
          });

          opts.services.playerService.on('canplay', () => {
            // const { step } = getState().playback;
            // if (step === 'AD_BREAK') return;

            dispatch(
              sendEvent({
                type: 'BUFFERING_END',
              })
            );
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