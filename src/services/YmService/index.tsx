import { logger } from 'utils/logger';
import { randomUnit32 } from 'utils/randomHash';
import { sendStat } from 'utils/statistics';

import { YandexGoal, YMInstance, YMQueryParams } from './types';

const Events = {
  click_subscribe: 'https://ads.adfox.ru/264443/getCode?p1=bzqje&p2=frfe&pfc=bsuii&pfb=fszym&pr=[RANDOM]&ptrc=b',
};

export type YandexEvents = keyof typeof Events;

const YMService = () => {
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
    if (!window.ENV?.YMID || !window.ym) {
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

  const reachGoal = (event: YandexGoal) => {
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

  const sendEvent = (event: YandexEvents) => {
    const link = Events[event]?.replace('[RANDOM]', `${randomUnit32()}`);
    if (link) sendStat(link);
  };

  return { init, reachGoal, log, sendUserParams, sendEvent };
};

const instance = YMService();
export { instance as YMService };
