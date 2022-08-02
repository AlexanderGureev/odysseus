import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { startListening } from 'store/middleware';
import type { AppEvent, FSMConfig } from 'store/types';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';

import { ActionPayload, FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
  error: null,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    INIT_REJECT: 'ERROR',
    CHECK_CAPABILITIES_REJECT: 'ERROR',
    PARSE_CONFIG_REJECT: 'ERROR',
    INIT_ANALYTICS_REJECT: 'ERROR',
    CHECK_ERROR_REJECT: 'ERROR',
    INIT_SERVICES_REJECT: 'ERROR',
    PLAYER_INIT_REJECT: 'ERROR',
    SELECT_SOURCE_ERROR: 'ERROR',
    CHECK_MANIFEST_REJECT: 'ERROR',
    FETCHING_MANIFEST_REJECT: 'ERROR',
  },
  ERROR: {
    SET_ERROR: null,
    RELOAD: 'IDLE',
  },
};

const error = createSlice({
  name: 'error',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<ActionPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'error', `${state.step} -> ${type} -> ${next}`);

      return next ? { ...state, step: next, ...payload } : { ...state, ...payload };
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => currentState.error.step !== prevState.error.step,
    effect: (action, api) => {
      const { dispatch, getState, extra: services } = api;

      const { step } = getState().error;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        ERROR: () => {
          const {
            payload: { meta },
          } = action as PayloadAction<{
            meta: { error: PlayerError };
          }>;

          dispatch(
            sendEvent({
              type: 'SET_ERROR',
              payload: {
                error: meta.error,
              },
            })
          );
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'error', step);
        effect();
      }
    },
  });

export default {
  ...error,
  config,
  addMiddleware,
};
