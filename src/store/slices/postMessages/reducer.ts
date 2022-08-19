import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FSM_EVENT } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { outputEvents } from './effects/outputEvents';
import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {},
};

const postMessages = createSlice({
  name: 'postMessages',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'postMessages', `${state.step} -> ${type} -> ${next}`);

      return next ? { ...state, step: next, ...payload } : { ...state, ...payload };
    });
  },
});

const addMiddleware = () => {
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, postMessages.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().postMessages;

      const handler: { [key in State]?: () => Promise<void> | void } = {};

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'postMessages', step);
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
      outputEvents(event, opts);
    },
  });
};

export default {
  ...postMessages,
  config,
  addMiddleware,
};
