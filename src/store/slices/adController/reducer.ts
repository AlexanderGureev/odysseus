import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { startListening } from 'store/middleware';
import type { AppEvent, FSMConfig } from 'store/types';
import { TAdPointConfig } from 'types/ad';
import { logger } from 'utils/logger';

import { checkPauseRoll, checkPostRoll, checkTimePoint, init, initAdBreak, preloadAdBlock } from './effects';
import { Opts } from './effects/initAdBreak';
import { ActionPayload, Event, FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',

  data: null,
  point: null,
  isStarted: false,
};

const extend = (config: FSMConfig<State, Event>, transition: { [event in Event]?: State | null }) => {
  return Object.entries(config).reduce((acc, [state, value]) => {
    return {
      ...acc,
      [state]: {
        ...value,
        ...transition,
      },
    };
  }, {});
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    AD_INIT: 'INIT_AD_PENDING',
    CHECK_TIME_POINT: 'CHECK_TIME_POINT_PENDING',
    DO_PLAY_RESOLVE: 'CHECK_PAUSE_ROLL',
    VIDEO_END: 'CHECK_POST_ROLL',
  },
  CHECK_POST_ROLL: {
    CHECK_POST_ROLL_RESOLVE: 'IDLE',
    INIT_AD_BREAK: 'AD_BREAK',
  },
  CHECK_PAUSE_ROLL: {
    CHECK_PAUSE_ROLL_RESOLVE: 'IDLE',
    INIT_AD_BREAK: 'AD_BREAK',
  },
  INIT_AD_PENDING: {
    RESUME_VIDEO: 'IDLE', // нет преролла
    INIT_AD_REJECT: 'DISABLED', // нет рекламы
    INIT_AD_BREAK: 'AD_BREAK',
  },
  CHECK_TIME_POINT_PENDING: {
    PRELOAD_AD_BLOCK: 'PRELOAD_AD_BLOCK_PENDING',
    INIT_AD_BREAK: 'AD_BREAK',
    CHECK_TIME_POINT_RESOLVE: 'IDLE',
  },
  PRELOAD_AD_BLOCK_PENDING: {
    PRELOAD_AD_BLOCK_STARTED: 'IDLE',
    PRELOAD_AD_BLOCK_REJECT: 'IDLE',
  },
  AD_BREAK: {
    AD_BREAK_STARTED: null,
    AD_BREAK_END: 'END',
  },
  END: {
    RESET: 'IDLE',
  },
  DISABLED: {
    AD_INIT: 'INIT_AD_PENDING',
  },
};

const adController = createSlice({
  name: 'adController',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<ActionPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      if (type === 'RESET') return initialState;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'adController', `${state.step} -> ${type} -> ${next}`);

      const step = next || state.step;

      switch (type) {
        case 'AD_BREAK_STARTED':
          return { ...state, step, isStarted: true };
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => currentState.adController.step !== prevState.adController.step,
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().adController;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        INIT_AD_PENDING: () => init(opts),
        CHECK_PAUSE_ROLL: () => checkPauseRoll(opts),
        CHECK_POST_ROLL: () => checkPostRoll(opts),
        CHECK_TIME_POINT_PENDING: () => {
          const {
            payload: { meta },
          } = action as PayloadAction<{
            meta: { currentTime: number };
          }>;

          checkTimePoint(meta, opts);
        },
        PRELOAD_AD_BLOCK_PENDING: () => {
          const {
            payload: { meta: point },
          } = action as PayloadAction<{
            meta: TAdPointConfig;
          }>;

          preloadAdBlock(point, opts);
        },
        AD_BREAK: () => {
          const {
            payload: { payload },
          } = action as PayloadAction<{
            payload: Opts;
          }>;

          initAdBreak(payload, opts);
        },
        END: () => {
          const { isStarted } = getState().adController;

          dispatch(
            sendEvent({
              type: 'RESET',
            })
          );

          if (isStarted) {
            dispatch(
              sendEvent({
                type: 'RESUME_VIDEO',
              })
            );
          }
        },
        DISABLED: () => {
          dispatch(
            sendEvent({
              type: 'RESUME_VIDEO',
            })
          );
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'adController', step);
        effect();
      }
    },
  });

export default {
  ...adController,
  config,
  addMiddleware,
};
