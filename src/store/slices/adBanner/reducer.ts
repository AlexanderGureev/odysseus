import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import { getPlaylistItem } from 'store/selectors';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';

export const AD_BANNER_CONTAINER_ID = 'ad-banner';
const BANNER_KEY = 'pause_banner';

const initialState: FSMState = {
  step: 'IDLE',
  bannerParams: '',
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    START_PLAYBACK: 'INIT_AD_BANNER',
  },
  INIT_AD_BANNER: {
    INIT_AD_BANNER_RESOLVE: 'HIDDEN',
    INIT_AD_BANNER_REJECT: 'DISABLED',
  },
  HIDDEN: {
    DO_PAUSE: 'VISIBLE',
    CHANGE_TRACK: 'DISPOSE_PENDING',
    START_AD_BREAK: 'DISPOSE_PENDING',
  },
  VISIBLE: {
    DO_PLAY: 'HIDDEN',
    AD_BREAK_STARTED: 'HIDDEN',
    CHANGE_TRACK: 'DISPOSE_PENDING',
    START_AD_BREAK: 'DISPOSE_PENDING',
  },
  DISPOSE_PENDING: {
    DISPOSE_RESOLVE: 'IDLE',
  },
  DISABLED: {},
};

const adBanner = createSlice({
  name: 'adBanner',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;
      if (next === undefined) return state;

      logger.log('[FSM]', 'adBanner', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'DISPOSE_RESOLVE':
          return initialState;
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, adBanner.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().adBanner;

      const handler: { [key in State]?: () => Promise<void> | void } = {
        INIT_AD_BANNER: () => {
          const {
            root: {
              features: { AD_PAUSE_BANNER_PARAMS },
              meta,
            },
          } = getState();

          if (!AD_PAUSE_BANNER_PARAMS) {
            dispatch(sendEvent({ type: 'INIT_AD_BANNER_REJECT' }));
            return;
          }

          const item = getPlaylistItem(getState());

          const bannerParams = services.bannerService.replaceParams(AD_PAUSE_BANNER_PARAMS, {
            '[PARTNER_ID]': meta.partnerId ?? '',
            '[PROJECT_ID]': item?.project_id ?? '',
            '[ADFOX_SEASON]': item?.adfox_season_id ?? '',
            '[NUM_IN_PROJECT]': item?.num_in_project ?? '',
          });

          dispatch(sendEvent({ type: 'INIT_AD_BANNER_RESOLVE', payload: { bannerParams } }));
        },
        VISIBLE: () => {
          const {
            adBanner: { bannerParams },
          } = getState();

          services.bannerService.show(AD_BANNER_CONTAINER_ID, BANNER_KEY, bannerParams);
        },
        HIDDEN: () => {
          services.bannerService.hide(BANNER_KEY);
        },
        DISPOSE_PENDING: () => {
          services.bannerService.dispose(BANNER_KEY);
          dispatch(sendEvent({ type: 'DISPOSE_RESOLVE' }));
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'adBanner', step);
        effect();
      }
    },
  });

export default {
  ...adBanner,
  config,
  addMiddleware,
};
