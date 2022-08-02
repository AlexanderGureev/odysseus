import { EffectOpts } from 'interfaces';
import { isIOS, isSafari } from 'react-device-detect';
import { createSource } from 'services/StreamService/utils';
import { sendEvent } from 'store';
import { ERROR_CODES } from 'types/errors';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';

export const loadMeta = async ({ getState, dispatch, services: { playerService } }: EffectOpts) => {
  try {
    const {
      root: { currentStream },
      quality: { currentURL },
    } = getState();

    if (!currentStream || !currentURL) {
      throw new PlayerError(ERROR_CODES.UNKNOWN, 'currentStream or manifestData is undefined');
    }

    const source = createSource({ ...currentStream, url: currentURL });
    logger.log('[loadMeta]', { source });

    await playerService.setSource(source);

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
