export type UTMTerm =
  | 'logo'
  | 'controls'
  | 'thumbnail'
  | 'preview'
  | 'subscribe_cta'
  | 'paywall'
  | 'project'
  | 'season'
  | 'track';

export type UTMParam = 'utm_source' | 'utm_medium' | 'utm_content' | 'utm_term';

export type Params = {
  term: UTMTerm;
  skinId: number | null;
  trackId: number | null;
};
