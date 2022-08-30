import { Nullable } from 'types';

import { TParameters } from './parameters';

export type HorusParamName = keyof TParameters;

export type THorusConfig = {
  heartbeat_period: number;
  max_event_list_items: number;
  flush_buffer_period: number;
};

export type TEventParams = { [key in keyof TParameters]: TParameters[key] };

export type THorusEvent = {
  event_name: HorusEventName;
  event_params: Partial<TEventParams>;
};

export type TDBEvent = {
  key: string;
  id: string;
  updatedAt: number;
  status: string;
  payload: THorusEvent;
};

export enum EventStatus {
  IDLE = 'IDLE',
  PENDING = 'PENDING',
}

export type HORUS_EVENT =
  | 'HEARTBEAT'
  | 'HORUS_VIDEO_ERROR'
  | 'HORUS_VIDEO_STARTED'
  | 'HORUS_CLICK_PLAY'
  | 'HORUS_AUTO_PLAY'
  | 'HORUS_CLICK_PAUSE'
  | 'HORUS_AUTO_PAUSE'
  | 'HORUS_SESSION_FINISHED'
  | 'HORUS_SESSION_STARTED'
  | 'HORUS_CLOSE'
  | 'HORUS_GOTO'
  | 'HORUS_CHANGE_QUALITY'
  | 'HORUS_BITRATE_ADOPTION'
  | 'HORUS_REBUFFER'
  | 'HORUS_AD_SHOW_START'
  | 'HORUS_AD_SHOW_END'
  | 'HORUS_AD_REQUEST'
  | 'HORUS_AD_ERROR'
  | 'HORUS_AUTO_SWITCH_START'
  | 'HORUS_AUTO_SWITCH_CLICK_CANCEL'
  | 'HORUS_AUTO_SWITCH_CLICK_NEXT_TRACK'
  | 'HORUS_AUTO_SWITCH_SWITCH_NEXT_TRACK'
  | 'HORUS_CUSTOM_EVENT'
  | 'HORUS_ERROR_RESPONSE'
  | 'HORUS_ERROR_RESPONSE_SEND'
  | 'HORUS_ERROR_RESPONSE_OK'
  | 'HORUS_ERROR_CLOSE';

export enum HorusEventName {
  HEARTBEAT = 'heartbeat',
  HORUS_VIDEO_ERROR = 'video_error',
  HORUS_VIDEO_STARTED = 'video_start',
  HORUS_CLICK_PLAY = 'click_play',
  HORUS_AUTO_PLAY = 'auto_play',
  HORUS_CLICK_PAUSE = 'click_pause',
  HORUS_AUTO_PAUSE = 'auto_pause',
  HORUS_SESSION_FINISHED = 'session_finish',
  HORUS_SESSION_STARTED = 'streaming_session_start',
  HORUS_CLOSE = 'close',
  HORUS_GOTO = 'goto',
  HORUS_CHANGE_QUALITY = 'change_quality',
  HORUS_BITRATE_ADOPTION = 'bitrate_adaptation',
  HORUS_REBUFFER = 'rebuffer',

  HORUS_AD_REQUEST = 'ad_request',
  HORUS_AD_SHOW_START = 'ad_show_start',
  HORUS_AD_SHOW_END = 'ad_show_end',
  HORUS_AD_ERROR = 'ad_error',

  HORUS_AUTO_SWITCH_START = 'auto_switch_start',
  HORUS_AUTO_SWITCH_CLICK_CANCEL = 'auto_switch_click_cancel',
  HORUS_AUTO_SWITCH_CLICK_NEXT_TRACK = 'auto_switch_click_next_track',
  HORUS_AUTO_SWITCH_SWITCH_NEXT_TRACK = 'auto_switch_next_track',

  HORUS_CUSTOM_EVENT = 'custom_event',

  HORUS_ERROR_RESPONSE = 'error_response',
  HORUS_ERROR_RESPONSE_SEND = 'error_response_send',
  HORUS_ERROR_RESPONSE_OK = 'error_response_ok',
  HORUS_ERROR_CLOSE = 'error_close',
}

export const params: HorusParamName[] = [
  'module',
  'hacks_detected',
  'user_subscription',
  'device_timestamp',
  'device_timezone',
  'viewport_height',
  'viewport_width',
  'fullscreen',
  'nessie_id',
  'track_id',
  'video_position',
  // video_resolution,
  'video_type',
  'drm',
  'drm_supported',
  'bitrate',
  'bandwidth',
  'readahead',
  'dropped_frames',
  'shown_frames',
  'video_format',
  'audio_format',
  'stream_hostname',
  'app_name',
  'player_embedded',
  'player_id',
  'player_version',
  // device_id: (state: AppState) => state.player.device_id,
  'volume',
  'stream_chosen',
  'device_type',
  'device_os',
  'device_model',
  'sauron_id',
  'network_type',
  'event_num',
  'ym_client_id',
  'videosession_id',
  'streaming_session_id',
  'video_business_model',
  'partner_id',
];

export const ParamsByEventName: Record<HorusEventName, HorusParamName[]> = {
  [HorusEventName.HORUS_AD_REQUEST]: [...params, 'ad_roll_type_puid3', 'debug_info'],
  [HorusEventName.HORUS_AD_ERROR]: [...params, 'ad_roll_type_puid3', 'debug_info'],
  [HorusEventName.HORUS_AD_SHOW_START]: [...params, 'ad_roll_type_puid3', 'debug_info'],
  [HorusEventName.HORUS_AD_SHOW_END]: [...params, 'ad_roll_type_puid3', 'debug_info'],

  [HorusEventName.HORUS_ERROR_RESPONSE]: [...params],
  [HorusEventName.HORUS_ERROR_RESPONSE_SEND]: [...params],
  [HorusEventName.HORUS_ERROR_RESPONSE_OK]: [...params],
  [HorusEventName.HORUS_ERROR_CLOSE]: [...params],
  [HorusEventName.HORUS_VIDEO_ERROR]: [...params, 'debug_info'],

  [HorusEventName.HORUS_SESSION_STARTED]: [...params, 'debug_info'],
  [HorusEventName.HORUS_CLICK_PLAY]: [...params],
  [HorusEventName.HORUS_AUTO_PLAY]: [...params],
  [HorusEventName.HORUS_VIDEO_STARTED]: [...params],
  [HorusEventName.HEARTBEAT]: [...params],

  [HorusEventName.HORUS_CLICK_PAUSE]: [...params],
  [HorusEventName.HORUS_AUTO_PAUSE]: [...params],
  [HorusEventName.HORUS_GOTO]: [...params],
  [HorusEventName.HORUS_CHANGE_QUALITY]: [...params],
  [HorusEventName.HORUS_BITRATE_ADOPTION]: [...params],
  [HorusEventName.HORUS_REBUFFER]: [...params],
  [HorusEventName.HORUS_SESSION_FINISHED]: [...params],
  [HorusEventName.HORUS_CLOSE]: [...params],

  [HorusEventName.HORUS_CUSTOM_EVENT]: [...params, 'debug_info'],

  [HorusEventName.HORUS_AUTO_SWITCH_START]: [...params],
  [HorusEventName.HORUS_AUTO_SWITCH_CLICK_CANCEL]: [...params],
  [HorusEventName.HORUS_AUTO_SWITCH_CLICK_NEXT_TRACK]: [...params],
  [HorusEventName.HORUS_AUTO_SWITCH_SWITCH_NEXT_TRACK]: [...params],
};

export type ParamsSelector = { [key in keyof TParameters]: () => TParameters[key] | null };

export type HorusInitOpts = {
  paramsSelector: ParamsSelector;
  isEnabled: boolean;
};

export type DebugInfo = Record<string, any> & {
  type?: 'persistent_error' | 'rebuffer';
  duration?: number;
  additional?: {
    hint?: string;
    location?: string;
    video_type?: string;
    is_yandex_creative?: boolean;
  };
  currentStream?: Nullable<{
    ls_url?: string | null;
    url: string;
    manifest_expires_at?: number | null;
    history?: string[];
  }>;
  stream_src?: string | null;
};
