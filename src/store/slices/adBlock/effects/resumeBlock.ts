import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';
import { logger } from 'utils/logger';

export const resumeBlock = ({ getState, dispatch, services: { adService } }: EffectOpts) => {
  try {
    const { point, index } = getState().adBlock;
    const currentBlock = adService.getBlock(point, index);
    currentBlock.resumeAd();
  } catch (err) {
    logger.error('[playBlock]', err?.message);
  } finally {
    dispatch(
      sendEvent({
        type: 'PLAY_AD_BLOCK_RESOLVE',
      })
    );
  }
};
