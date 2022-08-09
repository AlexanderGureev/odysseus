import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { checkAdult } from './effects';
import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
  confirmed: false,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    DO_INIT: 'ADULT_NOTIFY_INIT',
    CHECK_ADULT: 'CHECK_ADULT_CONTENT',
  },
  ADULT_NOTIFY_INIT: {
    ADULT_NOTIFY_INIT_RESOLVE: 'IDLE',
  },
  CHECK_ADULT_CONTENT: {
    SHOW_ADULT_NOTIFY: 'ADULT_NOTIFY',
    SKIP_ADULT_NOTIFY: 'IDLE',
  },
  ADULT_NOTIFY: {
    ADULT_NOTIFY_RESOLVE: 'IDLE',
    ADULT_NOTIFY_REJECT: 'ADULT_NOTIFY_REJECTED',
  },
  ADULT_NOTIFY_REJECTED: {},
};

const adultNotify = createSlice({
  name: 'adultNotify',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'adultNotify', `${state.step} -> ${type} -> ${next}`);

      const step = next || state.step;

      switch (type) {
        case 'ADULT_NOTIFY_RESOLVE':
          return { ...state, step, confirmed: true };
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, adultNotify.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().adultNotify;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        ADULT_NOTIFY_INIT: () => {
          const {
            root: { params },
          } = getState();

          const confirmed = params.adult === false;

          if (!confirmed) {
            services.postMessageService.on('userReachedCorrectAge', () => {
              dispatch(
                sendEvent({
                  type: 'ADULT_NOTIFY_RESOLVE',
                })
              );
            });

            services.postMessageService.on('userNotReachedCorrectAge', () => {
              dispatch(
                sendEvent({
                  type: 'ADULT_NOTIFY_REJECT',
                })
              );
            });
          }

          dispatch(
            sendEvent({
              type: 'ADULT_NOTIFY_INIT_RESOLVE',
              payload: {
                confirmed,
              },
            })
          );
        },
        CHECK_ADULT_CONTENT: () => checkAdult(opts),
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'adultNotify', step);
        effect();
      }
    },
  });

export default {
  ...adultNotify,
  config,
  addMiddleware,
};
