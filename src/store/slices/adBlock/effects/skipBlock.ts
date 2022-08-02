import { EffectOpts } from 'interfaces';
import { logger } from 'utils/logger';

export const skipBlock = ({ getState, services: { adService } }: EffectOpts) => {
  try {
    const { point, index } = getState().adBlock;
    const currentBlock = adService.getBlock(point, index);
    currentBlock.skipAd();
  } catch (err) {
    logger.error('[skipBlock]', err?.message);
  }
};
