import { EffectOpts } from 'interfaces';
import { getPlaylistItem } from 'store/selectors';

export const clickSubscribeButton = ({ getState, services: { utmService } }: EffectOpts) => {
  const {
    root: {
      meta: { isEmbedded, trackId },
      config,
    },
  } = getState();

  const item = getPlaylistItem(getState());

  if (isEmbedded && item.sharing_url) {
    const queryParams = utmService
      .buildUTMQueryParams({
        term: 'subscribe_cta',
        trackId,
        skinId: config.config.skin_id,
      })
      .toString();

    window?.open(`${item.sharing_url}?${queryParams}`, '_blank');
  }
};
