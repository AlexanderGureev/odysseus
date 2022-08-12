import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';
import { NETWORK_CHECK_PATH, request } from 'utils/request';
import { retry, sleep } from 'utils/retryUtils';

import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',

  offlineTimer: [5, 10, 15],
  offlineRetryQuantity: 3,
  offlineRetryTime: 1,

  attempt: 0,
  timerValue: 0,
  timerTimestamp: null,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    GO_OFFLINE: 'RETRY_PENDING',
    INITIALIZE_NETWORK_RESOLVE: 'RETRY_PENDING',
  },
  RETRY_PENDING: {
    GO_ONLINE: 'IDLE',
    RETRY_FAILED: 'TIMEOUT_WAITING',
  },
  TIMEOUT_WAITING: {
    GO_ONLINE: 'IDLE',
    CLICK_RETRY_BUTTON: 'RETRY_PENDING',
    NEXT_RETRY: null,
    UPDATE_TIMER: null,
  },
  REJECTED: {
    GO_ONLINE: 'IDLE',
    RELOAD: null,
  },
};

const networkRecovery = createSlice({
  name: 'networkRecovery',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;
      const step = next || state.step;

      logger.log('[FSM]', 'networkRecovery', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'GO_ONLINE':
          return initialState;
        case 'CLICK_RETRY_BUTTON':
          state.attempt = 0;
          state.timerTimestamp = Date.now();
          state.step = step;
          break;
        case 'RETRY_FAILED':
          state.timerValue = state.offlineTimer[state.attempt];
          state.timerTimestamp = Date.now();
          state.step = step;
          break;
        case 'NEXT_RETRY': {
          state.attempt += 1;
          state.step = state.attempt < state.offlineTimer.length ? 'RETRY_PENDING' : 'REJECTED';
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
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, networkRecovery.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().networkRecovery;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        RETRY_PENDING: async () => {
          const { offlineRetryQuantity, offlineRetryTime } = getState().networkRecovery;

          try {
            await retry(() => request.options(NETWORK_CHECK_PATH, { networkCheck: false }), {
              attempts: offlineRetryQuantity,
              timeoutFn: () => offlineRetryTime * 1000,
              isSuccess: (res: Response) => res.ok,
            });

            dispatch(sendEvent({ type: 'GO_ONLINE' }));
          } catch (err) {
            dispatch(sendEvent({ type: 'RETRY_FAILED' }));
          }
        },
        TIMEOUT_WAITING: async () => {
          const ts = getState().networkRecovery.timerTimestamp;

          while (true) {
            const {
              networkRecovery: { timerTimestamp, timerValue },
            } = getState();

            if (timerTimestamp !== ts) return;
            await sleep(1000);

            if (timerValue === 1) {
              dispatch(sendEvent({ type: 'NEXT_RETRY' }));
            } else {
              dispatch(sendEvent({ type: 'UPDATE_TIMER', payload: { timerValue: timerValue - 1 } }));
            }
          }
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'networkRecovery', step);
        effect();
      }
    },
  });

export default {
  ...networkRecovery,
  config,
  addMiddleware,
};
