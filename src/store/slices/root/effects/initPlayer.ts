import { EffectOpts } from 'interfaces';
import { DEFAULT_PLAYER_ID } from 'services/PlayerService/types';
import { sendEvent } from 'store/actions';
import { ERROR_CODES } from 'types/errors';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';

export const initPlayer = async (opts: EffectOpts) => {
  const {
    dispatch,
    services: { playerService },
  } = opts;

  try {
    await playerService.init(DEFAULT_PLAYER_ID, {});

    dispatch(
      sendEvent({
        type: 'PLAYER_INIT_RESOLVE',
      })
    );
  } catch (err) {
    logger.error('[initPlayer]', err);

    dispatch(
      sendEvent({
        type: 'PLAYER_INIT_REJECT',
        meta: {
          error: new PlayerError(ERROR_CODES.ERROR_NOT_AVAILABLE, err?.message).serialize(),
        },
      })
    );
  }
};
