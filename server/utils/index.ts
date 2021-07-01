import express from 'express';
import { TConfigSource } from '../types';

const base64RegExp = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
export const isValidBase64 = (str: string): boolean => base64RegExp.test(str);

export const createHeaders = (req: express.Request) => {
  const requestId = req.headers?.['x-request-id'];
  const headers: Record<string, any> = {};
  if (requestId) headers['x-request-id'] = requestId;
  return headers;
};

export const URL_MAP_BY_SOURCE: Record<TConfigSource, string> = {
  [TConfigSource.HUB]: process.env.SIREN_HOST,
  [TConfigSource.SIREN_CTC]: process.env.SIREN_CTC_HOST,
  [TConfigSource.PAK]: process.env.PAK_HOST,
};

type TRequestConfig = { url: string; params: Record<string, string> } | undefined;

export type TParams = {
  partner_id: string;
  track_id: string;
  user_token?: string;
  sign?: string;
  pf?: string;
  pt?: string;
};

export const buildRequstByConfigSource = (configSource: TConfigSource, params: TParams): TRequestConfig => {
  const baseUrl = URL_MAP_BY_SOURCE[configSource];
  const createParams = (params: Record<string, string | undefined>) =>
    Object.keys(params).reduce((acc, key) => (params[key] ? { ...acc, [key]: params[key] } : acc), {});

  return {
    [TConfigSource.HUB]: () => {
      const queryParams = createParams({
        partner_id: params.partner_id,
        track_id: params.track_id,
        user_token: params.user_token,
        sign: params.sign,
        pf: params.pf,
        pt: params.pt,
      });

      return { url: `${baseUrl}/player/config`, params: queryParams };
    },
    [TConfigSource.SIREN_CTC]: () => {
      const queryParams = createParams({
        partner_id: params.partner_id,
        track_id: params.track_id,
        user_token: params.user_token,
      });

      return { url: `${baseUrl}/player/config`, params: queryParams };
    },
    [TConfigSource.PAK]: () => {
      const queryParams = {
        partner_id: params.partner_id,
        userToken: params.user_token || '',
      };
      return { url: `${baseUrl}/video/tracks/${params.track_id}/track_config.json`, params: queryParams };
    },
  }[configSource]?.();
};

export const DATA_REQUEST_TIMEOUT = 2000;

export const createEnv = (req: express.Request) => ({
  AD_FOX_OWNER_ID: process.env.AD_FOX_OWNER_ID,
  NODE_ENV: process.env.NODE_ENV,
  CONFIG_URL_PRESET: process.env.CONFIG_URL_PRESET,
  APP_VERSION: process.env.APP_VERSION,
  USE_MOCKS: process.env.USE_MOCKS === '1',
  DEV_TOOLS: process.env.DEV_TOOLS === 'enabled',
  LOG_LEVEL: process.env.LOG_LEVEL,
  SIREN_HOST: process.env.SIREN_HOST,
  HORUS_SRC: process.env.HORUS_SRC,
  INDEXED_DB_LIMIT: process.env.INDEXED_DB_LIMIT,
  HORUS_ENABLED: process.env.HORUS_ENABLED ? JSON.parse(process.env.HORUS_ENABLED) : true,
  HORUS_BLACKLIST: process.env.HORUS_BLACKLIST ? process.env.HORUS_BLACKLIST : null,
  WHAT_IS_MY_BROWSER_KEY: process.env.WHATISMYBROWSER_KEY,
  WHAT_IS_MY_BROWSER_LINK: process.env.WHATISMYBROWSER_LINK,
  IP: req.clientIp,
  SENTRY_EVENT_RATE: process.env.SENTRY_EVENT_RATE ? Number(process.env.SENTRY_EVENT_RATE) : undefined,
  SENTRY_DSN: process.env.SENTRY_DSN,
  SAURON_API_URL: process.env.SAURON_API_URL,
});

export const isNumber = (num: string | undefined) => num && !Number.isNaN(Number(num));
