import { createAction, createSlice } from '@reduxjs/toolkit';
import { isIndexedDBSupported } from 'services/IDBService/support';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { FSMState, Mode, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
  mode: 'DISABLED',
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    DO_INIT: 'INIT_FAVOURITES_LISTENERS',
    PARSE_CONFIG_RESOLVE: 'SELECT_MODE_PENDING',
  },
  INIT_FAVOURITES_LISTENERS: {
    INIT_FAVOURITES_LISTENERS_RESOLVE: 'IDLE',
  },
  SELECT_MODE_PENDING: {
    SET_FAVOURITES_MODE: 'LOADING_FAVOURITES',
    SET_DISABLED_MODE: 'DISABLED',
  },
  LOADING_FAVOURITES: {
    GET_FAVOURITES_STATUS_RESOLVE: 'READY',
    GET_FAVOURITES_STATUS_REJECT: 'DISABLED',
  },
  READY: {},
  DISABLED: {},
};

const favourites = createSlice({
  name: 'favourites',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;
      const step = next || state.step;

      logger.log('[FSM]', 'favourites', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'GET_FAVOURITES_STATUS_RESOLVE':
        case 'PARSE_CONFIG_RESOLVE':
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
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, favourites.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().favourites;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        INIT_FAVOURITES_LISTENERS: () => {
          services.postMessageService.on('set_favorites', ({ data }) => {
            dispatch(
              sendEvent({
                type: 'SET_LOCAL_FAVOURITES',
                payload: { isFavourites: data.isFavorites },
                meta: {
                  source: 'web',
                },
              })
            );
          });

          dispatch(
            sendEvent({
              type: 'INIT_FAVOURITES_LISTENERS_RESOLVE',
            })
          );
        },
        SELECT_MODE_PENDING: () => {
          const {
            root: {
              features,
              meta,
              config: { trackInfo },
            },
          } = getState();

          const isStoreAvailable = isIndexedDBSupported();

          if (!features.ENABLE_FAVOURITES || !trackInfo) {
            return dispatch(
              sendEvent({
                type: 'SET_DISABLED_MODE',
              })
            );
          }

          const payload: { mode: Mode } = meta.userToken
            ? { mode: isStoreAvailable ? 'AUTHORIZED_MODE' : 'AUTHORIZED_MODE_WITHOUT_DB' }
            : { mode: isStoreAvailable ? 'ANONYMOUS_MODE' : 'DISABLED' };

          dispatch(
            sendEvent({
              type: 'SET_FAVOURITES_MODE',
              payload,
            })
          );
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'favourites', step);
        effect();
      }
    },
  });

export default {
  ...favourites,
  config,
  addMiddleware,
};
