import jwtDecode from 'jwt-decode';
import { Nullable } from 'types';

import { logger } from './logger';

export const getTokenExpiredTime = (token: string): Nullable<number> => {
  let expiredTime = null;

  try {
    const decoded: { exp: number } = jwtDecode(token);
    expiredTime = decoded.exp * 1000;
  } catch (err) {
    logger.error('[getTokenExpiredTime]', `Couldn't get expired token time: ${err?.message}`);
  }

  return expiredTime;
};
