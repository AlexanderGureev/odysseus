import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    DO_INIT: 'CHECK_VISIBILITY_PENDING',
  },
  CHECK_VISIBILITY_PENDING: {
    GO_TO_VISIBLE: 'VISIBLE',
    GO_TO_HIDDEN: 'HIDDEN',
  },
  VISIBLE: {
    GO_TO_HIDDEN: 'HIDDEN',
  },
  HIDDEN: {
    GO_TO_VISIBLE: 'VISIBLE',
  },
};

const visibility = createSlice({
  name: 'visibility',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'visibility', `${state.step} -> ${type} -> ${next}`);

      return next ? { ...state, step: next, ...payload } : { ...state, ...payload };
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, visibility.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().visibility;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        CHECK_VISIBILITY_PENDING: () => {
          const handler = () => {
            dispatch(sendEvent({ type: document.visibilityState === 'hidden' ? 'GO_TO_HIDDEN' : 'GO_TO_VISIBLE' }));
          };

          document.addEventListener('visibilitychange', handler);
          handler();
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'visibility', step);
        effect();
      }
    },
  });

export default {
  ...visibility,
  config,
  addMiddleware,
};
