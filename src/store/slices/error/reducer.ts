import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { RawPlayerError } from 'types/errors';
import { buildQueryParams } from 'utils';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
  error: null,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    INIT_REJECT: 'ERROR',
    CHECK_CAPABILITIES_REJECT: 'ERROR',
    PARSE_CONFIG_REJECT: 'ERROR',
    INIT_ANALYTICS_REJECT: 'ERROR',
    CHECK_ERROR_REJECT: 'ERROR',
    INIT_SERVICES_REJECT: 'ERROR',
    PLAYER_INIT_REJECT: 'ERROR',
    SELECT_SOURCE_ERROR: 'ERROR',
    CHECK_MANIFEST_REJECT: 'ERROR',
    FETCHING_MANIFEST_REJECT: 'ERROR',
    FETCH_TRACK_CONFIG_REJECT: 'ERROR',
    QUALITY_INITIALIZATION_REJECT: 'ERROR',
    PLAYER_ERROR: 'ERROR',
    CHANGE_AUDIO_TRACK_REJECT: 'ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    BEFORE_UNLOAD: 'DISABLED', // мы не хотим отправлять ошибки об aborted запросах
    SHOW_ERROR: 'ERROR',
  },
  ERROR: {
    RELOAD: 'RELOADING',
    OPEN_URL: 'OPENING_NEW_PAGE',
  },
  OPENING_NEW_PAGE: {
    OPENING_NEW_PAGE_RESOLVE: 'ERROR',
  },
  RELOADING: {
    RELOADING_RESOLVE: 'IDLE',
  },
  NETWORK_ERROR: {
    GO_ONLINE: 'IDLE',
  },
  DISABLED: {},
};

const error = createSlice({
  name: 'error',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, meta } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'error', `${state.step} -> ${type} -> ${next}`);

      const step = next || state.step;

      switch (type) {
        case 'GO_ONLINE':
          return initialState;
        default:
          const m = meta as { error: RawPlayerError };
          return m?.error ? { ...state, step, error: m.error } : { ...state, step };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, error.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().error;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        RELOADING: () => {
          const {
            playback: { currentTime },
            root: {
              meta: { trackId, partnerId, userToken },
              params,
            },
          } = getState();

          const queryParams = buildQueryParams({ ...params, startAt: currentTime || 0 });
          const target = `${window.location.origin}/player/${partnerId}/${trackId}${userToken ? `/${userToken}` : ''}${
            queryParams ? `?${queryParams}` : ''
          }`;

          window.location.href = target;
          dispatch(sendEvent({ type: 'RELOADING_RESOLVE' }));
        },
        OPENING_NEW_PAGE: () => {
          const {
            payload: {
              meta: { url, target },
            },
          } = action as PayloadAction<{ meta: { url: string; target?: string } }>;

          window.open(url, target);
          dispatch(sendEvent({ type: 'OPENING_NEW_PAGE_RESOLVE' }));
        },
        ERROR: () => {
          dispatch(sendEvent({ type: 'ERROR_SHOWN' }));
        },
        NETWORK_ERROR: () => {
          dispatch(sendEvent({ type: 'ERROR_SHOWN' }));
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'error', step);
        effect();
      }
    },
  });

export default {
  ...error,
  config,
  addMiddleware,
};
