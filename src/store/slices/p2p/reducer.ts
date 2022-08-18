import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { VIEW_TYPE } from 'types/TrackInfo';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    INIT_P2P: 'INITIALIZE_P2P_PENDING',
  },
  INITIALIZE_P2P_PENDING: {
    INITIALIZE_P2P_RESOLVE: 'INITIALIZED',
    INITIALIZE_P2P_REJECT: 'IDLE',
  },
  INITIALIZED: {
    CHANGE_TRACK: 'DISPOSING_P2P',
    AD_BREAK_STARTED: 'DISPOSING_P2P',
  },
  DISPOSING_P2P: {
    DISPOSING_P2P_RESOLVE: 'IDLE',
  },
};

const p2p = createSlice({
  name: 'p2p',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (next === undefined) return state;

      logger.log('[FSM]', 'p2p', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, p2p.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().p2p;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        INITIALIZE_P2P_PENDING: async () => {
          const {
            root: {
              params: { p2p },
              previews,
              config: { trackInfo },
              currentStream,
            },
          } = getState();

          if (currentStream && p2p && !previews && trackInfo?.track?.viewType === VIEW_TYPE.NORMAL) {
            await services.p2pService.init({
              currentStream,
            });

            dispatch(sendEvent({ type: 'INITIALIZE_P2P_RESOLVE' }));
          } else {
            dispatch(sendEvent({ type: 'INITIALIZE_P2P_REJECT' }));
          }
        },
        DISPOSING_P2P: () => {
          services.p2pService.dispose();
          dispatch(sendEvent({ type: 'DISPOSING_P2P_RESOLVE' }));
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'p2p', step);
        effect();
      }
    },
  });

export default {
  ...p2p,
  config,
  addMiddleware,
};
