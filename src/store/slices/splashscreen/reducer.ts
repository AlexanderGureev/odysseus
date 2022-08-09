import { createAction, createSlice } from '@reduxjs/toolkit';
import { toNumber } from 'server/utils';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import { getMinAge } from 'store/selectors';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { FSMState, Screens, State } from './types';

export const DEFAULT_SPLASH_SCREEN_DURATION = 3500;
export const DEFAULT_AD_SPLASH_SCREEN_DURATION = 3500;

const initialState: FSMState = {
  step: 'IDLE',
  screens: [],
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    LAUNCH_SETUP_RESOLVE: 'INIT_SPLASHCREEN',
  },
  INIT_SPLASHCREEN: {
    INIT_SPLASHCREEN_RESOLVE: 'SHOWING_SPLASHCREEN',
    INIT_SPLASHCREEN_REJECT: 'DISABLED',
  },
  SHOWING_SPLASHCREEN: {
    SHOWING_SPLASHCREEN_END: 'DISABLED',
  },
  DISABLED: {
    CHANGE_TRACK: 'IDLE',
  },
};

const splashscreen = createSlice({
  name: 'splashscreen',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'splashscreen', `${state.step} -> ${type} -> ${next}`);

      return next ? { ...state, step: next, ...payload } : state;
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, splashscreen.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().splashscreen;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        INIT_SPLASHCREEN: () => {
          const {
            root: {
              features: {
                DISCLAIMER_AGE_RESTRICTIONS,
                SPLASH_SCREEN_IMAGE,
                SPLASH_SCREEN_DURATION,
                AD_SPLASH_SCREEN_IMAGE,
                AD_SPLASH_SCREEN_DURATION,
              },
            },
          } = getState();

          const minAge = getMinAge(getState());
          const screens: Screens = [];

          if (SPLASH_SCREEN_IMAGE) {
            const d = toNumber(SPLASH_SCREEN_DURATION);
            const duration = d ? d * 1000 : DEFAULT_SPLASH_SCREEN_DURATION;

            screens.push({
              img: SPLASH_SCREEN_IMAGE,
              duration,
            });
          }

          const images: Record<string, string> = DISCLAIMER_AGE_RESTRICTIONS?.images || {};
          const image = images[`${minAge}`] || images.default;

          if (image) {
            const d = toNumber(DISCLAIMER_AGE_RESTRICTIONS?.show_duration);
            const duration = d ? d * 1000 : DEFAULT_SPLASH_SCREEN_DURATION;

            screens.push({
              img: image,
              duration,
            });
          }

          if (AD_SPLASH_SCREEN_IMAGE && [16, 18].includes(minAge)) {
            const d = toNumber(AD_SPLASH_SCREEN_DURATION);
            const duration = d ? d * 1000 : DEFAULT_AD_SPLASH_SCREEN_DURATION;

            screens.push({
              img: AD_SPLASH_SCREEN_IMAGE,
              duration,
            });
          }

          dispatch(
            sendEvent({
              type: screens.length ? 'INIT_SPLASHCREEN_RESOLVE' : 'INIT_SPLASHCREEN_REJECT',
              payload: { screens },
            })
          );
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'splashscreen', step);
        effect();
      }
    },
  });

export default {
  ...splashscreen,
  config,
  addMiddleware,
};
