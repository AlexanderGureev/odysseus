import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';
import { logger } from 'utils/logger';

type Opts = { currentTime: number };

export const checkTimePoint = ({ currentTime }: Opts, { getState, dispatch, services: { adService } }: EffectOpts) => {
  const {
    root: { adPoints, adConfig },
  } = getState();

  adService.updatePreloadedBlocks(currentTime);
  const preCachePoint = adService.getPreCachePoint(adPoints, currentTime);

  if (preCachePoint && adService.canPlayAd(preCachePoint.category)) {
    logger.log('[checkTimePoint]', 'preCachePoint', { currentTime, preCachePoint });

    return dispatch(
      sendEvent({
        type: 'PRELOAD_AD_BLOCK',
        meta: preCachePoint,
      })
    );
  }

  const next = adService.getCurrentPoint(adPoints, currentTime);
  const data = next ? adConfig?.[next.category] : null;
  const block = next ? adService.getBlock(next, 0) : null;

  if (next && data && adService.canPlayAd(next.category) && !block?.isDisposed()) {
    return dispatch(
      sendEvent({
        type: 'INIT_AD_BREAK',
        payload: {
          point: next,
          data,
        },
      })
    );
  }

  dispatch(
    sendEvent({
      type: 'CHECK_TIME_POINT_RESOLVE',
    })
  );
};
