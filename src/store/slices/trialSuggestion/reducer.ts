import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { isIOS } from 'react-device-detect';
import { toNumber } from 'server/utils';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { condition } from 'store/condition';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { AdCategory, TAdPointConfig } from 'types/ad';
import { PlayerDisposeError } from 'utils/errors';
import { logger } from 'utils/logger';
import { randomHash12 } from 'utils/randomHash';

import { clickSubscribeButton } from '../adDisableSuggestion/effects/clickSubscribeButton';
import { FSMState, State } from './types';
import { getContentByTrigger, getSettingByKey, keysByTrigger, notifyConditions, selectActiveNotify } from './utils';

const initialState: FSMState = {
  step: 'IDLE',
  isInitialized: false,
  notifyType: null,
  notifyContent: null,
  timerId: null,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    PARSE_CONFIG_RESOLVE: 'INITIALIZING_TRIAL_NOTICE',
  },
  INITIALIZING_TRIAL_NOTICE: {
    INITIALIZING_TRIAL_NOTICE_RESOLVE: null,
    INITIALIZING_TRIAL_NOTICE_REJECT: 'DISABLED',
  },
  INITIALIZING_NOTICE_LISTENERS: {
    INITIALIZING_NOTICE_LISTENERS_RESOLVE: 'READY',
  },
  READY: {
    AD_BREAK_STARTED: 'AD_BREAK',
    SHOW_TRIAL_NOTICE: 'SHOWING_TRIAL_NOTICE', // при показе уведомления перед паузроллом
  },
  AD_BREAK: {
    AD_BREAK_END: 'CHECKING_TRIGGERS',
  },
  CHECKING_TRIGGERS: {
    SET_TRIAL_NOTICE: 'AWAITING_START_PLAYBACK', // ждем старта ролика т.к могут быть сплешьскрины или другие модалки
    NOT_FOUND_NOTICE: 'READY',
  },
  AWAITING_START_PLAYBACK: {
    START_PLAYBACK: 'SHOWING_TRIAL_NOTICE',
  },
  SHOWING_TRIAL_NOTICE: {
    CLICK_PAY_BUTTON_TRIAL_NOTICE: 'CLICK_PAY_BUTTON_TRIAL_NOTICE_PROCESSING',
    CLICK_CLOSE_TRIAL_NOTICE: 'DISPOSE_NOTICE',
    CLOSE_TRIAL_NOTICE: 'DISPOSE_NOTICE', // ивент о закрытии с веба
    AUTO_CLOSE_TRIAL_NOTICE: 'DISPOSE_NOTICE', // авто закрытие по таймауту
    SHOW_TRIAL_NOTICE: null, // в момент показа попапа может открыть другой (редкий кейс когда нет таймаутов между показами)
    AD_BREAK_STARTED: 'AD_BREAK',
    CHANGE_TRACK: null,
  },
  CLICK_PAY_BUTTON_TRIAL_NOTICE_PROCESSING: {
    CLICK_PAY_BUTTON_TRIAL_NOTICE_PROCESSING_RESOLVE: 'DISPOSE_NOTICE',
  },
  AUTO_CLOSE: {
    DISPOSE_NOTICE_RESOLVE: 'IDLE',
  },
  DISPOSE_NOTICE: {
    DISPOSE_NOTICE_RESOLVE: 'READY',
  },
  DISABLED: {},
};

const trialSuggestion = createSlice({
  name: 'trialSuggestion',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (type === 'CHANGE_TRACK') {
        return { ...state, step: state.step === 'SHOWING_TRIAL_NOTICE' ? 'AUTO_CLOSE' : 'IDLE' };
      }

      if (next === undefined) return state;

      logger.log('[FSM]', 'trialSuggestion', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'AD_BREAK_STARTED':
        case 'DISPOSE_NOTICE_RESOLVE':
          return { ...state, step, notifyType: null, notifyContent: null };
        case 'PARSE_CONFIG_RESOLVE':
          state.step = step;
          break;
        case 'INITIALIZING_TRIAL_NOTICE_RESOLVE':
          state.step = state.isInitialized ? 'READY' : 'INITIALIZING_NOTICE_LISTENERS';
          break;
        case 'INITIALIZING_NOTICE_LISTENERS_RESOLVE':
          return { ...state, step, isInitialized: true };
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, trialSuggestion.name),
    effect: async (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().trialSuggestion;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        INITIALIZING_TRIAL_NOTICE: () => {
          const state = getState();
          const isActive = notifyConditions.every((c) => c(state));
          dispatch(
            sendEvent({ type: isActive ? 'INITIALIZING_TRIAL_NOTICE_RESOLVE' : 'INITIALIZING_TRIAL_NOTICE_REJECT' })
          );
        },
        INITIALIZING_NOTICE_LISTENERS: () => {
          services.adService.addHook('initAdBreak', async ({ category }) => {
            if (category !== AdCategory.PAUSE_ROLL) return;

            const notifyType = selectActiveNotify(getState(), category, services);
            if (!notifyType) return;

            const {
              fullscreen: { step },
            } = getState();

            const notifyContent = getContentByTrigger(getState(), notifyType);
            dispatch(sendEvent({ type: 'AUTO_PAUSE' }));

            if (step === 'FULLSCREEN' && isIOS) {
              dispatch(sendEvent({ type: 'EXIT_FULLCREEN' }));
            }

            dispatch(sendEvent({ type: 'DISABLE_HOTKEYS' }));
            dispatch(
              sendEvent({ type: 'SHOW_TRIAL_NOTICE', payload: { notifyType, notifyContent, timerId: randomHash12() } })
            );

            await condition(
              ({
                trialSuggestion,
                root: {
                  meta: { isEmbedded },
                },
              }) => {
                if (!isEmbedded && trialSuggestion.step === 'CLICK_PAY_BUTTON_TRIAL_NOTICE_PROCESSING') {
                  throw new PlayerDisposeError('TRIAL_NOTICE condition');
                }

                return trialSuggestion.step !== 'SHOWING_TRIAL_NOTICE';
              }
            );
          });

          services.postMessageService.on('on_click_bt_close_trial_suggestion', () => {
            dispatch(sendEvent({ type: 'CLOSE_TRIAL_NOTICE' }));
          });

          dispatch(sendEvent({ type: 'INITIALIZING_NOTICE_LISTENERS_RESOLVE' }));
        },
        CHECKING_TRIGGERS: () => {
          const {
            payload: {
              meta: { category },
            },
          } = action as PayloadAction<{
            meta: TAdPointConfig;
          }>;

          const notifyType = selectActiveNotify(getState(), category, services);
          if (!notifyType || category === AdCategory.PAUSE_ROLL) {
            dispatch(sendEvent({ type: 'NOT_FOUND_NOTICE' }));
            return;
          }

          const {
            fullscreen: { step },
          } = getState();

          const notifyContent = getContentByTrigger(getState(), notifyType);

          if (step === 'FULLSCREEN' && isIOS) {
            dispatch(sendEvent({ type: 'EXIT_FULLCREEN' }));
          }

          dispatch(
            sendEvent({ type: 'SET_TRIAL_NOTICE', payload: { notifyType, notifyContent, timerId: randomHash12() } })
          );
        },
        SHOWING_TRIAL_NOTICE: () => {
          dispatch(sendEvent({ type: 'TRIAL_NOTICE_SHOWN' }));

          const { notifyType, timerId } = getState().trialSuggestion;
          if (notifyType === 'triggerBeforePauserolls') return;

          const timeout = toNumber(getSettingByKey(getState(), 'suggestionDisplayDuration'));

          if (timeout && timeout > 0) {
            setTimeout(() => {
              if (timerId !== getState().trialSuggestion.timerId) return;

              dispatch(sendEvent({ type: 'AUTO_CLOSE_TRIAL_NOTICE' }));
            }, timeout * 1000);
          }
        },
        CLICK_PAY_BUTTON_TRIAL_NOTICE_PROCESSING: () => {
          clickSubscribeButton(opts);
          dispatch(sendEvent({ type: 'CLICK_PAY_BUTTON_TRIAL_NOTICE_PROCESSING_RESOLVE' }));
        },
        DISPOSE_NOTICE: () => {
          const { notifyType } = getState().trialSuggestion;
          if (!notifyType) return;

          const { storageKey } = keysByTrigger[notifyType];
          services.localStorageService.setItemByDomain(storageKey, Date.now());

          dispatch(sendEvent({ type: 'DISPOSE_NOTICE_RESOLVE' }));
        },
        AUTO_CLOSE: () => {
          dispatch(sendEvent({ type: 'AUTO_CLOSE_TRIAL_NOTICE' }));
          dispatch(sendEvent({ type: 'DISPOSE_NOTICE_RESOLVE' }));
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'trialSuggestion', step);
        effect();
      }
    },
  });

export default {
  ...trialSuggestion,
  config,
  addMiddleware,
};
