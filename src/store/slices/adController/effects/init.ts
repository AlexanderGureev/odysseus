import { EffectOpts } from 'interfaces';
import { PLAYER_ID } from 'services/PlayerService/types';
import { sendEvent } from 'store';
import { AdCategory } from 'types/ad';
import { logger } from 'utils/logger';

const DEFAULT_ADV_CONTROLS_ID = 'adv-controls';

export const init = async ({ getState, dispatch, services: { adService, playerService } }: EffectOpts) => {
  try {
    const {
      root: { adConfig, adPoints, features },
    } = getState();

    playerService.on('timeupdate', ({ currentTime }) => {
      dispatch(
        sendEvent({
          type: 'CHECK_TIME_POINT',
          meta: {
            currentTime,
          },
        })
      );
    });

    await adService.init({
      playerId: PLAYER_ID,
      controlsId: DEFAULT_ADV_CONTROLS_ID,
      features,
    });

    if (!adConfig) throw new Error('adConfig is undefined');

    const delayedPreroll = adPoints.find((p) => p.category === AdCategory.PRE_ROLL);

    if (adService.canPlayAd() && !delayedPreroll && adConfig.pre_roll) {
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
