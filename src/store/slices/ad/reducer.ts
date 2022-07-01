import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT } from 'store/actions';
import { startListening } from 'store/middleware';
import type { FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { Event, EventPayload, FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
};

const config: FSMConfig<State, Event> = {
  IDLE: {
    DO_INIT: 'IDLE',
  },
};

const ad = createSlice({
  name: 'ad',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload = {} } = action.payload;

      // logger.log('[FSM]', 'ad transition', { type, payload });

      const next = config[state.step]?.[type];
      return next ? { ...state, step: next, ...payload } : { ...state, ...payload };
    });
  },
});

startListening({
  predicate: (action, currentState, prevState) => currentState.ad.step !== prevState.ad.step,
  effect: (action, api) => {
    const { dispatch, getState, extra: services } = api;

    // logger.log('[MW]', 'ad', getState());
  },
});

export default ad;
