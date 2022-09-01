import { EffectOpts } from 'interfaces';
import { isNumber } from 'server/utils';
import { STORAGE_SETTINGS } from 'services/LocalStorageService/types';
import { AppState } from 'store';
import { getStatusTrialSelector, getTrialDurationText } from 'store/selectors';
import { TrialSuggestionCfg } from 'types';
import { AdCategory } from 'types/ad';
import { VIEW_TYPE } from 'types/TrackInfo';

export type TS_TRIGGER = 'triggerAfterPrerolls' | 'triggerAfterMidrolls' | 'triggerBeforePauserolls';

export enum TS_EVENT_NAME {
  ON_SHOW = 'on_show_trial_suggestion',
  CLICK_ADV_OFF = 'on_click_bt_turnoff_adv_at_trial_suggestion',
  CLICK_CLOSE = 'on_click_bt_close_trial_suggestion',
  AUTOCLOSE_TIMEOUT = 'timeout_close_suggestion',
  TRIAL_SUGGESTION_HIDDEN = 'trial_suggestion_hidden',
}

export const triggerByAdCategory: { [key in AdCategory]?: TS_TRIGGER } = {
  [AdCategory.MID_ROLL]: 'triggerAfterMidrolls',
  [AdCategory.CONTENT_ROLL]: 'triggerAfterMidrolls',
  [AdCategory.PRE_ROLL]: 'triggerAfterPrerolls',
  [AdCategory.PAUSE_ROLL]: 'triggerBeforePauserolls',
};

export const keysByTrigger: {
  [key in TS_TRIGGER]: { storageKey: STORAGE_SETTINGS; intervalKey: keyof TrialSuggestionCfg };
} = {
  triggerAfterPrerolls: {
    storageKey: STORAGE_SETTINGS.AFTER_PREROLL_TIMESTAMP,
    intervalKey: 'afterPrerollsInterval',
  },
  triggerAfterMidrolls: {
    storageKey: STORAGE_SETTINGS.AFTER_MIDROLL_TIMESTAMP,
    intervalKey: 'afterMidrollsInterval',
  },
  triggerBeforePauserolls: {
    storageKey: STORAGE_SETTINGS.BEFORE_PAUSEROLL_TIMESTAMP,
    intervalKey: 'beforePauserollsInterval',
  },
};

export type NoticeContent = {
  title: string | null;
  description: string | null;
  payButtonText: string | null;
  closeButtonText: string | null;
};

export const getContentByTrigger = (state: AppState, trigger: TS_TRIGGER) => {
  const text = getTrialDurationText(state);

  const map: {
    [key in 'notify' | 'modal']: NoticeContent;
  } = {
    notify: {
      title: null,
      description: `Хочешь смотреть без рекламы?<br>Оформи ${text} подписки бесплатно`,
      payButtonText: `Отключить рекламу ${state.fullscreen.step === 'FULLSCREEN' ? 'бесплатно' : ''}`,
      closeButtonText: null,
    },
    modal: {
      title: 'Видео продолжится после рекламы',
      description: `Хочешь смотреть без рекламы?<br>Оформи ${text} подписки бесплатно`,
      payButtonText: 'Отключить рекламу бесплатно',
      closeButtonText: 'Продолжить просмотр с рекламой',
    },
  };

  return trigger === 'triggerBeforePauserolls' ? map.modal : map.notify;
};

type CheckConditionFn = (state: AppState) => boolean;

export const getSettingByKey = (state: AppState, key: keyof TrialSuggestionCfg) =>
  state.root.features?.TRIAL_SUGGESTION?.[key] || undefined;

const isValidSettingByKey = (key: keyof TrialSuggestionCfg) => (state: AppState) => {
  const value = getSettingByKey(state, key);
  return Boolean(value && isNumber(`${value}`) && value > 0);
};

export const conditionsByTrigger: { [key in TS_TRIGGER]: Array<CheckConditionFn> } = {
  triggerAfterPrerolls: [
    isValidSettingByKey('suggestionDisplayDuration'),
    isValidSettingByKey('afterPrerollsInterval'),
  ],
  triggerAfterMidrolls: [
    isValidSettingByKey('suggestionDisplayDuration'),
    isValidSettingByKey('afterMidrollsInterval'),
  ],
  triggerBeforePauserolls: [isValidSettingByKey('beforePauserollsInterval')],
};

export const selectActiveNotify = (state: AppState, category: AdCategory, services: EffectOpts['services']) => {
  const trigger = triggerByAdCategory[category];
  if (!trigger) return false;

  const { storageKey, intervalKey } = keysByTrigger[trigger];
  const lastActivatedAt = services.localStorageService.getItemByDomain<number>(storageKey);
  const isValidSettings = conditionsByTrigger[trigger]?.every((c) => c(state));
  const intervalValue = getSettingByKey(state, intervalKey);

  if (!isValidSettings || !intervalValue) return false;

  // TODO fix
  return trigger;
  // if (Date.now() - (lastActivatedAt || 0) > intervalValue * 60 * 60 * 1000) {
  //   return trigger;
  // }

  // return null;
};

export const notifyConditions: CheckConditionFn[] = [
  (state) => {
    const { hasRightAvod, hasRightSvod } = state.root.config?.trackInfo?.track || {};
    return Boolean(hasRightAvod && hasRightSvod);
  },
  (state) => {
    const { viewType } = state.root.config?.trackInfo?.track || {};
    return viewType === VIEW_TYPE.NORMAL;
  },
  (state) => getStatusTrialSelector(state),
];
