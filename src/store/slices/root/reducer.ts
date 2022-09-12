import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TParams } from 'server/utils';
import { STORAGE_SETTINGS } from 'services/LocalStorageService/types';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { TConfig, TExtendedConfig } from 'types';
import { logger } from 'utils/logger';
import { v4 as uuidv4 } from 'uuid';

import {
  checkCapabilities,
  checkConfigError,
  checkPermissions,
  checkPreview,
  fetchManifest,
  initAnalytics,
  initialize,
  initPlayback,
  initPlayer,
  initServices,
  parseConfig,
  selectSource,
  selectTheme,
} from './effects';
import { FSMState, State, TrackParams } from './types';

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
    PLAYER_INIT_RESOLVE: 'CHECK_PERMISSIONS_PENDING',
    PLAYER_INIT_REJECT: 'ERROR',
  },
  // проверка прав на запуск (autoplay, mute)
  CHECK_PERMISSIONS_PENDING: {
    CHECK_PERMISSIONS_RESOLVE: 'INIT_ANALYTICS_PENDING',
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
    SHOW_PAYWALL: 'PAYWALL', // передача управления в paywall fsm
  },
  // платный трек недоступен для просмотра
  PAYWALL: {},
  // инциализация основных сервисов приложения
  INIT_SERVICES_PENDING: {
    INIT_SERVICES_RESOLVE: 'CHECK_ADULT_CONTENT',
    INIT_SERVICES_REJECT: 'ERROR',
  },
  // проверка на 18+ контент
  CHECK_ADULT_CONTENT: {
    ADULT_NOTIFY_RESOLVE: 'CHECK_RESUME_VIDEO',
    SKIP_ADULT_NOTIFY: 'CHECK_RESUME_VIDEO',
  },
  // проверка на необходимость показа экрана "продолжить просмотр"
  CHECK_RESUME_VIDEO: {
    RESUME_VIDEO_NOTIFY_RESOLVE: 'INITIAL_SELECT_SOURCE_PENDING',
    RESUME_VIDEO_NOTIFY_REJECT: 'INITIAL_SELECT_SOURCE_PENDING',
    SKIP_RESUME_VIDEO_NOTIFY: 'INITIAL_SELECT_SOURCE_PENDING',
  },

  // первичный выбор потока
  INITIAL_SELECT_SOURCE_PENDING: {
    SELECT_SOURCE_RESOLVE: 'INITIAL_FETCHING_MANIFEST',
    SELECT_SOURCE_ERROR: 'ERROR',
  },
  INITIAL_FETCHING_MANIFEST: {
    FETCHING_MANIFEST_RESOLVE: 'INITIALIZING_QUALITY_SERVICE',
    FETCHING_MANIFEST_REJECT: 'ERROR',
  },
  INITIALIZING_QUALITY_SERVICE: {
    QUALITY_INITIALIZATION_RESOLVE: 'SETUP_INITIAL_VOLUME',
    QUALITY_INITIALIZATION_REJECT: 'ERROR',
  },
  SETUP_INITIAL_VOLUME: {
    SETUP_INITIAL_VOLUME_RESOLVE: 'SELECTING_PLAYER_THEME',
  },
  SELECTING_PLAYER_THEME: {
    SELECTING_PLAYER_THEME_RESOLVE: 'CHECK_AUTOPLAY',
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

  // выбор другого доступного потока в случае ошибок
  SELECT_SOURCE_PENDING: {
    SELECT_SOURCE_RESOLVE: 'FETCHING_MANIFEST',
    SELECT_SOURCE_ERROR: 'ERROR',
  },
  FETCHING_MANIFEST: {
    FETCHING_MANIFEST_RESOLVE: 'RESUME_VIDEO_PENDING',
    FETCHING_MANIFEST_REJECT: 'ERROR',
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
    START_PLAYBACK: null,
    UPDATE_MANIFEST: null,
    UPDATE_TOKEN: null,
    RESUME_VIDEO: 'RESUME_VIDEO_PENDING',
    CHANGE_TRACK: 'PARSE_CONFIG_PENDING',
    RESET_PLAYBACK_RESOLVE: null,
  },

  ERROR: {},
  DISPOSED: {},
};

const initialState: FSMState = {
  step: 'IDLE',
  theme: 'default',

  config: {} as TExtendedConfig,
  adConfig: null,
  adPoints: [],

  features: {},
  subscription: {
    ACTIVE: null,
    DEFFERED: null,
  },
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
  previewDuration: null,
  capabilities: [],
  permissions: {
    autoplay: true,
    mute: true,
  },

  isShowPlayerUI: false,
  isFirstStartPlayback: true,

  deviceInfo: {
    isMobile: false,
    isSafari: undefined,
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
    browserVersion: undefined,
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
      const step = next || state.step;

      if (type === 'DISPOSE_PLAYER') return { ...state, isShowPlayerUI: false, step: 'DISPOSED' };
      if (next === undefined) return state;

      logger.log('[FSM]', 'root', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'QUALITY_INITIALIZATION_RESOLVE':
          return { ...state, step };
        case 'RESET_PLAYBACK_RESOLVE':
          state.session.id = uuidv4();
          break;
        case 'PARSE_CONFIG_RESOLVE':
          return {
            ...initialState,
            isShowPlayerUI: state.isShowPlayerUI,
            capabilities: state.capabilities,
            deviceInfo: state.deviceInfo,
            step,
            ...payload,
          };
        case 'SETUP_INITIAL_VOLUME_RESOLVE':
          state.step = step;
          break;
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
        case 'START_PLAYBACK':
          state.isFirstStartPlayback = false;
          break;
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, root.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const opts = {
        dispatch,
        getState,
        services,
      };

      const { step } = getState().root;

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
        CHECK_ADULT_CONTENT: () => {
          dispatch(
            sendEvent({
              type: 'CHECK_ADULT',
            })
          );
        },
        CHECK_RESUME_VIDEO: () => {
          dispatch(
            sendEvent({
              type: 'CHECK_RESUME',
            })
          );
        },
        SELECTING_PLAYER_THEME: () => selectTheme(opts),
        RENDER: () => {
          const { isShowPlayerUI } = getState().root;

          if (isShowPlayerUI) {
            dispatch(
              sendEvent({
                type: 'DO_PLAYER_INIT',
              })
            );
          } else {
            dispatch(
              sendEvent({
                type: 'SET_STATE',
                payload: {
                  isShowPlayerUI: true,
                },
              })
            );
          }
        },
        PLAYER_INIT_PENDING: () => initPlayer(opts),
        INITIAL_SELECT_SOURCE_PENDING: () => selectSource(opts),
        INITIAL_FETCHING_MANIFEST: () => fetchManifest(opts),
        SELECT_SOURCE_PENDING: () => selectSource(opts),
        FETCHING_MANIFEST: () => fetchManifest(opts),
        CHECK_PERMISSIONS_PENDING: () => checkPermissions(opts),
        AD_INIT_PENDING: async () => {
          await services.playerService.initLaunchHook();
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
        SETUP_INITIAL_VOLUME: () => {
          dispatch(
            sendEvent({
              type: 'SET_INITIAL_VOLUME',
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
        READY: () => {
          const { config } = getState().root;

          services.localStorageService.setItemByDomain(STORAGE_SETTINGS.USER_ID, config.config?.user_id || null);
          initPlayback(opts);
        },
        PAYWALL: () => {
          dispatch(
            sendEvent({
              type: 'PAYWALL_SHOWN',
            })
          );
        },
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
