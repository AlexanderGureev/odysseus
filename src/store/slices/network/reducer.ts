import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { on } from 'utils';
import { logger } from 'utils/logger';
import { request } from 'utils/request';

import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    DO_INIT: 'INITIALIZE_NETWORK',
  },
  INITIALIZE_NETWORK: {
    INITIALIZE_NETWORK_RESOLVE: 'ONLINE',
  },
  ONLINE: {
    GO_OFFLINE: 'OFFLINE',
  },
  OFFLINE: {
    GO_ONLINE: 'ONLINE',
    GO_REJECT: null,
  },
};

const network = createSlice({
  name: 'network',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;
      const step = next || state.step;

      logger.log('[FSM]', 'network', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, network.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().network;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        INITIALIZE_NETWORK: () => {
          request.addHook('networkError', () => {
            dispatch(sendEvent({ type: 'GO_OFFLINE' }));
          });
          on(window, 'online', () => {
            dispatch(sendEvent({ type: 'GO_ONLINE' }));
          });
          on(window, 'offline', () => {
            dispatch(sendEvent({ type: 'GO_OFFLINE' }));
          });

          dispatch(sendEvent({ type: 'INITIALIZE_NETWORK_RESOLVE' }));
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'network', step);
        effect();
      }
    },
  });

export default {
  ...network,
  config,
  addMiddleware,
};
