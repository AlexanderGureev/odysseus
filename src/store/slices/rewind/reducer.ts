import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { accumulation } from './effects/accumulation';
import { ActionPayload, FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',

  type: 'inc',
  inc: 0,
  dec: 0,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    DO_INIT: 'REWIND_INIT',
  },
  REWIND_INIT: {
    REWIND_INIT_RESOLVE: 'READY',
  },
  READY: {
    SEEK: 'SEEK_START',
    INC_SEEK: 'ACCUMULATION',
    DEC_SEEK: 'ACCUMULATION',
  },
  ACCUMULATION: {
    ACCUMULATION_RESOLVE: 'READY',
    SEEK: 'SEEK_START',
  },
  SEEK_START: {
    SEEK_START_RESOLVE: 'SEEKING',
  },
  SEEKING: {
    SEEK: 'SEEK_START',
    SEEK_END: 'READY',
  },
};

const rewind = createSlice({
  name: 'rewind',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'rewind', `${state.step} -> ${type} -> ${next}`);

      const step = next || state.step;

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
    predicate: (action, currentState, prevState) => currentState.rewind.step !== prevState.rewind.step,
    effect: (action, api) => {
      const { dispatch, getState, extra: services } = api;

      const { step } = getState().rewind;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        REWIND_INIT: () => {
          opts.services.playerService.on('seeked', () => {
            dispatch(
              sendEvent({
                type: 'SEEK_END',
              })
            );
          });

          dispatch(
            sendEvent({
              type: 'REWIND_INIT_RESOLVE',
            })
          );
        },
        ACCUMULATION: () => accumulation(opts),
        SEEK_START: () => {
          const {
            payload: { meta },
          } = action as PayloadAction<{
            meta: { to: number };
          }>;

          opts.services.playerService.setCurrentTime(meta.to);
          dispatch(
            sendEvent({
              type: 'SEEK_START_RESOLVE',
            })
          );
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'rewind', step);
        effect();
      }
    },
  });

export default {
  ...rewind,
  config,
  addMiddleware,
};
