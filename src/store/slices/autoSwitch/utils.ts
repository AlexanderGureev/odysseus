import { EffectOpts } from 'interfaces';
import { STORAGE_SETTINGS } from 'services/LocalStorageService/types';
import { AppState } from 'store';
import { getStatusTrialSelector, getSubPriceText, getTrialDurationText } from 'store/selectors';

import { AutoswitchNotifyType } from './types';

export const selectAutoswitchNotifyType = ({ getState, services }: EffectOpts): AutoswitchNotifyType => {
  const {
    experiments: {
      web: { experiments },
    },
    root: { features, adConfig, adPoints, subscription },
    adController,
  } = getState();

  const isExperiment = experiments?.EXP_AB_MONEY687?.includes('test');

  if (!isExperiment || !adConfig || !adPoints.length || subscription.ACTIVE || adController.step === 'DISABLED') {
    return 'default';
  }

  const interval = features?.FEATURE_OFF_ADS_DISPLAY_TIME || 2; // в часах
  const lastShowAt = services.localStorageService.getItemByDomain<number>(STORAGE_SETTINGS.AUTOSWITCH_AVOD_POPUP);
  const isActive = Date.now() - (lastShowAt || 0) > interval * 60 * 60 * 1000;

  return isActive ? 'avod_popup' : 'default';
};

export const getAutoswitchNotifyContent = (state: AppState, type: AutoswitchNotifyType) => {
  if (type === 'default') {
    return {
      autoswitchNotifyText: null,
      buttonText: state.autoSwitch.buttonText,
      cancelButtonText: state.autoSwitch.cancelButtonText,
    };
  }

  let autoswitchNotifyText = '';

  if (getStatusTrialSelector(state)) {
    const trialText = getTrialDurationText(state);
    autoswitchNotifyText = `Если это отвлекает от сюжета и мешает просмотру,<br/> то рекламу можно отключить на ${trialText} бесплатно`;
  } else {
    const subText = getSubPriceText(state);
    autoswitchNotifyText = `Если это отвлекает от сюжета и мешает просмотру,<br/> то рекламу можно отключить за ${subText} в месяц`;
  }

  return {
    autoswitchNotifyText,
    buttonText: 'Продолжить с рекламой',
    cancelButtonText: 'Отключить рекламу',
  };
};
