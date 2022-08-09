import { createAction, createSlice } from '@reduxjs/toolkit';
import { STORAGE_SETTINGS } from 'services/LocalStorageService/types';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
  list: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
  currentSpeed: 1,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    DO_INIT: 'PLAYBACK_SPEED_INIT',
    START_PLAYBACK: 'READY',
  },
  PLAYBACK_SPEED_INIT: {
    PLAYBACK_SPEED_INIT_RESOLVE: 'IDLE',
  },
  READY: {
    SET_PLAYBACK_SPEED: 'CHANGE_PLAYBACK_SPEED_PENDING',
    AD_BREAK_STARTED: 'IDLE',
    CHANGE_TRACK: 'IDLE',
  },
  CHANGE_PLAYBACK_SPEED_PENDING: {
    CHANGE_PLAYBACK_SPEED_RESOLVE: 'READY',
  },
};

const playbackSpeed = createSlice({
  name: 'playbackSpeed',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'playbackSpeed', `${state.step} -> ${type} -> ${next}`);

      const step = next || state.step;

      switch (type) {
        case 'SET_PLAYBACK_SPEED':
          state.step = step;
          state.currentSpeed = payload.value;
          break;
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, playbackSpeed.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().playbackSpeed;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        PLAYBACK_SPEED_INIT: () => {
          services.playerService.on('ratechange', (value) => {
            if (value !== getState().playbackSpeed.currentSpeed) {
              dispatch(sendEvent({ type: 'SET_PLAYBACK_SPEED', payload: { value } }));
            }
          });

          const currentSpeed =
            services.localStorageService.getItemByDomain<number>(STORAGE_SETTINGS.PLAYBACK_SPEED) || 1;

          dispatch(sendEvent({ type: 'PLAYBACK_SPEED_INIT_RESOLVE', payload: { currentSpeed } }));
        },
        CHANGE_PLAYBACK_SPEED_PENDING: () => {
          const { currentSpeed } = getState().playbackSpeed;
          services.playerService.setPlaybackRate(currentSpeed);
          services.localStorageService.setItemByDomain(STORAGE_SETTINGS.PLAYBACK_SPEED, currentSpeed);
          dispatch(sendEvent({ type: 'CHANGE_PLAYBACK_SPEED_RESOLVE' }));
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'playbackSpeed', step);
        effect();
      }
    },
  });

export default {
  ...playbackSpeed,
  config,
  addMiddleware,
};
