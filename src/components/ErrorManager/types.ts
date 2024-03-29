import { Nullable } from '@moretv/types';
import { AppDispatch } from 'store';
import { SkinClass } from 'types';
import { ERROR_TYPE } from 'types/errors';

export enum PLAYER_ERROR_TYPE {
  ERROR_ENCRYPTED_IOS = 'ERROR_ENCRYPTED_IOS',
  ERROR_CUSTOM = 'ERROR_CUSTOM',
  ERROR_ABORTED = 'ERROR_ABORTED',
  ERROR_NETWORK = 'ERROR_NETWORK',
  ERROR_DECODE = 'ERROR_DECODE',
  ERROR_ENCRYPTED = 'ERROR_ENCRYPTED',
  ERROR_SRC_NOT_SUPPORTED = 'ERROR_SRC_NOT_SUPPORTED',
  ERROR_NOT_AVAILABLE_BY_SOURCE = 'ERROR_NOT_AVAILABLE_BY_SOURCE',
  ERROR_DOMAIN_RESTRICTION = 'ERROR_DOMAIN_RESTRICTION',
  ERROR_IP_RESTRICTION = 'ERROR_IP_RESTRICTION',

  ERROR_NOT_AVAILABLE = 'ERROR_NOT_AVAILABLE',
  ERROR_INVALID_STREAMS = 'ERROR_INVALID_STREAMS',
  ERROR_DATA_LOADING = 'ERROR_DATA_LOADING',
}

export const PLAYER_ERROR_CODES: Record<PLAYER_ERROR_TYPE, string> = {
  [PLAYER_ERROR_TYPE.ERROR_CUSTOM]: '0',
  [PLAYER_ERROR_TYPE.ERROR_NOT_AVAILABLE]: '100',
  [PLAYER_ERROR_TYPE.ERROR_DOMAIN_RESTRICTION]: '101',
  [PLAYER_ERROR_TYPE.ERROR_IP_RESTRICTION]: '102',
  [PLAYER_ERROR_TYPE.ERROR_NOT_AVAILABLE_BY_SOURCE]: '104',
  [PLAYER_ERROR_TYPE.ERROR_NETWORK]: '200',
  [PLAYER_ERROR_TYPE.ERROR_DATA_LOADING]: '201',
  [PLAYER_ERROR_TYPE.ERROR_DECODE]: '202',
  [PLAYER_ERROR_TYPE.ERROR_ENCRYPTED]: '203',
  [PLAYER_ERROR_TYPE.ERROR_ENCRYPTED_IOS]: '204',
  [PLAYER_ERROR_TYPE.ERROR_ABORTED]: '205',
  [PLAYER_ERROR_TYPE.ERROR_SRC_NOT_SUPPORTED]: '300',
  [PLAYER_ERROR_TYPE.ERROR_INVALID_STREAMS]: '301',
};

export type ErrorCfg = {
  icon: string;
  text: (isMobile: boolean) => React.ReactNode;
  btn_text?: Nullable<() => React.ReactNode | null>;
  footer_icons?: () => {
    src: string;
    href: string;
  }[];
  getRedirectURL?: () => string;
};

export type ErrorConfigByType = {
  [key in ERROR_TYPE]: (opts: {
    theme: SkinClass;
    isEmbedded: boolean;
    mailOpts: MailOpts;
    sharingUrl?: string;
  }) => ErrorCfg;
};

export type MailData = { subject: string; code: number };
export type MailOpts = {
  partnerId: number | null;
  projectId: number;
  trackId: number | null;
  ssid: string;
  userId: number | null;
  sid: string | null;
  webVersion: string | undefined;
  projectName: string;
  seasonName: string;
  episodeName: string;
};
