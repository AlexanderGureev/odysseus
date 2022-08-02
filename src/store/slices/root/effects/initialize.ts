import { EffectOpts } from 'interfaces';
import platform from 'platform';
import { engineName, engineVersion, isMobile, osName, osVersion } from 'react-device-detect';
import { APP_DB_NAME, CollectionName, Indexes } from 'services/IDBService/types';
import { sendEvent } from 'store/actions';
import { ERROR_CODES } from 'types/errors';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';
import { randomHash12 } from 'utils/randomHash';

import { DeviceInfo, DeviceType, OS } from '../types';

export const getDeviceInfo = (): DeviceInfo => {
  const types: Record<string, DeviceType> = {
    [OS.IOS]: DeviceType.WEB_IOS,
    [OS.ANDROID]: DeviceType.ANDROID,
    [OS.WIN_PHONE]: DeviceType.WIN_PHONE,
  };

  const model = platform.product && platform.version ? `${platform.product}, ${platform.version}` : undefined;

  return {
    browser: `${platform.name}, ${platform.version}`,
    browserDescription: platform.description,
    deviceModel: model,
    osName,
    osVersion,
    deviceType: isMobile ? types[`${platform.os?.family}`] || DeviceType.MOBILE_UNKNOWN : DeviceType.WEB_DESKTOP,
    isMobile,
    brand: platform.manufacturer,
    name: platform.name,
    engineName,
    engineVersion,
  };
};

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
    services: {
      embeddedCheckService,
      sauronService,
      postMessageService,
      horusService,
      youboraService,
      localStorageService,
    },
  } = opts;

  try {
    await createAppDatabase(opts);

    const [isEmbedded] = await Promise.all([
      embeddedCheckService.getEmbededStatus(),
      postMessageService.init(),
      sauronService.init(),
      horusService.init(),
      youboraService.init(),
    ]);

    const { hostname } = embeddedCheckService.getState();

    localStorageService.init(hostname);

    const payload = {
      meta: {
        isEmbedded,
        partnerId: null,
        skin: null,
        trackId: null,
        userToken: null,
        tokenExpiredAt: null,
        parentHost: hostname,
      },
      session: {
        id: '',
        videosession_id: randomHash12(),
        sid: sauronService.getSauronId(),
      },
      deviceInfo: getDeviceInfo(),
    };

    dispatch(
      sendEvent({
        type: 'INIT_RESOLVE',
        payload,
      })
    );
  } catch (err) {
    logger.error('[initialize]', err);

    dispatch(
      sendEvent({
        type: 'INIT_REJECT',
        meta: {
          error: new PlayerError(ERROR_CODES.ERROR_NOT_AVAILABLE, err?.message).serialize(),
        },
      })
    );
  }
};
