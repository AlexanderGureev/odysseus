import express from 'express';
import FormData from 'form-data';
import { ExperimentsCfg } from 'services/ExperimentsService/types';

import { PlayerError } from '../../src/utils/errors';
import { logger } from '../../src/utils/logger';
import { HTTPResponseError, ReqInit, request } from '../../src/utils/request';
import { ApiResponse, ERROR, SkinClass, TBaseConfig, TConfig, TConfigSource, THydraResponse } from '../../types';
import { Channels } from '../../types/channel';
import { MediaFile } from '../../types/MediaFile';
import { MediascopeCounterResponse } from '../../types/MediascopeCounter';
import { SubscriptionTariffs } from '../../types/SubscriptionTariffs';
import { TrackInfoData } from '../../types/TrackInfo';
import { ResponseMany, ResponseOne, TrackMeta } from '../../types/TrackMeta';
import { UserSubscription } from '../../types/UserSubscription';
import { buildRequstByConfigSource, DATA_REQUEST_TIMEOUT, TParams } from '.';
import { RequestError } from './error';

type TOptions = ReqInit;

export const hydraRequest = async (partnerId: string, options: TOptions = {}) => {
  try {
    const response = await request.get(`${process.env.HYDRA_HOST}/features/player/${partnerId}`, {
      ...options,
    });

    if (!response.ok) throw new RequestError(response.statusText, response.status);

    const data: THydraResponse = await response.json();
    return data;
  } catch (err) {
    if (err instanceof HTTPResponseError) throw new RequestError(ERROR.HYDRA_UNAVAILABLE, err.status, err.message);
    throw err;
  }
};

export const configRequest = async <T>(
  req: express.Request<T>,
  configSource: TConfigSource,
  params: TParams,
  options: TOptions = {}
) => {
  try {
    const config = buildRequstByConfigSource(configSource, params);
    if (!config) throw new RequestError(ERROR.INVALID_CONFIG_SOURCE, 400, 'buildRequstByConfigSource failed');

    const xRef = req.get('X-Referer');
    const ref = req.get('Referer');
    const origin = req.get('Origin');
    const host = `${req.protocol}://${req.get('host')}`;
    const reqIp = '88.214.33.5'; //'88.214.33.5' 95.165.136.7

    const finallyRef = xRef ?? ref ?? origin ?? host;
    const userAgent = req.get('User-Agent');

    const headers = {
      'X-Real-Ip': reqIp,
      'X-Forwarded-For': reqIp,
      'User-Agent': userAgent,
      'X-Referer': finallyRef,
      Referer: finallyRef,
      ...options.headers,
    };

    const response = await request.get(config.url, {
      params: config.params,
      ...options,
      headers,
    });

    if (!response.ok) throw new RequestError(response.statusText, response.status);

    const { data }: ApiResponse<TBaseConfig> = await response.json();
    return data;
  } catch (err) {
    if (err instanceof HTTPResponseError) throw new RequestError(ERROR.SIREN_UNAVAILABLE, err.status, err.message);
    throw err;
  }
};

const TARRIFS_ENDPOINT_BY_THEME: { [key in SkinClass]?: string } = {
  [SkinClass.CTC]: `${process.env.CTC_BE_ENDPOINT}/api/subscription/v2/offers`,
  [SkinClass.MORE_TV]: `${process.env.BE_ENDPOINT}/web/Subscriptions/ServiceTariffs`,
};

export const serviceTariffsRequest = async (
  userToken: string | null | undefined,
  theme: SkinClass,
  options: TOptions = {}
) => {
  try {
    const endpoint = TARRIFS_ENDPOINT_BY_THEME[theme];
    if (!endpoint) return null;

    const headers = options.headers || {};
    if (userToken) headers.Authorization = `${theme === SkinClass.CTC ? '' : 'Bearer'} ${userToken}`;

    const response = await request.get(endpoint, {
      ...options,
      timeout: DATA_REQUEST_TIMEOUT,
      headers,
    });

    if (!response.ok) throw new RequestError(response.statusText, response.status);

    const { data }: ApiResponse<SubscriptionTariffs> = await response.json();
    return data;
  } catch (err) {
    logger.error('[serviceTariffsRequest]', err);

    if (err instanceof PlayerError) throw err;
    return null;
  }
};

const TRACK_INFO_ENDPOINT_BY_THEME: { [key in SkinClass]?: string } = {
  [SkinClass.MORE_TV]: `${process.env.BE_ENDPOINT}/web/trackInfo`,
};

export const trackInfoRequest = async (trackId: string, theme: SkinClass, options: TOptions = {}) => {
  try {
    const endpoint = TRACK_INFO_ENDPOINT_BY_THEME[theme];
    if (!endpoint) return null;

    const headers = options.headers || {};

    const response = await request.get(endpoint, {
      ...options,
      timeout: DATA_REQUEST_TIMEOUT,
      params: {
        hubId: trackId,
      },
      headers,
    });

    if (!response.ok) throw new RequestError(response.statusText, response.status);

    const { data }: ApiResponse<TrackInfoData> = await response.json();
    return data;
  } catch (err) {
    logger.error('[trackInfoRequest]', err);

    if (err instanceof PlayerError) throw err;
    return null;
  }
};

const SUBSCRIPTION_ENDPOINT_BY_THEME: { [key in SkinClass]?: string } = {
  [SkinClass.MORE_TV]: `${process.env.BE_ENDPOINT}/v2/web/Subscriptions`,
};

export const userSubscriptionRequest = async (
  userToken: string | null | undefined,
  theme: SkinClass,
  options: TOptions = {}
) => {
  try {
    const endpoint = SUBSCRIPTION_ENDPOINT_BY_THEME[theme];
    if (!endpoint || !userToken) return null;

    const headers = options.headers || {};
    headers.Authorization = `Bearer ${userToken}`;

    const response = await request.get(endpoint, {
      ...options,
      timeout: DATA_REQUEST_TIMEOUT,
      headers,
    });

    if (!response.ok) throw new RequestError(response.statusText, response.status);

    const { data }: ApiResponse<UserSubscription[]> = await response.json();
    return data;
  } catch (err) {
    logger.error('[userSubscriptionRequest]', err);

    if (err instanceof PlayerError) throw err;
    return null;
  }
};

export const mediascopeCounterRequest = async (serviceId: number | undefined, options: TOptions = {}) => {
  try {
    if (!serviceId) return null;

    const headers = options.headers || {};

    const response = await request.get(`${process.env.TURMS_ENDPOINT}/mediascope/counter/web/watching`, {
      ...options,
      params: {
        service_group_id: serviceId,
      },
      timeout: DATA_REQUEST_TIMEOUT,
      headers,
    });

    if (!response.ok) throw new RequestError(response.statusText, response.status);

    const data: MediascopeCounterResponse = await response.json();
    return data;
  } catch (err) {
    logger.error('[mediascopeCounterRequest]', err);

    if (err instanceof PlayerError) throw err;
    return null;
  }
};

export const getChannels = async (): Promise<Record<string, string> | null> => {
  try {
    const response = await request.get(`${process.env.BE_ENDPOINT}/web/channels`, {
      timeout: DATA_REQUEST_TIMEOUT,
    });

    if (!response.ok) throw new RequestError(response.statusText, response.status);

    const { data }: ApiResponse<Channels> = await response.json();
    return data.reduce((acc, { id, playerURI }) => ({ ...acc, [id]: playerURI }), {});
  } catch (err) {
    logger.error('[getChannels]', err);

    if (err instanceof PlayerError) throw err;
    return null;
  }
};

export const getInspectStreams = async (trackId: number): Promise<ResponseOne<MediaFile>> => {
  try {
    const response = await request.get(`${process.env.SIREN_HOST}/private/v1/tracks/${trackId}/stream_inspect`, {
      headers: {
        'X-Auth-Token': process.env.SIREN_API_TOKEN,
      },
    });

    if (!response.ok) throw new RequestError(response.statusText, response.status);

    const data = await response.json();
    return data;
  } catch (err) {
    throw {
      name: 'RequestError',
      status: err.status || 503,
      message: err?.message,
    };
  }
};

export const getTrackMeta = async (trackId: number): Promise<ResponseMany<TrackMeta>> => {
  try {
    const response = await request.get(`${process.env.MORPHEUS_ENDPOINT}/v1/private/tracks?pak_id=${trackId}`);
    if (!response.ok) throw new RequestError(response.statusText, response.status);

    const data = await response.json();
    return data;
  } catch (err) {
    throw {
      name: 'RequestError',
      status: err.status || 503,
      message: err?.message,
    };
  }
};

export const uploadScreenshotToPAK = async (endpoint: string, image: Buffer) => {
  const formData = new FormData();
  formData.append('screenshot[thumb]', image, { contentType: 'image/jpeg', filename: 'screenshot.jpg' });

  const response = await request.post(endpoint, {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    body: formData,
    headers: {
      ...formData.getHeaders(),
      'X-Auth-Token': process.env.PAK_API_TOKEN,
    },
  });

  const data = await response.json();
  return data;
};

export const fetchExperiments = async () => {
  try {
    const response = await request.get(`${process.env.HYDRA_HOST}/experiments/player`, {
      timeout: DATA_REQUEST_TIMEOUT,
    });

    if (!response.ok) throw new RequestError(response.statusText, response.status);

    const { data }: { data: ExperimentsCfg } = await response.json();
    return data;
  } catch (err) {
    logger.error('[fetchExperiments]', err);

    if (err instanceof PlayerError) throw err;
    return null;
  }
};

export const fetchMockConfig = async (trackId: string) => {
  try {
    const response = await request.get(`${process.env.HYDRA_HOST}/private/player/test_config/${trackId}`, {
      timeout: DATA_REQUEST_TIMEOUT,
    });

    if (!response.ok) throw new RequestError(response.statusText, response.status);

    const { data }: { data: TConfig } = await response.json();
    return data;
  } catch (err) {
    logger.error('[fetchMockConfig]', err);

    if (err instanceof PlayerError) throw err;
    return null;
  }
};
