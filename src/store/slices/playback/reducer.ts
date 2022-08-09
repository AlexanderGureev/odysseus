import { createAction, createSlice } from '@reduxjs/toolkit';
import { STORAGE_SETTINGS } from 'services/LocalStorageService/types';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { checkManifest, checkToken } from '../updater/effects';
import { FSMState, State } from './types';

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
    AD_BREAK_STARTED: 'AD_BREAK',
    START_PLAYBACK: 'PLAY_PENDING',
    META_LOADED: null,
  },
  AD_BREAK: {
    RESUME_VIDEO: 'READY',
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
    SET_PAUSED: 'PAUSED',
    DO_PAUSE: 'PAUSED',
    AD_BREAK_STARTED: 'AD_BREAK',
    TIME_UPDATE: null,
    SEEK: null,
  },
  PAUSED: {
    SET_PLAYING: 'PLAYING',
    DO_PLAY: 'CHECK_TOKEN_PENDING',
    ENDED: 'END',
    TIME_UPDATE: null,
    SEEK: null,
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
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload, meta } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (type === 'CHANGE_TRACK') return { ...initialState, step: 'READY' };
      if (['GO_TO_NEXT_TRACK', 'GO_TO_PREV_TRACK'].includes(type)) return { ...state, step: 'PAUSED' };
      if (next === undefined) return state;

      logger.log('[FSM]', 'playback', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'SEEK':
          const duration = state.duration || 0;
          state.currentTime = meta.to < 0 ? 0 : meta.to > duration ? duration : meta.to;
          break;
        case 'TIME_UPDATE':
          return { ...state, step, ...payload };
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

const addMiddleware = () => {
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, playback.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().playback;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        PLAYBACK_INIT: () => {
          services.playerService.on('error', (error) => {
            dispatch(
              sendEvent({
                type: 'PLAYER_ERROR',
                meta: { error },
              })
            );
          });

          services.playerService.on('play', () => {
            dispatch(
              sendEvent({
                type: 'SET_PLAYING',
              })
            );
          });
          services.playerService.on('pause', () => {
            dispatch(
              sendEvent({
                type: 'SET_PAUSED',
              })
            );
          });
          services.playerService.on('loadedmetadata', (payload) => {
            dispatch(
              sendEvent({
                type: 'META_LOADED',
                payload,
              })
            );
          });
          services.playerService.on('timeupdate', (payload) => {
            const {
              playback: { step },
              root: {
                meta: { trackId },
                previewDuration,
              },
            } = getState();

            const next = config[step]?.['TIME_UPDATE'];
            if (next === undefined) return;

            if (trackId) {
              services.localStorageService.setItemByProject(
                trackId,
                STORAGE_SETTINGS.CURRENT_TIME,
                payload.currentTime
              );
            }

            const data = {
              ...payload,
              duration: previewDuration ?? payload.duration,
            };

            dispatch(
              sendEvent({
                type: 'TIME_UPDATE',
                payload: data,
              })
            );
          });

          services.playerService.on('ended', () => {
            dispatch(
              sendEvent({
                type: 'ENDED',
              })
            );
          });

          dispatch(
            sendEvent({
              type: 'PLAYBACK_INIT_RESOLVE',
            })
          );
        },
        CHECK_TOKEN_PENDING: () => checkToken(opts),
        CHECK_MANIFEST_PENDING: () => checkManifest(opts),
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
        END: () => {
          const {
            root: {
              meta: { trackId },
            },
          } = getState();

          if (trackId) {
            services.localStorageService.setItemByProject(trackId, STORAGE_SETTINGS.CURRENT_TIME, 0);
          }

          dispatch(
            sendEvent({
              type: 'VIDEO_END',
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
};

export default {
  ...playback,
  config,
  addMiddleware,
};
