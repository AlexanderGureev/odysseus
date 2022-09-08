import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    NEXT_STEP: 'EMAIL_STEP',
    CLOSE_OVERLAY: 'CLOSING_REPORT_FORM',
  },
  EMAIL_STEP: {
    NEXT_STEP: 'SENDING_REPORT_STEP',
    CLOSE_OVERLAY: 'CLOSING_REPORT_FORM',
  },
  SENDING_REPORT_STEP: {
    SEND_ERROR_REPORT_REJECT: 'ERROR_STEP',
    SEND_ERROR_REPORT_RESOLVE: 'END',
  },
  ERROR_STEP: {
    NEXT_STEP: 'SENDING_REPORT_STEP',
    CLOSE_OVERLAY: 'CLOSING_REPORT_FORM',
  },
  END: {
    CLOSE_OVERLAY: 'CLOSING_REPORT_FORM',
  },
  CLOSING_REPORT_FORM: {
    CLOSING_REPORT_FORM_RESOLVE: 'IDLE',
  },
};

const errorReportsForm = createSlice({
  name: 'errorReportsForm',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (next === undefined) return state;

      logger.log('[FSM]', 'errorReportsForm', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, errorReportsForm.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().errorReportsForm;

      const handler: { [key in State]?: () => Promise<void> | void } = {
        CLOSING_REPORT_FORM: () => {
          const s = api.getOriginalState().errorReportsForm.step;
          dispatch(sendEvent({ type: 'CLOSING_REPORT_FORM_RESOLVE', meta: { step: s } }));
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'errorReportsForm', step);
        effect();
      }
    },
  });

export default {
  ...errorReportsForm,
  config,
  addMiddleware,
};
