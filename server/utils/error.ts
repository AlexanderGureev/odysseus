import { PlayerError } from '../../src/utils/errors';
import { ConfigErrors, ERROR } from '../../types';
import { ERROR_ITEM_MAP, ERROR_TYPE, RawPlayerError } from '../../types/errors';

export class BaseError extends Error {
  status = 500;

  constructor(message?: string) {
    super(message);
  }
}

export class RequestError extends BaseError {
  constructor(name: string, status: number, message?: string) {
    super(message || name);
    this.name = name;
    this.status = status;
  }
}

export const SERVER_ERR_MAP: Record<ERROR, RawPlayerError> = {
  [ERROR.INVALID_BODY]: ERROR_ITEM_MAP[110],
  [ERROR.NOT_FOUND]: ERROR_ITEM_MAP[110],
  [ERROR.HYDRA_UNAVAILABLE]: ERROR_ITEM_MAP[110],
  [ERROR.SIREN_UNAVAILABLE]: ERROR_ITEM_MAP[100],
  [ERROR.INVALID_PARTNER_ID]: ERROR_ITEM_MAP[100],
  [ERROR.INVALID_TRACK_ID]: ERROR_ITEM_MAP[100],
  [ERROR.INVALID_BODY]: ERROR_ITEM_MAP[100],
  [ERROR.INVALID_CONFIG_SOURCE]: ERROR_ITEM_MAP[100],
};

export const createError = (e: RequestError | PlayerError | Error): { status: number; errors: ConfigErrors } => {
  let error: RawPlayerError | null = null;

  if (e instanceof PlayerError) error = e.serialize();
  if (e instanceof RequestError) error = SERVER_ERR_MAP[e.name as ERROR];

  if (!error) {
    error = {
      code: -1,
      title: ERROR_TYPE.UNKNOWN,
    };
  }

  return {
    status: 'status' in e ? e.status : 500,
    errors: [{ ...error, details: e.message }],
  };
};
