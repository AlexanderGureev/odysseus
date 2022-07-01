import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { startListening } from 'store/middleware';
import { FSMConfig } from 'store/types';
import { TConfig } from 'types';
import { logger } from 'utils/logger';

import { checkConfigError, checkPreview, initialize, parseConfig } from './effects';
import { Event, EventPayload, FSMState, State } from './types';

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

const config: FSMConfig<State, Event> = {
  // 1 PHASE иницилизация корневого модуля и загрузка конфига
  // IDLE: {
  //   FETCH_CONFIG: 'FETCHING_CONFIG',
  // },
  // FETCHING_CONFIG: {
  //   FETCH_CONFIG_RESOLVE: 'LOADED_CONFIG',
  //   FETCH_CONFIG_REJECT: 'ERROR',
  // },
  // LOADED_CONFIG: {
  //   DO_INIT: 'INITIALIZING',
  // },

  IDLE: {
    DO_INIT: 'INIT_PENDING',
  },
  INIT_PENDING: {
    INIT_RESOLVE: 'INITIALIZED',
    INIT_REJECT: 'ERROR',
  },
  INITIALIZED: {
    PARSE_CONFIG: 'PARSE_CONFIG_PENDING',
  },
  PARSE_CONFIG_PENDING: {
    PARSE_CONFIG_RESOLVE: 'CHECK_ERROR_PENDING',
    PARSE_CONFIG_REJECT: 'ERROR',
  },
  CHECK_ERROR_PENDING: {
    CHECK_PREVIEW: 'CHECK_PREVIEW_PENDING',
    CHECK_ERROR_RESOLVE: 'RENDER',
    CHECK_ERROR_REJECT: 'ERROR',
  },
  CHECK_PREVIEW_PENDING: {
    CHECK_PREVIEW_RESOLVE: 'RENDER',
    CHECK_PREVIEW_REJECT: 'PAYWALL',
  },

  PAYWALL: {},
  RENDER: {},

  // 2 PHASE инициализация модулей, проверка возможностей и выбор потока
  // INITIALIZED: {
  //   SET_SOURCE: 'CHECKING_CAPABILITIES',
  // },
  CHECKING_CAPABILITIES: {
    CHECK_CAPABILITIES_RESOLVE: 'SELECTING_SOURCE',
    CHECK_CAPABILITIES_REJECT: 'ERROR',
  },
  SELECTING_SOURCE: {
    LOAD_META: 'LOADING_META',
    SELECT_SOURCE_ERROR: 'ERROR',
  },
  LOADING_META: {
    LOAD_META_RESOLVE: 'READY',
    LOAD_META_REJECT: 'SELECTING_SOURCE',
  },

  // 3 PHASE вопроизведение
  READY: {
    DO_PLAY: 'AWAITING_PLAY',
    FETCH_CONFIG: 'FETCHING_CONFIG',
  },
  AWAITING_PLAY: {
    DO_PAUSE: 'AWAITING_PAUSE',
    DO_PLAY_RESOLVE: 'PLAYING',
    DO_PLAY_REJECT: 'ERROR',
  },
  PLAYING: {
    DO_PAUSE: 'AWAITING_PAUSE',
    TIME_UPDATE: undefined,
    VIDEO_END: 'END',
    FETCH_CONFIG: 'FETCHING_CONFIG',
  },
  AWAITING_PAUSE: {
    DO_PLAY: 'AWAITING_PLAY',
    DO_PAUSE_RESOLVE: 'PAUSED',
    DO_PAUSE_REJECT: 'ERROR',
  },
  PAUSED: {
    DO_PLAY: 'AWAITING_PLAY',
    FETCH_CONFIG: 'FETCHING_CONFIG',
  },

  END: {},
  ERROR: {
    RELOAD: 'IDLE',
  },
};

const initialState: FSMState = {
  step: 'IDLE',
  config: null,
  features: null,
  session: {
    id: '',
    videosession_id: '',
  },
  meta: {
    partnerId: null,
    trackId: null,
    skin: null,
    isEmbedded: true,
  },
  currentStream: null,
  previews: null,

  currentTime: null,
  duration: null,
  remainingTime: null,

  error: null,
};

const player = createSlice({
  name: 'player',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload = {}, meta } = action.payload;

      logger.log('[FSM]', 'player transition', { type, payload, meta });

      const next = config[state.step]?.[type];
      return next ? { ...state, step: next, ...payload } : { ...state, ...payload };
    });
  },
});

startListening({
  predicate: (action, currentState, prevState) => currentState.player.step !== prevState.player.step,
  effect: (action, api) => {
    const { dispatch, getState, extra: services } = api;

    const { step } = getState().player;

    const opts = {
      dispatch,
      getState,
      services,
    };

    logger.log('[MW]', 'player', getState().player);

    const handler: { [key in State]?: () => Promise<void> | void } = {
      INIT_PENDING: () => initialize(opts),
      INITIALIZED: () => {
        dispatch(
          sendEvent({
            type: 'PARSE_CONFIG',
            meta: window.ODYSSEUS_PLAYER_CONFIG,
          })
        );
      },
      PARSE_CONFIG_PENDING: () => {
        const { payload } = action as PayloadAction<{
          meta: TConfig;
        }>;

        parseConfig(payload.meta, opts);
      },
      CHECK_ERROR_PENDING: () => checkConfigError(opts),
      CHECK_PREVIEW_PENDING: () => checkPreview(opts),
    };

    handler[step]?.();
  },
});

export default player;
