import { Meta, TrackParams } from 'store/slices/root';
import { ConfigErrors, TBaseConfig, TConfig, TConfigSource } from 'types';
import { ERROR_CODES } from 'types/errors';
import { isNil } from 'utils';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';
import { request } from 'utils/request';

export const fetchBaseConfig = async (params: TrackParams, meta: Meta, source: TConfigSource) => {
  const { sign, pf, pt } = params;
  const { partnerId, trackId, userToken } = meta;

  const queryObj: Record<string, any> = { sign, pf, pt, config_source: source };
  const queryParams = new URLSearchParams();
  Object.keys(queryObj).forEach((key) => {
    if (!isNil(queryObj[key])) queryParams.set(key, queryObj[key]);
  });

  const url = `/manifest/${partnerId}/${trackId}` + (userToken ? `/${userToken}` : '');
  const query = queryParams.toString();
  const target = url + (query ? `?${query}` : '');

  const response = await request.get(target);
  if (response.status !== 200) {
    const [error]: ConfigErrors = await response.json();
    throw new PlayerError(error.code, error.details);
  }

  const data: TBaseConfig = await response.json();
  return data;
};

const BASE_CONFIG_PATH = '/config';

export const fetchConfig = async (sirenURL: string, outerHost: string | null) => {
  try {
    logger.log('[fetchConfig]', { sirenURL, outerHost });

    const target = `${BASE_CONFIG_PATH}/${window.btoa(encodeURIComponent(sirenURL))}`;
    const currentHost = new URL(outerHost ? outerHost : window.location.href);
    const referrer = currentHost.protocol + '//' + currentHost.hostname;

    const response = await request.get(target, {
      headers: { 'X-Referer': referrer },
    });

    if (response.status !== 200) {
      const [error]: ConfigErrors = await response.json();
      throw new PlayerError(error.code, error.details);
    }

    const data: Omit<TConfig, 'mediascopeCounter'> = await response.json();
    if (!data) throw new Error('config is undefined');

    if (data.playlist?.items[0]?.errors?.length) {
      const [error] = data.playlist.items[0].errors;
      throw new PlayerError(error.code, error.details);
    }

    return data;
  } catch (err) {
    logger.error('[fetchConfig]', err);
    throw new PlayerError(err.code || ERROR_CODES.ERROR_NOT_AVAILABLE, err?.message);
  }
};
