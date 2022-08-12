export interface IProcessEnv {
  NODE_ENV?: string;
  PORT?: string;
  DEBUG_MODE?: string;

  PAK_HOST: string;
  HYDRA_HOST: string;
  BE_ENDPOINT: string;
  PUBLIC_BE_ENDPOINT: string;
  CTC_BE_ENDPOINT: string;
  HORUS_SRC: string;
  TURMS_ENDPOINT?: string;

  SIREN_HOST: string;
  SIREN_CTC_HOST: string;

  WHATISMYBROWSER_KEY?: string;
  WHATISMYBROWSER_LINK?: string;
  AD_FOX_OWNER_ID: string;
  INDEXED_DB_LIMIT?: string;
  LOG_LEVEL?: import('utils/logger').LogLevel;
  HORUS_ENABLED?: string;
  HORUS_BLACKLIST?: string;

  SENTRY_EVENT_RATE?: string;
  SENTRY_DSN?: string;

  DEBUG_PAGE?: string;
  DATA_CACHE_TIME?: string;
  DATA_REQUEST_TIMEOUT?: string;
  CANARY_RELEASE?: string;

  SAURON_API_URL?: string;
  CDN_HOSTNAME?: string;
  FAIRPLAY_CERT_ENDPOINT?: string;
  YOUBORA_ACCOUNT_CODE?: string;
  YOUBORA_SERVICE_ENABLED?: string;
  YMID?: string;
}

declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface ProcessEnv extends IProcessEnv {}
  }
}
