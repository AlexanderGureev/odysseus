import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
  experiments: {},
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    DO_INIT: 'INIT_EXPERIMENTS_SUBSCRIBER',
    SET_EXPERIMENT: null,
  },
  INIT_EXPERIMENTS_SUBSCRIBER: {
    INIT_EXPERIMENTS_SUBSCRIBER_RESOLVE: 'IDLE',
  },
};

const experiments = createSlice({
  name: 'experiments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;
      if (next === undefined) return state;

      logger.log('[FSM]', 'experiments', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'SET_EXPERIMENT':
          const { name, group } = payload;
          state.experiments[name] = group;
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () => {
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, experiments.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().experiments;

      const handler: { [key in State]?: () => Promise<void> | void } = {
        INIT_EXPERIMENTS_SUBSCRIBER: () => {
          services.postMessageService.on('set_experiment_group', ({ data }) => {
            dispatch(sendEvent({ type: 'SET_EXPERIMENT', payload: data }));
          });

          dispatch(sendEvent({ type: 'INIT_EXPERIMENTS_SUBSCRIBER_RESOLVE' }));
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'experiments', step);
        effect();
      }
    },
  });
};

export default {
  ...experiments,
  config,
  addMiddleware,
};
