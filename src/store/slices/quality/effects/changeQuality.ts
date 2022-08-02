import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';
import { ERROR_CODES } from 'types/errors';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';

export const changeQuality = async ({ getState, dispatch, services: { qualityService } }: EffectOpts) => {
  try {
    const {
      quality: { currentQualityMark, qualityRecord },
      root: { currentStream },
      playback: { currentTime },
    } = getState();

    const data = qualityRecord[currentQualityMark];
    if (!data || !currentStream) {
      throw new PlayerError(
        ERROR_CODES.UNKNOWN,
        `quality by ${currentQualityMark} not found or currentStream is undefined`
      );
    }

    await qualityService.setQuality(data, {
      currentStream,
      currentTime: currentTime || 0,
    });

    dispatch(
      sendEvent({
        type: 'QUALITY_CHANGE_RESOLVE',
      })
    );
  } catch (err) {
    logger.error('[quality init]', err?.message);

    const error =
      err instanceof PlayerError ? err : new PlayerError(ERROR_CODES.ERROR_DATA_LOADING, 'changeQuality error');

    dispatch(
      sendEvent({
        type: 'QUALITY_CHANGE_REJECT',
        meta: {
          error: error.serialize(),
        },
      })
    );
  }
};
