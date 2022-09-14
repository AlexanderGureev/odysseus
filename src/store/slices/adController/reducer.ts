import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { TAdPointConfig } from 'types/ad';
import { PlayerDisposeError } from 'utils/errors';
import { logger } from 'utils/logger';

import { checkPauseRoll, checkPostRoll, checkTimePoint, init, initAdBreak, preloadAdBlock } from './effects';
import { Opts } from './effects/initAdBreak';
import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',

  data: null,
  point: null,
  isStarted: false,
  adBreaksCount: 0,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    DO_INIT: 'INIT_AD_SERVICE',
    AD_INIT: 'INIT_AD_PENDING',
    CHECK_TIME_POINT: 'CHECK_TIME_POINT_PENDING',
    DO_PLAY_RESOLVE: 'CHECK_PAUSE_ROLL_PENDING',
    SET_PLAYING: 'CHECK_PAUSE_ROLL_PENDING', // для обработки нажатия play в ios в фулскрине
    CHECK_POST_ROLL: 'CHECK_POST_ROLL_PENDING',
  },
  INIT_AD_SERVICE: {
    INIT_AD_SERVICE_RESOLVE: 'IDLE',
  },
  CHECK_POST_ROLL_PENDING: {
    CHECK_POST_ROLL_RESOLVE: 'IDLE',
    INIT_AD_BREAK: 'INITIALIZING_AD_BREAK',
  },
  CHECK_PAUSE_ROLL_PENDING: {
    CHECK_PAUSE_ROLL_RESOLVE: 'IDLE',
    INIT_AD_BREAK: 'INITIALIZING_AD_BREAK',
  },
  INIT_AD_PENDING: {
    RESUME_VIDEO: 'IDLE', // нет преролла
    INIT_AD_REJECT: 'DISABLED', // нет рекламы
    INIT_AD_BREAK: 'INITIALIZING_AD_BREAK',
  },
  CHECK_TIME_POINT_PENDING: {
    PRELOAD_AD_BLOCK: 'PRELOAD_AD_BLOCK_PENDING',
    INIT_AD_BREAK: 'INITIALIZING_AD_BREAK',
    CHECK_TIME_POINT_RESOLVE: 'IDLE',
  },
  PRELOAD_AD_BLOCK_PENDING: {
    PRELOAD_AD_BLOCK_STARTED: 'IDLE',
    PRELOAD_AD_BLOCK_REJECT: 'IDLE',
  },
  INITIALIZING_AD_BREAK: {
    AD_BREAK_STARTED: 'AD_BREAK',
    AD_BREAK_END: 'IDLE',
    DISPOSE_PLAYER: 'IDLE',
  },
  AD_BREAK: {
    AD_BREAK_END: 'DISPOSE_AD_BREAK',
  },
  DISPOSE_AD_BREAK: {
    RESUME_VIDEO: 'IDLE',
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
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (type === 'CHANGE_TRACK') return initialState;
      if (next === undefined) return state;

      logger.log('[FSM]', 'adController', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'AD_BREAK_END':
          return { ...initialState, step, adBreaksCount: state.adBreaksCount };
        case 'AD_BREAK_STARTED':
          return { ...state, step, isStarted: true, adBreaksCount: state.adBreaksCount + 1 };
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, adController.name),
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
        INIT_AD_SERVICE: () => {
          services.playerService.on('timeupdate', ({ currentTime }) => {
            dispatch(
              sendEvent({
                type: 'CHECK_TIME_POINT',
                meta: {
                  currentTime,
                },
              })
            );
          });

          services.adService.addHook('adBlockCreated', (block) => {
            block.on('AdInitialized', (data) => {
              dispatch(sendEvent({ type: 'AD_CREATIVE_INITIALIZED', meta: data }));
            });
          });

          dispatch(sendEvent({ type: 'INIT_AD_SERVICE_RESOLVE' }));
        },
        INIT_AD_PENDING: () => init(opts),
        CHECK_PAUSE_ROLL_PENDING: () => checkPauseRoll(opts),
        CHECK_POST_ROLL_PENDING: () => checkPostRoll(opts),
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
        INITIALIZING_AD_BREAK: async () => {
          const {
            payload: { payload },
          } = action as PayloadAction<{
            payload: Opts;
          }>;

          try {
            await services.adService.initAdBreakHook(payload.point);
          } catch (err) {
            if (err instanceof PlayerDisposeError) {
              logger.error(
                '[INITIALIZING_AD_BREAK]',
                'initAdBreakHook rejected, player dispose, message:',
                err?.message
              );

              dispatch(sendEvent({ type: 'DISPOSE_PLAYER' }));
              return;
            }
          }

          initAdBreak(payload, opts);
        },
        DISPOSE_AD_BREAK: () => {
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
