import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { startListening } from 'store/middleware';
import type { AppEvent, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { ActionPayload, FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',

  currentTime: null,
  duration: null,
  remainingTime: null,

  pausedAt: null,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    DO_INIT: 'PLAYBACK_INIT',
  },
  PLAYBACK_INIT: {
    PLAYBACK_INIT_RESOLVE: 'READY',
  },
  READY: {
    START_PLAYBACK: 'PLAY_PENDING',
  },
  AD_BREAK: {
    START_PLAYBACK: 'PLAY_PENDING',
  },
  CHECK_TOKEN_PENDING: {
    CHECK_TOKEN_RESOLVE: 'CHECK_MANIFEST_PENDING',
    CHECK_TOKEN_REJECT: 'IDLE', // TODO CHECK CASE
  },
  CHECK_MANIFEST_PENDING: {
    CHECK_MANIFEST_RESOLVE: 'PLAY_PENDING',
    CHECK_MANIFEST_REJECT: 'IDLE',
  },
  PLAY_PENDING: {
    DO_PLAY_RESOLVE: 'PLAYING',
    DO_PAUSE: 'PAUSED',
  },
  PLAYING: {
    DO_PAUSE: 'PAUSED',
    AD_BREAK_STARTED: 'AD_BREAK',
    TIME_UPDATE: null,
    VIDEO_END: 'END',
  },
  PAUSED: {
    DO_PLAY: 'CHECK_TOKEN_PENDING',
    TIME_UPDATE: null,
  },
  END: {
    CHECK_POST_ROLL_RESOLVE: 'RESET',
    AD_BREAK_END: 'RESET',
  },
  RESET: {
    RESET_RESOLVE: 'PAUSED',
  },
};

const playback = createSlice({
  name: 'playback',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<ActionPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'playback', `${state.step} -> ${type} -> ${next}`);

      const step = next || state.step;

      switch (type) {
        case 'START_PLAYBACK':
        case 'RESET_RESOLVE':
          return { ...state, step, ...payload, pausedAt: null };
        case 'DO_PAUSE':
          return { ...state, step, ...payload, pausedAt: Date.now() };
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => currentState.playback.step !== prevState.playback.step,
    effect: (action, api) => {
      const { dispatch, getState, extra: services } = api;

      const { step } = getState().playback;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        PLAYBACK_INIT: () => {
          opts.services.playerService.on('timeupdate', (payload) => {
            dispatch(
              sendEvent({
                type: 'TIME_UPDATE',
                payload,
              })
            );
          });

          opts.services.playerService.on('ended', () => {
            dispatch(
              sendEvent({
                type: 'VIDEO_END',
              })
            );
          });

          dispatch(
            sendEvent({
              type: 'PLAYBACK_INIT_RESOLVE',
            })
          );
        },
        CHECK_TOKEN_PENDING: () => {
          dispatch(
            sendEvent({
              type: 'CHECK_TOKEN',
            })
          );
        },
        CHECK_MANIFEST_PENDING: () => {
          dispatch(
            sendEvent({
              type: 'CHECK_MANIFEST',
            })
          );
        },
        PLAY_PENDING: async () => {
          await opts.services.playerService.play();
          dispatch(
            sendEvent({
              type: 'DO_PLAY_RESOLVE',
            })
          );
        },
        PAUSED: () => {
          opts.services.playerService.pause();
        },
        RESET: () => {
          opts.services.playerService.setCurrentTime(0);
          dispatch(
            sendEvent({
              type: 'RESET_RESOLVE',
            })
          );
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'playback', step);
        effect();
      }
    },
  });

export default {
  ...playback,
  config,
  addMiddleware,
};
