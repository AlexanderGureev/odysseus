import { EffectOpts } from 'interfaces';
import { AppState, sendEvent } from 'store';
import { logger } from 'utils/logger';

type PromoOfferCfg = {
  enable: boolean;
  SVOD: boolean;
  AVOD: boolean;
  FREE: boolean;
};

export const isTrailerTheme = (state: AppState) => {
  const {
    hasRightAvod = false,
    hasRightFree = false,
    hasRightSvod = false,
  } = state.root.config?.trackInfo?.project || {};

  const {
    root: { subscription, features },
  } = state;

  if (!features.PROMO_OFFER_BUTTON) return false;

  try {
    const { enable, SVOD, AVOD, FREE }: PromoOfferCfg = JSON.parse(features.PROMO_OFFER_BUTTON);
    return enable && !subscription?.ACTIVE && hasRightAvod === AVOD && hasRightSvod === SVOD && hasRightFree === FREE;
  } catch (e) {
    logger.error('[isSubButton]', e?.message);
    return false;
  }
};

export const selectTheme = ({ getState, dispatch }: EffectOpts) => {
  dispatch(
    sendEvent({
      type: 'SELECTING_PLAYER_THEME_RESOLVE',
      payload: {
        theme: isTrailerTheme(getState()) ? 'TRAILER' : 'DEFAULT',
      },
    })
  );
};
