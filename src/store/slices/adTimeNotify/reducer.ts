import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { TAdPointConfig } from 'types/ad';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
  points: [],
  time: null,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    PRELOAD_AD_BLOCK_RESOLVE: 'UPDATE_POINTS',
    TIME_UPDATE: 'TIME_UPDATE_PENDING',
    AD_BREAK_END: 'RESET',
    INIT_AD_REJECT: 'DISABLED',
  },
  UPDATE_POINTS: {
    UPDATE_POINTS_RESOLVE: 'IDLE',
  },
  TIME_UPDATE_PENDING: {
    UPDATE_TIME: 'IDLE',
  },
  RESET: {
    DONE: 'IDLE',
  },
  DISABLED: {},
};

const MAX_TIME = 15;

const adTimeNotify = createSlice({
  name: 'adTimeNotify',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      if (type === 'TIME_UPDATE' && next) return { ...state, step: next };

      logger.log('[FSM]', 'adTimeNotify', `${state.step} -> ${type} -> ${next}`);

      return next ? { ...state, step: next, ...payload } : { ...state, ...payload };
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => currentState.adTimeNotify.step !== prevState.adTimeNotify.step,
    effect: (action, api) => {
      const { dispatch, getState, extra: services } = api;

      const { step } = getState().adTimeNotify;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        UPDATE_POINTS: () => {
          const {
            payload: { meta: point },
          } = action as PayloadAction<{
            meta: TAdPointConfig;
          }>;

          const {
            adTimeNotify: { points },
          } = getState();

          dispatch(
            sendEvent({
              type: 'UPDATE_POINTS_RESOLVE',
              payload: {
                points: [...points, point],
              },
            })
          );
        },
        TIME_UPDATE_PENDING: () => {
          const {
            adTimeNotify: { points },
            playback: { currentTime },
          } = getState();

          const time = points.reduce((acc: number | null, point) => {
            if (!currentTime) return acc;
            const t = Math.floor(point.point - currentTime);
            return t > 0 && t <= MAX_TIME ? t : acc;
          }, null);

          dispatch(
            sendEvent({
              type: 'UPDATE_TIME',
              payload: {
                time,
              },
            })
          );
        },
        RESET: () => {
          const {
            adTimeNotify: { points },
          } = getState();

          const {
            payload: { meta: point },
          } = action as PayloadAction<{
            meta: TAdPointConfig;
          }>;

          dispatch(
            sendEvent({
              type: 'DONE',
              payload: {
                time: null,
                points: points.filter((p) => p.point !== point.point),
                isVisible: false,
              },
            })
          );
        },
      };

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
