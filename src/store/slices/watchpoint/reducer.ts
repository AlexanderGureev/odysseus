import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { toFixed } from 'utils';
import { logger } from 'utils/logger';

import { FSMState, State, watchPoints } from './types';

const HEARTBEAT_PLAIN_VIDEO_SEC = 30;

const initialState: FSMState = {
  step: 'IDLE',

  previous: {
    AD: 0,
    PLAIN: 0,
  },

  progress: {
    AD: 0,
    PLAIN: 0,
  },

  previousTime: 0,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    AD_BLOCK_TIME_UPDATE: null,
    TIME_UPDATE: 'CHECK_PLAIN_WATCHPOINT_PENDING',
  },
  CHECK_PLAIN_WATCHPOINT_PENDING: {
    CHECK_PLAIN_WATCHPOINT_RESOLVE: 'IDLE',
  },
  CHECK_AD_WATCHPOINT_PENDING: {},
};

const watchpoint = createSlice({
  name: 'watchpoint',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'watchpoint', `${state.step} -> ${type} -> ${next}`);

      const step = next || state.step;

      switch (type) {
        case 'TIME_UPDATE':
        case 'AD_BLOCK_TIME_UPDATE':
          const videoType = type === 'AD_BLOCK_TIME_UPDATE' ? 'AD' : 'PLAIN';
          const diff = Math.abs(payload.currentTime - state.previous[videoType]);

          if (diff < 1) state.progress[videoType] = toFixed(state.progress[videoType] + diff);
          state.previous[videoType] = payload.currentTime;
          state.step = step;
          break;
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => currentState.watchpoint.step !== prevState.watchpoint.step,
    effect: (action, api) => {
      const { dispatch, getState, extra: services } = api;

      const { step, progress, previousTime } = getState().watchpoint;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        CHECK_PLAIN_WATCHPOINT_PENDING: () => {
          const {
            payload: { payload },
          } = action as PayloadAction<{
            payload: { currentTime: number };
          }>;

          const currentTime = Math.floor(payload.currentTime);

          const newProgress = {
            ...progress,
          };

          const {
            playback: { duration },
            root: { config },
            quality: { qualityStats },
            buffering: { bufferingTime, initialBufferTime },
          } = getState();

          const demonStatPayload = {
            bufferTime: bufferingTime,
            currentTime,
            initialBufferTime,
            playTimeByQuality: qualityStats,
          };

          const period = config.config.scrobbling?.period;

          // if (currentTime === 0) {
          //   opts.services.demonService.sendStat(demonStatPayload);
          // }

          if (period && progress.PLAIN > period) {
            logger.log('[hearbeat]', { type: 'PLAIN', value: HEARTBEAT_PLAIN_VIDEO_SEC });
            newProgress.PLAIN = 0;
            opts.services.demonService.sendStat(demonStatPayload);
          }

          if (!duration || Math.floor(previousTime) === currentTime) {
            dispatch(
              sendEvent({
                type: 'CHECK_PLAIN_WATCHPOINT_RESOLVE',
              })
            );
            return;
          }

          for (const { measure, num, value } of watchPoints) {
            const sec = measure === 'percents' ? Math.floor((num / 100) * duration) : num;

            if (sec === currentTime) {
              logger.log('[watchpoint]', { num, value });
            }
          }

          dispatch(
            sendEvent({
              type: 'CHECK_PLAIN_WATCHPOINT_RESOLVE',
              payload: {
                previousTime: payload.currentTime,
                progress: newProgress,
              },
            })
          );
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'watchpoint', step);
        effect();
      }
    },
  });

export default {
  ...watchpoint,
  config,
  addMiddleware,
};
