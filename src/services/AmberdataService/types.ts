import { SkinClass } from 'types';

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
  projectId: number;
  videoId: number;
  skinId: number;
  partnerId: number;
  videosessionId: string;
  sid: string | null;
  userId: number | null;
};

export type CrashEventPayload = {
  partnerId: number | null;
  trackId: number | null;
  videosessionId: string;
};

export enum AmberdataEvent {
  OPEN = 'open',
  PLAY = 'play',
  PAUSE = 'pause',
  CLOSE = 'close',
  STOP = 'stop',
  ADSTART = 'adstart',
  BUFFERING = 'buffering',
  TIMEUPDATE = 'ping',
  CRASH = 'crash',
  MOVE = 'move',
  PREV = 'prev',
  NEXT = 'next',
}

export enum EventOrigin {
  AUTO = 0,
  MANUAL = 1,
}

export type AmberdataEventPayload = {
  eventType: AmberdataEvent;
  eventOrigin: EventOrigin;
  eventPosition: number;
  saveOrigin?: boolean;
  eventValue?: string;
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
