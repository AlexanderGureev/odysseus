import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import { getSavedProgressTime, isOldSafari } from 'store/selectors';
import type { AppEvent, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { checkManifest, checkToken } from '../updater/effects';
import { loadMeta } from './effects';
import { ActionPayload, FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    INIT_RESUME_VIDEO: 'CHECK_TOKEN_PENDING',
  },
  CHECK_TOKEN_PENDING: {
    UPDATE_TOKEN: 'CHECK_MANIFEST_PENDING',
    CHECK_TOKEN_RESOLVE: 'CHECK_MANIFEST_PENDING',
    CHECK_TOKEN_REJECT: 'CHECK_MANIFEST_PENDING',
  },
  CHECK_MANIFEST_PENDING: {
    UPDATE_MANIFEST: 'LOADING_META_PENDING',
    CHECK_MANIFEST_RESOLVE: 'LOADING_META_PENDING',
    CHECK_MANIFEST_REJECT: 'IDLE',
  },
  LOADING_META_PENDING: {
    LOAD_META_RESOLVE: 'LAUNCH_SETUP',
    LOAD_META_REJECT: 'IDLE',
  },
  LAUNCH_SETUP: {
    LAUNCH_SETUP_RESOLVE: 'SPLASH_SCREEN_PENDING',
  },
  SPLASH_SCREEN_PENDING: {
    SHOWING_SPLASHCREEN_END: 'RESUME_VIDEO_END',
    INIT_SPLASHCREEN_REJECT: 'RESUME_VIDEO_END',
  },
  RESUME_VIDEO_END: {
    RESUME_VIDEO_RESOLVE: 'IDLE',
  },
};

const resumeVideo = createSlice({
  name: 'resumeVideo',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<ActionPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'resumeVideo', `${state.step} -> ${type} -> ${next}`);

      return next ? { ...state, step: next, ...payload } : { ...state, ...payload };
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, resumeVideo.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().resumeVideo;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        LOADING_META_PENDING: () => loadMeta(opts),
        LAUNCH_SETUP: () => {
          const {
            resumeVideoNotify: { isResetStartTime },
            playback: { currentTime, duration },
            playbackSpeed: { currentSpeed },
            volume: { volume, muted },
            root: {
              previews,
              params: { startAt },
            },
          } = getState();

          const savedTime = getSavedProgressTime(getState(), services.localStorageService);

          console.log('[TEST] launch setup', {
            time: isResetStartTime || previews ? 0 : startAt ?? savedTime ?? currentTime ?? 0,
            savedTime,
            startAt,
            currentTime,
          });

          services.playerService.setMute(muted);
          services.playerService.setVolume(volume);
          services.playerService.setPlaybackRate(currentSpeed);

          const value = isResetStartTime || previews ? 0 : startAt ?? savedTime ?? currentTime ?? 0;
          const startPosition = value < (duration || 0) ? value : 0;

          if (isOldSafari(getState())) {
            services.playerService.one('timeupdate', () => {
              services.playerService.setCurrentTime(startPosition);
            });
          } else {
            services.playerService.setCurrentTime(startPosition);
          }

          dispatch(
            sendEvent({
              type: 'LAUNCH_SETUP_RESOLVE',
            })
          );
        },
        CHECK_TOKEN_PENDING: () => checkToken(opts),
        CHECK_MANIFEST_PENDING: () => checkManifest(opts),
        RESUME_VIDEO_END: () => {
          dispatch(sendEvent({ type: 'RESUME_VIDEO_RESOLVE' }));
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'resumeVideo', step);
        effect();
      }
    },
  });

export default {
  ...resumeVideo,
  config,
  addMiddleware,
};
