import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TStreamItem, TConfig } from 'server/types';

export enum State {
  IDLE = 'idle',
  FETCHING_CONFIG = 'fetchingConfig',
  LOADED_CONFIG = 'loadedConfig',

  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',

  CHECKING_CAPABILITIES = 'checkingCapabilities',
  SELECTING_SOURCE = 'selectingSource',
  LOADING_META = 'loadingMeta',

  READY = 'ready',
  AWAITING_PLAY = 'awaitingPlay',
  PLAYING = 'playing',
  AWAITING_PAUSE = 'awaitingPause',
  PAUSED = 'paused',
  END = 'END',
  ERROR = 'error',
}

export enum Event {
  CHANGE_TRACK = 'CHANGE_TRACK',

  FETCH_CONFIG = 'FETCH_CONFIG',
  FETCH_CONFIG_RESOLVE = 'FETCH_CONFIG_RESOLVE',
  FETCH_CONFIG_REJECT = 'FETCH_CONFIG_REJECT',

  DO_INIT = 'DO_INIT',
  INIT_RESOLVE = 'INIT_RESOLVE',
  INIT_REJECT = 'INIT_REJECT',

  DO_PLAY = 'DO_PLAY',
  DO_PAUSE = 'DO_PAUSE',

  CHECK_CAPABILITIES_RESOLVE = 'CHECK_CAPABILITIES_RESOLVE',
  CHECK_CAPABILITIES_REJECT = 'CHECK_CAPABILITIES_REJECT',

  SET_SOURCE = 'SET_SOURCE',
  LOAD_META = 'LOAD_META',
  SELECT_SOURCE_ERROR = 'SELECT_SOURCE_ERROR',

  LOAD_META_RESOLVE = 'LOAD_META_RESOLVE',
  LOAD_META_REJECT = 'LOAD_META_REJECT',

  DO_PLAY_RESOLVE = 'DO_PLAY_RESOLVE',
  DO_PLAY_REJECT = 'DO_PLAY_REJECT',

  DO_PAUSE_RESOLVE = 'DO_PAUSE_RESOLVE',
  DO_PAUSE_REJECT = 'DO_PAUSE_REJECT',

  VIDEO_END = 'VIDEO_END',
  TIME_UPDATE = 'TIME_UPDATE',
}

export enum PLAYER_EVENT {
  CONTROL_PLAY_CLICK = 'CONTROL_PLAY_CLICK',
  CONTROL_PAUSE_CLICK = 'CONTROL_PAUSE_CLICK',
}

type FSMConfig<S extends string, E extends string> = {
  [state in S]?: {
    [event in E]?: S | undefined;
  };
};

/*
  Текущие проблемы:
  1) нет визуализации (мапить нашу структуру во что то, что понимает визуализотор?) graphviz, stately viz, sketch.systems
  2) нет возможности вкладывать состояния (тип FSMConfig должен быть рекурсивный?)
  3) есть глобальные ивенты которые нужно обработать находясь в любом состоянии (к примеру SET_SOURCE)
  4) guards на основе состояния выглядят удобно? избавляет от if на уровне обработчиков
  5) 1 fsm которая принимает все ивенты и проксирует (redux middleware) их в другие 
  6) проблема синхронизации n параллельных fsm 
     6.1) ключ в сторе для отбрасывания ивентов из прошлой "сессии"
     6.2) в модулях не должно быть мутаций, результат работы функции должен передавать через payload в ивенте (требует большого рефакторинга)
  7) yasdk использует video tag для вызова play/pause, можем использовать object.defineproperty ?
  8) нужны правила нейминга ивентов, чтобы потом можно было сделать мапинг в структуру для визуализации
*/

/*

IDLE
  FETCH_CONFIG_RESOLVE -> READY

READY 
  FETCH_CONFIG -> IDLE
  DO_PLAY - PLAYING
  PLAYING
    DO_PAUSE -> PAUSED
  PAUSED
    DO_PLAY -> PLAYING

*/

const config: FSMConfig<State, Event> = {
  // 1 PHASE иницилизация корневого модуля и загрузка конфига
  [State.IDLE]: {
    [Event.FETCH_CONFIG]: State.FETCHING_CONFIG,
  },
  [State.FETCHING_CONFIG]: {
    [Event.FETCH_CONFIG_RESOLVE]: State.LOADED_CONFIG,
    [Event.FETCH_CONFIG_REJECT]: State.ERROR,
  },
  [State.LOADED_CONFIG]: {
    [Event.DO_INIT]: State.INITIALIZING,
  },
  [State.INITIALIZING]: {
    [Event.INIT_RESOLVE]: State.INITIALIZED,
    [Event.INIT_REJECT]: State.ERROR,
  },

  // 2 PHASE инициализация модулей, проверка возможностей и выбор потока
  [State.INITIALIZED]: {
    [Event.SET_SOURCE]: State.CHECKING_CAPABILITIES,
  },
  [State.CHECKING_CAPABILITIES]: {
    [Event.CHECK_CAPABILITIES_RESOLVE]: State.SELECTING_SOURCE,
    [Event.CHECK_CAPABILITIES_REJECT]: State.ERROR,
  },
  [State.SELECTING_SOURCE]: {
    [Event.LOAD_META]: State.LOADING_META,
    [Event.SELECT_SOURCE_ERROR]: State.ERROR,
  },
  [State.LOADING_META]: {
    [Event.LOAD_META_RESOLVE]: State.READY,
    [Event.LOAD_META_REJECT]: State.SELECTING_SOURCE,
  },

  // 3 PHASE вопроизведение
  [State.READY]: {
    [Event.DO_PLAY]: State.AWAITING_PLAY,
    [Event.FETCH_CONFIG]: State.FETCHING_CONFIG,
  },
  [State.AWAITING_PLAY]: {
    [Event.DO_PAUSE]: State.AWAITING_PAUSE,
    [Event.DO_PLAY_RESOLVE]: State.PLAYING,
    [Event.DO_PLAY_REJECT]: State.ERROR,
  },
  [State.PLAYING]: {
    [Event.DO_PAUSE]: State.AWAITING_PAUSE,
    [Event.TIME_UPDATE]: undefined,
    [Event.VIDEO_END]: State.END,
    [Event.FETCH_CONFIG]: State.FETCHING_CONFIG,
  },
  [State.AWAITING_PAUSE]: {
    [Event.DO_PLAY]: State.AWAITING_PLAY,
    [Event.DO_PAUSE_RESOLVE]: State.PAUSED,
    [Event.DO_PAUSE_REJECT]: State.ERROR,
  },
  [State.PAUSED]: {
    [Event.DO_PLAY]: State.AWAITING_PLAY,
    [Event.FETCH_CONFIG]: State.FETCHING_CONFIG,
  },

  [State.END]: {},
  [State.ERROR]: {},
};

export type EventType =
  | {
      type: Event;
      payload?: null;
    }
  | {
      type: Event.TIME_UPDATE;
      payload: { currentTime: number; duration: number; remainingTime: number };
    }
  | {
      type: Event.LOAD_META;
      payload: { currentStream: TStreamItem };
    }
  | {
      type: Event.FETCH_CONFIG;
      payload: { meta: Meta };
    }
  | {
      type: Event.FETCH_CONFIG_RESOLVE;
      payload: { config: TConfig };
    };

type Meta = {
  partnerId: number | null;
  trackId: number | null;
};

type FSMState = {
  current: State;
  meta: Meta;
  currentTime: number | null;
  duration: number | null;
  remainingTime: number | null;
  currentStream: TStreamItem | null;
  config: TConfig | null;
};

const initialState: FSMState = {
  current: State.IDLE,
  meta: {
    partnerId: null,
    trackId: null,
  },
  currentTime: null,
  duration: null,
  remainingTime: null,
  currentStream: null,
  config: null,
};

const playerFSM = createSlice({
  name: 'playerFSM',
  initialState,
  reducers: {
    transition: (state, action: PayloadAction<EventType>) => {
      const { type, payload } = action.payload;

      console.log('[FSM] transition', { type, payload });

      const next = config[state.current]?.[type];
      return next ? { ...state, current: next, ...payload } : { ...state, ...payload };
    },
  },
});

export default playerFSM;
