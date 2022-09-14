import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';

const IS_DEBUG = window.ENV?.DEBUG_MODE;

const initialState: FSMState = {
  step: 'IDLE',
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    START_PLAYBACK: null,
  },
  SETUP_DEBUG: {
    SETUP_DEBUG_RESOLVE: 'IDLE',
  },
};

const debug = createSlice({
  name: 'debug',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload, meta } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (next === undefined) return state;

      logger.log('[FSM]', 'debug', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'START_PLAYBACK':
          return { ...state, step: meta?.isFirst ? 'SETUP_DEBUG' : 'IDLE' };
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, debug.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().debug;

      const handler: { [key in State]?: () => Promise<void> | void } = {
        SETUP_DEBUG: () => {
          const {
            autoSwitch: { autoswitchPoint },
            playback: { duration },
            root: { adPoints },
          } = getState();

          if (IS_DEBUG) {
            window.debug = {
              play: () => dispatch(sendEvent({ type: 'DO_PLAY' })),
              pause: () => dispatch(sendEvent({ type: 'DO_PAUSE' })),
              seek: (to: number) => dispatch(sendEvent({ type: 'SEEK', meta: { to } })),
              seekToAutoswitch: () => {
                if (autoswitchPoint) {
                  dispatch(sendEvent({ type: 'SEEK', meta: { to: autoswitchPoint - 5 } }));
                }
              },
              seekToEnd: () => {
                if (duration) {
                  dispatch(sendEvent({ type: 'SEEK', meta: { to: duration - 5 } }));
                }
              },
              seekToAd: (pointIndex: number) => {
                if (!adPoints[pointIndex]) logger.log('point not found');
                else {
                  dispatch(sendEvent({ type: 'SEEK', meta: { to: adPoints[pointIndex].point - 5 } }));
                }
              },
              invokeError: (code: number) => {
                dispatch(sendEvent({ type: 'PLAYER_ERROR', meta: { error: new PlayerError(code).serialize() } }));
              },
            };
          }

          dispatch(sendEvent({ type: 'SETUP_DEBUG_RESOLVE' }));
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'debug', step);
        effect();
      }
    },
  });

export default {
  ...debug,
  config,
  addMiddleware,
};
