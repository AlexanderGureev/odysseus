/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { TParameters } from './parameters';

export const PARAMS_SELECTOR: { [key in keyof TParameters]: (state: any) => TParameters[key] | null } = {
  module: () => null,
  hacks_detected: () => null,
  user_subscription: () => null,
  device_timestamp: () => null,
  device_timezone: () => null,
  viewport_height: () => null,
  viewport_width: () => null,
  fullscreen: () => null,
  nessie_id: () => null,
  track_id: () => null,
  video_position: () => null,
  // video_resolution: (state: AppState) => state.player.video_resolution,
  video_type: () => null,
  drm: () => null,
  drm_supported: () => null,
  bitrate: () => null,
  bandwidth: () => null,
  readahead: () => null,
  dropped_frames: () => null,
  shown_frames: () => null,
  video_format: () => null,
  audio_format: () => null,
  stream_hostname: () => null,
  app_name: () => null,
  player_embedded: () => null,
  player_id: () => null,
  player_version: () => null,
  // device_id: (state: AppState) => state.player.device_id,
  volume: () => null,
  stream_chosen: () => null,
  device_type: () => null,
  device_os: () => null,
  device_model: () => null,
  sauron_id: () => null,
  network_type: () => null,
  event_num: () => null,
  ym_client_id: () => null,
  videosession_id: () => null,
  debug_info: () => null,
  streaming_session_id: () => null,
  ad_roll_type_puid3: () => null,
  video_business_model: () => null,
  partner_id: () => null,
};
