import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { accumulation } from './effects/accumulation';
import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',

  type: 'inc',
  inc: 0,
  dec: 0,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    DO_INIT: 'READY',
  },
  READY: {
    INC_SEEK: 'ACCUMULATION',
    DEC_SEEK: 'ACCUMULATION',
    SEEK: null,
  },
  ACCUMULATION: {
    ACCUMULATION_RESOLVE: 'READY',
  },
};

const rewindAcc = createSlice({
  name: 'rewindAcc',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (['CHANGE_TRACK'].includes(type)) return { ...initialState, step: 'READY' };
      if (next === undefined) return state;

      logger.log('[FSM]', 'rewindAcc', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'SEEK':
          return { ...state, step, inc: 0, dec: 0 };
        case 'INC_SEEK':
          return { ...state, step, inc: state.inc + payload.value, dec: 0, type: 'inc' };
        case 'DEC_SEEK':
          return { ...state, step, dec: state.dec + payload.value, inc: 0, type: 'dec' };
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, rewindAcc.name),
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

      const { step } = getState().rewindAcc;

      const handler: { [key in State]?: () => Promise<void> | void } = {
        ACCUMULATION: () => accumulation(opts),
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'rewindAcc', step);
        effect();
      }
    },
  });

export default {
  ...rewindAcc,
  config,
  addMiddleware,
};
