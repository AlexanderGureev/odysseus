import axios, { AxiosRequestConfig, AxiosRequestHeaders } from 'axios';
import express from 'express';
import { buildRequstByConfigSource, DATA_REQUEST_TIMEOUT, TParams } from '.';
import { SubscriptionTariffs } from '../../types/SubscriptionTariffs';
import { IS_DEV } from '../server';
import { THydraResponse, TConfigSource, TConfigResponse } from '../types';

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

    const { data } = await axios.get<TConfigResponse>(config.url, {
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

export const serviceTariffsRequest = async (
  partnerId: string,
  userToken: string | undefined,
  options: TOptions = {}
) => {
  try {
    if (![1728, 1677, 1788].includes(Number(partnerId))) return null;

    const headers = options.headers || {};
    if (userToken) headers.Authorization = `Bearer ${userToken}`;

    const { data } = await axios.get<SubscriptionTariffs>(
      `${process.env.BE_ENDPOINT}/web/Subscriptions/ServiceTariffs`,
      {
        ...options,
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
