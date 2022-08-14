import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {},
};

const analytics = createSlice({
  name: 'analytics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'analytics', `${state.step} -> ${type} -> ${next}`);

      return next ? { ...state, step: next, ...payload } : { ...state, ...payload };
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => true,
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { quality, adController, autoSwitch } = getState();

      const opts = {
        dispatch,
        getState,
        services,
      };

      const a = action as PayloadAction<EventPayload>;

      switch (a.payload.type) {
        case 'PARSE_CONFIG_RESOLVE':
          console.log('[TEST]', a.payload.type);
          break;
        case 'START_PLAYBACK':
          console.log('[TEST]', a.payload.type);
          break;
        case 'DO_PLAY':
          console.log('[TEST]', a.payload.type);
          break;
        case 'DO_PAUSE':
          console.log('[TEST]', a.payload.type);
          break;
        case 'TIME_UPDATE':
          console.log('[TEST]', a.payload.type);

          if (quality.previousBitrate !== quality.videoMeta.bitrate) {
            console.log('[TEST]', 'BITRATE CHANGE');
          }

          break;
        case 'WATCHPOINT':
          console.log('[TEST]', a.payload.type);
          break;
        case 'HEARTBEAT_VIDEO':
          console.log('[TEST]', a.payload.type);
          break;
        case 'SEEK_STARTED':
          console.log('[TEST]', a.payload.type);
          break;
        case 'SEEK_END':
          console.log('[TEST]', a.payload.type);
          break;
        case 'BUFFERING_START':
          console.log('[TEST]', a.payload.type);
          break;
        case 'BUFFERING_END':
          console.log('[TEST]', a.payload.type);
          break;
        case 'SET_VOLUME':
          console.log('[TEST]', a.payload.type);
          break;
        case 'VIDEO_END':
          console.log('[TEST]', a.payload.type);
          break;

        case 'CHANGE_CURRENT_QUALITY':
          console.log('[TEST]', a.payload.type);
          break;

        case 'SET_PLAYBACK_SPEED':
          console.log('[TEST]', a.payload.type);
          break;

        case 'GO_TO_NEXT_TRACK':
          console.log('[TEST]', a.payload.type);
          break;
        case 'GO_TO_PREV_TRACK':
          console.log('[TEST]', a.payload.type);
          break;

        case 'AUTOSWITCH_NOTIFY_SHOWN':
          console.log('[TEST]', a.payload.type);
          break;
        case 'START_AUTOSWITCH':
          console.log('[TEST]', a.payload.type);
          break;
        case 'HIDE_AUTOSWITCH_NOTIFY':
          console.log('[TEST]', a.payload.type);
          break;
        case 'CHANGE_TRACK':
          console.log('[TEST]', a.payload.type);
          break;

        // реклама
        case 'AD_BREAK_STARTED':
          console.log('[TEST] ad', a.payload.type, adController.point);
          break;
        case 'AD_BLOCK_IMPRESSION':
          console.log('[TEST] ad', a.payload.type);
          break;
        case 'PLAY_AD_BLOCK_RESOLVE':
          console.log('[TEST] ad', a.payload.type);
          break;
        case 'PAUSE_AD_BLOCK_RESOLVE':
          console.log('[TEST] ad', a.payload.type);
          break;
        case 'AD_BLOCK_TIME_UPDATE':
          console.log('[TEST] ad', a.payload.type);
          break;
        case 'DO_SKIP_AD_BLOCK':
          console.log('[TEST] ad', a.payload.type);
          break;
        case 'AD_BLOCK_VIDEO_QUARTILE':
          console.log('[TEST] ad ', a.payload.type);
          break;
        case 'AD_BLOCK_END':
          console.log('[TEST] ad', a.payload.type);
          break;
        case 'AD_BREAK_END':
          console.log('[TEST] ad', a.payload.type);
          break;
      }
    },
  });

export default {
  ...analytics,
  config,
  addMiddleware,
};
