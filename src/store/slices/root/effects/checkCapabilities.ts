import { EffectOpts } from 'interfaces';
import { getCapabilities } from 'services/StreamService/utils/supports';
import { sendEvent } from 'store';
import { ERROR_CODES } from 'types/errors';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';

export const checkCapabilities = async ({ dispatch }: EffectOpts) => {
  try {
    const capabilities = await getCapabilities();
    if (!capabilities.length) throw new Error('capabilities is empty');

    dispatch(
      sendEvent({
        type: 'CHECK_CAPABILITIES_RESOLVE',
        payload: { capabilities },
      })
    );
  } catch (err) {
    logger.error('[checkCapabilities]', err);

    dispatch(
      sendEvent({
        type: 'CHECK_CAPABILITIES_REJECT',
        meta: {
          error: new PlayerError(ERROR_CODES.ERROR_SRC_NOT_SUPPORTED, err?.message).serialize(),
        },
      })
    );
  }
};
