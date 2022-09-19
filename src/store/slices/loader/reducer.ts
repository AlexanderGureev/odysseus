import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT } from 'store/actions';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
  type: 'overlay',
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    GO_TO_NEXT_TRACK: 'SHOWING',
    GO_TO_PREV_TRACK: 'SHOWING',
    SEEK: 'SHOWING',
    BUFFERING_START: 'SHOWING',
    SELECT_SOURCE_RESOLVE: 'SHOWING',
    INIT_RESUME_VIDEO: 'SHOWING',

    // реклама
    AD_INIT: 'SHOWING',
    PLAY_NEXT_BLOCK: 'SHOWING',
  },
  SHOWING: {
    ERROR_SHOWN: 'IDLE',
    INIT_ANALYTICS_RESOLVE: 'IDLE',
    SEEK_END: 'IDLE',
    BUFFERING_END: 'IDLE',
    RESUME_VIDEO_RESOLVE: 'IDLE',
    SHOW_BIG_PLAY_BUTTON: 'IDLE',
    INIT_SPLASHCREEN_RESOLVE: 'IDLE',

    // реклама
    AD_BREAK_STARTED: 'IDLE',
    PLAY_AD_BLOCK_RESOLVE: 'IDLE',
    AD_BREAK_END: 'IDLE',
    DISPOSE_PLAYER: 'IDLE',
  },
};

const loader = createSlice({
  name: 'loader',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (next === undefined) return state;

      logger.log('[FSM]', 'loader', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'INIT_RESUME_VIDEO':
        case 'SELECT_SOURCE_RESOLVE':
        case 'SEEK':
        case 'BUFFERING_START':
          return { ...state, step, type: 'spinner' };
        case 'AD_INIT':
        case 'GO_TO_NEXT_TRACK':
        case 'GO_TO_PREV_TRACK':
        case 'PLAY_NEXT_BLOCK':
          return { ...state, step, type: 'overlay' };
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

export default {
  ...loader,
  config,
};
