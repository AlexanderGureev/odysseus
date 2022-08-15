import { createAction, createSlice } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { SkinClass } from 'types';
import { isNil } from 'utils';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';

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
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    PARSE_CONFIG_RESOLVE: null,
  },
  READY: {
    TIME_UPDATE: null,
  },
  AUTOSWITCH_NOTIFY: {
    TIME_UPDATE: null,
    START_AUTOSWITCH: 'AUTOSWITCH_PENDING',
    HIDE_AUTOSWITCH_NOTIFY: 'AUTOSWITCH_WAITING',
  },
  AUTOSWITCH_WAITING: {
    VIDEO_END: 'AUTOSWITCH_PENDING',
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

      if (type === 'CHANGE_TRACK') return initialState;
      if (next === undefined) return state;

      logger.log('[FSM]', 'autoSwitch', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'VIDEO_END':
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
              step: Math.ceil(countdownValue) > 0 ? 'AUTOSWITCH_NOTIFY' : 'AUTOSWITCH_PENDING',
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

      const { step } = getState().autoSwitch;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        AUTOSWITCH_NOTIFY: () => {
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
