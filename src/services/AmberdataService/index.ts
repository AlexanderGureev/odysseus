/* eslint-disable @typescript-eslint/ban-ts-comment */

import { AdCategory, TSkinClass } from 'server/types';
import { Nullable } from 'types';
import { TAdConfigByCategory } from 'components/Advertisement';
import { isNil } from 'utils';
import { createCounter } from 'utils/counter';
import { randomUnit32 } from 'utils/randomHash';
import { sendStat } from 'utils/statistics';

export const AMBERDATA_CODE_BY_SKIN_NAME: { [key in TSkinClass]?: number } = {
  MORE_TV: 6334,
  DEFAULT: 7267,
};

export type TAmberdataParams = {
  skinName: TSkinClass;
  isEmbedded: boolean;
  partnerId: number;
  referrer: string;
  adConfig: TAdConfigByCategory;
  params: TAmberdataInitParams;
};

export type TAmberdataInitParams = {
  projectId: number;
  videoId: number;
  skinId: number;
  partnerId: number;
  videosessionId: string;
  sid: string | null;
};

const createStatUrl = (skinName: TSkinClass) => {
  const code = AMBERDATA_CODE_BY_SKIN_NAME[skinName] || AMBERDATA_CODE_BY_SKIN_NAME.DEFAULT;
  return `https://dmg.digitaltarget.ru/1/${code}/i/i?i={random}&c=`;
};

const URL_PAYLOAD_TEMPLATE = 'tg:{payload}';

export const AMBERDATA_BUFFERING_THRESHOLD = 2000;

export const AMBERDATA_EVENT_TYPES = {
  OPEN: 'open',
  PLAY: 'play',
  PAUSE: 'pause',
  CLOSE: 'close',
  STOP: 'stop',
  ADSTART: 'adstart',
  BUFFERING: 'buffering',
  TIMEUPDATE: 'ping',
  CRASH: 'crash',
  MOVE: 'move',
  PREV: 'prev',
  NEXT: 'next',
};

const QUERY_PARAMS = {
  PROJECT_ID: 'project_id',
  TRACK_ID: 'track_id',
  SKIN_ID: 'skin_id',
  PARTNER_ID: 'partner_id',
  SID: 'sid',
  TIMEZONE: 'tz',
  EVENT_TYPE: 'event_type',
  EVENT_POSITION: 'event_position',
  EVENT_ORIGIN: 'event_manual',
  EVENT_VALUE: 'event_value',
  EVENT_NUMBER: 'event_number',
  VIDEO_SESSION_ID: 'videosession_id',
  USER_ID: 'userid_pak',
};

const PARAMS_MAP: Record<string, string> = {
  projectId: QUERY_PARAMS.PROJECT_ID,
  videoId: QUERY_PARAMS.TRACK_ID,
  skinId: QUERY_PARAMS.SKIN_ID,
  partnerId: QUERY_PARAMS.PARTNER_ID,
  sid: QUERY_PARAMS.SID,
  timezone: QUERY_PARAMS.TIMEZONE,
  eventType: QUERY_PARAMS.EVENT_TYPE,
  eventPosition: QUERY_PARAMS.EVENT_POSITION,
  eventOrigin: QUERY_PARAMS.EVENT_ORIGIN,
  eventValue: QUERY_PARAMS.EVENT_VALUE,
  videosessionId: QUERY_PARAMS.VIDEO_SESSION_ID,
  authorizedUserId: QUERY_PARAMS.USER_ID,
};

enum PARAMS {
  SEASON = 'SEASON',
  ADFOX_PARTNER = 'ADFOX_PARTNER',
  EVENT_TYPE = 'EVENT_TYPE',
  PAID_CONTENT = 'PAID_CONTENT',
}

const initQueryParams: Record<string, string> = {
  [PARAMS.SEASON]: 'season_id',
  [PARAMS.ADFOX_PARTNER]: 'adfox_partner',
  [PARAMS.EVENT_TYPE]: 'event_type',
  [PARAMS.PAID_CONTENT]: 'by_subscription',
};

const mappedRegex = {
  [PARAMS.ADFOX_PARTNER]: /puid12=(\d+?)&/i,
  [PARAMS.SEASON]: /puid6=(\d+?)&/i,
};

const AmberdataService = () => {
  const tick = createCounter();
  let loaded = false;
  let baseLink = '';

  const sendAmberdataInitStat = (skin: TSkinClass, config: TAdConfigByCategory) => {
    const isContainAdvertisement = Object.keys(config).length;
    const resultedParams: { [key in PARAMS]?: Nullable<string | number> } = {
      [PARAMS.ADFOX_PARTNER]: null,
      [PARAMS.SEASON]: null,
      [PARAMS.EVENT_TYPE]: AMBERDATA_EVENT_TYPES.OPEN,
    };

    if (!isContainAdvertisement) resultedParams[PARAMS.PAID_CONTENT] = 1;

    let queryString = '';

    const links = Object.keys(config).reduce((acc: string[], category: string) => {
      const key = category as AdCategory;
      const data = config[key]?.links || [];
      return [...acc, ...data];
    }, []);

    for (let i = 0; i < links.length; i++) {
      Object.entries(mappedRegex).forEach(([key, regex]) => {
        const [, matchedValue = null] = links[i].match(regex) || [];
        resultedParams[key as PARAMS] = matchedValue;
      });

      const isAllParamsReceived = Object.values(resultedParams).every(Boolean);
      if (isAllParamsReceived) break;
    }

    Object.entries(resultedParams).forEach(([key, value]) => {
      queryString += queryString === '' ? `${initQueryParams[key]}__${value}` : ` ${initQueryParams[key]}__${value}`;
    });

    queryString += ` ${baseLink}`;
    queryString = `${queryString} ${QUERY_PARAMS.EVENT_NUMBER}__${tick()}`;

    const statUrlBase = createStatUrl(skin).replace('{random}', `${randomUnit32()}`);
    const statPayload = URL_PAYLOAD_TEMPLATE.replace('{payload}', queryString);
    const statUrl = `${statUrlBase}${encodeURIComponent(statPayload)}`;

    console.log(`<<<<<---SEND AMBERDATA INIT STAT: QUERY STRING - ${queryString}`);
    console.log(`<<<<<---SEND AMBERDATA INIT STAT: STAT PAYLOAD - ${statPayload}`);
    console.log(`<<<<<---SEND AMBERDATA INIT STAT: STAT URL - ${statUrl}`);

    sendStat(statUrl);
  };

  const createBaseLink = (options: TAmberdataInitParams) => {
    const params: Record<string, any> = { ...options, timezone: -1 * (new Date().getTimezoneOffset() / 60) };

    return Object.keys(params).reduce((acc, key) => {
      if (isNil(params[key])) return acc;
      return acc === '' ? `${PARAMS_MAP[key]}__${params[key]}` : `${acc} ${PARAMS_MAP[key]}__${params[key]}`;
    }, '');
  };

  const init = ({ isEmbedded, skinName, adConfig, params, ...rest }: TAmberdataParams) => {
    if (!loaded) {
      loaded = true;
      createAdcm({ isEmbedded, skinName, ...rest });
    }

    baseLink = createBaseLink(params);
    sendAmberdataInitStat(skinName, adConfig);
  };

  const createAdcm = ({
    skinName,
    isEmbedded,
    partnerId,
    referrer,
  }: {
    skinName: TSkinClass;
    isEmbedded: boolean;
    partnerId: number;
    referrer: string;
  }) => {
    const SKIN_CODE_SELECTOR = skinName === 'MORE_TV' ? 'MORE_TV' : 'DEFAULT';
    const tags = [`partner_id=${partnerId}`];

    isEmbedded && tags.push('embedded');
    referrer && tags.push(`dn_${referrer.split('-').join('_').split('.').join('__')}`);

    const config = {
      id: AMBERDATA_CODE_BY_SKIN_NAME[SKIN_CODE_SELECTOR],
      tags,
    };

    const amberdata = document.createElement('script');
    amberdata.src = 'https://tag.digitaltarget.ru/adcm.js';
    amberdata.async = true;
    amberdata.onload = () => {
      // @ts-ignore
      window?.adcm?.configure(config, () => window.adcm.call());
    };

    document.head.appendChild(amberdata);
  };

  return { init };
};

const instance = AmberdataService();
export { instance as AmberdataService };
