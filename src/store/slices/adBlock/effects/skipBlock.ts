import { EffectOpts } from 'interfaces';
import { logger } from 'utils/logger';

export const skipBlock = ({ getState, services: { adService } }: EffectOpts) => {
  try {
    const { adPoint, index } = getState().adBlock;
    const currentBlock = adService.getBlock(adPoint, index);
    currentBlock.skipAd();
  } catch (err) {
    logger.error('[skipBlock]', err?.message);
  }
};
