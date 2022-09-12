import { EffectOpts } from 'interfaces';
import platform from 'platform';
import { browserVersion, engineName, engineVersion, isMobile, isSafari, osName, osVersion } from 'react-device-detect';
import { createParamsSelector } from 'services/HorusService/selectors';
import { APP_DB_NAME, CollectionName, Indexes } from 'services/IDBService/types';
import { sendEvent } from 'store/actions';
import { featuresSelector } from 'store/selectors';
import { ERROR_CODES } from 'types/errors';
import { on } from 'utils';
import { debounce } from 'utils/debounce';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';
import { randomHash12 } from 'utils/randomHash';
import { request } from 'utils/request';

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
    isSafari,
    brand: platform.manufacturer,
    name: platform.name,
    engineName,
    engineVersion,
    browserVersion,
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
        keyPath: 'id',
        indexes: [
          {
            name: Indexes.BY_STATUS,
            field: 'status',
          },
        ],
      },
      {
        name: CollectionName.FAVOURITES,
        keyPath: 'id',
        indexes: [
          {
            name: Indexes.BY_PROJECT_ID,
            field: 'id',
          },
          {
            name: Indexes.BY_IS_STORED_IN_GONDWANA,
            field: 'isStoredInGondwana',
          },
        ],
      },
    ]);

    await windowService.init();
  } catch (err) {
    logger.error('[IDBService]', 'connect failed', err?.message);
  }
};

const registerListeners = ({ dispatch }: EffectOpts) => {
  on(window, 'beforeunload', () => {
    dispatch(sendEvent({ type: 'BEFORE_UNLOAD' }));
  });

  on(
    window,
    'resize',
    debounce(() => {
      dispatch(sendEvent({ type: 'RESIZE' }));
    }, 300)
  );
};

const setupRequest = () => {
  request.addHook('beforeResponse', async (response) => {
    if (response.status === 403) {
      const text = await response.text();

      if (text.toLowerCase().includes('access to resource was blocked')) {
        throw new PlayerError(ERROR_CODES.WAF_ERROR);
      }
    }

    if (response.status === 429) {
      throw new PlayerError(ERROR_CODES.NETWORK_TIMEOUT_ERROR);
    }

    if (response.status === 451) {
      throw new PlayerError(ERROR_CODES.STORMWALL_GEOBLOCK_ERROR);
    }
  });
};

export const initialize = async (opts: EffectOpts) => {
  const {
    getState,
    dispatch,
    services: { embeddedCheckService, sauronService, horusService, localStorageService, favouritesService, dbService },
  } = opts;

  try {
    await createAppDatabase(opts);
    registerListeners(opts);
    setupRequest();

    const [isEmbedded] = await Promise.all([
      embeddedCheckService.getEmbededStatus(),
      sauronService.init(),
      favouritesService.init(dbService, {
        getToken: () => getState().root.meta.userToken,
      }),
    ]);

    const { hostname } = embeddedCheckService.getState();
    const { HORUS_ENABLED = false } = featuresSelector(isEmbedded);

    await horusService.init({
      paramsSelector: createParamsSelector(opts),
      isEnabled: HORUS_ENABLED,
    });

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
