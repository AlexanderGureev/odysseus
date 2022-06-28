import { Nullable } from '../types';
import { SubscriptionTariffs } from '../types/SubscriptionTariffs';

export enum TConfigSource {
  HUB = 'HUB',
  'SIREN_CTC' = 'SIREN_CTC',
  'PAK' = 'PAK',
}

export enum TSkinClass {
  CTC = 'CTC',
  VIDEOMORE = 'VIDEOMORE',
  MORE_TV = 'MORE_TV',
  DOMASHNIY = 'DOMASHNIY',
  CTC_LOVE = 'CTC_LOVE',
  CTC_KIDS = 'CTC_KIDS',
  CHE = 'CHE',
  DEFAULT = 'DEFAULT',
}

export type TFeatureConfig = {
  NEXT_EPISODE: 'POSTMESSAGE' | 'LINK' | false;
  PREV_EPISODE: 'POSTMESSAGE' | 'LINK' | false;
  SPLASH_SCREEN_VARIATION: 'MORE_TV' | null;
  SUBSCRIPTION_TITLE: string;
  SUBSCRIPTION_PREVIEW: 'HUB' | 'PAK' | 'FALSE';
  AUTOPLAY: 'ALWAYS' | 'NEVER' | 'ON' | 'OFF';

  ADV_CACHE_LOOKAHEAD: string;
  ADV_CACHE_TIMEOUT: string;
  ADV_MAX_TIMELINE_OFFSET: string;
  ADV_PLAY_WAIT_TIMEOUT: string;
  ADV_INTERSECTION_TIMEOUT: string;
  ADV_PAUSE_ROLL_ACTIVATE_TIMEOUT: string;

  ADV_START_WARNING: string;
  CONTROLS: boolean;
  DISABLE_BEHOLDER: boolean;
  INFO_BAR_LOGO: boolean;
  LOGO_LINK_TO_HOME: boolean;
  TITLE_LINKS: boolean;
  NEXT_EPISODE_AUTOPLAY: boolean;
  NEXT_EPISODE_AUTOPLAY_SUGGEST: boolean;
  RESTORE_SUBSCRIPTION: boolean;
  SHARING: boolean;
  SHOW_LOGO_CONTROL: boolean;
  SUBSCRIPTION: boolean;
  THUMBNAIL_LOGO: boolean;
  ANDROID_APP_LINK: string;
  IOS_APP_LINK: string;
  ALLOW_FULLSCREEN: boolean;
  PAK_FALLBACK_SRC: boolean;
  FORCE_PUID_4: boolean;
  SHOW_AD_NUMBER: boolean;
  SENTRY_ENABLED: boolean;
};

export type TEnvConfig = {
  AD_FOX_OWNER_ID: string;
  DEBUG_MODE: boolean;
  NODE_ENV?: string;
  APP_VERSION?: string;
  LOG_LEVEL?: string;
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
  YOUBORA_ACCOUNT_CODE?: string;
  YOUBORA_SERVICE_ENABLED: boolean;
};

export type THydraResponse = {
  config_source: TConfigSource;
  skin_theme_class: TSkinClass;
  partner_id: number;
  base: Partial<TFeatureConfig>;
  embedded: Partial<TFeatureConfig>;
  id: string;
};

export enum AdCategory {
  PRE_ROLL = 'pre_roll',
  CONTENT_ROLL = 'content_roll',
  MID_ROLL = 'mid_roll',
  PAUSE_ROLL = 'pause_roll',
  POST_ROLL = 'post_roll',
  PRE_PAUSE_ROLL = 'pre_pause_roll',
  POST_PAUSE_ROLL = 'post_pause_roll',
}

export type TRawPoint = {
  point: number;
};
export type TAdItem = {
  item: string;
  type?: string;
};
export type TAdParams = {
  limiter: number;
  type: string;
};
export type TRawAdRollData = {
  items: TAdItem[];
  params: TAdParams;
};
export type TRawAdConfig = {
  [key in AdCategory]?: TRawAdRollData;
};

export type TScrobbling = {
  hostname: string;
  mandatory_points: number[];
  period: number;
  serviceId: Nullable<number>;
};

export type TRawConfig = {
  ad: TRawAdConfig;
  post_image: string;
  pre_image: string;
  project_id: number;
  puid12?: {
    site: number;
    embed: number;
  };
  ref: string;
  scrobbling: TScrobbling;
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
  manifest_expires_at: number;
  protocol: StreamProtocol;
  url: string;
};

export type TStreamsConfig = TStreamItem[];

export type TLinkedTrackConfig = {
  canonicalUrl: string;
  caption?: string;
  episode?: number;
  playerConfig: string;
  playerUrl: string;
  projectId?: number;
  season?: number;
  thumbnail?: string;
  trackHubId?: number;
  trackId?: number;
};
export type TLinkedTracks = {
  next: Nullable<TLinkedTrackConfig>;
  previous: Nullable<TLinkedTrackConfig>;
};
export type TAutoSwitchConfig = {
  caption: string;
  caption_v2: string;
  countdown: number;
  point: number;
  project_poster: Nullable<string>;
};

export type TPlaceholder = { id: number; sponsorship: string };
export type TContentRollPoint = {
  point: number;
  placeholders?: TPlaceholder;
};
export type TContentUrlConfig = {
  item: string;
  type: string;
};
export type TContentRollsConfig = {
  points: TContentRollPoint[];
  url: TContentUrlConfig[];
};
export type TPreRollsConfig = {
  points: {
    point: number;
  };
};
export type TMiddleRollsConfig = {
  freq_points: number;
  freq_time: number;
  max_midrolls: number;
  points: TRawPoint[];
  skip_adv: number;
  start_time: number;
  url: TAdItem[];
};

export type THeartBeatTnsCounterConfig = {
  link: string;
  params: Array<{ key: string; value: string | number }>;
};

export type TnsCounter = {
  video_end: string;
  video_load: string;
  video_start: string;
};

export type TPlaylistItem = Partial<{
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
  project_id: number;
  project_name: string;
  season_name: string;
  sharing_url: string;
  streaming_origin: 'HUB' | 'PAK';
  streams?: TStreamsConfig;
  sub_types: 'svod' | null;
  thumbnail_url: string;
  tns_counter: TnsCounter;
  track_id: number;
  views: number;
}>;

export type TRawPlaylist = {
  items: TPlaylistItem[];
};

export type TBaseConfig = {
  config: TRawConfig;
  playlist: TRawPlaylist;
};

export type TSessionState = {
  id: string;
  videosession_id: string;
};

export type TConfig = {
  config: TRawConfig;
  playlist: TRawPlaylist;
  features: THydraResponse;
  serviceTariffs?: SubscriptionTariffs[];
};

export type TConfigResponse = {
  data: TBaseConfig;
};

export enum ERROR {
  SIREN_UNAVAILABLE = 'SIREN_UNAVAILABLE',
  HYDRA_UNAVAILABLE = 'HYDRA_UNAVAILABLE',
  INVALID_PARTNER_ID = 'INVALID_PARTNER_ID',
  INVALID_TRACK_ID = 'INVALID_TRACK_ID',
  INVALID_BODY = 'INVALID_BODY',
  NOT_FOUND = 'NOT_FOUND',
}
