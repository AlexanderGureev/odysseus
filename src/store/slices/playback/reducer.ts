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
  ended: false,
  isFirstPlay: true,
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
    DO_END_PLAYBACK: 'CHECK_AUTOSWITCH_PENDING',
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
    SEEK_STARTED: null,
  },
  PAUSED: {
    SET_PLAYING: 'PLAYING',
    DO_PLAY: 'CHECK_TOKEN_PENDING',
    ENDED: 'END',
    TIME_UPDATE: null,
    SEEK_STARTED: null,
  },
  END: {
    START_END_FLOW: 'CHECK_AD_PENDING',
  },
  CHECK_AD_PENDING: {
    CHECK_POST_ROLL_RESOLVE: 'CHECK_AUTOSWITCH_PENDING',
    AD_DISABLED: 'CHECK_AUTOSWITCH_PENDING',
    AD_BREAK_STARTED: 'AD_BREAK',
    AD_BREAK_END: 'CHECK_AUTOSWITCH_PENDING',
  },
  CHECK_AUTOSWITCH_PENDING: {
    VIDEO_END: null,
    AUTOSWITCH_DISABLED: 'RESET_PLAYBACK',
  },
  RESET_PLAYBACK: {
    RESET_PLAYBACK_RESOLVE: 'PAUSED',
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

      if (['CHANGE_TRACK'].includes(type)) return { ...initialState, step: 'READY' };
      // if (['RESUME_VIDEO'].includes(type)) return { ...state, step: 'READY' };
      if (['NETWORK_ERROR', 'GO_TO_NEXT_TRACK', 'GO_TO_PREV_TRACK'].includes(type)) return { ...state, step: 'PAUSED' };

      if (next === undefined) return state;

      logger.log('[FSM]', 'playback', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'DO_PLAY_RESOLVE':
          return { ...state, isFirstPlay: false, step };
        case 'ENDED':
          return { ...state, step, ended: true };
        case 'START_PLAYBACK':
          return { ...state, step, ...payload, pausedAt: null };
        case 'SEEK_STARTED':
          const duration = state.duration || 0;
          state.currentTime = meta.to < 0 ? 0 : meta.to > duration ? duration : meta.to;
          break;
        case 'RESET_PLAYBACK_RESOLVE':
          return { ...initialState, currentTime: 0, duration: state.duration, step };
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
            const {
              playback: { step },
            } = getState();

            const next = config[step]?.['SET_PLAYING']; // TODO refactor
            if (next === undefined) return;

            dispatch(
              sendEvent({
                type: 'SET_PLAYING',
              })
            );
          });
          services.playerService.on('pause', () => {
            const {
              playback: { step },
            } = getState();

            const next = config[step]?.['SET_PAUSED'];
            if (next === undefined) return;

            const isEnded = services.playerService.isEnded();

            dispatch(
              sendEvent({
                type: 'SET_PAUSED',
                meta: {
                  isEnded,
                },
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
            console.log('[TEST] ended');

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
        PLAY_PENDING: () => {
          const { isFirstPlay } = getState().playback;
          opts.services.playerService.play();

          dispatch(
            sendEvent({
              type: 'DO_PLAY_RESOLVE',
              meta: { isFirstPlay },
            })
          );
        },
        PAUSED: () => {
          opts.services.playerService.pause();
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
              type: 'START_END_FLOW',
            })
          );
        },
        CHECK_AD_PENDING: () => {
          const { adController } = getState();
          dispatch(
            sendEvent({
              type: adController.step === 'DISABLED' ? 'AD_DISABLED' : 'CHECK_POST_ROLL',
            })
          );
        },
        CHECK_AUTOSWITCH_PENDING: () => {
          const { autoSwitch } = getState();

          if (autoSwitch.step === 'DISABLED') {
            dispatch(
              sendEvent({
                type: 'AUTOSWITCH_DISABLED',
              })
            );
          } else {
            dispatch(
              sendEvent({
                type: 'VIDEO_END',
                meta: {
                  beforeAutoswitch: true,
                },
              })
            );

            dispatch(
              sendEvent({
                type: 'START_VIDEO_END_AUTOSWITCH',
              })
            );
          }
        },
        RESET_PLAYBACK: async () => {
          const {
            root: { previews },
          } = getState();

          dispatch(
            sendEvent({
              type: 'VIDEO_END',
            })
          );

          if (!previews) {
            await new Promise<void>((res) => {
              services.playerService.one('seeked', res);
              services.playerService.setCurrentTime(0);
            });
          }

          dispatch(
            sendEvent({
              type: 'RESET_PLAYBACK_RESOLVE',
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
