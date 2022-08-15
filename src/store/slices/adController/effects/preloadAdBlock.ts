import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';
import { TAdPointConfig } from 'types/ad';
import { logger } from 'utils/logger';

export const preloadAdBlock = async (
  point: TAdPointConfig,
  { getState, dispatch, services: { adService, embeddedCheckService } }: EffectOpts
) => {
  try {
    const {
      root: {
        adConfig,
        meta,
        session,
        deviceInfo,
        config: {
          config: { puid12, user_id },
        },
      },
    } = getState();

    const config = adConfig?.[point.category];
    if (!config) throw new Error(`adConfig by category - ${point.category} not found`);

    const links = adService.createState(config, point);
    const block = adService.createBlock(links, {
      config: point,
      index: 0,
      limit: config.limit,
      isPromo: false,
      creativeOpts: {
        isEmbedded: meta.isEmbedded,
        isMobile: deviceInfo.isMobile,
        outerHost: embeddedCheckService.getState().location,
        puid12,
        sauronId: session.sid,
        ssid: session.id,
        videosessionId: session.videosession_id,
        userId: user_id,
      },
    });

    block
      .preload()
      .then(() => {
        dispatch(
          sendEvent({
            type: 'PRELOAD_AD_BLOCK_RESOLVE',
            payload: { preloadedPoint: point },
          })
        );
      })
      .catch((err) => {
        logger.error('[preloadAdBlock]', 'preload next block failed', err?.message);
        dispatch(
          sendEvent({
            type: 'PRELOAD_AD_BLOCK_REJECT',
          })
        );
      });

    dispatch(
      sendEvent({
        type: 'PRELOAD_AD_BLOCK_STARTED',
      })
    );
  } catch (err) {
    logger.error('[preloadAd]', err?.message);
    dispatch(
      sendEvent({
        type: 'PRELOAD_AD_BLOCK_REJECT',
      })
    );
  }
};
