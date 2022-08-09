import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';
import { DELTA } from 'utils/token';

import { fetchBeholderToken } from './effects/fetchBeholderToken';
import { sendViews } from './effects/sendViews';
import { FSMState, State } from './types';

// https://confluence.more.tv/x/gh7J
const initialState: FSMState = {
  step: 'IDLE',

  hostname: '',
  period: 30,
  points: [],
  token: null,
  tokenExpiredAt: null,
  serviceId: 1,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    PARSE_CONFIG_RESOLVE: null,
  },
  FETCH_BEHOLDER_TOKEN: {
    FETCH_BEHOLDER_TOKEN_RESOLVE: 'READY',
    FETCH_BEHOLDER_TOKEN_REJECT: 'DISABLED',
  },
  READY: {
    DO_PAUSE: 'CHECK_BEHOLDER_TOKEN',
    SEEK: 'CHECK_BEHOLDER_TOKEN',
    BEFORE_UNLOAD: 'CHECK_BEHOLDER_TOKEN',
    WATCHPOINT: null,
    HEARTBEAT_VIDEO: null,
  },
  CHECK_BEHOLDER_TOKEN: {
    CHECK_BEHOLDER_TOKEN_RESOLVE: 'SEND_VIEWS_PENDING',
    FETCH_BEHOLDER_TOKEN_RESOLVE: 'SEND_VIEWS_PENDING',
    FETCH_BEHOLDER_TOKEN_REJECT: 'DISABLED',
  },
  SEND_VIEWS_PENDING: {
    SEND_VIEWS_RESOLVE: 'READY',
  },
  DISABLED: {
    CHANGE_TRACK: 'IDLE',
  },
};

const beholder = createSlice({
  name: 'beholder',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (type === 'CHANGE_TRACK') return initialState;
      if (next === undefined) return state;

      logger.log('[FSM]', 'beholder', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'WATCHPOINT': {
          if (payload.value.measure === 'percents' && state.points.includes(payload.value.num)) {
            state.points = state.points.filter((p) => p !== payload.value.num);
            state.step = 'CHECK_BEHOLDER_TOKEN';
          }
          break;
        }
        case 'HEARTBEAT_VIDEO': {
          if (payload.value === state.period) {
            state.step = 'CHECK_BEHOLDER_TOKEN';
          }
          break;
        }
        case 'PARSE_CONFIG_RESOLVE': {
          const {
            features: { DISABLE_BEHOLDER },
            config: { config },
            meta: { userToken },
          } = payload;

          const scrobbling = config.scrobbling;

          if (!scrobbling?.hostname || !userToken || DISABLE_BEHOLDER) {
            return { ...state, step: 'DISABLED' };
          }

          return {
            ...state,
            step: 'FETCH_BEHOLDER_TOKEN',
            hostname: scrobbling.hostname,
            period: scrobbling.period || 30,
            points: scrobbling.mandatory_points,
            serviceId: scrobbling.serviceId ?? 1,
            timePrevious: 0,
            timeProgress: 0,
            token: null,
            tokenExpiredAt: null,
          };
        }
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, beholder.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().beholder;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        CHECK_BEHOLDER_TOKEN: async () => {
          const { tokenExpiredAt } = getState().beholder;
          if (!tokenExpiredAt) {
            dispatch(sendEvent({ type: 'FETCH_BEHOLDER_TOKEN_REJECT' }));
            return;
          }

          if (Date.now() > tokenExpiredAt - DELTA) {
            await fetchBeholderToken(opts);
          } else {
            dispatch(sendEvent({ type: 'CHECK_BEHOLDER_TOKEN_RESOLVE' }));
          }
        },
        FETCH_BEHOLDER_TOKEN: () => fetchBeholderToken(opts),
        SEND_VIEWS_PENDING: () => sendViews(opts),
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'beholder', step);
        effect();
      }
    },
  });

export default {
  ...beholder,
  config,
  addMiddleware,
};
