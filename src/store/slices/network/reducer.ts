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
  connectionType: null,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    INIT_RESOLVE: 'INITIALIZE_NETWORK',
  },
  INITIALIZE_NETWORK: {
    INITIALIZE_NETWORK_RESOLVE: 'ONLINE',
  },
  ONLINE: {
    GO_OFFLINE: 'OFFLINE',
    CHANGE_CONNECTION_TYPE: null,
  },
  OFFLINE: {
    GO_ONLINE: 'ONLINE',
    GO_REJECT: null,
  },
};

const MapType = {
  online: 'GO_ONLINE',
  offline: 'GO_OFFLINE',
  reject: 'GO_REJECT',
} as const;

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
          const { isEmbedded } = getState().root.meta;

          if (isEmbedded) {
            request.addHook('networkError', () => {
              dispatch(sendEvent({ type: 'GO_OFFLINE' }));
            });
            on(window, 'online', () => {
              dispatch(sendEvent({ type: 'GO_ONLINE' }));
            });
            on(window, 'offline', () => {
              dispatch(sendEvent({ type: 'GO_OFFLINE' }));
            });
          } else {
            services.postMessageService.on('networkDispatched', ({ status }) => {
              dispatch(
                sendEvent({
                  type: MapType[status],
                })
              );
            });
          }

          const type = navigator?.connection?.type ?? null;

          if (type) {
            navigator.connection?.addEventListener('change', () => {
              dispatch(
                sendEvent({
                  type: 'CHANGE_CONNECTION_TYPE',
                  payload: {
                    connectionType: navigator?.connection?.type ?? null,
                  },
                })
              );
            });
          }

          dispatch(
            sendEvent({ type: 'INITIALIZE_NETWORK_RESOLVE', payload: { connectionType: type }, meta: { isEmbedded } })
          );
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
