/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { PLAYER_ID } from 'components/Player/types';
import { EffectOpts } from 'interfaces';
import { StreamProtocol } from 'services/StreamService/types';
import { getPlaylistItem, getUserSubscriptionType } from 'store/selectors';
import { APP_CLASSNAME, DOMAINS, MAP_HOST_TO_SKIN } from 'types';

import { STREAM_LOWER_CASE, VIDEO_BUSSINESS_MODEL_TYPES } from './parameters';
import { ParamsSelector } from './types';

export const calcTime = (offset: number) => {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const nd = new Date(utc + 3600000 * offset);
  return nd.valueOf();
};

export const getTimeZone = () => {
  const offset = new Date().getTimezoneOffset() / 60;
  let timezone: string;
  if (offset > 0) {
    if (offset < 10) {
      timezone = `0${offset}`;
    } else {
      timezone = String(offset);
    }
  } else if (offset < 0) {
    if (String(offset).length <= 2) {
      timezone = `-0${String(offset)[1]}`;
    } else {
      timezone = String(offset);
    }
  } else {
    timezone = '00';
  }

  return timezone;
};

export const getViewportWidth = (): number | null =>
  (document.getElementById(PLAYER_ID) as HTMLVideoElement)?.offsetWidth ?? null;

export const getViewportHeight = (): number | null =>
  (document.getElementById(PLAYER_ID) as HTMLVideoElement)?.offsetHeight ?? null;

const mapStreamToLowerCase = {
  [StreamProtocol.DASH]: STREAM_LOWER_CASE.DASH,
  [StreamProtocol.HLS]: STREAM_LOWER_CASE.HLS,
  [StreamProtocol.MP4]: STREAM_LOWER_CASE.MP4,
  [StreamProtocol.MSS]: STREAM_LOWER_CASE.MSS,
};

const mapConnectionType: { [key in string]?: string } = {
  wifi: 'wifi',
  cellular: 'mobile',
  ethernet: 'lan',
};

export const VIDEO_BUSSINESS_MODEL_MAP = {
  true: VIDEO_BUSSINESS_MODEL_TYPES.SVOD,
  false: VIDEO_BUSSINESS_MODEL_TYPES.AVOD,
  unknown: VIDEO_BUSSINESS_MODEL_TYPES.UNKNOWN,
};

export const createParamsSelector = ({
  getState,
  services: { playerService, embeddedCheckService },
}: EffectOpts): ParamsSelector => ({
  module: () => null,
  event_num: () => null,
  hacks_detected: () => {
    const list = getState().analytics.hacks_detected;
    return list.length ? list : null;
  },
  user_subscription: () => getUserSubscriptionType(getState().root?.config?.subscription?.[0] || null),
  device_timestamp: () => calcTime(3),
  device_timezone: () => getTimeZone(),
  viewport_height: () => getViewportWidth(),
  viewport_width: () => getViewportHeight(),
  fullscreen: () => (getState().fullscreen.step === 'FULLSCREEN' ? 'yes' : 'no'),
  nessie_id: () => getState().root.config.config?.user_id ?? null,
  track_id: () => getState().root.meta.trackId,
  video_position: () => getState().playback.currentTime,
  // video_resolution: (state: AppState) => state.player.video_resolution,
  video_type: () => (getState().adController.step === 'AD_BREAK' ? 'ad' : 'video'),
  drm: () => {
    const type = getState().root.currentStream?.drm_type;
    return type || 'no_drm';
  },
  drm_supported: () => {
    const { capabilities } = getState().root;
    const list = capabilities.filter((k) => ['widevine', 'fairplay', 'playready'].includes(k)) as Array<
      'fairplay' | 'widevine' | 'playready'
    >;
    return list;
  },
  bitrate: () => getState().quality.videoMeta.bitrate,
  bandwidth: () => playerService.getTech()?.bandwidth || null,
  readahead: () => {
    const {
      playback: { currentTime },
      buffering,
    } = getState();

    const bufferedEnd = Number((buffering.bufferedEnd - (currentTime || 0)).toFixed(1));
    return bufferedEnd >= 0 ? bufferedEnd : 0;
  },
  dropped_frames: () => getState().quality.videoMeta.dropped_frames,
  shown_frames: () => getState().quality.videoMeta.shown_frames,
  video_format: () => getState().quality.videoMeta.video_format,
  audio_format: () => getState().root.manifestData?.parsedManifest.audioFormat ?? null,
  stream_hostname: () => getState().root.manifestData?.responseUrl ?? null,
  app_name: () => {
    const skin = getState().root.meta.skin;
    if (!skin || skin === 'DEFAULT') {
      const ref = embeddedCheckService.getState().location ?? document.referrer;
      const host = String(
        ref.match(/more\.tv|che\.tv|ctc\.ru|ctckids\.ru|domashniy\.ru|ctclove\.ru|videomore\.ru/i)
      ) as DOMAINS;

      return MAP_HOST_TO_SKIN[`${host}`] ?? 'DEFAULT';
    }

    return APP_CLASSNAME[skin] ?? 'DEFAULT';
  },
  player_embedded: () => getState().root.meta.isEmbedded,
  player_id: () => getState().root.meta.skin,
  player_version: () => window.ENV.APP_VERSION ?? null,
  // device_id: (state: AppState) => state.player.device_id,
  volume: () => getState().volume.volume,
  stream_chosen: () => {
    const p = getState().root.currentStream?.protocol;
    return p ? mapStreamToLowerCase[p] : null;
  },
  device_type: () => getState().root.deviceInfo.deviceType ?? null,
  device_os: () => getState().root.deviceInfo.osName ?? null,
  device_model: () => getState().root.deviceInfo.deviceModel ?? null,
  sauron_id: () => getState().root.session.sid,
  network_type: () => {
    const type = getState().network.connectionType;
    return mapConnectionType[`${type}`] || null;
  },
  ym_client_id: () => getState().analytics.ym_client_id || null,
  videosession_id: () => getState().root.session.videosession_id,
  debug_info: () => null,
  streaming_session_id: () => getState().root.session.id,
  ad_roll_type_puid3: () => getState().adBlock.adFoxParams?.puid3 || null,
  video_business_model: () => {
    const paid = getPlaylistItem(getState()).paid ?? 'unknown';
    return getState().root.previews ? VIDEO_BUSSINESS_MODEL_TYPES.PREVIEW : VIDEO_BUSSINESS_MODEL_MAP[`${paid}`];
  },
  partner_id: () => getState().root.meta.partnerId,
});
