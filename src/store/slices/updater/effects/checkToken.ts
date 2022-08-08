import { fetchConfig } from 'api';
import { EffectOpts } from 'interfaces';
import { STORAGE_SETTINGS } from 'services/LocalStorageService/types';
import { sendEvent } from 'store';
import { ERROR_CODES } from 'types/errors';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';
import { sleep } from 'utils/retryUtils';
import { getTokenExpiredTime } from 'utils/token';

import { TokenUpdateResponse } from '../types';

const isTokenExpired = (tokenExpiredAt: number) => Date.now() > tokenExpiredAt;

const TOKEN_REQUEST_TIMEOUT = 5000;

// window.postMessage(
//   {
//     event: 'updateConfig',
//     data: {
//       config_url:
//         'https://siren.preprod.more.tv/player/config?track_id=19567&partner_id=1677&user_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOjUwMDE4NjM5LCJpYXQiOjE2NTk0NTIyMzcsImV4cCI6MTY1OTQ2MzAzNywicGN0IjoxNjExMTQ0MDgwLjI3NDMxMywicHJvdmlkZXJfaWQiOjEsInByb3ZpZGVyX25hbWUiOiJQYXNzd29yZCIsImFub255bW91cyI6ZmFsc2V9.t4XrpWV0O0wWawZpXKZ9kZ0ACc0UoQz75fyWBx9U3eq1qEbDNereCFF2QE9p9jLfXXlY7Of0Aq48JvhI1YyQEw&userId=50018639',
//       action: 'token_update',
//     },
//   },
//   '*'
// );

const updateToken = async ({
  postMessageService,
  embeddedCheckService,
  localStorageService,
}: EffectOpts['services']): Promise<TokenUpdateResponse> => {
  const { url, token } = await new Promise<{ url: string; token: string }>((resolve, reject) => {
    postMessageService.one('updateConfig', ({ data: { config_url, action } }) => {
      try {
        if (action === 'token_update') {
          const url = new URL(config_url);
          const token = url.searchParams.get('user_token');
          if (token) resolve({ url: config_url, token });
          else reject(new Error('user_token is undefined'));
        }
      } catch (err) {
        reject(err);
      }
    });

    postMessageService.emit('token_expired');
    sleep(TOKEN_REQUEST_TIMEOUT).then(() => reject(new Error('timeout expired')));
  });

  const { location } = await embeddedCheckService.getIframeLocation();
  const data = await fetchConfig(url, location);

  const linked_tracks = data?.playlist?.items?.[0]?.linked_tracks || {
    next: null,
    previous: null,
  };

  localStorageService.setItemByDomain(STORAGE_SETTINGS.USER_TOKEN, token);

  return {
    linked_tracks,
    tokenExpiredAt: getTokenExpiredTime(token),
    userToken: token,
  };
};

export const checkToken = async ({ getState, dispatch, services }: EffectOpts) => {
  try {
    const {
      root: { meta, features },
    } = getState();

    if (meta.isEmbedded || !meta.tokenExpiredAt || !features.TOKEN_UPDATE || !isTokenExpired(meta.tokenExpiredAt)) {
      dispatch(
        sendEvent({
          type: 'CHECK_TOKEN_RESOLVE',
        })
      );
      return;
    }

    const payload = await updateToken(services);

    dispatch(
      sendEvent({
        type: 'UPDATE_TOKEN',
        payload,
      }),
      {
        currentSession: true,
      }
    );
  } catch (err) {
    logger.error('[checkToken]', err);

    const error = err instanceof PlayerError ? err : new PlayerError(ERROR_CODES.ERROR_DATA_LOADING, err?.message);

    dispatch(
      sendEvent({
        type: 'CHECK_TOKEN_REJECT',
        meta: {
          error: error.serialize(),
        },
      })
    );
  }
};
