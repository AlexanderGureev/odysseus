import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { STORAGE_SETTINGS } from 'services/LocalStorageService/types';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',

  beforeAdState: null,
  muted: false,
  volume: 0.5,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    SET_INITIAL_VOLUME: 'SETUP_INITIAL_VOLUME',
    SET_MUTE: 'CHANGE_MUTE_PENDING',
    SET_VOLUME: 'CHANGE_VOLUME_PENDING',

    SET_MUTE_AD_BLOCK: 'CHANGE_MUTE_AD_BLOCK_PENDING',
    SET_VOLUME_AD_BLOCK: 'CHANGE_VOLUME_AD_BLOCK_PENDING',
    AD_BLOCK_VOLUME_CHANGE: 'CHANGE_AD_VOLUME_STATE',

    AD_BREAK_STARTED: null,
    INIT_RESUME_VIDEO: null,
  },
  SETUP_INITIAL_VOLUME: {
    SETUP_INITIAL_VOLUME_RESOLVE: 'IDLE',
  },
  CHANGE_MUTE_PENDING: {
    CHANGE_MUTE_RESOLVE: 'IDLE',
  },
  CHANGE_VOLUME_PENDING: {
    CHANGE_VOLUME_RESOLVE: 'IDLE',
  },
  CHANGE_MUTE_AD_BLOCK_PENDING: {
    CHANGE_MUTE_AD_BLOCK_RESOLVE: 'IDLE',
  },
  CHANGE_VOLUME_AD_BLOCK_PENDING: {
    CHANGE_VOLUME_AD_BLOCK_RESOLVE: 'IDLE',
  },
  CHANGE_AD_VOLUME_STATE: {
    CHANGE_AD_VOLUME_STATE_RESOLVE: 'IDLE',
  },
};

const volume = createSlice({
  name: 'volume',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'volume', `${state.step} -> ${type} -> ${next}`);

      const step = next || state.step;

      switch (type) {
        case 'AD_BREAK_STARTED':
          if (!state.beforeAdState) {
            state.beforeAdState = {
              muted: state.muted,
              volume: state.volume,
            };
          }
          break;

        case 'INIT_RESUME_VIDEO':
          if (state.beforeAdState) {
            state.muted = state.beforeAdState.muted;
            state.volume = state.beforeAdState.volume;
          }

          state.beforeAdState = null;
          break;

        case 'SET_MUTE':
          state.step = step;
          state.muted = payload.value;
          break;
        case 'SET_VOLUME':
          state.step = step;
          state.volume = payload.value;
          state.muted = payload.value === 0;
          break;
        case 'SET_MUTE_AD_BLOCK':
          state.step = step;
          state.muted = payload.value;
          if (state.beforeAdState) {
            state.beforeAdState.muted = payload.value;
          }
          break;
        case 'SET_VOLUME_AD_BLOCK':
          state.step = step;
          state.volume = payload.value;
          state.muted = payload.value === 0;
          if (state.beforeAdState) {
            state.beforeAdState.volume = payload.value;
            state.beforeAdState.muted = payload.value === 0;
          }
          break;
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => currentState.volume.step !== prevState.volume.step,
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().volume;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        SETUP_INITIAL_VOLUME: () => {
          const {
            permissions: { mute },
          } = getState().root;

          const volume = services.localStorageService.getItemByDomain<number>(STORAGE_SETTINGS.VOLUME) ?? 0.5;
          const muted =
            (mute || services.localStorageService.getItemByDomain<boolean>(STORAGE_SETTINGS.MUTED)) ?? false;

          console.log('[TEST] SETUP_INITIAL_VOLUME', { muted, volume });
          services.playerService.setMute(muted);
          services.playerService.setVolume(volume);

          dispatch(
            sendEvent({
              type: 'SETUP_INITIAL_VOLUME_RESOLVE',
              payload: {
                volume,
                muted,
              },
            })
          );
        },
        CHANGE_MUTE_AD_BLOCK_PENDING: () => {
          const {
            volume: { volume, muted },
            adBlock: { index, point },
          } = getState();

          const currentBlock = services.adService.getBlock(point, index);
          currentBlock.setVolume(muted ? 0 : volume);
          services.playerService.setMute(muted);

          dispatch(
            sendEvent({
              type: 'CHANGE_MUTE_AD_BLOCK_RESOLVE',
            })
          );
        },
        CHANGE_VOLUME_AD_BLOCK_PENDING: () => {
          const {
            volume: { volume, muted },
            adBlock: { index, point },
          } = getState();

          const currentBlock = services.adService.getBlock(point, index);
          currentBlock.setVolume(volume);
          services.playerService.setMute(muted);

          dispatch(
            sendEvent({
              type: 'CHANGE_VOLUME_AD_BLOCK_RESOLVE',
            })
          );
        },
        CHANGE_AD_VOLUME_STATE: () => {
          const {
            payload: { meta },
          } = action as PayloadAction<{
            meta: { value: number };
          }>;

          const muted = meta.value === 0;
          services.playerService.setMute(muted);

          dispatch(
            sendEvent({
              type: 'CHANGE_AD_VOLUME_STATE_RESOLVE',
              payload: {
                muted,
              },
            })
          );
        },
        CHANGE_MUTE_PENDING: () => {
          const {
            volume: { muted },
          } = getState();

          services.playerService.setMute(muted);
          services.localStorageService.setItemByDomain(STORAGE_SETTINGS.MUTED, muted);

          dispatch(
            sendEvent({
              type: 'CHANGE_MUTE_RESOLVE',
            })
          );
        },
        CHANGE_VOLUME_PENDING: () => {
          const { volume, muted } = getState().volume;
          services.playerService.setVolume(volume);
          services.playerService.setMute(muted);
          services.localStorageService.setItemByDomain(STORAGE_SETTINGS.MUTED, muted);
          services.localStorageService.setItemByDomain(STORAGE_SETTINGS.VOLUME, volume);

          dispatch(
            sendEvent({
              type: 'CHANGE_VOLUME_RESOLVE',
            })
          );
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'volume', step);
        effect();
      }
    },
  });

export default {
  ...volume,
  config,
  addMiddleware,
};
