import { createAction, createSlice } from '@reduxjs/toolkit';
import { isIOS } from 'react-device-detect';
import { STORAGE_SETTINGS } from 'services/LocalStorageService/types';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { condition } from 'store/condition';
import { isStepChange, startListening } from 'store/middleware';
import { getPlaylistItem } from 'store/selectors';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { AdCategory } from 'types/ad';
import { PlayerDisposeError } from 'utils/errors';
import { logger } from 'utils/logger';

import { clickSubscribeButton } from './effects/clickSubscribeButton';
import { FSMState, State } from './types';
import { getContent } from './utils';

const initialState: FSMState = {
  step: 'IDLE',
  isInitialized: false,

  title: null,
  description: null,
  payButtonText: null,
  closeButtonText: null,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    PARSE_CONFIG_RESOLVE: 'INIT_AD_DISABLE_SUGGESTION',
  },
  INIT_AD_DISABLE_SUGGESTION: {
    INIT_AD_DISABLE_SUGGESTION_RESOLVE: null,
    INIT_AD_DISABLE_SUGGESTION_REJECT: 'IDLE',
  },
  INIT_AD_DISABLE_SUGGESTION_LISTENERS: {
    INIT_AD_DISABLE_SUGGESTION_LISTENERS_RESOLVE: 'READY',
  },
  READY: {
    SHOW_AD_DISABLE_SUGGESTION: 'SHOWING_AD_DISABLE_SUGGESTION',
  },
  SHOWING_AD_DISABLE_SUGGESTION: {
    CLICK_SUB_BUTTON: 'CLICK_SUB_BUTTON_PROCESSING',
    CLICK_CLOSE_AD_DISABLE_SUGGESTION: 'DISPOSE_AD_SUGGESTION',
    CLOSE_AD_DISABLE_SUGGESTION: 'DISPOSE_AD_SUGGESTION',
  },
  CLICK_SUB_BUTTON_PROCESSING: {
    CLICK_SUB_BUTTON_PROCESSING_RESOLVE: 'DISPOSE_AD_SUGGESTION',
  },
  DISPOSE_AD_SUGGESTION: {
    DISPOSE_AD_SUGGESTION_RESOLVE: 'DISABLED',
  },
  DISABLED: {},
};

const adDisableSuggestion = createSlice({
  name: 'adDisableSuggestion',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (next === undefined) return state;

      logger.log('[FSM]', 'adDisableSuggestion', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'INIT_AD_DISABLE_SUGGESTION_LISTENERS_RESOLVE':
          return { ...state, isInitialized: true, step };
        case 'INIT_AD_DISABLE_SUGGESTION_RESOLVE':
          return {
            ...state,
            step: !state.isInitialized ? 'INIT_AD_DISABLE_SUGGESTION_LISTENERS' : 'READY',
            ...payload,
          };
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, adDisableSuggestion.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().adDisableSuggestion;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        INIT_AD_DISABLE_SUGGESTION_LISTENERS: () => {
          services.adService.addHook('initAdBreak', async ({ category, point }) => {
            const {
              fullscreen: { step },
              adDisableSuggestion,
            } = getState();

            if (adDisableSuggestion.step !== 'READY' || category !== AdCategory.PRE_ROLL || point > 0) return;

            if (step === 'FULLSCREEN' && isIOS) {
              dispatch(sendEvent({ type: 'EXIT_FULLCREEN' }));
            }

            dispatch(sendEvent({ type: 'SHOW_AD_DISABLE_SUGGESTION' }));

            await condition(
              ({
                adDisableSuggestion,
                root: {
                  meta: { isEmbedded },
                },
              }) => {
                if (!isEmbedded && adDisableSuggestion.step === 'CLICK_SUB_BUTTON_PROCESSING') {
                  throw new PlayerDisposeError('AD_DISABLE_SUGGESTION condition');
                }

                return adDisableSuggestion.step !== 'SHOWING_AD_DISABLE_SUGGESTION';
              }
            );
          });

          services.postMessageService.on('on_close_off_ads_before_preroll_experiment', () => {
            dispatch(sendEvent({ type: 'CLOSE_AD_DISABLE_SUGGESTION' }));
          });

          dispatch(sendEvent({ type: 'INIT_AD_DISABLE_SUGGESTION_LISTENERS_RESOLVE' }));
        },
        INIT_AD_DISABLE_SUGGESTION: () => {
          const {
            root: { adConfig, subscription },
            experiments: { experiments },
          } = getState();

          const { num_in_project } = getPlaylistItem(getState());

          const isDisabled = Boolean(
            experiments.EXP_AB_MONEY689 !== 'test' || num_in_project !== 2 || !adConfig?.pre_roll || subscription.ACTIVE
          );

          const isShown = services.localStorageService.getItemByDomain<boolean>(
            STORAGE_SETTINGS.AD_DISABLE_SUGGESTION_BEFORE_PREROLL
          );

          if (isDisabled || isShown) {
            dispatch(
              sendEvent({
                type: 'INIT_AD_DISABLE_SUGGESTION_REJECT',
              })
            );
          } else {
            dispatch(
              sendEvent({
                type: 'INIT_AD_DISABLE_SUGGESTION_RESOLVE',
                payload: getContent(getState()),
              })
            );
          }
        },
        CLICK_SUB_BUTTON_PROCESSING: () => {
          clickSubscribeButton(opts);
          dispatch(sendEvent({ type: 'CLICK_SUB_BUTTON_PROCESSING_RESOLVE' }));
        },
        DISPOSE_AD_SUGGESTION: () => {
          services.localStorageService.setItemByDomain(STORAGE_SETTINGS.AD_DISABLE_SUGGESTION_BEFORE_PREROLL, true);
          dispatch(sendEvent({ type: 'DISPOSE_AD_SUGGESTION_RESOLVE' }));
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'adDisableSuggestion', step);
        effect();
      }
    },
  });

export default {
  ...adDisableSuggestion,
  config,
  addMiddleware,
};
