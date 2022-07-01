import { EffectOpts } from 'interfaces';
import { APP_DB_NAME, CollectionName, Indexes } from 'services/IDBService/types';
import { sendEvent } from 'store/actions';
import { ERROR_ITEM_MAP, ERROR_TYPE } from 'types/errors';
import { logger } from 'utils/logger';
import { randomHash12 } from 'utils/randomHash';

const createAppDatabase = async ({ services: { dbService, windowService } }: EffectOpts) => {
  try {
    await dbService.connect(APP_DB_NAME, [
      {
        name: CollectionName.MASTER_WINDOW,
        keyPath: 'key',
      },
      {
        name: CollectionName.EVENTS,
        keyPath: 'timestamp',
        indexes: [
          {
            name: Indexes.BY_STATUS,
            field: 'status',
          },
        ],
      },
    ]);

    await windowService.init();
  } catch (err) {
    logger.error('[IDBService]', 'connect failed', err?.message);
  }
};

export const initialize = async (opts: EffectOpts) => {
  const {
    dispatch,
    services: { embeddedCheckService },
  } = opts;

  try {
    const [isEmbedded] = await Promise.all([embeddedCheckService.getEmbededStatus(), createAppDatabase(opts)]);

    const payload = {
      meta: {
        isEmbedded,
        partnerId: null,
        skin: null,
        trackId: null,
      },
      session: {
        id: '',
        videosession_id: randomHash12(),
      },
    };

    dispatch(
      sendEvent({
        type: 'INIT_RESOLVE',
        payload,
      })
    );
  } catch (err) {
    dispatch(
      sendEvent({
        type: 'INIT_REJECT',
        payload: {
          error: {
            ...ERROR_ITEM_MAP[ERROR_TYPE.NOT_AVAILABLE],
            details: err?.message,
          },
        },
      })
    );
  }
};
