import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT } from 'store/actions';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { BACKWARD_REWIND_STEP, FORWARD_REWIND_STEP } from '../hotkeys/constants';
import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
  type: null,
  text: null,
  key: 0,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    DO_PLAY: null,
    DO_PAUSE: null,
    SEEK: null,
    SET_VOLUME: null,
  },
};

const hotkeysNotice = createSlice({
  name: 'hotkeysNotice',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload, meta, isKeyboardEvent } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (next === undefined || !isKeyboardEvent) return state;

      logger.log('[FSM]', 'hotkeysNotice', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'DO_PLAY':
          state.type = 'play';
          state.text = 'Воспроизведение';
          state.key += 1;
          break;
        case 'DO_PAUSE':
          state.type = 'pause';
          state.text = 'Видео на паузе';
          state.key += 1;
          break;
        case 'SEEK':
          state.type = meta.type === 'forward' ? 'forward_seek' : 'backward_seek';
          state.text = meta.type === 'forward' ? `+${FORWARD_REWIND_STEP} секунд` : `-${BACKWARD_REWIND_STEP} секунд`;
          state.key += 1;
          break;
        case 'SET_VOLUME':
          state.type = payload.value <= 0 ? 'mute' : 'volume';
          state.text = payload.value <= 0 ? 'Звук выключен' : `Громкость ${Math.floor(payload.value * 100)}%`;
          state.key += 1;
          break;
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

export default {
  ...hotkeysNotice,
  config,
};
