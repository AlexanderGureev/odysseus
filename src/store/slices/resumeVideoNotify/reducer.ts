import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { checkResumeVideo } from './effects';
import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
  isActive: true,
  time: null,
  isResetStartTime: false,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    CHECK_RESUME: 'CHECK_RESUME_VIDEO',
    RESUME_VIDEO_RESOLVE: null,
  },
  CHECK_RESUME_VIDEO: {
    SHOW_RESUME_VIDEO_NOTIFY: 'RESUME_VIDEO_NOTIFY',
    SKIP_RESUME_VIDEO_NOTIFY: 'IDLE',
  },
  RESUME_VIDEO_NOTIFY: {
    RESUME_VIDEO_NOTIFY_RESOLVE: 'IDLE',
    RESUME_VIDEO_NOTIFY_REJECT: 'IDLE',
  },
};

const resumeVideoNotify = createSlice({
  name: 'resumeVideoNotify',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'resumeVideoNotify', `${state.step} -> ${type} -> ${next}`);

      const step = next || state.step;

      switch (type) {
        case 'RESUME_VIDEO_RESOLVE':
          state.isResetStartTime = false;
          break;
        case 'RESUME_VIDEO_NOTIFY_REJECT':
          return { ...state, step, isResetStartTime: true };
        case 'SHOW_RESUME_VIDEO_NOTIFY':
          return { ...state, step, isActive: false, ...payload };
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () => {
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, resumeVideoNotify.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().resumeVideoNotify;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        CHECK_RESUME_VIDEO: () => checkResumeVideo(opts),
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'resumeVideoNotify', step);
        effect();
      }
    },
  });
};

export default {
  ...resumeVideoNotify,
  config,
  addMiddleware,
};
