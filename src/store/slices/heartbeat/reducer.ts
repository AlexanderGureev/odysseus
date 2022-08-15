import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { toFixed } from 'utils';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',

  previous: {
    AD: 0,
    PLAIN: 0,
  },

  progress: {
    AD: {},
    PLAIN: {},
  },

  heartbeats: [30],
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    PARSE_CONFIG_RESOLVE: null,
    AD_BLOCK_TIME_UPDATE: 'CHECK_HEARBEAT_PENDING',
    TIME_UPDATE: 'CHECK_HEARBEAT_PENDING',
  },
  CHECK_HEARBEAT_PENDING: {
    CHECK_HEARBEAT_RESOLVE: 'IDLE',
  },
};

const heartbeat = createSlice({
  name: 'heartbeat',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (type === 'CHANGE_TRACK') return initialState;
      if (next === undefined) return state;

      logger.log('[FSM]', 'heartbeat', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'PARSE_CONFIG_RESOLVE': {
          const scrobbling = payload.config.config?.scrobbling;
          const period = scrobbling?.period;

          if (period && !state.heartbeats.includes(period)) {
            state.heartbeats = [...state.heartbeats, period];
          }

          const data = state.heartbeats.reduce((acc: Record<string, number>, p) => ({ ...acc, [p]: 0 }), {});
          state.progress.AD = data;
          state.progress.PLAIN = data;
          break;
        }
        case 'TIME_UPDATE':
        case 'AD_BLOCK_TIME_UPDATE':
          const videoType = type === 'AD_BLOCK_TIME_UPDATE' ? 'AD' : 'PLAIN';
          const diff = Math.abs(payload.currentTime - state.previous[videoType]);

          if (diff < 1) {
            state.heartbeats.forEach((p) => {
              const value = state.progress[videoType][p];
              state.progress[videoType][p] = toFixed(value + diff);
            });
          }

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
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, heartbeat.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().heartbeat;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const {
        payload: { type },
      } = action as PayloadAction<EventPayload>;

      const handler: { [key in State]?: () => Promise<void> | void } = {
        CHECK_HEARBEAT_PENDING: () => {
          const {
            heartbeat: { progress, heartbeats },
          } = getState();

          const newProgress = {
            AD: { ...progress.AD },
            PLAIN: { ...progress.PLAIN },
          };

          const videoType = type === 'AD_BLOCK_TIME_UPDATE' ? 'AD' : 'PLAIN';

          const heartbeatPoints = heartbeats.reduce((acc: number[], p) => {
            return progress[videoType][p] >= p ? [...acc, p] : acc;
          }, []);

          heartbeatPoints.forEach((point) => {
            newProgress[videoType][point] = 0;

            dispatch(
              sendEvent({
                type: videoType === 'PLAIN' ? 'HEARTBEAT_VIDEO' : 'HEARTBEAT_AD',
                payload: {
                  value: point,
                },
              })
            );
          });

          dispatch(
            sendEvent({
              type: 'CHECK_HEARBEAT_RESOLVE',
              payload: {
                progress: newProgress,
              },
            })
          );
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'heartbeat', step);
        effect();
      }
    },
  });

export default {
  ...heartbeat,
  config,
  addMiddleware,
};
