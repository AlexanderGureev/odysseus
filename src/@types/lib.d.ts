interface Window {
  ya?: any;
  ENV: {
    AD_FOX_OWNER_ID: string;
    DEV_TOOLS: boolean;
    HORUS_BLACKLIST: string;
    HORUS_ENABLED: boolean;
    HORUS_SRC: string;
    INDEXED_DB_LIMIT: string;
    IP: string;
    LOG_LEVEL: string;
    NODE_ENV: string;
    SENTRY_DSN: string;
    SENTRY_EVENT_RATE: number;
    SIREN_HOST: string;
    USE_MOCKS: boolean;
    WHAT_IS_MY_BROWSER_KEY: string;
    WHAT_IS_MY_BROWSER_LINK: string;
    SAURON_API_URL?: string;
  };
  ODYSSEUS_PLAYER_CONFIG: import('../../server/types').TConfig;
  CONTEXT: import('../../server/utils').TParams;
  WebKitMediaSource?: any;
  WebKitSourceBuffer?: any;
}
