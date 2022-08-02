import { EffectOpts } from 'interfaces';
import { isIOS, isSafari } from 'react-device-detect';
import { createSource } from 'services/StreamService/utils';
import { sendEvent } from 'store';
import { TStreamItem } from 'types';
import { ERROR_CODES } from 'types/errors';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';

const isManifestExpired = (currentStream: TStreamItem | null) => {
  return (
    currentStream &&
    typeof currentStream.manifest_expires_at === 'number' &&
    currentStream.manifest_expires_at < Date.now() / 1000
  );
};

export const checkManifest = async ({ getState, dispatch, services: { playerService } }: EffectOpts) => {
  try {
    const {
      root: { currentStream },
      quality: { currentURL },
    } = getState();

    if (!isManifestExpired(currentStream)) {
      return dispatch(
        sendEvent({
          type: 'CHECK_MANIFEST_RESOLVE',
        })
      );
    }

    dispatch(
      sendEvent({
        type: 'LOAD_META_RESOLVE',
      })
    );
  } catch (err) {
    logger.error('[loadMeta]', err);

    dispatch(
      sendEvent({
        type: 'LOAD_META_REJECT',
        meta: {
          error: new PlayerError(ERROR_CODES.UNKNOWN, err?.message).serialize(),
        },
      })
    );
  }
};
