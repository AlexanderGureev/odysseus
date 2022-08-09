import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store';
import { ERROR_CODES } from 'types/errors';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';

export const selectSource = ({ dispatch, services: { streamService } }: EffectOpts) => {
  try {
    const stream = streamService.getStream();
    if (!stream) throw new Error('stream is undefined');

    dispatch(
      sendEvent({
        type: 'SELECT_SOURCE_RESOLVE',
        payload: { currentStream: stream },
      })
    );
  } catch (err) {
    logger.error('[selectSource]', err);

    dispatch(
      sendEvent({
        type: 'SELECT_SOURCE_ERROR',
        meta: {
          error: new PlayerError(ERROR_CODES.ERROR_SRC_NOT_SUPPORTED, err?.message).serialize(),
        },
      })
    );
  }
};
