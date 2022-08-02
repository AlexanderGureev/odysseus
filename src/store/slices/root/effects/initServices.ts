/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { EffectOpts } from 'interfaces';
import { LS_KEY_STREAM, THistoryStreams } from 'services/StreamService/types';
import { sendEvent } from 'store/actions';
import { getPlaylistItem, getSources } from 'store/selectors';
import { ERROR_CODES } from 'types/errors';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';

export const initServices = async (opts: EffectOpts) => {
  const {
    getState,
    dispatch,
    services: { beholderService, streamService, localStorageService },
  } = opts;

  try {
    const { meta, config, features, capabilities, previews } = getState().root;

    const state = getState();
    const data = getPlaylistItem(state);

    const history = localStorageService.getItem<THistoryStreams>(LS_KEY_STREAM) || [];
    const sources = previews || getSources(state) || [];

    await Promise.all([
      streamService.init(sources, capabilities, history),
      beholderService.init({
        duration: data.duration,
        seasonName: data.season_name,
        trackId: data.track_id,
        projectId: config.config.project_id,
        scrobbling: config.config.scrobbling,
        userId: config.config.user_id,
        userToken: meta.userToken,
        serviceDisabled: Boolean(features.DISABLE_BEHOLDER),
      }),
    ]);

    dispatch(
      sendEvent({
        type: 'INIT_SERVICES_RESOLVE',
      })
    );
  } catch (err) {
    logger.error('[initServices]', err);

    dispatch(
      sendEvent({
        type: 'INIT_SERVICES_REJECT',
        meta: {
          error: new PlayerError(ERROR_CODES.ERROR_NOT_AVAILABLE, err?.message).serialize(),
        },
      })
    );
  }
};
