import { Experiments } from '@moretv/types';
import { OnceSubscribe, Subscribe, Unsubscribe } from 'services/MediatorService/types';
import { TS_TRIGGER } from 'store/slices/trialSuggestion/utils';
import { TLinkedTrackConfig, TLinkedTracks } from 'types';
import { AdCategory } from 'types/ad';
import { ERROR_TYPE } from 'types/errors';

export enum ERROR_CODE {
  ADULT_CONTENT = 154,
  RESUME_NOTIFY = 155,
}

export enum NOTIFY_TYPES {
  PAYWALL_ON_START = 1,
  PAYWALL_AFTER_PREVIEW = 2,
}

type Payload<T> = {
  payload: T;
};

export type OutputEvents = {
  loaded: () => void;

  getPageLocation: () => void;
  switch_cancel: (
    data: Payload<{
      videosession_id: string;
      time_cursor: number;
      trackDescription: TLinkedTrackConfig;
      trackId: number;
      projectId: number;
    }>
  ) => void;
  new_track: (
    data: Payload<{
      target: 'next' | 'prev' | 'change_audio_track';
      auto: boolean;
      trackDescription: TLinkedTrackConfig;
      overlay: boolean;
      videosession_id: string;
      time_cursor: number;
      track_id: number | null;
      project_id: number;
    }>
  ) => void;
  auto_switch: (
    data: Payload<{
      videosession_id: string;
      time_cursor: number;
      trackDescription: TLinkedTrackConfig;
      trackId: number | null;
      projectId: number;
    }>
  ) => void;

  inited: (data: Payload<{ adv: boolean; tracks: TLinkedTracks | null }>) => void;
  'inited-player': () => void;
  started: (data: { time: number }) => void;
  'video-started': () => void;
  paused: (data: { time: number }) => void;
  ended: (data: { time: number }) => void;
  error: (data: { code?: number; payload?: { code: number; type: ERROR_TYPE; track_id: number | null } }) => void;

  rewound: (data: { time: number; previousTime: number }) => void;
  adShown: (data: { time: number }) => void;
  pay_and_watch_button: (data: Payload<{ time_cursor: number; btn_type?: 'about' }>) => void;

  // subscription_restore: () => void;

  'exit-full-screen': () => void;
  'enter-full-screen': () => void;
  show_payment_popup: () => void;
  button_disable_ad: () => void;
  'launch-player': (data: Payload<{ volume: number; is_sub_button: boolean }>) => void;
  play: (data: Payload<{ videosession_id: string; track_id: number | null }>) => void;
  view: (data: Payload<{ videosession_id: string; track_id: number | null }>) => void;
  watchpoint: (
    data: Payload<{
      track_id: number | null;
      videosession_id: string;
      user_id: number | null;
      time_cursor: number;
      duration: number | null;
      value: number | string;
      sid: string | null;
    }>
  ) => void;
  time_roll: (
    data: Payload<{
      event_value: string;
      videosession_id: string;
      time_cursor: number;
      track_id: number | null;
      project_id: number;
    }>
  ) => void;
  player_refresh: () => void;
  playerStarted: () => void;
  notify: (data: { code: NOTIFY_TYPES }) => void;
  token_expired: () => void;

  BI: (
    data: Payload<{
      page?: string;
      block?: string;
      event_name?: string;
      event_type?: string;
      event_value?: string;
      answer?: string;
      project_id?: number;
      track_id?: number | null;
      videosession_id?: string;
    }>
  ) => void;
  play_btn_click: (data: Payload<{ btn_type: 'play' | 'pause' }>) => void;

  error_response: (
    data: Payload<{
      project_id: number;
      track_id: number;
      videosession_id: string;
      time_cursor: number;
    }>
  ) => void;
  error_response_send: (
    data: Payload<{
      project_id: number;
      track_id: number;
      videosession_id: string;
      time_cursor: number;
      event_value: string;
    }>
  ) => void;
  error_response_ok: (
    data: Payload<{
      project_id: number;
      track_id: number;
      videosession_id: string;
      time_cursor: number;
      event_value: string;
    }>
  ) => void;
  error_close: (
    data: Payload<{
      project_id: number;
      track_id: number;
      videosession_id: string;
      time_cursor: number;
      event_value: string;
    }>
  ) => void;

  recommendation_show: (
    data: Payload<{
      track_id: number;
      project_id: number;
      event_name: string;
      event_type: string;
    }>
  ) => void;
  recommendation_hide: (
    data: Payload<{
      track_id: number;
      project_id: number;
      event_name: string;
    }>
  ) => void;
  recommendation_tile: (
    data: Payload<{
      track_id: number;
      project_id: number;
      event_name: string;
      event_value: string;
      position: number;
    }>
  ) => void;
  recommendation_left: (
    data: Payload<{
      track_id: number;
      project_id: number;
      event_name: string;
    }>
  ) => void;
  recommendation_right: (
    data: Payload<{
      track_id: number;
      project_id: number;
      event_name: string;
    }>
  ) => void;

  change_track: (
    data: Payload<{
      track_id: number;
      canonical_url: string;
    }>
  ) => void;
  // audio: () => void;
  // audio_choice: (data: Payload<{ event_value: 'english' | 'russian' }>) => void;
  volume: (data: Payload<{ volume: number }>) => void;

  watchprogress: (data: {
    data: {
      track_id: number | null;
      project_id: number | null;
      time_cursor: number;
      duration: number | null;
    };
  }) => void;

  set_favorites: (
    data: Payload<{
      projectId: number;
      isFavorites: boolean;
      redirect: boolean;
      videosession_id: string;
      time_cursor: number;
      track_id: number | null;
    }>
  ) => void;

  on_click_bt_turnoff_adv_at_trial_suggestion: (
    data: Payload<{ videosession_id: string; time_cursor: number; triggerType: TS_TRIGGER }>
  ) => void;
  on_click_bt_close_trial_suggestion: (
    data: Payload<{ videosession_id: string; time_cursor: number; triggerType: TS_TRIGGER }>
  ) => void;
  on_show_trial_suggestion: (
    data: Payload<{ videosession_id: string; time_cursor: number; triggerType: TS_TRIGGER }>
  ) => void;
  timeout_close_suggestion: (
    data: Payload<{ videosession_id: string; time_cursor: number; triggerType: TS_TRIGGER }>
  ) => void;

  on_open_off_ads_experiment: () => void;
  on_close_off_ads_experiment: () => void;

  on_open_off_ads_before_preroll_experiment: () => void;
  on_close_off_ads_before_preroll_experiment: () => void;

  ad_manifest: (data: Payload<{ numBreaks: number; numExpectedBreaks: number; breaksTimeLimit: number[] }>) => void;
  ad_break_start: (data: Payload<{ category: AdCategory; limit: number; point: number }>) => void;
  ad_start: (data: Payload<{ category: AdCategory; position: number }>) => void;
  ad_quartile: (data: Payload<{ value: number }>) => void;
  ad_click_thru: (data: Payload<{ category: AdCategory; position: number }>) => void;
  ad_skip: (data: Payload<{ category: AdCategory; position: number }>) => void;
  ad_error: (data: Payload<{ category: AdCategory; position: number }>) => void;
  ad_end: (data: Payload<{ category: AdCategory; position: number }>) => void;
  ad_break_end: () => void;
};

export type PlayerParams = {
  startAt?: number | null;
  adult?: boolean;
  trial_available?: boolean;
  pf?: number | null;
  pt?: number | null;
  sign?: string | null;
  p2p?: number | null;
  splash_screen?: boolean;
  user_token?: string | null;
  video_theme?: 'DEFAULT' | 'TRAILER';
};

export type UpdateConfigType = PlayerParams & {
  config_url: string;
  action: 'refresh' | 'token_update';
};

// Команды направленные к плееру от веба
export type INPUT_PLAYER_POST_MESSAGE = {
  setPageLocation: (p: any) => void;
  updateLinkedTracks: (p: any) => void;
  userReachedCorrectAge: (p: any) => void;
  userNotReachedCorrectAge: (p: any) => void;
  changeTrack: (p: any) => void;
  updateConfig: (p: { data: UpdateConfigType }) => void;
  terminatePlayer: (p: any) => void;
  networkDispatched: (p: { status: 'offline' | 'online' | 'reject' }) => void;
  initialInfo: (p: { data: { ym_client_id: string } }) => void;
  on_click_bt_close_trial_suggestion: (p: { data: { triggerType: TS_TRIGGER } }) => void;
  set_settings: (p: any) => void;
  play: () => void;
  pause: () => void;
  seek: (p: { data: { to: number } }) => void;
  setVolume: (p: { data: { value: number } }) => void;
  mute: () => void;
  unmute: () => void;
  testAdvPoint: () => void;
  set_favorites: (p: { data: { isFavorites: boolean } }) => void;
  set_experiment_group: (p: { data: { name: Experiments; group: string } }) => void;

  on_close_off_ads_experiment: () => void;
  on_close_off_ads_before_preroll_experiment: () => void;
};

export type TMessage = {
  event: keyof INPUT_PLAYER_POST_MESSAGE;
  location?: string;
  data?: Record<string, any>;
};

export type TLegacyMessage = {
  method: string;
  payload: Record<string, any>;
  callback?: () => void; // TODO REMOVE
  cmd?: any; // TODO REMOVE
};

export type InputMessage = TMessage & TLegacyMessage;

export type TPostMessageService = {
  init: () => void;
  emit: <E extends keyof OutputEvents, C extends OutputEvents[E]>(event: E, data: Parameters<C>[0]) => void;
  on: Subscribe<INPUT_PLAYER_POST_MESSAGE>;
  one: OnceSubscribe<INPUT_PLAYER_POST_MESSAGE>;
  off: Unsubscribe<INPUT_PLAYER_POST_MESSAGE>;
};
