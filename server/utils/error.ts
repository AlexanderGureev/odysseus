import { ConfigErrors, ERROR } from '../../types';
import { ERROR_ITEM_MAP, ERROR_TYPE, PlayerError } from '../../types/errors';

export class BaseError extends Error {
  status = -1;

  constructor(message?: string) {
    super(message);
  }
}

export class RequestError extends BaseError {
  constructor(name: string) {
    super(name);
    this.name = name;
  }
}

export const SERVER_ERR_MAP: Record<ERROR, PlayerError> = {
  [ERROR.INVALID_BODY]: ERROR_ITEM_MAP[110],
  [ERROR.NOT_FOUND]: ERROR_ITEM_MAP[110],
  [ERROR.HYDRA_UNAVAILABLE]: ERROR_ITEM_MAP[110],
  [ERROR.SIREN_UNAVAILABLE]: ERROR_ITEM_MAP[100],
  [ERROR.INVALID_PARTNER_ID]: ERROR_ITEM_MAP[100],
  [ERROR.INVALID_TRACK_ID]: ERROR_ITEM_MAP[100],
  [ERROR.INVALID_BODY]: ERROR_ITEM_MAP[100],
};

export const createError = (e: RequestError): ConfigErrors => {
  const error = SERVER_ERR_MAP[e.name as ERROR] || {
    code: -1,
    title: ERROR_TYPE.UNKNOWN,
  };

  return [{ ...error, details: e.message }];
};
