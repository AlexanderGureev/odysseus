import { createAction, createSlice } from '@reduxjs/toolkit';
import { QUALITY_MARKS } from 'services/VigoService';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { toFixed } from 'utils';
import { logger } from 'utils/logger';

import { changeQuality } from './effects/changeQuality';
import { init } from './effects/init';
import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
  qualityRecord: {},
  qualityList: [],
  currentQualityMark: QUALITY_MARKS.AQ,
  previousTime: 0,
  qualityStats: {
    AQ: 0,
    LD: 0,
    SD: 0,
    HD: 0,
    UHD: 0,
  },

  currentURL: null,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    FETCHING_MANIFEST_RESOLVE: 'QUALITY_INITIALIZATION',
  },
  QUALITY_INITIALIZATION: {
    QUALITY_INITIALIZATION_RESOLVE: 'READY',
    QUALITY_INITIALIZATION_REJECT: 'ERROR',
  },
  READY: {
    CHANGE_CURRENT_QUALITY: 'QUALITY_CHANGE_PENDING',
    TIME_UPDATE: null,
    // CHECK_MANIFEST_RESOLVE: "QUALITY_INITIALIZATION"
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
      if (next === undefined) return state;

      logger.log('[FSM]', 'quality', `${state.step} -> ${type} -> ${next}`);

      const step = next || state.step;

      switch (type) {
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
        case 'CHANGE_CURRENT_QUALITY':
          return { ...state, step, currentQualityMark: payload.value };
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => currentState.quality.step !== prevState.quality.step,
    effect: (action, api) => {
      const { dispatch, getState, extra: services } = api;

      const { step } = getState().quality;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        QUALITY_INITIALIZATION: () => init(opts),
        QUALITY_CHANGE_PENDING: () => changeQuality(opts),
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
