import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',

  muted: true,
  volume: 0.5,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    // START_AD_BREAK: 'SYNC_VOLUME_STATE',
    // SYNC_VOLUME: 'SYNC_VOLUME_PENDING',
    // SET_MUTE_AD_BLOCK: 'CHANGE_MUTE_AD_BLOCK_PENDING',
    // SET_VOLUME_AD_BLOCK: 'CHANGE_VOLUME_AD_BLOCK_PENDING',
    // UPDATE_VOLUME_AD_BLOCK: 'UPDATE_VOLUME_AD_BLOCK_PENDING',
  },
  UPDATE_VOLUME_AD_BLOCK_PENDING: {
    UPDATE_VOLUME_AD_BLOCK_RESOLVE: 'IDLE',
  },
  SYNC_VOLUME_STATE: {
    SYNC_VOLUME_STATE_RESOLVE: 'IDLE',
  },
  SYNC_VOLUME_PENDING: {
    SYNC_VOLUME_PENDING_RESOLVE: 'IDLE',
  },
  CHANGE_MUTE_AD_BLOCK_PENDING: {
    CHANGE_MUTE_AD_BLOCK_RESOLVE: 'IDLE',
  },
  CHANGE_VOLUME_AD_BLOCK_PENDING: {
    CHANGE_VOLUME_AD_BLOCK_RESOLVE: 'IDLE',
  },
};

const adBlockVolume = createSlice({
  name: 'adBlockVolume',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'adBlockVolume', `${state.step} -> ${type} -> ${next}`);

      const step = next || state.step;

      switch (type) {
        case 'SET_MUTE_AD_BLOCK':
          state.step = step;
          state.muted = payload.value;
          break;
        case 'SET_VOLUME_AD_BLOCK':
          state.step = step;
          state.volume = payload.value;
          state.muted = payload.value === 0;
          break;
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, adBlockVolume.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().adBlockVolume;

      const handler: { [key in State]?: () => Promise<void> | void } = {
        SYNC_VOLUME_STATE: () => {
          const {
            volume: { volume, muted },
          } = getState();

          dispatch(
            sendEvent({
              type: 'SYNC_VOLUME_STATE_RESOLVE',
              payload: {
                volume,
                muted,
              },
            })
          );
        },
        SYNC_VOLUME_PENDING: () => {
          const {
            adBlock: { index, adPoint },
            adBlockVolume: { volume: currentVolume, muted: currentMute },
          } = getState();

          const value = currentMute ? 0 : currentVolume;
          const currentBlock = services.adService.getBlock(adPoint, index);
          currentBlock.setVolume(value); // специально повторно выставляем блоку звук так как не всегда интерфейс синхронизирован со стейтом

          dispatch(
            sendEvent({
              type: 'SYNC_VOLUME_PENDING_RESOLVE',
              payload: {
                muted: currentMute,
                volume: currentVolume,
              },
            })
          );
        },
        CHANGE_MUTE_AD_BLOCK_PENDING: () => {
          const {
            adBlock: { index, adPoint },
            adBlockVolume: { volume, muted },
          } = getState();

          const currentBlock = services.adService.getBlock(adPoint, index);
          currentBlock.setVolume(muted ? 0 : volume);

          dispatch(
            sendEvent({
              type: 'CHANGE_MUTE_AD_BLOCK_RESOLVE',
            })
          );
        },
        CHANGE_VOLUME_AD_BLOCK_PENDING: () => {
          const {
            adBlock: { index, adPoint },
            adBlockVolume: { volume },
          } = getState();

          const currentBlock = services.adService.getBlock(adPoint, index);
          currentBlock.setVolume(volume);

          dispatch(
            sendEvent({
              type: 'CHANGE_VOLUME_AD_BLOCK_RESOLVE',
            })
          );
        },
        UPDATE_VOLUME_AD_BLOCK_PENDING: () => {
          const { volume: currentVolume } = getState().adBlockVolume;
          const {
            payload: { meta },
          } = action as PayloadAction<{ meta: { value: number } }>;

          const muted = meta.value === 0;
          const volume = muted ? currentVolume : meta.value;

          dispatch(
            sendEvent({
              type: 'UPDATE_VOLUME_AD_BLOCK_RESOLVE',
              payload: {
                muted,
                volume,
              },
            })
          );
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'adBlockVolume', step);
        effect();
      }
    },
  });

export default {
  ...adBlockVolume,
  config,
  addMiddleware,
};
