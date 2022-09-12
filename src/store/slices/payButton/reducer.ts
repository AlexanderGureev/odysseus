import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { clickSubscribeButton } from '../adDisableSuggestion/effects/clickSubscribeButton';
import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
  text: '',
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    SETUP_PAY_NOTIFY_REJECT: 'SETUP_PAY_BUTTON',
  },
  SETUP_PAY_BUTTON: {
    SETUP_PAY_BUTTON_RESOLVE: 'READY',
    SETUP_PAY_BUTTON_REJECT: 'DISABLED',
  },
  READY: {
    CHANGE_TRACK: 'IDLE',
    CLICK_PAY_BUTTON: 'CLICK_PAY_BUTTON_PROCESSING',
  },
  CLICK_PAY_BUTTON_PROCESSING: {
    CLICK_PAY_BUTTON_PROCESSING_RESOLVE: 'READY',
  },
  DISABLED: {
    CHANGE_TRACK: 'IDLE',
  },
};

const payButton = createSlice({
  name: 'payButton',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;
      if (next === undefined) return state;

      logger.log('[FSM]', 'payButton', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () => {
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, payButton.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const opts = {
        dispatch,
        getState,
        services,
      };

      const { step } = getState().payButton;

      const handler: { [key in State]?: () => Promise<void> | void } = {
        SETUP_PAY_BUTTON: () => {
          const {
            root: {
              features: { SUBSCRIPTION_TITLE, SUBSCRIPTION },
              adConfig,
              adPoints,
              config,
            },
          } = getState();

          if (
            SUBSCRIPTION_TITLE &&
            SUBSCRIPTION &&
            adConfig &&
            adPoints.length &&
            config?.trackInfo?.track?.hasRightAvod !== false
          ) {
            dispatch(sendEvent({ type: 'SETUP_PAY_BUTTON_RESOLVE', payload: { text: SUBSCRIPTION_TITLE } }));
          } else {
            dispatch(sendEvent({ type: 'SETUP_PAY_BUTTON_REJECT' }));
          }
        },
        CLICK_PAY_BUTTON_PROCESSING: () => {
          clickSubscribeButton(opts);
          dispatch(sendEvent({ type: 'CLICK_PAY_BUTTON_PROCESSING_RESOLVE' }));
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'payButton', step);
        effect();
      }
    },
  });
};

export default {
  ...payButton,
  config,
  addMiddleware,
};
