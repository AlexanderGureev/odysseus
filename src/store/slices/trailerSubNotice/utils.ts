import { AppState } from 'store';
import { getStatusTrialSelector, getTrialDurationText } from 'store/selectors';

export const getContent = (state: AppState) => {
  let description = null;
  let buttonText = null;

  if (getStatusTrialSelector(state)) {
    const trialText = getTrialDurationText(state);
    description = `Все сериалы можно смотреть бесплатно<br/> первые ${trialText} подписки. <span>Подробнее о подписке</span>`;
    buttonText = 'Смотреть бесплатно';
  } else {
    description = `Все сериалы, фильмы и шоу<br/> можно смотреть по одной подписке. <span>Подробнее о подписке</span>`;
    buttonText = 'Смотреть по подписке';
  }

  return {
    description,
    buttonText,
  };
};
