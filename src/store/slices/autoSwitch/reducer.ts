import { createAction, createSlice } from '@reduxjs/toolkit';
import { isIOS } from 'react-device-detect';
import { STORAGE_SETTINGS } from 'services/LocalStorageService/types';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { SkinClass } from 'types';
import { AdCategory } from 'types/ad';
import { isNil } from 'utils';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';
import { getAutoswitchNotifyContent, selectAutoswitchNotifyType } from './utils';

const initialState: FSMState = {
  step: 'IDLE',

  controlType: null,
  autoswitchType: null,
  autoswitchPoint: -1,
  countdown: -1,
  countdownValue: -1,
  thumbnail: null,
  buttonText: null,
  cancelButtonText: null,
  previousTime: null,

  auto: true,
  autoswitchNotifyType: 'default',
  autoswitchNotifyText: null,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    DO_INIT: 'PREPARE_AUTOSWITCH',
    PARSE_CONFIG_RESOLVE: null,
  },
  PREPARE_AUTOSWITCH: {
    PREPARE_AUTOSWITCH_RESOLVE: 'IDLE',
  },
  READY: {
    TIME_UPDATE: null,
  },
  SELECT_AUTOSWITCH_NOTIFY_TYPE: {
    SELECT_AUTOSWITCH_NOTIFY_TYPE_RESOLVE: 'AUTOSWITCH_NOTIFY',
  },
  AUTOSWITCH_NOTIFY: {
    TIME_UPDATE: null,
    START_AUTOSWITCH: 'AUTOSWITCH_PENDING',
    HIDE_AUTOSWITCH_NOTIFY: 'AUTOSWITCH_WAITING',
    CLOSE_AUTOSWITCH_NOTIFY: 'AUTOSWITCH_WAITING',
  },
  AUTOSWITCH_WAITING: {
    START_VIDEO_END_AUTOSWITCH: 'AUTOSWITCH_PENDING',
  },
  AUTOSWITCH_PENDING: {
    CHANGE_TRACK: 'IDLE',
  },
  DISABLED: {
    CHANGE_TRACK: 'IDLE',
  },
};

const autoSwitch = createSlice({
  name: 'autoSwitch',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (type === 'CHECK_PREVIEW_RESOLVE') return { ...initialState, step: 'DISABLED' };
      if (type === 'CHANGE_TRACK') return initialState;
      if (next === undefined) return state;

      logger.log('[FSM]', 'autoSwitch', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'START_VIDEO_END_AUTOSWITCH':
          state.auto = true;
          state.step = step;
          break;
        case 'START_AUTOSWITCH':
          state.auto = false;
          state.step = step;
          break;
        case 'PARSE_CONFIG_RESOLVE': {
          const { NEXT_EPISODE_AUTOPLAY, NEXT_EPISODE_AUTOPLAY_SUGGEST } = payload.features;
          const skin = payload.meta.skin;
          const data = payload.config.playlist.items[0].auto_switch;
          const next = payload.config.playlist.items[0].linked_tracks?.next;

          if (isNil(data?.point) || isNil(data?.countdown) || !next) return { ...state, step: 'DISABLED' };

          const autoswitchType = data.countdown === 0 ? 'auto' : 'notify';

          if (autoswitchType === 'notify' && !NEXT_EPISODE_AUTOPLAY_SUGGEST) {
            return { ...state, step: 'DISABLED' };
          }

          if (autoswitchType === 'auto' && !NEXT_EPISODE_AUTOPLAY) {
            return { ...state, step: 'DISABLED' };
          }

          return {
            ...state,
            controlType: data.project_poster ? 'project' : 'episode',
            autoswitchType,
            autoswitchPoint: data.point,
            countdown: data.countdown,
            countdownValue: data.countdown,
            thumbnail: data.project_poster || next.thumbnail || null,
            buttonText: data.project_poster ? data.caption_v2 : data.caption,
            cancelButtonText: skin === SkinClass.MORE_TV ? 'Смотреть титры' : 'Досмотреть',
            step: autoswitchType === 'auto' ? 'AUTOSWITCH_WAITING' : 'READY',
          };
        }
        case 'TIME_UPDATE': {
          const { currentTime } = payload;
          const previousTime = state.previousTime || currentTime;
          const diff = currentTime - previousTime;

          // TODO узнать нужно ли так?
          if (state.step === 'AUTOSWITCH_NOTIFY' && state.autoswitchNotifyType === 'avod_popup') return state;

          // если старт ролика или перемотка сразу попадает в интервал autoswitch,
          // то переходим в механику автопереключения в конце трека
          if (currentTime >= state.autoswitchPoint && (previousTime === currentTime || diff > 1)) {
            return {
              ...state,
              previousTime: currentTime,
              step: 'AUTOSWITCH_WAITING',
            };
          }

          if (currentTime >= state.autoswitchPoint) {
            const diff = currentTime - previousTime;
            const countdownValue = state.countdownValue - diff;

            return {
              ...state,
              previousTime: currentTime,
              countdownValue,
              step: Math.ceil(countdownValue) > 0 ? 'SELECT_AUTOSWITCH_NOTIFY_TYPE' : 'AUTOSWITCH_PENDING',
            };
          }

          return { ...state, previousTime: currentTime, countdownValue: state.countdown, step: 'READY' };
        }
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, autoSwitch.name),
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
        getState,
        dispatch,
        services,
      };

      const { step } = getState().autoSwitch;

      const handler: { [key in State]?: () => Promise<void> | void } = {
        PREPARE_AUTOSWITCH: () => {
          services.adService.addHook('canPlayAd', (category) => {
            const { step } = getState().autoSwitch;

            if (['AUTOSWITCH_NOTIFY', 'AUTOSWITCH_PENDING'].includes(step)) return false;
            if (step === 'AUTOSWITCH_WAITING' && category === AdCategory.POST_ROLL) return false;
            return true;
          });

          services.postMessageService.on('on_close_off_ads_experiment', () => {
            const { autoswitchNotifyType } = getState().autoSwitch;
            if (autoswitchNotifyType === 'avod_popup') {
              dispatch(sendEvent({ type: 'CLOSE_AUTOSWITCH_NOTIFY' }));
            }
          });

          dispatch(sendEvent({ type: 'PREPARE_AUTOSWITCH_RESOLVE' }));
        },
        SELECT_AUTOSWITCH_NOTIFY_TYPE: () => {
          const autoswitchNotifyType = selectAutoswitchNotifyType(opts);
          const content = getAutoswitchNotifyContent(getState(), autoswitchNotifyType);

          dispatch(
            sendEvent({
              type: 'SELECT_AUTOSWITCH_NOTIFY_TYPE_RESOLVE',
              payload: {
                autoswitchNotifyType,
                ...content,
              },
            })
          );
        },
        AUTOSWITCH_NOTIFY: () => {
          const {
            fullscreen: { step },
            autoSwitch: { autoswitchNotifyType },
          } = getState();

          if (autoswitchNotifyType === 'avod_popup') {
            services.localStorageService.setItemByDomain(STORAGE_SETTINGS.AUTOSWITCH_AVOD_POPUP, Date.now());
          }

          // на ios в фулскрине нативный плеер и мы не увидим там autoSwitch notify, поэтому принудительно выходим
          if (step === 'FULLSCREEN' && isIOS) {
            dispatch(sendEvent({ type: 'EXIT_FULLCREEN' }));
          }

          dispatch(sendEvent({ type: 'AUTOSWITCH_NOTIFY_SHOWN' }));
        },
        AUTOSWITCH_PENDING: () => {
          const { auto } = getState().autoSwitch;

          dispatch(
            sendEvent({
              type: 'GO_TO_NEXT_TRACK',
              payload: { params: { startAt: 0 } },
              meta: {
                auto,
                overlay: true,
              },
            })
          );
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'autoSwitch', step);
        effect();
      }
    },
  });

export default {
  ...autoSwitch,
  config,
  addMiddleware,
};
