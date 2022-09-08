import { createAction, createSlice } from '@reduxjs/toolkit';
import { AppState } from 'store';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import { getPlaylistItem, getStatusTrialSelector, getTrialDurationText } from 'store/selectors';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { SkinClass } from 'types';
import { logger } from 'utils/logger';

import { FSMState, State, SubType } from './types';

const DEFAULT_TITLE = 'Оформи подписку<br/>для продолжения просмотра';

export const getButtonTextBySkin = (state: AppState, type: SubType): string => {
  const { skin } = state.root.meta;

  const textBySkin: { [key in SkinClass]?: { [type in SubType]: string } } = {
    MORE_TV: {
      FULL_PRICE: 'оформить подписку бесплатно',
      TRIAL: 'оформить подписку со скидкой',
    },
    CTC: {
      FULL_PRICE: 'попробовать подписку',
      TRIAL: `${getTrialDurationText(state)} бесплатно без рекламы`,
    },
    DEFAULT: {
      FULL_PRICE: 'оформить подписку бесплатно',
      TRIAL: 'оформить подписку со скидкой',
    },
  };

  const text = textBySkin[skin || 'DEFAULT'] || textBySkin.DEFAULT;
  return text?.[type] as string;
};

const getPaywallDescription = (state: AppState, type: SubType) => {
  const { skin } = state.root.meta;

  const textBySkin: { [key in SkinClass]?: { [type in SubType]?: string } } = {
    MORE_TV: {
      TRIAL: `Первые ${getTrialDurationText(state)} подписки бесплатно`,
    },
  };

  const text = textBySkin[skin || 'DEFAULT'];
  return text?.[type] || null;
};

const initialState: FSMState = {
  step: 'IDLE',
  title: null,
  description: null,
  paywallButtonText: null,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    SHOW_PAYWALL: 'SETUP_PAYWALL',
    VIDEO_END: null,
  },
  SETUP_PAYWALL: {
    SETUP_PAYWALL_RESOLVE: 'READY',
  },
  READY: {
    CLICK_SUB_BUTTON: 'CLICK_SUB_BUTTON_PROCESSING',
  },
  CLICK_SUB_BUTTON_PROCESSING: {
    CLICK_SUB_BUTTON_PROCESSING_RESOLVE: 'READY',
  },
};

const paywall = createSlice({
  name: 'paywall',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload, meta } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;
      if (next === undefined) return state;

      logger.log('[FSM]', 'paywall', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'VIDEO_END':
          return { ...state, step: meta.isPreview ? 'SETUP_PAYWALL' : step };
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () => {
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, paywall.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().paywall;

      const handler: { [key in State]?: () => Promise<void> | void } = {
        SETUP_PAYWALL: () => {
          const state = getState();

          const {
            root: {
              features: { PAYWALL_TITLE },
            },
          } = state;

          const isTrialAvailable = getStatusTrialSelector(state);
          const type = isTrialAvailable ? 'TRIAL' : 'FULL_PRICE';

          const title = PAYWALL_TITLE || DEFAULT_TITLE;
          const description = getPaywallDescription(state, type);
          const paywallButtonText = getButtonTextBySkin(state, type);

          dispatch(
            sendEvent({
              type: 'SETUP_PAYWALL_RESOLVE',
              payload: { title, description, paywallButtonText },
            })
          );
        },
        CLICK_SUB_BUTTON_PROCESSING: () => {
          const {
            root: {
              config,
              meta: { isEmbedded, trackId },
              previews,
            },
          } = getState();

          const item = getPlaylistItem(getState());

          if (item.sharing_url && isEmbedded) {
            const queryParams = services.utmService
              .buildUTMQueryParams({
                term: previews ? 'preview' : 'paywall',
                trackId,
                skinId: config.config.skin_id,
              })
              .toString();

            window.open(`${item.sharing_url}?${queryParams}`, '_blank');
          }

          dispatch(sendEvent({ type: 'CLICK_SUB_BUTTON_PROCESSING_RESOLVE' }));
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'paywall', step);
        effect();
      }
    },
  });
};

export default {
  ...paywall,
  config,
  addMiddleware,
};
