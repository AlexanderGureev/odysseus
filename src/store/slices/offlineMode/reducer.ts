import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { ERROR_CODES } from 'types/errors';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
  initialPlaybackStep: null,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    GO_OFFLINE: 'OFFLINE',
  },
  OFFLINE: {
    GO_ONLINE: 'INIT_RESTORE_MEDIA_LOADER',
    TIME_UPDATE: 'CHECK_ERROR',
    SEEK_STARTED: 'CHECK_ERROR',
  },
  INIT_RESTORE_MEDIA_LOADER: {
    RESTORE_MEDIA_LOADER: 'RESTORE_MEDIA_LOADER_PENDING',
    RESTORE_MEDIA_LOADER_RESOLVE: 'IDLE',
  },
  RESTORE_MEDIA_LOADER_PENDING: {
    RESUME_VIDEO_RESOLVE: 'SETUP_PLAYBACK',
  },
  SETUP_PLAYBACK: {
    RESTORE_PLAYBACK: 'IDLE',
  },
  CHECK_ERROR: {
    CHECK_ERROR_RESOLVE: 'OFFLINE',
    NETWORK_ERROR: 'ERROR',
  },
  ERROR: {
    GO_ONLINE: 'INIT_RESTORE_MEDIA_LOADER',
  },
};

const offlineMode = createSlice({
  name: 'offlineMode',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload, meta } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;
      const step = next || state.step;

      logger.log('[FSM]', 'offlineMode', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'TIME_UPDATE':
          return { ...state, step };
        case 'RESTORE_PLAYBACK':
          return { ...state, step, initialPlaybackStep: null };
        case 'NETWORK_ERROR':
          return { ...state, step, initialPlaybackStep: meta.playbackState || null };
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, offlineMode.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().offlineMode;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        INIT_RESTORE_MEDIA_LOADER: async () => {
          const {
            playback: { step },
            offlineMode: { initialPlaybackStep },
            adController,
          } = getState();

          if (adController.step === 'AD_BREAK') {
            dispatch(sendEvent({ type: 'RESTORE_MEDIA_LOADER_RESOLVE' }));
          } else {
            dispatch(
              sendEvent({
                type: 'RESTORE_MEDIA_LOADER',
                payload: {
                  initialPlaybackStep: initialPlaybackStep || (step === 'PLAYING' ? 'PLAYING' : 'PAUSED'),
                },
              })
            );
          }
        },
        RESTORE_MEDIA_LOADER_PENDING: () => {
          dispatch(sendEvent({ type: 'INIT_RESUME_VIDEO' }));
        },
        SETUP_PLAYBACK: () => {
          const {
            offlineMode: { initialPlaybackStep },
          } = getState();

          dispatch(
            sendEvent({
              type: 'RESTORE_PLAYBACK',
              meta: {
                state: initialPlaybackStep === 'PLAYING' ? 'PLAYING' : 'PAUSED',
              },
            })
          );
        },
        CHECK_ERROR: () => {
          const {
            payload: { type, meta, payload },
          } = action as PayloadAction<EventPayload>;

          const {
            playback: { currentTime, step },
            buffering: { bufferedEnd },
          } = getState();

          const playbackState = step === 'PLAYING' ? 'PLAYING' : 'PAUSED';

          const handler: Record<string, (...args: any[]) => boolean | undefined> = {
            TIME_UPDATE: () => {
              if ((currentTime || 0) >= bufferedEnd - 1) {
                const error = new PlayerError(ERROR_CODES.ERROR_NETWORK).serialize();
                dispatch(sendEvent({ type: 'NETWORK_ERROR', meta: { error, playbackState } }));
                return true;
              }
            },
            SEEK_STARTED: (meta: { from: number; to: number }) => {
              if (meta.to < meta.from || meta.to > bufferedEnd) {
                const error = new PlayerError(ERROR_CODES.ERROR_NETWORK).serialize();
                dispatch(sendEvent({ type: 'NETWORK_ERROR', meta: { error, playbackState } }));
                return true;
              }
            },
          };

          if (!handler[type]?.(meta, payload)) {
            dispatch(sendEvent({ type: 'CHECK_ERROR_RESOLVE' }));
          }
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'offlineMode', step);
        effect();
      }
    },
  });

export default {
  ...offlineMode,
  config,
  addMiddleware,
};
