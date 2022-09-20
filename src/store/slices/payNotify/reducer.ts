import { createAction, createSlice } from '@reduxjs/toolkit';
import { AppState } from 'store';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import { getStatusTrialSelector } from 'store/selectors';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { SkinClass, SubscriptionPreviewType } from 'types';
import { declOfNum } from 'utils/declOfNum';
import { logger } from 'utils/logger';

import { clickSubscribeButton } from '../adDisableSuggestion/effects/clickSubscribeButton';
import { getButtonTextBySkin } from '../paywall';
import { FSMState, State } from './types';

const getPreviewNotifyText = (state: AppState) => {
  const {
    meta: { skin },
    features: { SUBSCRIPTION_PREVIEW },
    previewDuration,
  } = state.root;
  const time = previewDuration ? previewDuration / 60 : 2;

  const MAPPED_TEXT_BY_PREVIEW_TYPE_AND_SKIN_NAME: {
    [key in SubscriptionPreviewType]: { [skin in SkinClass]?: string };
  } = {
    HUB: {
      CTC: 'Чтобы посмотреть это видео полностью, нужна подписка.',
      MORE_TV: `Первые ${time} ${declOfNum(time, [
        'минута',
        'минуты',
        'минут',
      ])} видео бесплатно, полное видео доступно по подписке`,
    },
    PAK: {
      CTC: `Чтобы посмотреть это видео полностью, нужна подписка.`,
      MORE_TV: `Первые 2 минуты видео бесплатно, полное видео доступно по подписке`,
    },
    FALSE: {},
  };

  if (!SUBSCRIPTION_PREVIEW || !skin) return null;

  return MAPPED_TEXT_BY_PREVIEW_TYPE_AND_SKIN_NAME[SUBSCRIPTION_PREVIEW]?.[skin];
};

const initialState: FSMState = {
  step: 'IDLE',
  text: '',
  btnText: '',
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    START_PLAYBACK: 'SETUP_PAY_NOTIFY',
  },
  SETUP_PAY_NOTIFY: {
    SETUP_PAY_NOTIFY_RESOLVE: 'READY',
    SETUP_PAY_NOTIFY_REJECT: 'DISABLED',
  },
  READY: {
    VIDEO_END: 'DISABLED',
    CLICK_SUB_BUTTON: 'CLICK_SUB_BUTTON_PROCESSING',
    CHANGE_TRACK: 'IDLE',
  },
  CLICK_SUB_BUTTON_PROCESSING: {
    CLICK_SUB_BUTTON_PROCESSING_RESOLVE: 'READY',
  },
  DISABLED: {
    CHANGE_TRACK: 'IDLE',
  },
};

const payNotify = createSlice({
  name: 'payNotify',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;
      if (next === undefined) return state;

      logger.log('[FSM]', 'payNotify', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () => {
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, payNotify.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { createDispatch, services },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().payNotify;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        SETUP_PAY_NOTIFY: () => {
          const state = getState();
          const {
            root: {
              features: { SUBSCRIPTION_TEXT },
              previews,
              adConfig,
            },
          } = state;

          const isTrialAvailable = getStatusTrialSelector(state);
          const type = isTrialAvailable ? 'TRIAL' : 'FULL_PRICE';

          const text = previews ? getPreviewNotifyText(state) : adConfig ? SUBSCRIPTION_TEXT : null;
          const btnText = getButtonTextBySkin(state, type, true);

          if (text && btnText) {
            dispatch(sendEvent({ type: 'SETUP_PAY_NOTIFY_RESOLVE', payload: { text, btnText } }));
          } else {
            dispatch(sendEvent({ type: 'SETUP_PAY_NOTIFY_REJECT' }));
          }
        },
        CLICK_SUB_BUTTON_PROCESSING: () => {
          const {
            root: { previews },
          } = getState();

          clickSubscribeButton(opts, { term: previews ? 'preview' : 'subscribe_cta' });
          dispatch(sendEvent({ type: 'CLICK_SUB_BUTTON_PROCESSING_RESOLVE' }));
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'payNotify', step);
        effect();
      }
    },
  });
};

export default {
  ...payNotify,
  config,
  addMiddleware,
};
