import fetch from 'isomorphic-fetch';

import { BaseError } from '../../server/utils/error';
import { isNil } from '../utils';
import { logger } from './logger';

export class HTTPResponseError extends BaseError {
  response: Response;

  constructor(response: Response) {
    super(`HTTP Error Response: ${response.status} ${response.statusText}`);
    this.name = 'HTTPResponseError';
    this.status = response.status;
    this.response = response;
  }
}

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RawHeaders = { [k: string]: string[] | undefined };

export type ReqInit = Omit<RequestInit, 'headers'> & {
  json?: unknown;
  params?: Record<string, any>;
  headers?: Record<string, string | undefined>;
  timeout?: number;
};

const request = () => {
  const checkStatus = (response: Response) => {
    if (response.status >= 200 && response.status < 500) {
      return response;
    } else {
      throw new HTTPResponseError(response);
    }
  };

  const createRequest =
    (method: HTTPMethod) =>
    async (url: string, { json, params = {}, headers = {}, ...opts }: ReqInit = {}) => {
      try {
        logger.log('[http request]', 'before request', { method, url, params, headers });

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
          : opts;

        const response = await fetch(target, { method, ...extendedOpts });
        checkStatus(response);

        logger.log('[http request]', 'before response', { method, url, status: response.status });
        return response;
      } catch (error) {
        logger.log('[http request]', 'request failed', { method, url, message: error.message });
        throw error;
      }
    };

  return {
    get: createRequest('GET'),
    post: createRequest('POST'),
    put: createRequest('PUT'),
    patch: createRequest('PATCH'),
    delete: createRequest('DELETE'),
  };
};

const instance = request();
export { instance as request };
