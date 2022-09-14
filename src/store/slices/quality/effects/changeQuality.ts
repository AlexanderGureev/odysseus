import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';
import { ERROR_CODES } from 'types/errors';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';

export const changeQuality = async ({
  getState,
  dispatch,
  services: { qualityService, playerService },
}: EffectOpts) => {
  try {
    const {
      quality: { currentQualityMark, qualityRecord },
      root: { currentStream },
      playback: { currentTime, step },
    } = getState();

    const data = qualityRecord[currentQualityMark];
    if (!data || !currentStream) {
      throw new PlayerError(
        ERROR_CODES.UNKNOWN,
        `quality by ${currentQualityMark} not found or currentStream is undefined`
      );
    }

    if (qualityService.isRepresentationsSupport()) {
      await qualityService.setQuality(data, {
        currentStream,
      });
    } else {
      dispatch(sendEvent({ type: 'AUTO_PAUSE' }));

      await qualityService.setQuality(data, {
        currentStream,
      });

      const seekPromise = new Promise<void>((resolve) => {
        playerService.one('timeupdate', () => {
          dispatch(sendEvent({ type: 'SEEK', meta: { to: currentTime || 0 } }));
          resolve();
        });
      });

      dispatch(sendEvent({ type: 'AUTO_PLAY' }));
      await seekPromise;

      if (step === 'PAUSED') {
        dispatch(sendEvent({ type: 'AUTO_PAUSE' }));
      }
    }

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
