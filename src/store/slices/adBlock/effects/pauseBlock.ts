import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';
import { logger } from 'utils/logger';

export const pauseBlock = ({ getState, dispatch, services: { adService } }: EffectOpts) => {
  try {
    const { point, index } = getState().adBlock;
    const currentBlock = adService.getBlock(point, index);
    currentBlock.pauseAd();
  } catch (err) {
    logger.error('[pauseBlock]', err?.message);
  } finally {
    dispatch(
      sendEvent({
        type: 'PAUSE_AD_BLOCK_RESOLVE',
      })
    );
  }
};
