import { toNumber } from 'lodash';
import { AppState,store } from 'store';
import { TConfig } from 'types';

import { TAdBreakConfig,TOptions } from '../types';

const CUSTOM_DIMENSION_KEYS = [
  'project_id', // id проекта
  'paid', // true - требуется подписка для воспроизведения
  'referrer',
  'ssid', // стриминговая сессия, 1 на 1 трек
  'track_id', // id трека
  'player_embedded', // эмбедность плеера (parent iframe hostname или referrer !== sharing_url из конфига)
  'stream_hostname', // hostname медиасервера
  'audio_codec', // аудиокодек из манифеста
  'video_codec', // видеокодек из манифеста
  'drm_supported', // список поддерживаемых drm технологий
  'nessie_id', // user id из сервиса nessie
  'video_business_model', // avod, svod, free
  'network_type',
  'ym_client_id', // client id из яндекс метрики веба
  'videosession_id', // видеосессия, 1 на время жизни плеера
  'theme_class', // тема плеера, moretv, ctc...
  'capabilities', // список поддерживаемых протоколов и drm технологий (hls, dash, widevine...)
  'history', // история по протоколам и drm техногиям
  'web_version',
  'autoplay', // поддержка автоплея
  'mute', // состояние звука при автоплее
  'app_name', // moretv, ctc...
  'player_id',
  'drm',
];

export const getResetedOptions = (): TOptions => {
  return {
    'content.customDimensions': CUSTOM_DIMENSION_KEYS.reduce((acc, key) => ({ ...acc, [key]: null }), {}),
  };
};

export const getBaseOptionsSelector = (config: TConfig | undefined) => {
  // if (!config?.data) return {};
  // const { partner_id = window?.REQUEST_CONTEXT?.partnerId, skin_theme_class: theme_class } =
  //   config.data?.config?.skin_data || {};
  // const {
  //   track_id = window?.REQUEST_CONTEXT?.trackId,
  //   paid,
  //   project_id,
  //   drm,
  //   project_name,
  //   season_name,
  //   episode_name,
  // } = config.data?.playlist?.items?.[0] || {};
  // const { app_name, ...rest } = getId();
  // const { player_embedded } = store.getState()?.player || {};
  // const { ACTIVE } = adapterUserSubsciptions(config.data.subscriptions || []);
  // return {
  //   'content.title': `odysseus:${app_name}:${partner_id}`,
  //   'content.customDimensions': {
  //     project_id,
  //     partner_id: toNumber(partner_id),
  //     track_id: toNumber(track_id),
  //     paid,
  //     drm: drm !== 'false' ? drm : undefined,
  //     theme_class,
  //     player_embedded,
  //     subscription_type: getUserSubscriptionType(ACTIVE),
  //     ...rest,
  //   },
  //   'content.season': season_name?.match(CONTAIN_NUMBER_REGEX)?.[0],
  //   'content.episodeTitle': project_name ? `${project_name}${episode_name ? ' ' + episode_name : ''}` : undefined,
  // };
};

export const getExtendOptionsSelector = (state: AppState) => {
  // const { player_embedded, stream_hostname, audio_codec, video_codec, drm_supported, nessie_id } = state.player;
  // const {
  //   episodeName,
  //   seasonName,
  //   projectName,
  //   projectId,
  //   partnerId,
  //   paidSubscription,
  //   referrer,
  //   sessionId,
  //   videoId,
  //   webVersion,
  // } = state.config?.video_data || {};
  // const video_business_model = state.advertisement.video_business_model;
  // const { network_type, ym_client_id, videosession_id } = state.analytics;
  // const { autoplay, mute } = state.internal;
  // const { SKIN_NAME } = state.config?.featuring || {};
  // const app_name = APP_CLASSNAMES[SKIN_NAME] || 'unknown';
  // const { currentStream, capabilities, history } = state.stream;
  // return {
  //   'content.title': `odysseus:${app_name}:${partnerId}`,
  //   'content.customDimensions': {
  //     partner_id: partnerId,
  //     project_id: projectId,
  //     track_id: videoId,
  //     paid: paidSubscription,
  //     referrer,
  //     ssid: sessionId,
  //     player_embedded,
  //     stream_hostname,
  //     audio_codec,
  //     video_codec,
  //     drm_supported,
  //     nessie_id,
  //     video_business_model,
  //     network_type,
  //     ym_client_id,
  //     videosession_id,
  //     theme_class: SKIN_NAME,
  //     capabilities,
  //     history,
  //     web_version: webVersion,
  //     autoplay,
  //     mute,
  //     subscription_type: getUserSubscriptionType(state.userSubscriptions.ACTIVE),
  //   },
  //   'content.season': seasonName?.match(CONTAIN_NUMBER_REGEX)?.[0],
  //   'content.episodeTitle': projectName ? `${projectName}${episodeName ? ' ' + episodeName : ''}` : undefined,
  //   'content.streamingProtocol': currentStream?.protocol,
  //   'content.drm': currentStream?.drm_type,
  // };
};

export const getPlaybackOptions = (state: AppState) => {
  // const {
  //   is_visible_page,
  //   playback,
  //   video_type,
  //   shown_frames,
  //   stream_hostname,
  //   stream_src,
  //   volume,
  //   audio_codec,
  //   video_codec,
  //   stream_chosen,
  // } = state.player;
  // const { is_fullscreen } = state.framework;
  // return {
  //   volume,
  //   shown_frames,
  //   stream_hostname,
  //   stream_src,
  //   stream_chosen,
  //   audio_codec,
  //   video_codec,
  //   is_visible_page,
  //   is_fullscreen,
  //   playback,
  //   video_type,
  // };
};

export const getAdOptions = (state: AppState) => {
  // const { volume } = state.player;
  // const { is_fullscreen } = state.framework;
  // return {
  //   isAudioEnabled: volume > 0,
  //   isFullscreen: is_fullscreen,
  // };
};

export const getTrackMetaSelector = (config: TConfig | undefined) => {
  // const meta = config?.data?.playlist?.items?.[0];
  // if (!meta) return null;
  // return {
  //   track_id: meta.track_id,
  //   project_id: meta.project_id,
  // };
};

export const getViewEventParamsSelector = (state: AppState) => {
  // const {
  //   analytics: { videosession_id },
  //   config: {
  //     video_data: { videoId, sessionId },
  //   },
  // } = state;
  // return {
  //   track_id: videoId,
  //   videosession_id,
  //   ssid: sessionId,
  // };
};
