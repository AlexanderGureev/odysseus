import { AppState } from 'store';
import { getStatusTrialSelector, getSubPriceText, getTrialDurationText } from 'store/selectors';

export const getContent = (state: AppState) => {
  let description = '';

  if (getStatusTrialSelector(state)) {
    const trialText = getTrialDurationText(state);
    description = `Продолжить просмотр с рекламой<br/>или отключить её бесплатно на ${trialText}?`;
  } else {
    const subText = getSubPriceText(state);
    description = `Продолжить просмотр с рекламой<br/>или отключить её за ${subText} в месяц?`;
  }

  return {
    title: 'Эта серия будет показана<br/>с рекламными вставками',
    description,
    closeButtonText: 'Продолжить с рекламой',
    payButtonText: 'Отключить бесплатно',
  };
};
