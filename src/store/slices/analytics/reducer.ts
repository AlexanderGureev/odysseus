import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { YASDK_URL } from 'services/AdService/yaSdkLoader';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';
import { request } from 'utils/request';

import { amberdataStats, demonStat, horusStat, mediascopeStats, tnsStats, vigoStats } from './effects';
import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',

  ym_client_id: null,
  hacks_detected: [],
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    DO_INIT: 'INIT_ANALYTICS_SUBCRIBERS',
    SET_ANALYTICS_DATA: null,
  },
  INIT_ANALYTICS_SUBCRIBERS: {
    INIT_ANALYTICS_SUBCRIBERS_RESOLVE: 'IDLE',
  },
};

const analytics = createSlice({
  name: 'analytics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'analytics', `${state.step} -> ${type} -> ${next}`);

      return next ? { ...state, step: next, ...payload } : { ...state, ...payload };
    });
  },
});

const addMiddleware = () => {
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, analytics.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().analytics;

      const handler: { [key in State]?: () => Promise<void> | void } = {
        INIT_ANALYTICS_SUBCRIBERS: async () => {
          window.addEventListener('load', () => {
            request.options(YASDK_URL).catch(() => {
              dispatch(
                sendEvent({
                  type: 'SET_ANALYTICS_DATA',
                  payload: {
                    hacks_detected: ['adblock'],
                  },
                })
              );
            });
          });

          services.postMessageService.on('initialInfo', ({ data }) => {
            dispatch(
              sendEvent({
                type: 'SET_ANALYTICS_DATA',
                payload: {
                  ym_client_id: data.ym_client_id,
                },
              })
            );
          });

          dispatch(
            sendEvent({
              type: 'INIT_ANALYTICS_SUBCRIBERS_RESOLVE',
            })
          );
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'analytics', step);
        effect();
      }
    },
  });

  startListening({
    predicate: () => true,
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

      const event = action as PayloadAction<EventPayload>;

      amberdataStats(event, opts);
      vigoStats(event, opts);
      tnsStats(event, opts);
      mediascopeStats(event, opts);
      demonStat(event, opts);
      horusStat(event, opts);
    },
  });
};

export default {
  ...analytics,
  config,
  addMiddleware,
};
