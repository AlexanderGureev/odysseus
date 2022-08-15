import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, FSMConfig } from 'store/types';
import { AdCategory } from 'types/ad';
import { logger } from 'utils/logger';

import { getNext, pauseBlock, resumeBlock, skipBlock, startNextBlock } from './effects';
import { ActionPayload, FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',

  links: {},
  point: {
    category: AdCategory.PRE_ROLL,
    point: 0,
  },
  limit: 0,
  index: -1,
  isExclusive: false,
  isPromo: false,
  skippable: false,
  isVolumeAvailable: false,

  currentTime: null,
  duration: null,
  remainingTime: null,

  adFoxParams: {},
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    START_AD_BREAK: 'NEXT_BLOCK_PENDING',
  },
  START_BLOCK_PENDING: {
    PLAY_AD_BLOCK_RESOLVE: 'PLAYING',
    AD_BLOCK_END: 'NEXT_BLOCK_PENDING',
  },
  PLAY_AD_BLOCK_PENDING: {
    PLAY_AD_BLOCK_RESOLVE: 'PLAYING',
  },
  PAUSE_AD_BLOCK_PENDING: {
    PAUSE_AD_BLOCK_RESOLVE: 'PAUSED',
  },
  SKIP_AD_BLOCK_PENDING: {
    AD_BLOCK_END: 'NEXT_BLOCK_PENDING',
  },
  PLAYING: {
    DO_PAUSE_AD_BLOCK: 'PAUSE_AD_BLOCK_PENDING',
    GO_TO_HIDDEN: 'PAUSE_AD_BLOCK_PENDING',
    DO_SKIP_AD_BLOCK: 'SKIP_AD_BLOCK_PENDING',
    AD_BLOCK_END: 'NEXT_BLOCK_PENDING',
    AD_BLOCK_TIME_UPDATE: null,
    AD_STATE_CHANGE: null,
  },
  PAUSED: {
    DO_PLAY_AD_BLOCK: 'PLAY_AD_BLOCK_PENDING',
    AD_BLOCK_END: 'NEXT_BLOCK_PENDING',
    DO_SKIP_AD_BLOCK: 'SKIP_AD_BLOCK_PENDING',
    GO_TO_VISIBLE: 'PLAY_AD_BLOCK_PENDING',
  },
  NEXT_BLOCK_PENDING: {
    PLAY_NEXT_BLOCK: 'START_BLOCK_PENDING',
    AD_BREAK_END: 'END',
  },
  END: {
    RESET: 'IDLE',
  },
};

const adBlock = createSlice({
  name: 'adBlock',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<ActionPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      if (type === 'RESET') return initialState;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'adBlock', `${state.step} -> ${type} -> ${next}`);

      const step = next || state.step;

      switch (type) {
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, adBlock.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().adBlock;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        NEXT_BLOCK_PENDING: () => {
          getNext(opts);
        },
        START_BLOCK_PENDING: () => {
          startNextBlock(opts);
        },
        PAUSE_AD_BLOCK_PENDING: () => pauseBlock(opts),
        PLAY_AD_BLOCK_PENDING: () => resumeBlock(opts),
        SKIP_AD_BLOCK_PENDING: () => skipBlock(opts),
        END: () => {
          return;
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'adBlock', step);
        effect();
      }
    },
  });

export default {
  ...adBlock,
  config,
  addMiddleware,
};
