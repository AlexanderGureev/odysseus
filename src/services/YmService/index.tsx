import { logger } from 'utils/logger';

import { TYmService, YMInstance, YMQueryParams } from './types';

const YMService = (): TYmService => {
  let YMID: number;
  let ymInstance: YMInstance = () => {
    return;
  };

  let statParams: YMQueryParams = {
    sid: null,
    user_id: -1,
    videosession_id: '',
  };

  const init = async (userParams: Partial<YMQueryParams> = {}) => {
    if (!window.ENV.YMID || !window.ym) {
      logger.log('[YMService]', 'disabled');
      return;
    }

    YMID = window.ENV.YMID;
    ymInstance = window.ym;

    logger.log('[YMService]', 'init', { YMID, ymInstance });

    statParams = {
      ...statParams,
      ...userParams,
    };

    ymInstance(YMID, 'params', {
      sid: statParams.sid,
    });

    sendUserParams(statParams);
  };

  const dryRequest = (p: Partial<YMQueryParams>): Partial<YMQueryParams> => {
    (Object.keys(p) as Array<keyof YMQueryParams>).forEach((k) => {
      if (!(typeof p[k] === 'number') && !p[k]) delete p[k];
    });
    return p;
  };

  const reachGoal = (event: string) => {
    ymInstance(
      YMID,
      'reachGoal',
      event,
      dryRequest({
        ...statParams,
      })
    );
  };

  const log = (payload: Partial<YMQueryParams> = {}) => {
    ymInstance(
      YMID,
      'params',
      dryRequest({
        ...statParams,
        ...payload,
      })
    );
  };

  const sendUserParams = (payload: Partial<YMQueryParams> = {}) => {
    ymInstance(
      YMID,
      'userParams',
      dryRequest({
        ...payload,
      })
    );
  };

  return { init, reachGoal, log, sendUserParams };
};

const instance = YMService();
export { instance as YMService };
