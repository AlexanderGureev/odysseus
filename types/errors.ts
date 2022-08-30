export type THint = { error: string; module: string; method: string };

// https://confluence.more.tv/pages/viewpage.action?pageId=205099339 (серверные ошибки ПАК)
// https://confluence.more.tv/pages/viewpage.action?pageId=3247478

export enum ERROR_TYPE {
  CUSTOM = 'ERROR_CUSTOM',
  NOT_AVAILABLE = 'ERROR_NOT_AVAILABLE',

  // PAK
  PARTNER_ERROR = 'PARTNER_ERROR',
  GEOBLOCK_ERROR = 'GEOBLOCK_ERROR',

  NETWORK_TIMEOUT_ERROR = 'NETWORK_TIMEOUT_ERROR',
  WAF_ERROR = 'WAF_ERROR',
  STORMWALL_GEOBLOCK_ERROR = 'STORMWALL_GEOBLOCK_ERROR',

  NOT_ALLOWED_ERROR = 'NOT_ALLOWED_ERROR',
  EMBED_ERROR = 'EMBED_ERROR',
  TECHNICAL_ERROR = 'TECHNICAL_ERROR',
  PROXY_ERROR = 'PROXY_ERROR',
  TRACK_MISSING = 'TRACK_MISSING',
  ANONYMOUS_ERROR = 'ANONYMOUS_ERROR',

  HYDRA_UNAVAILABLE = 'HYDRA_UNAVAILABLE',
  NETWORK = 'ERROR_NETWORK',
  DATA_LOADING = 'ERROR_DATA_LOADING',
  DECODE = 'ERROR_DECODE',
  ENCRYPTED = 'ERROR_ENCRYPTED',
  NO_RIGHTS = 'NO_RIGHTS',
  FETCH_LICENSE_ERROR = 'FETCH_LICENSE_ERROR',

  ABORTED = 'ERROR_ABORTED',
  BALANCER_UNAVAILABLE = 'BALANCER_UNAVAILABLE',
  BALANCER_REQUEST_FAILED = 'BALANCER_REQUEST_FAILED',
  BALANCER_NO_DATA = 'BALANCER_NO_DATA',
  CDN_INVALID_DATA = 'CDN_INVALID_DATA',
  CDN_UNAVAILABLE = 'CDN_UNAVAILABLE',
  CDN_REQUEST_FAILED = 'CDN_REQUEST_FAILED',
  SRC_NOT_SUPPORTED = 'ERROR_SRC_NOT_SUPPORTED',
  INVALID_STREAMS = 'ERROR_INVALID_STREAMS',
  UNKNOWN = 'UNKNOWN',
}

// Коды ошибок для аналитики
export const ERROR_CODES: Record<ERROR_TYPE, number> = {
  [ERROR_TYPE.CUSTOM]: 0,
  [ERROR_TYPE.NOT_AVAILABLE]: 100,

  // PAK
  [ERROR_TYPE.PARTNER_ERROR]: 101,
  [ERROR_TYPE.GEOBLOCK_ERROR]: 102,
  [ERROR_TYPE.NOT_ALLOWED_ERROR]: 103,
  [ERROR_TYPE.EMBED_ERROR]: 104, // https://jira.more.tv/browse/SAHC-847
  [ERROR_TYPE.TECHNICAL_ERROR]: 105,
  [ERROR_TYPE.PROXY_ERROR]: 106,
  [ERROR_TYPE.TRACK_MISSING]: 107,
  [ERROR_TYPE.ANONYMOUS_ERROR]: 108,

  [ERROR_TYPE.HYDRA_UNAVAILABLE]: 110,
  [ERROR_TYPE.NETWORK]: 200,
  [ERROR_TYPE.DATA_LOADING]: 201,
  [ERROR_TYPE.DECODE]: 202,
  [ERROR_TYPE.ENCRYPTED]: 203,
  [ERROR_TYPE.NO_RIGHTS]: 204,
  [ERROR_TYPE.ABORTED]: 205,
  [ERROR_TYPE.BALANCER_UNAVAILABLE]: 210,
  [ERROR_TYPE.BALANCER_REQUEST_FAILED]: 211,
  [ERROR_TYPE.BALANCER_NO_DATA]: 212,
  [ERROR_TYPE.CDN_INVALID_DATA]: 213,
  [ERROR_TYPE.CDN_UNAVAILABLE]: 220,
  [ERROR_TYPE.CDN_REQUEST_FAILED]: 221,
  [ERROR_TYPE.FETCH_LICENSE_ERROR]: 230,

  [ERROR_TYPE.SRC_NOT_SUPPORTED]: 300,
  [ERROR_TYPE.INVALID_STREAMS]: 301,

  [ERROR_TYPE.WAF_ERROR]: 403,
  [ERROR_TYPE.NETWORK_TIMEOUT_ERROR]: 429,
  [ERROR_TYPE.STORMWALL_GEOBLOCK_ERROR]: 451,

  [ERROR_TYPE.UNKNOWN]: -1,
};

export type RawPlayerError = {
  code: number;
  details?: string;
  title: ERROR_TYPE;
};

export const ERROR_ITEM_MAP: Record<string, RawPlayerError> = {
  // Native error codes ------------------------------ >>

  0: {
    code: ERROR_CODES[ERROR_TYPE.CUSTOM],
    title: ERROR_TYPE.CUSTOM,
  },
  1: {
    code: ERROR_CODES[ERROR_TYPE.ABORTED],
    title: ERROR_TYPE.ABORTED,
  },
  2: {
    code: ERROR_CODES[ERROR_TYPE.NETWORK],
    title: ERROR_TYPE.NETWORK,
  },
  3: {
    code: ERROR_CODES[ERROR_TYPE.DECODE],
    title: ERROR_TYPE.DECODE,
  },
  4: {
    code: ERROR_CODES[ERROR_TYPE.SRC_NOT_SUPPORTED],
    title: ERROR_TYPE.SRC_NOT_SUPPORTED,
  },
  5: {
    code: ERROR_CODES[ERROR_TYPE.ENCRYPTED],
    title: ERROR_TYPE.ENCRYPTED,
  },

  // Odysseus analytics error codes -------------------- >>

  100: {
    code: ERROR_CODES[ERROR_TYPE.NOT_AVAILABLE],
    title: ERROR_TYPE.NOT_AVAILABLE,
  },
  101: {
    code: ERROR_CODES[ERROR_TYPE.PARTNER_ERROR],
    title: ERROR_TYPE.PARTNER_ERROR,
  },
  102: {
    code: ERROR_CODES[ERROR_TYPE.GEOBLOCK_ERROR],
    title: ERROR_TYPE.GEOBLOCK_ERROR,
  },
  103: {
    code: ERROR_CODES[ERROR_TYPE.NOT_ALLOWED_ERROR],
    title: ERROR_TYPE.NOT_ALLOWED_ERROR,
  },
  104: {
    code: ERROR_CODES[ERROR_TYPE.EMBED_ERROR],
    title: ERROR_TYPE.EMBED_ERROR,
  },
  105: {
    code: ERROR_CODES[ERROR_TYPE.TECHNICAL_ERROR],
    title: ERROR_TYPE.TECHNICAL_ERROR,
  },
  106: {
    code: ERROR_CODES[ERROR_TYPE.PROXY_ERROR],
    title: ERROR_TYPE.PROXY_ERROR,
  },
  107: {
    code: ERROR_CODES[ERROR_TYPE.TRACK_MISSING],
    title: ERROR_TYPE.TRACK_MISSING,
  },
  108: {
    code: ERROR_CODES[ERROR_TYPE.ANONYMOUS_ERROR],
    title: ERROR_TYPE.ANONYMOUS_ERROR,
  },
  110: {
    code: ERROR_CODES[ERROR_TYPE.HYDRA_UNAVAILABLE],
    title: ERROR_TYPE.HYDRA_UNAVAILABLE,
  },
  200: {
    code: ERROR_CODES[ERROR_TYPE.NETWORK],
    title: ERROR_TYPE.NETWORK,
  },
  201: {
    code: ERROR_CODES[ERROR_TYPE.DATA_LOADING],
    title: ERROR_TYPE.DATA_LOADING,
  },
  202: {
    code: ERROR_CODES[ERROR_TYPE.DECODE],
    title: ERROR_TYPE.DECODE,
  },
  203: {
    code: ERROR_CODES[ERROR_TYPE.ENCRYPTED],
    title: ERROR_TYPE.ENCRYPTED,
  },
  204: {
    code: ERROR_CODES[ERROR_TYPE.NO_RIGHTS],
    title: ERROR_TYPE.NO_RIGHTS,
  },
  205: {
    code: ERROR_CODES[ERROR_TYPE.ABORTED],
    title: ERROR_TYPE.ABORTED,
  },
  210: {
    code: ERROR_CODES[ERROR_TYPE.BALANCER_UNAVAILABLE],
    title: ERROR_TYPE.BALANCER_UNAVAILABLE,
  },
  211: {
    code: ERROR_CODES[ERROR_TYPE.BALANCER_REQUEST_FAILED],
    title: ERROR_TYPE.BALANCER_REQUEST_FAILED,
  },
  212: {
    code: ERROR_CODES[ERROR_TYPE.BALANCER_NO_DATA],
    title: ERROR_TYPE.BALANCER_NO_DATA,
  },
  213: {
    code: ERROR_CODES[ERROR_TYPE.CDN_INVALID_DATA],
    title: ERROR_TYPE.CDN_INVALID_DATA,
  },
  220: {
    code: ERROR_CODES[ERROR_TYPE.CDN_UNAVAILABLE],
    title: ERROR_TYPE.CDN_UNAVAILABLE,
  },
  221: {
    code: ERROR_CODES[ERROR_TYPE.CDN_REQUEST_FAILED],
    title: ERROR_TYPE.CDN_REQUEST_FAILED,
  },
  230: {
    code: ERROR_CODES[ERROR_TYPE.FETCH_LICENSE_ERROR],
    title: ERROR_TYPE.FETCH_LICENSE_ERROR,
  },
  300: {
    code: ERROR_CODES[ERROR_TYPE.SRC_NOT_SUPPORTED],
    title: ERROR_TYPE.SRC_NOT_SUPPORTED,
  },
  301: {
    code: ERROR_CODES[ERROR_TYPE.INVALID_STREAMS],
    title: ERROR_TYPE.INVALID_STREAMS,
  },
  403: {
    code: ERROR_CODES[ERROR_TYPE.WAF_ERROR],
    title: ERROR_TYPE.WAF_ERROR,
  },
  429: {
    code: ERROR_CODES[ERROR_TYPE.NETWORK_TIMEOUT_ERROR],
    title: ERROR_TYPE.NETWORK_TIMEOUT_ERROR,
  },
  451: {
    code: ERROR_CODES[ERROR_TYPE.STORMWALL_GEOBLOCK_ERROR],
    title: ERROR_TYPE.STORMWALL_GEOBLOCK_ERROR,
  },
  ['-1']: {
    code: ERROR_CODES[ERROR_TYPE.UNKNOWN],
    title: ERROR_TYPE.UNKNOWN,
  },
};
