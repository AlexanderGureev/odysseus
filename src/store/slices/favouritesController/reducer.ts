import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FavouritesSource } from 'services/FavouritesService/types';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { getFavouritesStatus, initialSync, syncFavourites, updateFavourites, updateLocalFavourites } from './effects';
import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
  isFavourites: false,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    SET_FAVOURITES_MODE: 'INITIAL_SYNC_FAVOURITES',
  },
  INITIAL_SYNC_FAVOURITES: {
    INITIAL_SYNC_FAVOURITES_RESOLVE: 'GET_FAVOURITES_STATUS',
    INITIAL_SYNC_FAVOURITES_REJECT: 'ERROR',
  },
  CHECK_TTL_FAVOURITES: {
    TTL_EXPIRED: 'INITIAL_SYNC_FAVOURITES',
    CHECK_TTL_FAVOURITES_RESOLVE: 'GET_FAVOURITES_STATUS',
  },
  GET_FAVOURITES_STATUS: {
    GET_FAVOURITES_STATUS_RESOLVE: 'READY',
    GET_FAVOURITES_STATUS_REJECT: 'ERROR',
  },
  READY: {
    SET_FAVOURITES: 'UPDATE_FAVOURITES_PENDING',
    SET_LOCAL_FAVOURITES: 'UPDATE_LOCAL_FAVOURITES_PENDING',
    PARSE_CONFIG_RESOLVE: 'CHECK_TTL_FAVOURITES',
    ROLLBACK_FAVOURITES_STATE: null,
  },
  UPDATE_FAVOURITES_PENDING: {
    START_SYNC_FAVOURITES: 'SYNC_FAVOURITES',
    UPDATE_FAVOURITES_RESOLVE: 'READY',
    UPDATE_FAVOURITES_REJECT: 'READY',
  },
  UPDATE_LOCAL_FAVOURITES_PENDING: {
    UPDATE_LOCAL_FAVOURITES_RESOLVE: 'READY',
    UPDATE_FAVOURITES_REJECT: 'READY',
  },
  SYNC_FAVOURITES: {
    SYNC_FAVOURITES_RESOLVE: 'READY',
  },
  ERROR: {},
};

const favouritesController = createSlice({
  name: 'favouritesController',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;
      const step = next || state.step;

      logger.log('[FSM]', 'favouritesController', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'PARSE_CONFIG_RESOLVE':
        case 'SET_FAVOURITES_MODE':
          state.step = step;
          break;
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, favouritesController.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().favouritesController;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        INITIAL_SYNC_FAVOURITES: () => initialSync(opts),
        GET_FAVOURITES_STATUS: () => getFavouritesStatus(opts),
        UPDATE_FAVOURITES_PENDING: () => {
          const { isFavourites: currentState } = getState().favouritesController;

          const {
            payload: {
              meta: { isFavourites: newState },
            },
          } = action as PayloadAction<{ meta: { isFavourites: boolean } }>;

          updateFavourites(currentState, newState, opts);
        },
        SYNC_FAVOURITES: () => {
          const {
            payload: { payload, meta },
          } = action as PayloadAction<{
            payload: { isFavourites: boolean };
            meta: {
              prevState: boolean;
            };
          }>;

          syncFavourites(meta.prevState, payload.isFavourites, opts);
        },
        CHECK_TTL_FAVOURITES: () => {
          dispatch(sendEvent({ type: 'CHECK_TTL_FAVOURITES_RESOLVE' }));
        },
        UPDATE_LOCAL_FAVOURITES_PENDING: async () => {
          const {
            payload: {
              payload: { isFavourites },
              meta,
            },
          } = action as PayloadAction<{ payload: { isFavourites: boolean }; meta: { source: FavouritesSource } }>;

          await updateLocalFavourites({ isFavourites, source: meta.source }, opts);
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'favouritesController', step);
        effect();
      }
    },
  });

export default {
  ...favouritesController,
  config,
  addMiddleware,
};
