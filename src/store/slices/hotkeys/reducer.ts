import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { isMobile } from 'react-device-detect';
import { PLAYER_ID } from 'services/PlayerService/types';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { on } from 'utils';
import { dbclick } from 'utils/dbclick';
import { isKeyPressed, SUPPORTED_KEY_CODES } from 'utils/keyboard';
import { logger } from 'utils/logger';

import { BACKWARD_REWIND_STEP, FORWARD_REWIND_STEP, VOLUME_STEP } from './constants';
import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
  isInitialized: false,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    START_PLAYBACK: null,
    CLOSE_OVERLAY: 'READY',
  },
  HOTKEYS_INIT: {
    HOTKEYS_INIT_RESOLVE: 'READY',
    HOTKEYS_INIT_REJECT: 'DISABLED',
  },
  READY: {
    AD_BREAK_STARTED: 'IDLE',
    KEYBOARD_EVENT: 'PROCESSING_KEYBOARD_EVENT',
    NETWORK_ERROR: 'IDLE',
    DISABLE_HOTKEYS: 'IDLE',
    SET_OVERLAY: 'IDLE',
    CHANGE_TRACK: 'IDLE',
    SETUP_PAYWALL_RESOLVE: 'IDLE',
  },
  PROCESSING_KEYBOARD_EVENT: {
    PROCESSING_KEYBOARD_EVENT_RESOLVE: 'READY',
  },
  DISABLED: {},
};

const hotkeys = createSlice({
  name: 'hotkeys',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (next === undefined) return state;

      logger.log('[FSM]', 'hotkeys', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'HOTKEYS_INIT_RESOLVE':
          return { ...state, isInitialized: true, step };
        case 'START_PLAYBACK':
          state.step = !state.isInitialized ? 'HOTKEYS_INIT' : 'READY';
          break;
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, hotkeys.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().hotkeys;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        HOTKEYS_INIT: () => {
          if (isMobile) {
            dispatch(sendEvent({ type: 'HOTKEYS_INIT_REJECT' }));
            return;
          }

          const node = document.getElementById(PLAYER_ID);
          if (node) {
            dbclick(node, () => {
              const { step } = getState().fullscreen;

              const event: EventPayload = {
                type: step === 'FULLSCREEN' ? 'EXIT_FULLCREEN' : 'ENTER_FULLCREEN',
              };

              dispatch(sendEvent({ type: 'KEYBOARD_EVENT', meta: { event } }));
            });
          }

          on(window, 'keydown', (event: KeyboardEvent) => {
            switch (true) {
              case isKeyPressed(event, SUPPORTED_KEY_CODES.ESCAPE): {
                break;
              }
              case isKeyPressed(event, SUPPORTED_KEY_CODES.ARROW_DOWN): {
                const { volume } = getState().volume;
                const event: EventPayload = {
                  type: 'SET_VOLUME',
                  payload: { value: Math.max(0, volume - VOLUME_STEP) },
                };

                dispatch(sendEvent({ type: 'KEYBOARD_EVENT', meta: { event } }));
                break;
              }
              case isKeyPressed(event, SUPPORTED_KEY_CODES.ARROW_UP): {
                const { volume } = getState().volume;
                const event: EventPayload = {
                  type: 'SET_VOLUME',
                  payload: { value: Math.min(1, volume + VOLUME_STEP) },
                };

                dispatch(sendEvent({ type: 'KEYBOARD_EVENT', meta: { event } }));
                break;
              }
              case isKeyPressed(event, SUPPORTED_KEY_CODES.ARROW_LEFT): {
                const { currentTime, duration } = getState().playback;
                if (!duration) return;

                const to = Math.max(0, (currentTime || 0) - BACKWARD_REWIND_STEP);
                const event: EventPayload = {
                  type: 'SEEK',
                  meta: { to },
                };

                dispatch(sendEvent({ type: 'KEYBOARD_EVENT', meta: { event } }));
                break;
              }
              case isKeyPressed(event, SUPPORTED_KEY_CODES.ARROW_RIGHT): {
                const { currentTime, duration } = getState().playback;
                if (!duration) return;

                const to = Math.min(duration, (currentTime || 0) + FORWARD_REWIND_STEP);
                const event: EventPayload = {
                  type: 'SEEK',
                  meta: { to },
                };

                dispatch(sendEvent({ type: 'KEYBOARD_EVENT', meta: { event } }));
                break;
              }
              case isKeyPressed(event, SUPPORTED_KEY_CODES.SPACE): {
                const { step } = getState().playback;

                if (step === 'PLAYING') {
                  dispatch(sendEvent({ type: 'KEYBOARD_EVENT', meta: { event: { type: 'DO_PAUSE' } } }));
                }

                if (step === 'PAUSED') {
                  dispatch(sendEvent({ type: 'KEYBOARD_EVENT', meta: { event: { type: 'DO_PLAY' } } }));
                }

                break;
              }
              default:
                break;
            }
          });

          dispatch(sendEvent({ type: 'HOTKEYS_INIT_RESOLVE' }));
        },
        PROCESSING_KEYBOARD_EVENT: () => {
          const {
            payload: { meta },
          } = action as PayloadAction<{
            meta: {
              event: EventPayload;
            };
          }>;

          logger.log('[hotkeys]', 'event', meta.event);

          dispatch(sendEvent({ ...meta.event, isKeyboardEvent: true }));
          dispatch(sendEvent({ type: 'PROCESSING_KEYBOARD_EVENT_RESOLVE' }));
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'hotkeys', step);
        effect();
      }
    },
  });

export default {
  ...hotkeys,
  config,
  addMiddleware,
};
