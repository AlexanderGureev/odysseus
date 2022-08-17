/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { EffectOpts } from 'interfaces';
import { LS_KEY_STREAM, THistoryStreams } from 'services/StreamService/types';
import { sendEvent } from 'store/actions';
import { getSources } from 'store/selectors';
import { ERROR_CODES } from 'types/errors';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';

export const initServices = async (opts: EffectOpts) => {
  const {
    getState,
    dispatch,
    services: { streamService, localStorageService, playerService },
  } = opts;

  try {
    const { capabilities, previews } = getState().root;

    const state = getState();

    const history = localStorageService.getItem<THistoryStreams>(LS_KEY_STREAM) || [];
    playerService.one('play', () => {
      const { currentStream } = getState().root;
      if (!currentStream) return;

      const uniqKeys = new Set(history);
      uniqKeys.add(streamService.createKey(currentStream));
      localStorageService.setItem(LS_KEY_STREAM, [...uniqKeys]);
    });

    const sources = previews || getSources(state) || [];

    await Promise.all([streamService.init(sources, capabilities, history)]);

    dispatch(
      sendEvent({
        type: 'INIT_SERVICES_RESOLVE',
      })
    );
  } catch (err) {
    logger.error('[initServices]', err);

    dispatch(
      sendEvent({
        type: 'INIT_SERVICES_REJECT',
        meta: {
          error: new PlayerError(ERROR_CODES.ERROR_NOT_AVAILABLE, err?.message).serialize(),
        },
      })
    );
  }
};
