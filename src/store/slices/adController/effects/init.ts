import { EffectOpts } from 'interfaces';
import { PLAYER_ID } from 'services/PlayerService/types';
import { sendEvent } from 'store';
import { AdCategory } from 'types/ad';
import { logger } from 'utils/logger';

export const DEFAULT_ADV_CONTROLS_ID = 'adv-controls';

export const init = async ({ getState, dispatch, services: { adService } }: EffectOpts) => {
  try {
    const {
      root: { adConfig, adPoints, features, previews },
    } = getState();

    if (!adConfig || previews) throw new Error('adConfig is undefined or preview video');

    await adService.init({
      playerId: PLAYER_ID,
      controlsId: DEFAULT_ADV_CONTROLS_ID,
      features,
    });

    const delayedPreroll = adPoints.find((p) => p.category === AdCategory.PRE_ROLL);

    if (adService.canPlayAd(AdCategory.PRE_ROLL) && !delayedPreroll && adConfig.pre_roll) {
      dispatch(
        sendEvent({
          type: 'INIT_AD_BREAK',
          payload: {
            data: adConfig.pre_roll,
            point: {
              category: AdCategory.PRE_ROLL,
              point: 0,
            },
          },
        })
      );
      return;
    }

    dispatch(
      sendEvent({
        type: 'RESUME_VIDEO',
      })
    );
  } catch (err) {
    logger.error('[adInit]', err?.message);

    dispatch(
      sendEvent({
        type: 'INIT_AD_REJECT',
      })
    );
  }
};
