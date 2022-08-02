import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { startListening } from 'store/middleware';
import type { AppEvent, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { checkManifest, checkToken } from './effects';
import { ActionPayload, FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    CHECK_TOKEN: 'CHECK_TOKEN_PENDING',
    CHECK_MANIFEST: 'CHECK_MANIFEST_PENDING',
  },
  CHECK_TOKEN_PENDING: {
    UPDATE_TOKEN: 'IDLE',
    CHECK_TOKEN_RESOLVE: 'IDLE',
    CHECK_TOKEN_REJECT: 'IDLE',
  },
  CHECK_MANIFEST_PENDING: {
    UPDATE_MANIFEST: 'IDLE',
    CHECK_MANIFEST_RESOLVE: 'IDLE',
    CHECK_MANIFEST_REJECT: 'IDLE',
  },
};

const updater = createSlice({
  name: 'updater',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<ActionPayload>(FSM_EVENT), (state, action) => {
      const { type } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'updater', `${state.step} -> ${type} -> ${next}`);

      return next ? { ...state, step: next } : state;
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => {
      return !['IDLE', prevState.updater.step].includes(currentState.updater.step);
    },
    effect: (action, api) => {
      const { dispatch, getState, extra: services } = api;

      const { step } = getState().updater;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        CHECK_TOKEN_PENDING: () => checkToken(opts),
        CHECK_MANIFEST_PENDING: () => checkManifest(opts),
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'updater', step);
        effect();
      }
    },
  });

export default {
  ...updater,
  config,
  addMiddleware,
};
