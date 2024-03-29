/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import { Nullable, SkinClass } from 'types';
import { createCounter, isNil } from 'utils';
import { logger } from 'utils/logger';
import { randomUnit32 } from 'utils/randomHash';
import { sendStat } from 'utils/statistics';

import {
  AmberdataEventPayload,
  AmberdataEventValue,
  CrashEventPayload,
  PARAMS,
  TAmberdataInitParams,
  TAmberdataParams,
} from './types';

export const AMBERDATA_CODE_BY_SKIN_NAME: { [key in SkinClass]?: number } = {
  MORE_TV: 6334,
  DEFAULT: 7267,
};

const getBaseStatURL = (skinName: SkinClass) => {
  const code = AMBERDATA_CODE_BY_SKIN_NAME[skinName] || AMBERDATA_CODE_BY_SKIN_NAME.DEFAULT;
  return `https://dmg.digitaltarget.ru/1/${code}/i/i?i={random}&c=`;
};

const URL_PAYLOAD_TEMPLATE = 'tg:{payload}';

export const AMBERDATA_BUFFERING_THRESHOLD = 2000;

const QUERY_PARAMS = {
  PROJECT_ID: 'project_id',
  TRACK_ID: 'track_id',
  SKIN_ID: 'skin_id',
  PARTNER_ID: 'partner_id',
  SID: 'sid',
  TIMEZONE: 'tz',
  EVENT_TYPE: 'event_type',
  EVENT_POSITION: 'event_position',
  EVENT_MANUAL: 'event_manual',
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
  eventManual: QUERY_PARAMS.EVENT_MANUAL,
  eventValue: QUERY_PARAMS.EVENT_VALUE,
  videosessionId: QUERY_PARAMS.VIDEO_SESSION_ID,
  userId: QUERY_PARAMS.USER_ID,
};

const PARSE_VALUE: Record<string, (value: string | number) => string> = {
  eventPosition: (value: string | number) => `${value}`.replace(/\./, '_'),
};

const initQueryParams: Record<string, string> = {
  [PARAMS.SEASON]: 'season_id',
  [PARAMS.ADFOX_PARTNER]: 'adfox_partner',
  [PARAMS.EVENT_TYPE]: 'event_type',
  [PARAMS.PAID_CONTENT]: 'by_subscription',
};

const AmberdataService = () => {
  const tick = createCounter();
  let loaded = false;
  let baseLink = '';
  let statURL = '';
  let isInitialized = false;

  const createStatURL = (baseStr: string) => {
    baseStr += ` ${baseLink}`;
    baseStr = `${baseStr} ${QUERY_PARAMS.EVENT_NUMBER}__${tick()}`;

    const statUrlBase = statURL.replace('{random}', `${randomUnit32()}`);
    const statPayload = URL_PAYLOAD_TEMPLATE.replace('{payload}', baseStr);
    const statUrl = `${statUrlBase}${encodeURIComponent(statPayload)}`;
    return statUrl;
  };

  const sendAmberdataInitStat = (paid: boolean, adFoxPartner: number | undefined, adFoxSeason: number | undefined) => {
    logger.log('[AmberdataService]', 'send init event');

    const resultedParams: { [key in PARAMS]?: Nullable<string | number> } = {
      [PARAMS.ADFOX_PARTNER]: !paid && adFoxPartner ? adFoxPartner : null,
      [PARAMS.SEASON]: !paid && adFoxSeason ? adFoxSeason : null,
      [PARAMS.EVENT_TYPE]: 'open',
      [PARAMS.PAID_CONTENT]: paid ? 1 : 0,
    };

    let queryString = '';

    Object.entries(resultedParams).forEach(([key, value]) => {
      if (!isNil(value)) {
        const params = `${initQueryParams[key]}__${value}`;
        queryString += queryString === '' ? `${params}` : ` ${params}`;
      }
    });

    const url = createStatURL(queryString);
    sendStat(url);
  };

  const sendAmberdataStat = ({ eventType, saveOrigin = false, ...opts }: AmberdataEventPayload) => {
    logger.log('[AmberdataService]', 'send event', { eventType, ...opts });

    let queryString = '';

    Object.entries(opts).forEach(([key, value]) => {
      if (!isNil(value)) {
        const val = PARSE_VALUE[key] ? PARSE_VALUE[key](value!) : value;
        const params = `${PARAMS_MAP[key]}__${val}`;
        queryString += queryString === '' ? `${params}` : ` ${params}`;
      }
    });

    const url = createStatURL(queryString);
    sendStat(url);
  };

  const sendAmberdataCrashEvent = (skinName: SkinClass, params: TAmberdataInitParams) => {
    statURL = getBaseStatURL(skinName);
    baseLink = createBaseLink(params);
    sendAmberdataStat({
      eventType: 'crash',
      eventManual: 0,
      eventPosition: 0,
      eventValue: AmberdataEventValue.ERROR.NO_DATA,
    });
  };

  const createBaseLink = (options: TAmberdataInitParams) => {
    const params: Record<string, any> = { ...options, timezone: -1 * (new Date().getTimezoneOffset() / 60) };

    return Object.keys(params).reduce((acc, key) => {
      if (isNil(params[key])) return acc;
      return acc === '' ? `${PARAMS_MAP[key]}__${params[key]}` : `${acc} ${PARAMS_MAP[key]}__${params[key]}`;
    }, '');
  };

  const init = ({ isEmbedded, skinName, paid, adFoxPartner, adFoxSeason, params, ...rest }: TAmberdataParams) => {
    logger.log('[AmberdataService]', 'init');

    if (!loaded) {
      loaded = true;
      createAdcm({ isEmbedded, skinName, ...rest });
    }

    statURL = getBaseStatURL(skinName);
    baseLink = createBaseLink(params);
    sendAmberdataInitStat(paid, adFoxPartner, adFoxSeason);
    isInitialized = true;
  };

  const createAdcm = ({
    skinName,
    isEmbedded,
    partnerId,
    referrer,
  }: {
    skinName: SkinClass;
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
      window.adcm?.configure(config, () => window.adcm?.call());
    };

    document.head.appendChild(amberdata);
  };

  return { init, sendAmberdataCrashEvent, sendAmberdataStat, isInitialized: () => isInitialized };
};

const instance = AmberdataService();
export { instance as AmberdataService };
