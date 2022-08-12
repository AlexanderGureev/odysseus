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
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    GO_OFFLINE: 'OFFLINE',
  },
  OFFLINE: {
    GO_ONLINE: 'IDLE',
    TIME_UPDATE: 'CHECK_ERROR',
    SEEK_STARTED: 'CHECK_ERROR',
  },
  CHECK_ERROR: {
    CHECK_ERROR_RESOLVE: 'OFFLINE',
    NETWORK_ERROR: 'ERROR',
  },
  ERROR: {
    GO_ONLINE: 'RECOVERY_SESSION',
  },
  RECOVERY_SESSION: {
    RESUME_VIDEO: 'IDLE',
  },
};

const offlineMode = createSlice({
  name: 'offlineMode',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;
      const step = next || state.step;

      logger.log('[FSM]', 'offlineMode', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
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
        RECOVERY_SESSION: () => {
          dispatch(sendEvent({ type: 'RESUME_VIDEO' }));
        },
        CHECK_ERROR: () => {
          const {
            payload: { type, meta, payload },
          } = action as PayloadAction<EventPayload>;

          const {
            playback: { currentTime },
            buffering: { bufferedEnd },
          } = getState();

          const handler: Record<string, (...args: any[]) => boolean | undefined> = {
            TIME_UPDATE: () => {
              if ((currentTime || 0) >= bufferedEnd - 1) {
                const error = new PlayerError(ERROR_CODES.ERROR_NETWORK).serialize();
                dispatch(sendEvent({ type: 'NETWORK_ERROR', meta: { error } }));
                return true;
              }
            },
            SEEK_STARTED: (meta: { from: number; to: number }) => {
              if (meta.to < meta.from || meta.to > bufferedEnd) {
                const error = new PlayerError(ERROR_CODES.ERROR_NETWORK).serialize();
                dispatch(sendEvent({ type: 'NETWORK_ERROR', meta: { error } }));
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
