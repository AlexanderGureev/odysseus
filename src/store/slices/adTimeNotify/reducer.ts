import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT } from 'store/actions';
import { startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
  points: [],
  time: null,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    PRELOAD_AD_BLOCK_RESOLVE: null,
    TIME_UPDATE: null,
    AD_BREAK_END: null,
    INIT_AD_REJECT: 'DISABLED',
  },
  DISABLED: {
    CHANGE_TRACK: 'IDLE',
  },
};

const MAX_TIME = 15;

const adTimeNotify = createSlice({
  name: 'adTimeNotify',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload, meta } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (next === undefined) return state;

      logger.log('[FSM]', 'adTimeNotify', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'PRELOAD_AD_BLOCK_RESOLVE':
          return { ...state, points: [...state.points, payload.preloadedPoint] };
        case 'TIME_UPDATE': {
          const { currentTime } = payload;

          const time = state.points.reduce((acc: number | null, point) => {
            if (!currentTime) return acc;
            const t = Math.floor(point.point - currentTime);
            return t > 0 && t <= MAX_TIME ? t : acc;
          }, null);

          return { ...state, time };
        }
        case 'AD_BREAK_END': {
          const point = meta.point;

          return {
            ...state,
            time: null,
            points: state.points.filter((p) => p.point !== point),
            isVisible: false,
          };
        }
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => currentState.adTimeNotify.step !== prevState.adTimeNotify.step,
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().adTimeNotify;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {};

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'adTimeNotify', step);
        effect();
      }
    },
  });

export default {
  ...adTimeNotify,
  config,
  addMiddleware,
};
