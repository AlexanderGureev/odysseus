import fetch from 'cross-fetch';

import { BaseError } from '../../server/utils/error';
import { ERROR_CODES } from '../../types/errors';
import { isNil } from '.';
import { PlayerError } from './errors';
import { logger } from './logger';

export const NETWORK_CHECK_PATH = '/check_connection'; // 'https://odysseus.more.tv/check_connection'

export class HTTPResponseError extends BaseError {
  response: Response;

  constructor(response: Response) {
    super(`HTTP Error Response: ${response.status} ${response.statusText}`);
    this.name = 'HTTPResponseError';
    this.status = response.status;
    this.response = response;
  }
}

export class NetworkError extends BaseError {
  constructor(message?: string) {
    super(`NetworkError, onLine: ${navigator.onLine}, error message: ${message} `);
    this.name = 'NetworkError';
  }
}

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';

export type RawHeaders = { [k: string]: string[] | undefined };

export type RequestOpts = {
  networkCheck?: boolean;
};

export type ReqInit = Omit<RequestInit, 'headers'> & {
  json?: unknown;
  params?: Record<string, any>;
  headers?: Record<string, string | undefined>;
  timeout?: number;
  networkCheck?: boolean;
};

export type Hooks = {
  networkError: () => void;
  beforeResponse: (res: Response) => Promise<void>;
};

export type HookType = keyof Hooks;

export type RequestHooks = {
  [key in HookType]: Hooks[key][];
};

const request = () => {
  let hooks: RequestHooks = {
    networkError: [],
    beforeResponse: [],
  };

  let requestOpts: RequestOpts = {
    networkCheck: true,
  };

  const setup = (params: RequestOpts) => {
    requestOpts = {
      ...requestOpts,
      ...params,
    };
  };

  const addHook = <T extends HookType, C extends Hooks[T]>(type: T, hook: C) => {
    hooks = {
      ...hooks,
      [type]: [...hooks[type], hook],
    };
  };

  const checkStatus = (response: Response) => {
    if (response.status >= 200 && response.status < 500) {
      return response;
    } else {
      throw new HTTPResponseError(response);
    }
  };

  const checkNetwork = async () => {
    try {
      await fetch(NETWORK_CHECK_PATH, {
        method: 'OPTIONS',
      });
    } catch (err) {
      for (const hook of hooks.networkError) hook();
      throw new PlayerError(ERROR_CODES.ERROR_NETWORK, `request checkNetwork, message: ${err?.message}`);
    }
  };

  const createRequest =
    (method: HTTPMethod) =>
    async (
      url: string,
      { json, params = {}, headers = {}, networkCheck = requestOpts.networkCheck, ...opts }: ReqInit = {}
    ) => {
      try {
        const s = new URLSearchParams();
        Object.keys(params).forEach((key) => {
          if (!isNil(params[key])) s.set(key, params[key]);
        });

        const query = s.toString();
        const target = url + (query ? `?${query}` : '');

        const parsedHeaders = Object.keys(headers).reduce((acc, key) => {
          return isNil(headers[key]) ? acc : { ...acc, [key]: headers[key] };
        }, {});

        const extendedOpts = json
          ? { ...opts, headers: { 'Content-Type': 'application/json', ...parsedHeaders }, body: JSON.stringify(json) }
          : { ...opts, headers: { ...parsedHeaders } };

        logger.log('[http request]', 'before request', { method, url, params, extendedOpts });

        const response = await fetch(target, {
          method,
          ...extendedOpts,
        });

        for (const h of hooks.beforeResponse) await h(response);
        checkStatus(response);

        logger.log('[http request]', 'before response', { method, url, status: response.status });
        return response;
      } catch (error) {
        logger.log('[http request]', 'request failed', { method, url, message: error.message });

        if (error instanceof HTTPResponseError) throw error;
        if (networkCheck) await checkNetwork();
        throw error;
      }
    };

  return {
    get: createRequest('GET'),
    post: createRequest('POST'),
    put: createRequest('PUT'),
    patch: createRequest('PATCH'),
    delete: createRequest('DELETE'),
    options: createRequest('OPTIONS'),
    addHook,
    setup,
  };
};

const instance = request();
export { instance as request };
