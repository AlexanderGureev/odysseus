/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { PLAYER_ID } from 'components/Player/types';
import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';
import { getPlaylistItem } from 'store/selectors';
import { ERROR_CODES } from 'types/errors';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';

export const initAnalytics = async (opts: EffectOpts) => {
  const {
    getState,
    dispatch,
    services: {
      ymService,
      gaService,
      amberdataService,
      vigoService,
      tnsCounter,
      demonService,
      embeddedCheckService,
      mediascopeCounter,
    },
  } = opts;

  try {
    const { session, deviceInfo, meta, config, adConfig, features } = getState().root;

    const data = getPlaylistItem(getState());

    await Promise.all([
      embeddedCheckService.getIframeLocation(),
      demonService.init({
        configLoadingTime: 0,
        projectId: config.config.project_id,
        referrer: config.config.ref,
        sid: session.sid,
        skinId: config.config.skin_id,
        statURL: config.config.stat_url,
        transactionId: data.transaction_id,
        userId: config.config.user_id,
        trackId: data.track_id,
      }),
      vigoService.init({
        playerId: PLAYER_ID,
        sid: session.sid!,
        skinName: meta.skin!,
      }),
      ymService.init({
        videosession_id: session.videosession_id,
        user_id: config.config.user_id,
        sid: session.sid,
      }),
      tnsCounter.init(data.heartbeat_tns_counter_v1_3, data.tns_counter, deviceInfo),
      gaService.init(),
      amberdataService.init({
        paid: !Object.keys(adConfig || {}).length,
        adFoxPartner: meta.isEmbedded ? config.config.puid12?.embed : config.config.puid12?.site,
        adFoxSeason: data.adfox_season_id,
        isEmbedded: meta.isEmbedded,
        partnerId: meta.partnerId!,
        skinName: meta.skin!,
        params: {
          partnerId: meta.partnerId!,
          projectId: config.config.project_id,
          sid: session.sid,
          skinId: config.config.skin_id,
          videoId: data.track_id,
          videosessionId: session.videosession_id,
          userId: config.config.user_id,
        },
        referrer: config.config.ref,
      }),
      mediascopeCounter.init({
        isEnabled: Boolean(features.MEDIASCOPE_WATCHING_COUNTER),
        params: config.mediascopeCounter?.mediascope_counter_watching || null,
      }),
    ]);

    dispatch(
      sendEvent({
        type: 'INIT_ANALYTICS_RESOLVE',
      })
    );
  } catch (err) {
    logger.error('[initAnalytics]', err);

    dispatch(
      sendEvent({
        type: 'INIT_ANALYTICS_REJECT',
        meta: {
          error: new PlayerError(ERROR_CODES.ERROR_NOT_AVAILABLE, err?.message).serialize(),
        },
      })
    );
  }
};
