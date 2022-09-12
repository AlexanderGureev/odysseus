import { Experiments } from '@moretv/types';
import { NextTrackConfig } from 'api/types';
import { TParams } from 'server/utils';
import { TManifestData } from 'services/ManifestParser/types';
import { TCapabilities } from 'services/StreamService/utils/supports';
import { DefaultPayload, ErrorPayload, WithoutPayload } from 'store/types';
import { SkinClass, TConfig, TExtendedConfig, TParsedFeatures, TStreamItem } from 'types';
import { TAdConfigByCategory, TAdPointsConfig } from 'types/ad';
import { RawPlayerError } from 'types/errors';
import { UserSubscription } from 'types/UserSubscription';

export type State =
  | 'IDLE'
  | 'RENDER'
  | 'SELECTING_PLAYER_THEME'
  | 'PAYWALL'
  | 'CHECK_ERROR_PENDING'
  | 'INIT_ANALYTICS_PENDING'
  | 'INIT_SERVICES_PENDING'
  | 'CHECK_PREVIEW_PENDING'
  | 'PARSE_CONFIG_PENDING'
  | 'CHECK_ADULT_CONTENT'
  | 'CHECK_RESUME_VIDEO'
  | 'PLAYER_INIT_PENDING'
  | 'CHECK_PERMISSIONS_PENDING'
  | 'FETCHING_CONFIG'
  | 'LOADED_CONFIG'
  | 'INIT_PENDING'
  | 'INITIALIZED'
  | 'CHECK_CAPABILITIES_PENDING'
  | 'SELECT_SOURCE_PENDING'
  | 'READY'
  | 'RESUME_VIDEO_PENDING'
  | 'ERROR'
  | 'INITIAL_SELECT_SOURCE_PENDING'
  | 'AD_INIT_PENDING'
  | 'BIG_PLAY_BUTTON'
  | 'CHECK_AUTOPLAY'
  | 'FETCHING_MANIFEST'
  | 'INITIAL_FETCHING_MANIFEST'
  | 'INITIALIZING_QUALITY_SERVICE'
  | 'INITIAL_SELECT_MANIFEST_PENDING'
  | 'SELECT_MANIFEST_PENDING'
  | 'SETUP_INITIAL_VOLUME'
  | 'DISPOSED';

export type ParsedConfigData = {
  config: TExtendedConfig;
  features: TParsedFeatures;
  subscription: UserSubscriptionsState;
  meta: Meta;
  session: SessionState;
  adConfig: TAdConfigByCategory | null;
  adPoints: TAdPointsConfig;
  params: TrackParams;
};

export type PlayerTheme = 'default' | 'trailer';

export type EventsWithPayload =
  | WithoutPayload<
      | 'CHECK_ERROR_RESOLVE'
      | 'CHECK_PREVIEW'
      | 'INIT_SERVICES_RESOLVE'
      | 'INIT_ANALYTICS_RESOLVE'
      | 'PLAYER_INIT_RESOLVE'
      | 'FETCH_CONFIG_REJECT'
      | 'DO_INIT'
      | 'SET_SOURCE'
      | 'LOAD_META'
      | 'CLICK_BIG_PLAY_BUTTON'
      | 'CHECK_AUTOPLAY_RESOLVE'
      | 'SHOW_BIG_PLAY_BUTTON'
      | 'SELECT_MANIFEST_RESOLVE'
      | 'SETUP_INITIAL_VOLUME_RESOLVE'
      | 'BEFORE_UNLOAD'
      | 'PAYWALL_SHOWN'
      | 'RESIZE'
      | 'DISPOSE_PLAYER'
      | 'MENU_SHOWN'
      | 'QUALITY_MENU_SHOWN'
    >
  | ErrorPayload<
      | 'CHECK_ERROR_REJECT'
      | 'INIT_SERVICES_REJECT'
      | 'INIT_ANALYTICS_REJECT'
      | 'INIT_REJECT'
      | 'PLAYER_INIT_REJECT'
      | 'CHECK_CAPABILITIES_REJECT'
      | 'SELECT_SOURCE_ERROR'
      | 'FETCHING_MANIFEST_REJECT'
    >
  | {
      type: 'INIT_RESOLVE';
      payload: { meta: Meta; session: SessionState; deviceInfo: DeviceInfo };
    }
  | {
      type: 'SELECTING_PLAYER_THEME_RESOLVE';
      payload: {
        theme: PlayerTheme;
      };
    }
  | {
      type: 'PARSE_CONFIG_RESOLVE';
      payload: ParsedConfigData;
    }
  | {
      type: 'PARSE_CONFIG_REJECT';
      payload: ParsedConfigData;
      meta: {
        error: RawPlayerError;
      };
    }
  | {
      type: 'CHECK_PREVIEW_RESOLVE';
      payload: { previews: TStreamItem[]; previewDuration: number };
    }
  | {
      type: 'CHECK_PERMISSIONS_RESOLVE';
      payload: { permissions: Permissions };
    }
  | {
      type: 'PARSE_CONFIG';
      meta: { config: TConfig; context: TParams | null; params?: TrackParams };
    }
  | {
      type: 'SELECT_SOURCE_RESOLVE';
      payload: { currentStream: TStreamItem };
    }
  | {
      type: 'FETCH_CONFIG';
      payload: { meta: Meta };
    }
  | {
      type: 'DO_PLAYER_INIT';
    }
  | {
      type: 'SET_STATE';
      payload: {
        isShowPlayerUI: boolean;
      };
    }
  | {
      type: 'CHECK_CAPABILITIES_RESOLVE';
      payload: { capabilities: Array<keyof TCapabilities> };
    }
  | {
      type: 'FETCHING_MANIFEST_RESOLVE';
      payload: {
        manifestData: TManifestData;
      };
    }
  | {
      type: 'CHANGE_TRACK';
      meta: { config: NextTrackConfig; context: Partial<TParams> | null; params?: TrackParams };
    }
  | {
      type: 'CLICK_MENU_ITEM';
      meta: { title: string; block?: string };
    }
  | {
      type: 'TRACK_DESCRIPTION_CLICK';
      meta: { type: 'project' | 'season' | 'track' };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type Meta = {
  partnerId: number | null;
  trackId: number | null;
  skin: SkinClass | null;
  isEmbedded: boolean;
  userToken: string | null;
  parentHost: string | null;
  tokenExpiredAt: number | null;
};

export enum OS {
  IOS = 'iOS',
  ANDROID = 'Android',
  WIN_PHONE = 'Windows Phone',
}

export enum DeviceType {
  IOS = 'ios',
  ANDROID = 'android',
  APPLE_TV = 'appletv',
  ANDROID_TV = 'androidtv',
  WEB_DESKTOP = 'web_desktop',
  WEB_IOS = 'web_ios',
  WEB_ANDROID = 'web_android',
  WEB_UNKNOWN = 'web_unknown',
  MOBILE_UNKNOWN = 'mobile_unknown',
  TIZEN = 'web_tizen',
  WEB_OS = 'webos',
  WIN_PHONE = 'win_phone',
}

export type DeviceInfo = {
  isMobile: boolean;
  isSafari: boolean | undefined;
  osName: string | undefined;
  osVersion: string | undefined;
  deviceType: DeviceType | undefined;
  deviceModel: string | undefined;
  browserDescription: string | undefined;
  browser: string | undefined;
  name: string | undefined;
  brand: string | undefined;
  engineName: string | undefined;
  engineVersion: string | undefined;
  browserVersion: string | undefined;
};

export type SessionState = {
  id: string;
  videosession_id: string;
  sid: string | null;
};

type Permissions = {
  autoplay: boolean;
  mute: boolean;
};

export type TrackParams = {
  sign?: string | null;
  pf?: string | null;
  pt?: string | null;
  userId?: string | null;
  p2p?: boolean;
  adult?: boolean;
  autoplay?: boolean;
  trial_available?: boolean;
  startAt?: number | null;
  isVkApp?: boolean;
  web_version?: string;
  experiments?: { [key in Experiments]?: string };
};

export enum SubscriptionState {
  'ACTIVE' = 'ACTIVE',
  'DEFFERED' = 'DEFFERED',
  // 'EXPIRED' = 'EXPIRED',
}

export type UserSubscriptionsState = { [key in SubscriptionState]: UserSubscription | null };

export type FSMState = {
  step: State;
  meta: Meta;
  session: SessionState;
  params: TrackParams;

  currentStream: TStreamItem | null;
  manifestData: TManifestData | null;

  config: TExtendedConfig;
  adConfig: TAdConfigByCategory | null;
  adPoints: TAdPointsConfig;
  features: TParsedFeatures;
  previews: TStreamItem[] | null;
  previewDuration: number | null;
  subscription: UserSubscriptionsState;

  capabilities: Array<keyof TCapabilities>;
  permissions: Permissions;

  theme: PlayerTheme;
  isShowPlayerUI: boolean;
  isFirstStartPlayback: boolean;

  deviceInfo: DeviceInfo;
};
