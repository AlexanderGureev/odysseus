import axios, { AxiosRequestConfig, AxiosRequestHeaders } from 'axios';
import express from 'express';
import { MediascopeCounterResponse } from 'types/MediascopeCounter';
import { TrackInfoData } from 'types/TrackInfo';
import { UserSubscription } from 'types/UserSubscription';

import { ApiResponse, SkinClass, TBaseConfig, TConfigSource, THydraResponse } from '../../types';
import { SubscriptionTariffs } from '../../types/SubscriptionTariffs';
import { IS_DEV } from '../server';
import { buildRequstByConfigSource, DATA_REQUEST_TIMEOUT, TParams } from '.';

type TOptions = AxiosRequestConfig;

export const hydraRequest = async (partnerId: string, options: TOptions = {}) => {
  try {
    const { data } = await axios.get<THydraResponse>(`${process.env.HYDRA_HOST}/features/player/${partnerId}`, {
      ...options,
    });
    return data;
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const configRequest = async (
  req: express.Request,
  configSource: TConfigSource,
  params: TParams,
  options: TOptions = {}
) => {
  try {
    const config = buildRequstByConfigSource(configSource, params);
    if (!config) return null;

    const xRef = req.get('X-Referer');
    const ref = req.get('Referer');
    const origin = req.get('Origin');
    const host = `${req.protocol}://${req.get('host')}`;
    const reqIp = IS_DEV ? '88.214.33.5' : req.clientIp; //'88.214.33.5' 95.165.136.7

    const finallyRef = xRef ?? ref ?? origin ?? host;
    const userAgent = req.get('User-Agent');

    if (reqIp) axios.defaults.headers.common.CLIENT_IP = reqIp;

    const headers = {
      'X-Real-Ip': reqIp,
      'X-Forwarded-For': reqIp,
      'User-Agent': userAgent,
      'X-Referer': finallyRef,
      Referer: finallyRef,
      ...options.headers,
    } as AxiosRequestHeaders;

    const { data } = await axios.get<ApiResponse<TBaseConfig>>(config.url, {
      params: config.params,
      ...options,
      headers,
    });
    return data;
  } catch (err) {
    console.error(err);
    return null;
  }
};

const TARRIFS_ENDPOINT_BY_THEME: { [key in SkinClass]?: string } = {
  [SkinClass.CTC]: `${process.env.CTC_BE_ENDPOINT}/api/subscription/v2/offers`,
  [SkinClass.MORE_TV]: `${process.env.BE_ENDPOINT}/web/Subscriptions/ServiceTariffs`,
};

export const serviceTariffsRequest = async (
  userToken: string | undefined,
  theme: SkinClass,
  options: TOptions = {}
) => {
  try {
    const endpoint = TARRIFS_ENDPOINT_BY_THEME[theme];
    if (!endpoint) return null;

    const headers = options.headers || {};
    if (userToken) headers.Authorization = `${theme === SkinClass.CTC ? '' : 'Bearer'} ${userToken}`;

    const { data } = await axios.get<ApiResponse<SubscriptionTariffs>>(endpoint, {
      ...options,
      timeout: DATA_REQUEST_TIMEOUT,
      headers,
    });

    return data;
  } catch (e) {
    console.error(e);
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

    const { data } = await axios.get<ApiResponse<TrackInfoData>>(endpoint, {
      ...options,
      timeout: DATA_REQUEST_TIMEOUT,
      params: {
        hubId: trackId,
      },
      headers,
    });

    return data;
  } catch (e) {
    console.error(e);
    return null;
  }
};

const SUBSCRIPTION_ENDPOINT_BY_THEME: { [key in SkinClass]?: string } = {
  [SkinClass.MORE_TV]: `${process.env.BE_ENDPOINT}/v2/web/Subscriptions`,
};

export const userSubscriptionRequest = async (
  userToken: string | undefined,
  theme: SkinClass,
  options: TOptions = {}
) => {
  try {
    const endpoint = SUBSCRIPTION_ENDPOINT_BY_THEME[theme];
    if (!endpoint || !userToken) return null;

    const headers = options.headers || {};
    headers.Authorization = `Bearer ${userToken}`;

    const { data } = await axios.get<ApiResponse<UserSubscription[]>>(endpoint, {
      ...options,
      timeout: DATA_REQUEST_TIMEOUT,
      headers,
    });

    return data;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const mediascopeCounterRequest = async (serviceId: number | undefined, options: TOptions = {}) => {
  try {
    if (!serviceId) return null;

    const headers = options.headers || {};

    const { data } = await axios.get<MediascopeCounterResponse>(
      `${process.env.TURMS_ENDPOINT}/mediascope/counter/web/watching`,
      {
        ...options,
        params: {
          service_group_id: serviceId,
        },
        timeout: DATA_REQUEST_TIMEOUT,
        headers,
      }
    );

    return data;
  } catch (e) {
    console.error(e);
    return null;
  }
};
