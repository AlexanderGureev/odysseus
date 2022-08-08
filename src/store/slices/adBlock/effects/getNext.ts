/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';

export const getNext = ({ getState, dispatch, services: { adService } }: EffectOpts) => {
  const { links, point, limit, index, isExclusive, isPromo } = getState().adBlock;

  let currentLinks = links;
  const idx = index + 1;

  if (idx < 1 && !isPromo) {
    const preloadedBlock = adService.getBlock(point, idx);
    if (preloadedBlock) currentLinks = preloadedBlock.getLinks();
    else {
      adService.createBlock(currentLinks, {
        config: point,
        index: idx,
        limit,
        isPromo: isExclusive,
      });
    }

    // limit
    dispatch(
      sendEvent({
        type: 'PLAY_NEXT_BLOCK',
        payload: {
          index: idx,
          links: currentLinks,
          skippable: false,
          isVolumeAvailable: false,
        },
      })
    );
  } else {
    dispatch(
      sendEvent({
        type: 'AD_BREAK_END',
        meta: point,
      })
    );
  }
};
