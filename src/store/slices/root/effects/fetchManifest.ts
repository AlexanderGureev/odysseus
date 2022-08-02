import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';
import { ERROR_CODES } from 'types/errors';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';

export const fetchManifest = async (opts: EffectOpts) => {
  const {
    getState,
    dispatch,
    services: { manifestService },
  } = opts;

  try {
    const {
      currentStream,
      features,
      deviceInfo: { isMobile },
    } = getState().root;
    if (!currentStream?.url) throw new PlayerError(ERROR_CODES.UNKNOWN, 'currentStream is undefined');

    const url = features.LIMIT_QUALITY && isMobile ? currentStream.url.replace(/hd40,/i, '') : currentStream.url;
    const manifestData = await manifestService.fetchManifest({ ...currentStream, url });

    dispatch(
      sendEvent({
        type: 'FETCHING_MANIFEST_RESOLVE',
        payload: {
          manifestData,
        },
      })
    );
  } catch (err) {
    logger.error('[initPlayer]', err);

    dispatch(
      sendEvent({
        type: 'FETCHING_MANIFEST_REJECT',
        meta: {
          error: err,
        },
      })
    );
  }
};
