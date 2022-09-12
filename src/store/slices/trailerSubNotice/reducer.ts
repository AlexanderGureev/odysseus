import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { clickSubscribeButton } from '../adDisableSuggestion/effects/clickSubscribeButton';
import { FSMState, State } from './types';
import { getContent } from './utils';

const initialState: FSMState = {
  step: 'IDLE',

  buttonText: null,
  description: null,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    SELECTING_PLAYER_THEME_RESOLVE: null,
  },
  INITIALIZE_TRAILER_NOTICE: {
    INITIALIZE_TRAILER_NOTICE_RESOLVE: 'READY',
  },
  READY: {
    CHANGE_TRACK: 'IDLE',
    CLICK_SUB_BUTTON: 'CLICK_SUB_BUTTON_PROCESSING',
  },
  CLICK_SUB_BUTTON_PROCESSING: {
    CLICK_SUB_BUTTON_PROCESSING_RESOLVE: 'READY',
  },
  DISABLED: {
    CHANGE_TRACK: 'IDLE',
  },
};

const trailerSubNotice = createSlice({
  name: 'trailerSubNotice',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (next === undefined) return state;

      logger.log('[FSM]', 'trailerSubNotice', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'SELECTING_PLAYER_THEME_RESOLVE':
          return { ...state, step: payload.theme === 'trailer' ? 'INITIALIZE_TRAILER_NOTICE' : 'DISABLED' };
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, trailerSubNotice.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().trailerSubNotice;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        INITIALIZE_TRAILER_NOTICE: () => {
          const payload = getContent(getState());
          dispatch(sendEvent({ type: 'INITIALIZE_TRAILER_NOTICE_RESOLVE', payload }));
        },
        CLICK_SUB_BUTTON_PROCESSING: () => {
          clickSubscribeButton(opts);
          dispatch(sendEvent({ type: 'CLICK_SUB_BUTTON_PROCESSING_RESOLVE' }));
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'trailerSubNotice', step);
        effect();
      }
    },
  });

export default {
  ...trailerSubNotice,
  config,
  addMiddleware,
};
