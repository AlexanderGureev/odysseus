import { TParams } from 'server/utils';
import { ExperimentsCfg } from 'services/ExperimentsService/types';
import { LogLevel } from 'utils/logger';

import { TContentRollsConfig, TMiddleRollsConfig, TPreRollsConfig, TRawAdConfig } from './ad';
import { RawPlayerError } from './errors';
import { MediascopeCounterResponse } from './MediascopeCounter';
import { SubscriptionTariffs } from './SubscriptionTariffs';
import { TrackInfoData } from './TrackInfo';
import { UserSubscription } from './UserSubscription';

export type Nullable<T> = T | null;
export type ApiResponse<T> = { data: T };

export enum TConfigSource {
  HUB = 'HUB',
  'SIREN_CTC' = 'SIREN_CTC',
  'PAK' = 'PAK',
}

export enum SkinClass {
  CTC = 'CTC',
  VIDEOMORE = 'VIDEOMORE',
  MORE_TV = 'MORE_TV',
  DOMASHNIY = 'DOMASHNIY',
  CTC_LOVE = 'CTC_LOVE',
  CTC_KIDS = 'CTC_KIDS',
  CHE = 'CHE',
  DEFAULT = 'DEFAULT',
}

export const AppNameBySkin: { [key in SkinClass]?: string } = {
  [SkinClass.VIDEOMORE]: 'moretv',
  [SkinClass.CTC]: 'ctc',
  [SkinClass.CTC_LOVE]: 'ctc_love',
  [SkinClass.MORE_TV]: 'moretv',
  [SkinClass.DOMASHNIY]: 'domashniy',
  [SkinClass.CHE]: 'che',
  [SkinClass.CTC_KIDS]: 'ctc_kids',
  [SkinClass.DEFAULT]: 'default',
};

export const AppThemeBySkin: Record<SkinClass, string> = {
  [SkinClass.VIDEOMORE]: 'theme-vm',
  [SkinClass.CTC]: 'theme-ctc',
  [SkinClass.CTC_LOVE]: 'theme-ctc-love',
  [SkinClass.MORE_TV]: 'theme-more-tv',
  [SkinClass.DOMASHNIY]: 'theme-home',
  [SkinClass.CHE]: 'theme-che',
  [SkinClass.DEFAULT]: 'theme-default',
  [SkinClass.CTC_KIDS]: 'theme-ctc-kids',
};

export enum DOMAINS {
  MORE_TV = 'more.tv',
  VIDEOMORE = 'videomore.ru',
  CHE_TV = 'chetv.ru',
  CTC = 'ctc.ru',
  CTC_KIDS = 'ctckids.ru',
  CTC_LOVE = 'ctclove.ru',
  DOMASHNIY = 'domashniy.ru',
}

export const MAP_HOST_TO_SKIN = {
  [DOMAINS.MORE_TV]: SkinClass.MORE_TV,
  [DOMAINS.VIDEOMORE]: SkinClass.VIDEOMORE,
  [DOMAINS.CHE_TV]: SkinClass.CHE,
  [DOMAINS.CTC]: SkinClass.CTC,
  [DOMAINS.CTC_KIDS]: SkinClass.CTC_KIDS,
  [DOMAINS.CTC_LOVE]: SkinClass.CTC_LOVE,
  [DOMAINS.DOMASHNIY]: SkinClass.DOMASHNIY,
};

export const SERVICE_GROUP_ID: { [key in SkinClass]?: number } = {
  [SkinClass.MORE_TV]: 1,
  [SkinClass.CTC]: 2,
  [SkinClass.DOMASHNIY]: 5,
};

export type SubscriptionPreviewType = 'HUB' | 'PAK' | 'FALSE';

type MIN_AGE_RESTRICTION = 0 | 6 | 12 | 16 | 18;

type DISCLAIMER_AGE_RESTRICTIONS = {
  show_duration: null | number;
  images: {
    [key in MIN_AGE_RESTRICTION | 'default']?: string;
  };
};

export type TrialSuggestionCfg = {
  suggestionDisplayDuration?: number;
  afterPrerollsInterval?: number;
  afterMidrollsInterval?: number;
  beforePauserollsInterval?: number;
};

export type TFeatureConfig = {
  ENABLE_FAVOURITES?: boolean;
  MEDIASCOPE_WATCHING_COUNTER?: boolean;
  HORUS_ENABLED?: boolean;
  PROMO_OFFER_BUTTON?: string;
  SUBSCRIPTION_TEXT?: string; // текст для уведомления о покупке подписки над таймлайном (включено на стс)
  PAYWALL_TITLE?: string; // текст на paywall
  AD_PAUSE_BANNER_PARAMS?: string; // текст
  TRIAL_SUGGESTION?: TrialSuggestionCfg;
  FEATURE_OFF_ADS_DISPLAY_TIME?: number;
  FEATURE_COMPLAIN?: boolean;
  COMPLAINT_LIMIT_TIME?: number;
  PAYWALL_NO_ADS_PATH?: string;

  AUTH_URL?: string; // используется для открытия страницы авторизации в эмбедах

  CONTINUE_WATCHING_NOTIFY?: boolean;
  PREVIEW_TIMELINE?: 'PREVIEW' | 'TRACK';

  DISCLAIMER_AGE_RESTRICTIONS?: Nullable<DISCLAIMER_AGE_RESTRICTIONS>;

  SPLASH_SCREEN_IMAGE?: string;
  SPLASH_SCREEN_DURATION?: number;
  // SPLASH_SCREEN_ENABLED?: boolean; // TODO legacy
  // SPLASH_SCREEN_VARIATION: 'MORE_TV' | null; // TODO legacy
  AD_SPLASH_SCREEN_IMAGE?: string;
  AD_SPLASH_SCREEN_DURATION?: number;

  NEXT_EPISODE: 'POSTMESSAGE' | 'LINK' | false;
  PREV_EPISODE: 'POSTMESSAGE' | 'LINK' | false;
  SUBSCRIPTION_TITLE: string;
  SUBSCRIPTION_PREVIEW: SubscriptionPreviewType;
  AUTOPLAY: 'ALWAYS' | 'NEVER' | 'ON' | 'OFF';

  ADV_CACHE_LOOKAHEAD: string;
  ADV_CACHE_TIMEOUT: string;
  ADV_MAX_TIMELINE_OFFSET: string;
  ADV_PLAY_WAIT_TIMEOUT: string;
  ADV_INTERSECTION_TIMEOUT: string;
  ADV_PAUSE_ROLL_ACTIVATE_TIMEOUT: string;
  LOADING_SOURCE_TIMEOUT?: string;

  ADV_START_WARNING: string;
  CONTROLS: boolean;
  DISABLE_BEHOLDER: boolean;
  INFO_BAR_LOGO: boolean;
  LOGO_LINK_TO_HOME: boolean;
  TITLE_LINKS: boolean;
  NEXT_EPISODE_AUTOPLAY: boolean;
  NEXT_EPISODE_AUTOPLAY_SUGGEST: boolean;
  // RESTORE_SUBSCRIPTION: boolean; // TODO legacy
  SHARING: boolean;
  // SHOW_LOGO_CONTROL: boolean; // TODO legacy
  SUBSCRIPTION: boolean;
  // THUMBNAIL_LOGO: boolean; // TODO legacy
  ANDROID_APP_LINK: string;
  IOS_APP_LINK: string;
  ALLOW_FULLSCREEN: boolean;
  PAK_FALLBACK_SRC: boolean;
  // FORCE_PUID_4: boolean;
  SHOW_AD_NUMBER: boolean;
  SENTRY_ENABLED: boolean;

  LIMIT_QUALITY: boolean;
  TOKEN_UPDATE: boolean;
};

export type TEnvConfig = {
  APP_STATIC_ENDPOINT?: string;
  LINKED_AUDIO_TRACKS_CONFIG_PATH?: string;
  SIREN_PUBLIC_HOST: string;

  AD_FOX_OWNER_ID: string;
  DEBUG_MODE: boolean;
  NODE_ENV?: string;
  APP_VERSION?: string;
  LOG_LEVEL?: LogLevel;
  SIREN_HOST: string;
  HORUS_SRC: string;
  INDEXED_DB_LIMIT: number | null;
  HORUS_ENABLED: boolean;
  HORUS_BLACKLIST: string | null;
  WHAT_IS_MY_BROWSER_KEY?: string;
  WHAT_IS_MY_BROWSER_LINK?: string;
  IP?: string;
  SENTRY_EVENT_RATE: number | null;
  SENTRY_DSN?: string;
  SAURON_API_URL?: string;
  CDN_HOSTNAME: string;
  FAIRPLAY_CERT_ENDPOINT: string;
  YMID: number | null;
  PUBLIC_BE_ENDPOINT: string;
};

export type THydraResponse = {
  config_source: TConfigSource;
  skin_theme_class: SkinClass;
  partner_id: number;
  base: Partial<TFeatureConfig>;
  embedded: Partial<TFeatureConfig>;
  id: string;
};

export type TScrobbling = {
  hostname: string;
  mandatory_points: number[];
  period: number;
  serviceId: Nullable<number>;
};

export type Puid12 = {
  site: number;
  embed: number;
};

export type TRawConfig = {
  ad?: TRawAdConfig;
  post_image: string;
  pre_image: string;
  project_id: number;
  puid12?: Puid12;
  ref: string;
  scrobbling?: TScrobbling;
  sid: string;
  skin_id: number;
  stat_url: string;
  user_id: Nullable<number>;
  videofile_id: number;
};

export enum StreamProtocol {
  HLS = 'HLS',
  DASH = 'DASH',
  MSS = 'MSS',
  MP4 = 'MP4',
}
export enum DRM_TYPE {
  FAIRPLAY = 'fairplay',
  WIDEVINE = 'widevine',
  PLAYREADY = 'playready',
}

export type TStreamItem = {
  drm_type: Nullable<DRM_TYPE>;
  ls_url: Nullable<string>;
  manifest_expires_at: number | null;
  protocol: StreamProtocol;
  url: string;
};

export type TStreamsConfig = TStreamItem[];

export type LinkedTrackQueryParams = {
  previewFrom: Nullable<string>;
  previewTo: Nullable<string>;
  sign: Nullable<string>;
  p2p?: 0 | 1;
};

export type TLinkedTrackConfig = {
  canonicalUrl: string;
  caption?: string;
  episode?: number;
  playerConfig: string;
  playerUrl?: string;
  projectId?: number;
  season?: number;
  thumbnail?: string;
  trackHubId?: number;
  trackId?: number;
  trackVod?: {
    link: string;
    playerLink: string;
    queryParams: LinkedTrackQueryParams;
  };
};

export type TLinkedTracks = {
  next: Nullable<TLinkedTrackConfig>;
  previous: Nullable<TLinkedTrackConfig>;
};

export type Badge = {
  text: string | null;
  badgeColor: string | null;
  textColor: string | null;
};

export type TAutoSwitchConfig = {
  badge: Nullable<Badge>;
  caption: string;
  caption_v2: string;
  countdown: number;
  point: number;
  project_poster: Nullable<string>;
  subtitle?: string;
  title?: string;
};

export type HeartBeatTnsParams = Array<{ key: string; value: string | number }>;
export type THeartBeatTnsCounterConfig = {
  link: string;
  params: HeartBeatTnsParams;
};

export type TnsCounter = {
  video_end: string;
  video_load: string;
  video_start: string;
};

export type ConfigErrors = RawPlayerError[];

export type PreviewDurationOpts = {
  from: number;
  to: number;
};

export type TPlaylistItem = {
  error: string;
  errors: ConfigErrors | null;
  auto_switch: TAutoSwitchConfig;
  dash_url: string;
  hls_url: string;
  transaction_id: Nullable<number>;
  confirm_min_age: boolean;
  contentrolls?: TContentRollsConfig;
  drm: string;
  duration: number;
  episode_name: string;
  feature_film: boolean;
  heartbeat_tns_counter_v1_3: THeartBeatTnsCounterConfig;
  linked_tracks?: TLinkedTracks;
  midrolls?: TMiddleRollsConfig;
  prerolls?: TPreRollsConfig;
  min_age: number;
  paid: boolean;
  previews_hls: string[];
  previews_mp4: string[];
  preview_streams?: Array<TStreamItem>;
  preview_duration?: PreviewDurationOpts;
  project_id: number;
  project_name: string;
  project_url?: string;
  season_url?: string;
  season_name: string;
  sharing_url: string;
  streaming_origin: 'HUB' | 'PAK';
  streams?: TStreamsConfig;
  sub_types: 'svod' | null;
  thumbnail_url: string;
  tns_counter: TnsCounter;
  track_id: number;
  views: number;
  adfox_season_id?: number;
  num_in_project?: number;
};

export type TRawPlaylist = {
  items: TPlaylistItem[];
};

export type TBaseConfig = {
  config: TRawConfig;
  playlist: TRawPlaylist;
};

export type TConfig = {
  config: TRawConfig;
  playlist: TRawPlaylist;
  features: THydraResponse;
  serviceTariffs: SubscriptionTariffs[] | null;
  trackInfo: TrackInfoData | null;
  subscription: UserSubscription[] | null;
  mediascopeCounter: MediascopeCounterResponse | null;
  experiments: ExperimentsCfg | null;
};

export type Override<T, O> = Omit<T, keyof O> & O;

export type TParsedFeatures = Partial<
  Override<
    TFeatureConfig,
    {
      ADV_CACHE_LOOKAHEAD: number;
      ADV_CACHE_TIMEOUT: number;
      ADV_MAX_TIMELINE_OFFSET: number;
      ADV_PLAY_WAIT_TIMEOUT: number;
      ADV_INTERSECTION_TIMEOUT: number;
      ADV_PAUSE_ROLL_ACTIVATE_TIMEOUT: number;
      LOADING_SOURCE_TIMEOUT?: number;
    }
  >
>;

export type TExtendedConfig = Omit<TConfig, 'subscription'> & {
  context: TParams | null;
};

export enum ERROR {
  SIREN_UNAVAILABLE = 'SIREN_UNAVAILABLE',
  HYDRA_UNAVAILABLE = 'HYDRA_UNAVAILABLE',
  INVALID_PARTNER_ID = 'INVALID_PARTNER_ID',
  INVALID_CONFIG_SOURCE = 'INVALID_CONFIG_SOURCE',
  INVALID_TRACK_ID = 'INVALID_TRACK_ID',
  INVALID_BODY = 'INVALID_BODY',
  NOT_FOUND = 'NOT_FOUND',
}
