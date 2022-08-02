import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {},
  ERROR: {},
};

const changeTrack = createSlice({
  name: 'changeTrack',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'changeTrack', `${state.step} -> ${type} -> ${next}`);

      return next ? { ...state, step: next, ...payload } : { ...state, ...payload };
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => currentState.changeTrack.step !== prevState.changeTrack.step,
    effect: (action, api) => {
      const { dispatch, getState, extra: services } = api;

      const { step } = getState().changeTrack;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {};

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'changeTrack', step);
        effect();
      }
    },
  });

export default {
  ...changeTrack,
  config,
  addMiddleware,
};
