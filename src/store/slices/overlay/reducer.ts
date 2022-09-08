import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { on } from 'utils';
import { isKeyPressed, SUPPORTED_KEY_CODES } from 'utils/keyboard';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
  overlayType: 'none',
  autoPause: false,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    DO_INIT: 'INIT_OVERLAY',
    SET_OVERLAY: 'SETUP_OVERLAY',
  },
  INIT_OVERLAY: {
    INIT_OVERLAY_RESOLVE: 'IDLE',
  },
  SETUP_OVERLAY: {
    SETUP_OVERLAY_RESOLVE: 'READY',
  },
  READY: {
    CLOSE_OVERLAY: 'CLOSING_OVERLAY',
  },
  CLOSING_OVERLAY: {
    CLOSING_OVERLAY_RESOLVE: 'IDLE',
  },
};

const overlay = createSlice({
  name: 'overlay',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (next === undefined) return state;

      logger.log('[FSM]', 'overlay', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'CLOSE_OVERLAY':
          return { ...state, step, overlayType: 'none' };
        case 'CLOSING_OVERLAY_RESOLVE':
          return { ...state, step, autoPause: false };
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, overlay.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().overlay;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        INIT_OVERLAY: () => {
          on(window, 'keydown', (event: KeyboardEvent) => {
            switch (true) {
              case isKeyPressed(event, SUPPORTED_KEY_CODES.ESCAPE): {
                dispatch(sendEvent({ type: 'CLOSE_OVERLAY', isKeyboardEvent: true }));
              }
            }
          });

          dispatch(sendEvent({ type: 'INIT_OVERLAY_RESOLVE' }));
        },
        SETUP_OVERLAY: () => {
          const step = getState().playback.step;
          let autoPause = false;

          if (step === 'PLAYING') {
            dispatch(sendEvent({ type: 'AUTO_PAUSE' }));
            autoPause = true;
          }

          dispatch(sendEvent({ type: 'SETUP_OVERLAY_RESOLVE', payload: { autoPause } }));
        },
        CLOSING_OVERLAY: () => {
          const { autoPause } = getState().overlay;
          if (autoPause) dispatch(sendEvent({ type: 'DO_PLAY' }));
          dispatch(sendEvent({ type: 'CLOSING_OVERLAY_RESOLVE' }));
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'overlay', step);
        effect();
      }
    },
  });

export default {
  ...overlay,
  config,
  addMiddleware,
};
