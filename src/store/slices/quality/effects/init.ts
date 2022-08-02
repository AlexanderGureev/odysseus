import { EffectOpts } from 'interfaces';
import { isIOS, isSafari } from 'react-device-detect';
import { sendEvent } from 'store/actions';
import { ERROR_CODES } from 'types/errors';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';

export const init = ({ getState, dispatch, services: { qualityService } }: EffectOpts) => {
  try {
    const { manifestData, currentStream } = getState().root;

    if (!manifestData || !currentStream)
      throw new PlayerError(ERROR_CODES.UNKNOWN, 'manifestData or currentStream is undefined');

    const { qualityRecord, currentQualityMark, qualityList } = qualityService.init({
      playlist: manifestData.parsedManifest.playlists,
      url: manifestData.url,
    });

    const currentURL = isSafari || isIOS ? qualityRecord[currentQualityMark]?.uri : manifestData.url;
    if (!currentURL) throw new PlayerError(ERROR_CODES.UNKNOWN, `url by quality ${currentQualityMark} not found`);

    dispatch(
      sendEvent({
        type: 'QUALITY_INITIALIZATION_RESOLVE',
        payload: {
          qualityRecord,
          currentQualityMark,
          qualityList,
          currentURL,
        },
      })
    );
  } catch (err) {
    logger.error('[quality init]', err?.message);

    dispatch(
      sendEvent({
        type: 'QUALITY_INITIALIZATION_REJECT',
        meta: {
          error: err,
        },
      })
    );
  }
};
