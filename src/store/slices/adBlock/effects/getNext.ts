/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';

export const getNext = ({ getState, dispatch, services: { adService, embeddedCheckService } }: EffectOpts) => {
  const {
    adBlock: { links, adPoint, limit, index, isExclusive, isPromo },
    root: {
      meta,
      session,
      deviceInfo,
      config: {
        config: { puid12, user_id },
      },
    },
  } = getState();

  let currentLinks = links;
  const idx = index + 1;

  if (idx < limit && !isPromo) {
    const preloadedBlock = adService.getBlock(adPoint, idx);
    if (preloadedBlock) currentLinks = preloadedBlock.getLinks();
    else {
      adService.createBlock(currentLinks, {
        config: adPoint,
        index: idx,
        limit,
        isPromo: isExclusive,
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
    }

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
        meta: adPoint,
      })
    );
  }
};
