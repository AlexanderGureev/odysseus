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
};

const volume = createSlice({
  name: 'volume',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'volume', `${state.step} -> ${type} -> ${next}`);

      return next ? { ...state, step: next, ...payload } : { ...state, ...payload };
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => currentState.volume.step !== prevState.volume.step,
    effect: (action, api) => {
      const { dispatch, getState, extra: services } = api;

      const { step } = getState().volume;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {};

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'volume', step);
        effect();
      }
    },
  });

export default {
  ...volume,
  config,
  addMiddleware,
};
