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
    DO_INIT: 'INIT_FULLSCREEN_SUBSCRIBERS',
  },
  INIT_FULLSCREEN_SUBSCRIBERS: {
    INIT_FULLSCREEN_SUBSCRIBERS_RESOLVE: 'DEFAULT',
  },
  ENTER_FULLCREEN_PENDING: {
    ENTER_FULLCREEN_RESOLVE: 'FULLSCREEN',
    ENTER_FULLCREEN_REJECT: 'DEFAULT',
  },
  EXIT_FULLCREEN_PENDING: {
    EXIT_FULLCREEN_RESOLVE: 'DEFAULT',
    EXIT_FULLCREEN_REJECT: 'FULLSCREEN',
  },
  FULLSCREEN: {
    EXIT_FULLCREEN: 'EXIT_FULLCREEN_PENDING',
    EVENT_SET_DEFAULT: 'DEFAULT',
  },
  DEFAULT: {
    ENTER_FULLCREEN: 'ENTER_FULLCREEN_PENDING',
    EVENT_SET_FULLSCREEN: 'FULLSCREEN',
  },
};

const fullscreen = createSlice({
  name: 'fullscreen',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'fullscreen', `${state.step} -> ${type} -> ${next}`);

      return next ? { ...state, step: next, ...payload } : { ...state, ...payload };
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, fullscreen.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().fullscreen;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        INIT_FULLSCREEN_SUBSCRIBERS: () => {
          services.playerService.on('fullscreenchange', (isFullscreen) => {
            dispatch(sendEvent({ type: isFullscreen ? 'EVENT_SET_FULLSCREEN' : 'EVENT_SET_DEFAULT' }));
          });

          dispatch(sendEvent({ type: 'INIT_FULLSCREEN_SUBSCRIBERS_RESOLVE' }));
        },
        ENTER_FULLCREEN_PENDING: async () => {
          try {
            await services.playerService.enterFullcreen();
            dispatch(sendEvent({ type: 'ENTER_FULLCREEN_RESOLVE' }));
          } catch (err) {
            logger.error('[fullscreen]', 'enterFullcreen error', err?.message);
            dispatch(sendEvent({ type: 'ENTER_FULLCREEN_REJECT' }));
          }
        },
        EXIT_FULLCREEN_PENDING: async () => {
          try {
            await services.playerService.exitFullcreen();
            dispatch(sendEvent({ type: 'EXIT_FULLCREEN_RESOLVE' }));
          } catch (err) {
            logger.error('[fullscreen]', 'exitFullcreen error', err?.message);
            dispatch(sendEvent({ type: 'EXIT_FULLCREEN_REJECT' }));
          }
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'fullscreen', step);
        effect();
      }
    },
  });

export default {
  ...fullscreen,
  config,
  addMiddleware,
};
