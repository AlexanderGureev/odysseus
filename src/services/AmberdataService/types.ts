import { SkinClass } from 'types';
import { ERROR_TYPE } from 'types/errors';

export type TAmberdataParams = {
  skinName: SkinClass;
  isEmbedded: boolean;
  partnerId: number;
  referrer: string;
  params: TAmberdataInitParams;
  paid: boolean;
  adFoxPartner?: number;
  adFoxSeason?: number;
};

export type TAmberdataInitParams = {
  projectId?: number;
  videoId: number | null;
  skinId?: number;
  partnerId: number | null;
  videosessionId: string;
  sid: string | null;
  userId: number | null;
};

export type CrashEventPayload = {
  partnerId: number | null;
  trackId: number | null;
  videosessionId: string;
};

export const AMBERDATA_BUFFERING_THRESHOLD = 2000;

export type AmberdataEvent =
  | 'open'
  | 'play'
  | 'pause'
  | 'close'
  | 'stop'
  | 'adstart'
  | 'buffering'
  | 'ping'
  | 'crash'
  | 'move'
  | 'prev'
  | 'next';

export type AmberdataEventPayload = {
  eventType: AmberdataEvent;
  eventManual: 1 | 0;
  eventPosition: number;
  saveOrigin?: boolean;
  eventValue?: string | null;
};

export enum PARAMS {
  SEASON = 'SEASON',
  ADFOX_PARTNER = 'ADFOX_PARTNER',
  EVENT_TYPE = 'EVENT_TYPE',
  PAID_CONTENT = 'PAID_CONTENT',
}

export const AmberdataEventValue = {
  ERROR: {
    GENERAL: 'error-general',
    BROWSER_NOT_SUPPORTED: 'error-browser-not-supported',
    DRM: 'error-drm',
    DOMAIN_RESTRICTION: 'error-domain-restriction',
    IP_RESTRICTION: 'error-ip-restriction',
    ENCODING: 'error-encoding',
    VIDEO_ENCRYPTED: 'error-video-encrypted',
    AGE: 'error-age',
    NO_DATA: 'error-no-data',
    ONLY_SUBSCRIPTION: 'error-only-subscription',
  },
};

export const mapAmberDataError: { [key in ERROR_TYPE]?: string } = {
  [ERROR_TYPE.DATA_LOADING]: AmberdataEventValue.ERROR.GENERAL,
  [ERROR_TYPE.EMBED_ERROR]: AmberdataEventValue.ERROR.BROWSER_NOT_SUPPORTED,
  [ERROR_TYPE.NOT_AVAILABLE]: AmberdataEventValue.ERROR.NO_DATA,
  [ERROR_TYPE.SRC_NOT_SUPPORTED]: AmberdataEventValue.ERROR.BROWSER_NOT_SUPPORTED,
  [ERROR_TYPE.NETWORK]: AmberdataEventValue.ERROR.GENERAL,
  [ERROR_TYPE.INVALID_STREAMS]: AmberdataEventValue.ERROR.GENERAL,
  [ERROR_TYPE.PARTNER_ERROR]: AmberdataEventValue.ERROR.DOMAIN_RESTRICTION,
  [ERROR_TYPE.GEOBLOCK_ERROR]: AmberdataEventValue.ERROR.IP_RESTRICTION,
  [ERROR_TYPE.ENCRYPTED]: AmberdataEventValue.ERROR.VIDEO_ENCRYPTED,
  [ERROR_TYPE.ABORTED]: AmberdataEventValue.ERROR.NO_DATA,
  [ERROR_TYPE.CUSTOM]: AmberdataEventValue.ERROR.GENERAL,
  [ERROR_TYPE.DECODE]: AmberdataEventValue.ERROR.ENCODING,
};
