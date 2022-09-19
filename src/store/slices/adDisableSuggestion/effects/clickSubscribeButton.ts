import { EffectOpts } from 'interfaces';
import { Params } from 'services/UTMService/types';
import { getPlaylistItem } from 'store/selectors';

export const clickSubscribeButton = (
  { getState, services: { utmService } }: EffectOpts,
  params: Partial<Params> = {}
) => {
  const {
    root: {
      meta: { isEmbedded, trackId },
      config,
      features: { PAYWALL_NO_ADS_PATH },
    },
    experiments: {
      player: { experiments },
    },
  } = getState();

  const item = getPlaylistItem(getState());

  if (isEmbedded && item.sharing_url) {
    const { origin } = new URL(item.sharing_url);
    const target =
      experiments.EXP_ACTI_73 === 'test' && PAYWALL_NO_ADS_PATH ? `${origin}${PAYWALL_NO_ADS_PATH}` : item.sharing_url;

    const queryParams = utmService
      .buildUTMQueryParams({
        term: 'subscribe_cta',
        trackId,
        skinId: config.config.skin_id,
        ...params,
      })
      .toString();

    window?.open(`${target}?${queryParams}`, '_blank');
  }
};
