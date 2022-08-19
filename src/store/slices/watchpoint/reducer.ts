import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { FSMState, State, watchPoints } from './types';

const initialState: FSMState = {
  step: 'IDLE',
  previousTime: -1,
  points: [],
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    PARSE_CONFIG_RESOLVE: null,
    TIME_UPDATE: 'CHECK_PLAIN_WATCHPOINT_PENDING',
  },
  CHECK_PLAIN_WATCHPOINT_PENDING: {
    CHECK_PLAIN_WATCHPOINT_RESOLVE: 'IDLE',
  },
};

const watchpoint = createSlice({
  name: 'watchpoint',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (type === 'CHANGE_TRACK') return initialState;
      if (type === 'RESET_PLAYBACK_RESOLVE') {
        return { ...initialState, points: state.points };
      }

      if (next === undefined) return state;

      logger.log('[FSM]', 'watchpoint', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'PARSE_CONFIG_RESOLVE': {
          const scrobbling = payload.config.config.scrobbling;

          const points = scrobbling?.mandatory_points?.length
            ? scrobbling.mandatory_points.map((value) => ({
                value,
                num: value,
                measure: 'percents',
              }))
            : [];

          const uniquePoints = [...watchPoints, ...points].reduce(
            (acc, point) => ({
              ...acc,
              [`${point.measure}:${point.num}`]: point,
            }),
            {}
          );

          state.points = Object.values(uniquePoints);
          break;
        }
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, watchpoint.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().watchpoint;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        CHECK_PLAIN_WATCHPOINT_PENDING: () => {
          const {
            watchpoint: { points, previousTime },
            playback: { currentTime, duration },
          } = getState();

          const time = Math.floor(currentTime || 0);

          if (duration && previousTime !== time) {
            for (const { measure, num, value } of points) {
              const sec = measure === 'percents' ? Math.floor((num / 100) * duration) : num;

              if (sec === time) {
                dispatch(
                  sendEvent({
                    type: 'WATCHPOINT',
                    payload: {
                      value: { measure, num, value },
                    },
                  })
                );
              }
            }
          }

          dispatch(
            sendEvent({
              type: 'CHECK_PLAIN_WATCHPOINT_RESOLVE',
              payload: {
                previousTime: time,
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
