export enum UTM_TERMS {
  LOGO = 'logo',
  CONTROLS = 'controls',
  THUMBNAIL = 'thumbnail',
  PREVIEW = 'preview',
  SUBSCRIBE_CTA = 'subscribe_cta',
  PAYWALL = 'paywall',
  PROJECT = 'project',
  SEASON = 'season',
  TRACK = 'track',
}

export enum UTM_PARAMS {
  UTM_SOURCE = 'utm_source',
  UTM_MEDIUM = 'utm_medium',
  UTM_CONTENT = 'utm_content',
  UTM_TERM = 'utm_term',
}

export type Params = {
  term: UTM_TERMS;
  skinId: number;
  videoId: number;
};
