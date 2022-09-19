import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { isIOS } from 'react-device-detect';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    DO_INIT: 'REWIND_INIT',
  },
  REWIND_INIT: {
    REWIND_INIT_RESOLVE: 'DISABLED',
  },
  READY: {
    SEEK: 'SEEK_START',
    SET_SEEKING: 'SEEKING',
    AD_BREAK_STARTED: 'DISABLED',
  },
  SEEK_START: {
    SEEK_STARTED: 'SEEKING',
  },
  SEEKING: {
    SEEK: 'SEEK_START',
    SEEK_END: 'READY',
  },
  DISABLED: {
    START_PLAYBACK: 'READY',
    RESET_PLAYBACK_RESOLVE: 'READY',
  },
};

const rewind = createSlice({
  name: 'rewind',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (['CHANGE_TRACK'].includes(type)) return { ...initialState, step: 'DISABLED' };
      if (next === undefined) return state;

      logger.log('[FSM]', 'rewind', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, rewind.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().rewind;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        REWIND_INIT: () => {
          services.playerService.on('seeking', () => {
            const {
              rewind: { step },
              fullscreen,
            } = getState();

            if (step === 'READY' && isIOS && fullscreen.step === 'FULLSCREEN') {
              dispatch(
                sendEvent({
                  type: 'SET_SEEKING',
                })
              );
            }
          });

          services.playerService.on('seeked', () => {
            const {
              rewind: { step },
            } = getState();

            if (step === 'SEEKING') {
              dispatch(
                sendEvent({
                  type: 'SEEK_END',
                })
              );
            }
          });

          dispatch(
            sendEvent({
              type: 'REWIND_INIT_RESOLVE',
            })
          );
        },
        SEEK_START: () => {
          const { currentTime } = getState().playback;

          const {
            payload: { meta },
          } = action as PayloadAction<{
            meta: { to: number };
          }>;

          services.playerService.setCurrentTime(meta.to);
          dispatch(
            sendEvent({
              type: 'SEEK_STARTED',
              meta: {
                to: meta.to,
                from: currentTime || 0,
              },
            })
          );
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'rewind', step);
        effect();
      }
    },
  });

export default {
  ...rewind,
  config,
  addMiddleware,
};
