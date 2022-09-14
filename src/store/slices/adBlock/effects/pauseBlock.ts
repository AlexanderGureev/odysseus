import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';
import { logger } from 'utils/logger';

export const pauseBlock = ({ getState, dispatch, services: { adService } }: EffectOpts) => {
  try {
    const { adPoint, index } = getState().adBlock;
    const currentBlock = adService.getBlock(adPoint, index);
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
