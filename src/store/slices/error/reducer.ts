import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { RawPlayerError } from 'types/errors';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';

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
    FETCH_TRACK_CONFIG_REJECT: 'ERROR',
    PLAYER_ERROR: 'ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
  },
  ERROR: {
    RELOAD: 'IDLE',
  },
  NETWORK_ERROR: {
    GO_ONLINE: 'IDLE',
  },
};

const error = createSlice({
  name: 'error',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload, meta } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'error', `${state.step} -> ${type} -> ${next}`);

      const step = next || state.step;

      switch (type) {
        case 'GO_ONLINE':
          return initialState;
        default:
          const { error } = meta as { error: RawPlayerError };
          return { ...state, step, error, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, error.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().error;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        ERROR: () => {
          dispatch(sendEvent({ type: 'ERROR_SHOWN' }));
        },
        NETWORK_ERROR: () => {
          dispatch(sendEvent({ type: 'ERROR_SHOWN' }));
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
