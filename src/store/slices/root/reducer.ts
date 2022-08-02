import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TParams } from 'server/utils';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { TConfig, TExtendedConfig } from 'types';
import { logger } from 'utils/logger';

import {
  checkAdult,
  checkCapabilities,
  checkConfigError,
  checkPermissions,
  checkPreview,
  checkResumeVideo,
  fetchManifest,
  initAnalytics,
  initialize,
  initPlayer,
  initServices,
  parseConfig,
  selectSource,
  startPlayback,
} from './effects';
import { ActionPayload, FSMState, State, TrackParams } from './types';

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

const config: FSMConfig<State, AppEvent> = {
  // 1 PHASE иницилизация корневого модуля и загрузка конфига

  IDLE: {
    // start app
    DO_INIT: 'INIT_PENDING',
  },
  // иницилизация глобальных сервисов (1 раз на видеосессию)
  INIT_PENDING: {
    INIT_RESOLVE: 'CHECK_CAPABILITIES_PENDING',
    INIT_REJECT: 'ERROR',
  },
  // проверка возможностей браузера (hls,dash,drm)
  CHECK_CAPABILITIES_PENDING: {
    CHECK_CAPABILITIES_RESOLVE: 'INITIALIZED',
    CHECK_CAPABILITIES_REJECT: 'ERROR',
  },
  INITIALIZED: {
    PARSE_CONFIG: 'PARSE_CONFIG_PENDING',
  },
  // парсинг raw конфига от сервера
  PARSE_CONFIG_PENDING: {
    PARSE_CONFIG_RESOLVE: 'RENDER',
    PARSE_CONFIG_REJECT: 'ERROR',
  },
  // первый render приложения
  RENDER: {
    SET_STATE: null,
    DO_PLAYER_INIT: 'PLAYER_INIT_PENDING',
  },
  // инициализация playService (videojs)
  PLAYER_INIT_PENDING: {
    PLAYER_INIT_RESOLVE: 'INIT_ANALYTICS_PENDING',
    PLAYER_INIT_REJECT: 'ERROR',
  },
  // инициализация аналитических сервисов (ym, google, amberdata...)
  INIT_ANALYTICS_PENDING: {
    INIT_ANALYTICS_RESOLVE: 'CHECK_ERROR_PENDING',
    INIT_ANALYTICS_REJECT: 'ERROR',
  },
  // проверка наличия ошибок в конфиге
  CHECK_ERROR_PENDING: {
    CHECK_PREVIEW: 'CHECK_PREVIEW_PENDING',
    CHECK_ERROR_RESOLVE: 'INIT_SERVICES_PENDING',
    CHECK_ERROR_REJECT: 'ERROR',
  },
  // проверка на возможность воспроизведения превью
  CHECK_PREVIEW_PENDING: {
    CHECK_PREVIEW_RESOLVE: 'INIT_SERVICES_PENDING',
    CHECK_PREVIEW_REJECT: 'PAYWALL',
  },
  // инциализация основных сервисов приложения
  INIT_SERVICES_PENDING: {
    INIT_SERVICES_RESOLVE: 'CHECK_ADULT_CONTENT',
    INIT_SERVICES_REJECT: 'ERROR',
  },
  // проверка на 18+ контент
  CHECK_ADULT_CONTENT: {
    SHOW_ADULT_NOTIFY: 'ADULT_NOTIFY',
    SKIP_ADULT_NOTIFY: 'CHECK_RESUME_VIDEO',
  },
  // проверка на необходимость показа экрана "продолжить просмотр"
  CHECK_RESUME_VIDEO: {
    SHOW_RESUME_VIDEO_NOTIFY: 'RESUME_VIDEO_NOTIFY',
    SKIP_RESUME_VIDEO_NOTIFY: 'CHECK_PERMISSIONS_PENDING',
  },
  // экран 18+
  ADULT_NOTIFY: {
    ADULT_NOTIFY_RESOLVE: 'CHECK_RESUME_VIDEO',
    ADULT_NOTIFY_REJECT: null,
  },
  // экран "продолжить просмотр"
  RESUME_VIDEO_NOTIFY: {
    RESUME_VIDEO_NOTIFY_RESOLVE: 'CHECK_PERMISSIONS_PENDING',
    RESUME_VIDEO_NOTIFY_REJECT: 'CHECK_PERMISSIONS_PENDING',
  },
  // платный трек недоступен для просмотра
  PAYWALL: {},
  // // первый render приложения
  // RENDER: {
  //   SET_STATE: null,
  //   DO_PLAYER_INIT: 'PLAYER_INIT_PENDING',
  // },
  // // инициализация playService (videojs)
  // PLAYER_INIT_PENDING: {
  //   PLAYER_INIT_RESOLVE: 'CHECK_PERMISSIONS_PENDING',
  //   PLAYER_INIT_REJECT: 'ERROR',
  // },
  // проверка прав на запуск (autoplay, mute)
  CHECK_PERMISSIONS_PENDING: {
    CHECK_PERMISSIONS_RESOLVE: 'INITIAL_SELECT_SOURCE_PENDING',
  },

  // первичный выбор потока
  INITIAL_SELECT_SOURCE_PENDING: {
    SELECT_SOURCE_RESOLVE: 'INITIAL_FETCHING_MANIFEST',
    SELECT_SOURCE_ERROR: 'ERROR',
  },
  INITIAL_FETCHING_MANIFEST: {
    FETCHING_MANIFEST_RESOLVE: 'CHECK_AUTOPLAY',
    FETCHING_MANIFEST_REJECT: 'ERROR',
  },
  // выбор другого доступного потока в случае ошибок
  SELECT_SOURCE_PENDING: {
    SELECT_SOURCE_RESOLVE: 'FETCHING_MANIFEST',
    SELECT_SOURCE_ERROR: 'ERROR',
  },
  FETCHING_MANIFEST: {
    FETCHING_MANIFEST_RESOLVE: 'RESUME_VIDEO_PENDING',
    FETCHING_MANIFEST_REJECT: 'ERROR',
  },

  CHECK_AUTOPLAY: {
    CHECK_AUTOPLAY_RESOLVE: 'AD_INIT_PENDING',
    SHOW_BIG_PLAY_BUTTON: 'BIG_PLAY_BUTTON',
  },
  BIG_PLAY_BUTTON: {
    CLICK_BIG_PLAY_BUTTON: 'AD_INIT_PENDING',
  },

  // передаем управление рекламному fsm и играем pre_roll если он есть
  AD_INIT_PENDING: {
    RESUME_VIDEO: 'RESUME_VIDEO_PENDING',
  },

  // начать воспроизведение основного контента
  RESUME_VIDEO_PENDING: {
    UPDATE_MANIFEST: null,
    UPDATE_TOKEN: null,
    RESUME_VIDEO_RESOLVE: 'READY',
    CHECK_MANIFEST_REJECT: 'ERROR',
    LOAD_META_REJECT: 'SELECT_SOURCE_PENDING',
  },

  // 3 PHASE вопроизведение
  READY: {
    RESUME_VIDEO: 'RESUME_VIDEO_PENDING',
  },

  ERROR: {},
};

const initialState: FSMState = {
  step: 'IDLE',
  config: {} as TExtendedConfig,
  adConfig: null,
  adPoints: [],

  features: {},
  session: {
    id: '',
    videosession_id: '',
    sid: null,
  },
  meta: {
    parentHost: null,
    partnerId: null,
    trackId: null,
    skin: null,
    userToken: null,
    tokenExpiredAt: null,
    isEmbedded: true,
  },
  params: {},

  currentStream: null,
  manifestData: null,

  previews: null,
  capabilities: [],
  permissions: {
    autoplay: true,
    mute: true,
  },

  isFirstRun: false,
  isShowPlayerUI: false,

  deviceInfo: {
    isMobile: false,
    browser: undefined,
    browserDescription: undefined,
    deviceModel: undefined,
    osName: undefined,
    osVersion: undefined,
    deviceType: undefined,
    brand: undefined,
    name: undefined,
    engineName: undefined,
    engineVersion: undefined,
  },
};

const root = createSlice({
  name: 'root',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'root', `${state.step} -> ${type} -> ${next}`);

      const step = next || state.step;

      switch (type) {
        case 'UPDATE_MANIFEST': {
          const { streams } = payload;
          const stream = streams.find((stream) => stream.protocol === state.currentStream?.protocol);
          if (stream) state.currentStream = stream;
          state.config.playlist.items[0].streams = streams;
          break;
        }
        case 'UPDATE_TOKEN': {
          const { linked_tracks, tokenExpiredAt, userToken } = payload;
          state.meta.userToken = userToken;
          state.meta.tokenExpiredAt = tokenExpiredAt;
          state.config.playlist.items[0].linked_tracks = linked_tracks;
          break;
        }
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => currentState.root.step !== prevState.root.step,
    effect: (action, api) => {
      const { dispatch, getState, extra: services } = api;

      const { step } = getState().root;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        INIT_PENDING: () => initialize(opts),
        INITIALIZED: () => {
          dispatch(
            sendEvent({
              type: 'PARSE_CONFIG',
              meta: {
                config: window.ODYSSEUS_PLAYER_CONFIG,
                context: window.CONTEXT,
              },
            })
          );
        },
        CHECK_CAPABILITIES_PENDING: () => checkCapabilities(opts),
        PARSE_CONFIG_PENDING: () => {
          const {
            payload: { meta },
          } = action as PayloadAction<{
            meta: { config: TConfig; context: TParams | null; params?: TrackParams };
          }>;

          parseConfig(meta.config, meta.context, meta.params, opts);
        },
        INIT_ANALYTICS_PENDING: () => initAnalytics(opts),
        CHECK_ERROR_PENDING: () => checkConfigError(opts),
        CHECK_PREVIEW_PENDING: () => checkPreview(opts),
        INIT_SERVICES_PENDING: () => initServices(opts),
        CHECK_ADULT_CONTENT: () => checkAdult(opts),
        CHECK_RESUME_VIDEO: () => checkResumeVideo(opts),
        RENDER: () => {
          dispatch(
            sendEvent({
              type: 'SET_STATE',
              payload: {
                isShowPlayerUI: true,
              },
            })
          );
        },
        PLAYER_INIT_PENDING: () => {
          const {
            payload: { meta },
          } = action as PayloadAction<{
            meta: { playerId: string };
          }>;

          initPlayer(meta.playerId, opts);
        },
        INITIAL_SELECT_SOURCE_PENDING: () => selectSource(opts),
        INITIAL_FETCHING_MANIFEST: () => fetchManifest(opts),
        SELECT_SOURCE_PENDING: () => selectSource(opts),
        FETCHING_MANIFEST: () => fetchManifest(opts),

        CHECK_PERMISSIONS_PENDING: () => checkPermissions(opts),

        AD_INIT_PENDING: () => {
          dispatch(
            sendEvent({
              type: 'AD_INIT',
            })
          );
        },
        RESUME_VIDEO_PENDING: () => {
          dispatch(
            sendEvent({
              type: 'INIT_RESUME_VIDEO',
            })
          );
        },
        CHECK_AUTOPLAY: () => {
          const { permissions } = getState().root;
          dispatch(
            sendEvent({
              type: permissions.autoplay ? 'CHECK_AUTOPLAY_RESOLVE' : 'SHOW_BIG_PLAY_BUTTON',
            })
          );
        },
        BIG_PLAY_BUTTON: () => {
          return;
        },
        READY: () => startPlayback(opts),
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'root', step);
        effect();
      }
    },
  });

export default {
  ...root,
  config,
  addMiddleware,
};