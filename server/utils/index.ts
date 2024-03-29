import express from 'express';

import { isNil } from '../../src/utils';
import { TConfigSource, TEnvConfig } from '../../types';

const base64RegExp = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
export const isValidBase64 = (str: string): boolean => base64RegExp.test(str);

export const createHeaders = <T>(req: express.Request<T>) => {
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
  user_token?: string | null | undefined;
  sign?: string;
  pf?: string;
  pt?: string;
  p2p?: string;
  isNcanto?: string;
};

export const createParams = (params: Record<string, any>) =>
  Object.keys(params).reduce((acc, key) => (params[key] ? { ...acc, [key]: params[key] } : acc), {});

export const buildRequstByConfigSource = (configSource: TConfigSource, params: TParams): TRequestConfig => {
  const baseUrl = URL_MAP_BY_SOURCE[configSource];

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

export const DATA_REQUEST_TIMEOUT = 5000;

export const toNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return !isNaN(num) ? num : null;
};

export const toBool = (value?: string) => String(value)?.toLowerCase().trim() === 'true';

export const excludeNil = <T extends Record<string, unknown>>(obj: T) =>
  Object.entries(obj).reduce<Partial<T>>((acc, [key, value]) => (isNil(value) ? acc : { ...acc, [key]: value }), {});

export const createEnv = <T>(req: express.Request<T>): TEnvConfig => ({
  AD_FOX_OWNER_ID: process.env.AD_FOX_OWNER_ID,
  DEBUG_MODE: toBool(process.env.DEBUG_MODE),
  NODE_ENV: process.env.NODE_ENV,
  APP_VERSION: process.env.APP_VERSION,
  LOG_LEVEL: process.env.LOG_LEVEL,
  SIREN_HOST: process.env.SIREN_HOST,
  HORUS_SRC: process.env.HORUS_SRC,
  INDEXED_DB_LIMIT: toNumber(process.env.INDEXED_DB_LIMIT),
  HORUS_ENABLED: toBool(process.env.HORUS_ENABLED),
  HORUS_BLACKLIST: process.env.HORUS_BLACKLIST ? process.env.HORUS_BLACKLIST : null,
  WHAT_IS_MY_BROWSER_KEY: process.env.WHATISMYBROWSER_KEY,
  WHAT_IS_MY_BROWSER_LINK: process.env.WHATISMYBROWSER_LINK,
  IP: req.clientIp,
  SENTRY_EVENT_RATE: toNumber(process.env.SENTRY_EVENT_RATE),
  SENTRY_DSN: process.env.SENTRY_DSN,
  SAURON_API_URL: process.env.SAURON_API_URL,
  CDN_HOSTNAME: process.env.CDN_HOSTNAME ? `//${process.env.CDN_HOSTNAME}` : '',
  FAIRPLAY_CERT_ENDPOINT: process.env.FAIRPLAY_CERT_ENDPOINT || 'https://static.more.tv/cert/fp/ctc.der',
  YMID: toNumber(process.env.YMID),
  PUBLIC_BE_ENDPOINT: process.env.PUBLIC_BE_ENDPOINT,
  APP_STATIC_ENDPOINT: process.env.APP_STATIC_ENDPOINT,
  LINKED_AUDIO_TRACKS_CONFIG_PATH: process.env.LINKED_AUDIO_TRACKS_CONFIG_PATH,
  SIREN_PUBLIC_HOST: process.env.SIREN_PUBLIC_HOST,
});

export const isNumber = (num: string | undefined) => (num ? !Number.isNaN(Number(num)) : false);
