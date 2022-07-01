import { BaseError } from 'server/utils/error';

import { logger } from './logger';

class HTTPResponseError extends BaseError {
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

type ReqInit = RequestInit & {
  json?: unknown;
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
    async (url: string, { json, ...opts }: ReqInit = {}) => {
      try {
        logger.log('[http request]', 'before request', { method, url });

        const extendedOpts = json
          ? { ...opts, headers: { 'Content-Type': 'application/json', ...opts?.headers }, body: JSON.stringify(json) }
          : opts;

        const response = await fetch(url, { method, ...extendedOpts });
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
