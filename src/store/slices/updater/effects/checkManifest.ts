import { fetchBaseConfig } from 'api';
import { EffectOpts } from 'interfaces';
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

export const checkManifest = async ({ getState, dispatch }: EffectOpts) => {
  try {
    const {
      root: { currentStream, params, meta, config },
    } = getState();

    if (isManifestExpired(currentStream)) {
      const { playlist } = await fetchBaseConfig(params, meta, config.features.config_source);
      const streams = playlist?.items?.[0]?.streams;
      if (!streams?.length) throw new PlayerError(ERROR_CODES.ERROR_INVALID_STREAMS);

      dispatch(
        sendEvent({
          type: 'UPDATE_MANIFEST',
          payload: {
            streams,
          },
        }),
        {
          currentSession: true,
        }
      );
    }

    dispatch(
      sendEvent({
        type: 'CHECK_MANIFEST_RESOLVE',
      })
    );
  } catch (err) {
    logger.error('[checkManifest]', err);

    const error = err instanceof PlayerError ? err : new PlayerError(ERROR_CODES.ERROR_NOT_AVAILABLE, err?.message);
    dispatch(
      sendEvent({
        type: 'CHECK_MANIFEST_REJECT',
        meta: {
          error: error.serialize(),
        },
      })
    );
  }
};
