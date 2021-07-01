import ym from 'react-yandex-metrika';
import { SauronService } from '../SauronService';

type TYmService = {
  init: (params: Partial<YMQueryParams>) => void;
  reachGoal: (event: string) => void;
  sendUserParams: (payload: Partial<YMQueryParams>) => void;
  log: (payload?: Partial<YMQueryParams>) => void;
};

export type YMQueryParams = {
  sid: string | null;
  user_id: number;
  videosession_id: string;
};

const YMService = (): TYmService => {
  let statParams: YMQueryParams = {
    sid: null,
    user_id: -1,
    videosession_id: '',
  };

  const init = (userParams: Partial<YMQueryParams> = {}) => {
    SauronService.subscribe((sauronId) => {
      statParams = {
        ...statParams,
        ...userParams,
        sid: sauronId,
      };

      ym('params', {
        sid: sauronId,
      });

      sendUserParams(statParams);
    });
  };

  const dryRequest = (p: Partial<YMQueryParams>): Partial<YMQueryParams> => {
    (Object.keys(p) as Array<keyof YMQueryParams>).forEach((k) => {
      if (!(typeof p[k] === 'number') && !p[k]) delete p[k];
    });
    return p;
  };

  const reachGoal = (event: string) => {
    ym(
      'reachGoal',
      event,
      dryRequest({
        ...statParams,
      })
    );
  };

  const log = (payload: Partial<YMQueryParams> = {}) => {
    SauronService.subscribe((sauronId) => {
      statParams.sid = sauronId;

      ym(
        'params',
        dryRequest({
          ...statParams,
          ...payload,
        })
      );
    });
  };

  const sendUserParams = (payload: Partial<YMQueryParams> = {}) => {
    ym(
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
