import { createAction, createSlice } from '@reduxjs/toolkit';
import { getViewportHeight } from 'services/HorusService/selectors';
import { QUALITY_MARKS } from 'services/VigoService';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { toFixed } from 'utils';
import { logger } from 'utils/logger';

import { changeQuality } from './effects/changeQuality';
import { getVideoMeta } from './effects/getVideoMeta';
import { init } from './effects/init';
import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
  qualityRecord: {},
  qualityList: [],
  currentQualityMark: QUALITY_MARKS.AQ,
  previousTime: 0,
  previousBitrate: null,

  qualityStats: {
    AQ: 0,
    LD: 0,
    SD: 0,
    HD: 0,
    UHD: 0,
  },
  videoMeta: {
    video_resolution: null,
    video_format: null,
    dropped_frames: null,
    shown_frames: null,
    frame_rate: null,
    video_codec: null,
    audio_codec: null,
    bitrate: null,
  },

  isAutoQualityMode: true,
  currentURL: null,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    FETCHING_MANIFEST_RESOLVE: 'QUALITY_INITIALIZATION',
    START_PLAYBACK: 'READY',
  },
  QUALITY_INITIALIZATION: {
    QUALITY_INITIALIZATION_RESOLVE: 'IDLE',
    QUALITY_INITIALIZATION_REJECT: 'ERROR',
  },
  READY: {
    CHANGE_CURRENT_QUALITY: 'QUALITY_CHANGE_PENDING',
    TIME_UPDATE: 'GET_VIDEO_META',
    RESIZE: null,
  },
  AUTO_SELECT_QUALITY: {
    AUTO_CHANGE_CURRENT_QUALITY: 'QUALITY_CHANGE_PENDING',
    AUTO_SELECT_QUALITY_RESOLVE: 'READY',
  },
  GET_VIDEO_META: {
    GET_VIDEO_META_RESOLVE: 'READY',
  },
  QUALITY_CHANGE_PENDING: {
    QUALITY_CHANGE_RESOLVE: 'READY',
    QUALITY_CHANGE_REJECT: 'ERROR',
  },
  ERROR: {},
};

const quality = createSlice({
  name: 'quality',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (type === 'CHANGE_TRACK') {
        const { currentQualityMark } = state;
        return { ...initialState, currentQualityMark, step: 'IDLE' };
      }

      if (type === 'RESET_PLAYBACK_RESOLVE') {
        return {
          ...state,
          previousBitrate: null,
          previousTime: 0,
          qualityStats: initialState.qualityStats,
          step: 'READY',
        };
      }

      if (next === undefined) return state;

      logger.log('[FSM]', 'quality', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'RESIZE':
          state.step = state.isAutoQualityMode ? 'AUTO_SELECT_QUALITY' : state.step;
          break;
        case 'TIME_UPDATE':
          const diff = Math.abs(payload.currentTime - state.previousTime);
          if (diff < 1) {
            state.qualityStats[state.currentQualityMark] = toFixed(state.qualityStats[state.currentQualityMark] + diff);
          }

          state.previousTime = payload.currentTime;
          state.step = step;
          break;
        case 'FETCHING_MANIFEST_RESOLVE':
          return { ...state, step };
        case 'AUTO_CHANGE_CURRENT_QUALITY':
          return { ...state, step, currentQualityMark: payload.value };
        case 'CHANGE_CURRENT_QUALITY':
          return { ...state, step, currentQualityMark: payload.value, isAutoQualityMode: false };
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, quality.name),
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

      const { step } = getState().quality;

      const handler: { [key in State]?: () => Promise<void> | void } = {
        QUALITY_INITIALIZATION: () => init(opts),
        QUALITY_CHANGE_PENDING: () => changeQuality(opts),
        GET_VIDEO_META: () => getVideoMeta(opts),
        AUTO_SELECT_QUALITY: () => {
          const { qualityRecord, currentQualityMark } = getState().quality;
          const videoHeight = getViewportHeight();

          if (!videoHeight) {
            return dispatch(sendEvent({ type: 'AUTO_SELECT_QUALITY_RESOLVE' }));
          }

          const mark = services.qualityService.selectQualityByHeight(qualityRecord, videoHeight);

          if (mark !== currentQualityMark) {
            dispatch(sendEvent({ type: 'AUTO_CHANGE_CURRENT_QUALITY', payload: { value: mark } }));
          } else {
            dispatch(sendEvent({ type: 'AUTO_SELECT_QUALITY_RESOLVE' }));
          }
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'quality', step);
        effect();
      }
    },
  });

export default {
  ...quality,
  config,
  addMiddleware,
};
