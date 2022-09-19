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
  startPosition: 0,
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
    UPDATE_MANIFEST: 'INITIALIZE_P2P',
    CHECK_MANIFEST_RESOLVE: 'INITIALIZE_P2P',
    CHECK_MANIFEST_REJECT: 'IDLE',
  },
  INITIALIZE_P2P: {
    INITIALIZE_P2P_RESOLVE: 'LOADING_META_PENDING',
    INITIALIZE_P2P_REJECT: 'LOADING_META_PENDING',
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
      const { type, payload, meta } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;
      const step = next || state.step;

      logger.log('[FSM]', 'resumeVideo', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'LAUNCH_SETUP_RESOLVE':
          state.startPosition = meta.startPosition;
          state.step = step;
          break;
        default:
          return { ...state, step, ...payload };
      }
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

      const opts = {
        dispatch,
        getState,
        services,
      };

      const { step } = getState().resumeVideo;

      const handler: { [key in State]?: () => Promise<void> | void } = {
        INITIALIZE_P2P: () => {
          dispatch(
            sendEvent({
              type: 'INIT_P2P',
            })
          );
        },
        LOADING_META_PENDING: () => loadMeta(opts),
        LAUNCH_SETUP: async () => {
          const {
            resumeVideoNotify: { isResetStartTime },
            playback: { currentTime, duration },
            playbackSpeed: { currentSpeed },
            volume: { volume, muted },
            root: {
              previews,
              params: { startAt },
              isFirstStartPlayback,
            },
            quality: { currentQualityMark, qualityRecord },
          } = getState();

          const savedTime = getSavedProgressTime(getState(), services.localStorageService);

          services.playerService.setMute(muted);
          services.playerService.setVolume(volume);
          services.playerService.setPlaybackRate(currentSpeed);

          const qualityCfg = qualityRecord[currentQualityMark];
          if (qualityCfg) await services.qualityService.setInitialQuality(qualityCfg);

          let time: number | null = null;

          if (isResetStartTime) time = 0;
          else if (isFirstStartPlayback) time = previews ? 0 : startAt ?? savedTime;
          else time = currentTime;

          if (!time) time = 0;

          const startPosition = time < (duration || 0) ? time : 0;

          if (isOldSafari(getState())) {
            services.playerService.one('timeupdate', () => {
              services.playerService.setCurrentTime(startPosition);
            });
          } else {
            services.playerService.setCurrentTime(startPosition);
          }

          console.log('[TEST] launch setup', {
            isFirstStartPlayback,
            time,
            savedTime,
            startAt,
            currentTime,
          });

          dispatch(
            sendEvent({
              type: 'LAUNCH_SETUP_RESOLVE',
              meta: {
                startPosition,
              },
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
