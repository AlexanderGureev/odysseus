import { OnceSubscribe, Subscribe, Unsubscribe } from 'services/MediatorService/types';
import { Nullable } from 'types';
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
      trackDescription: TLinkedTrack;
      trackId: number;
      projectId: number;
    }>
  ) => void;
  new_track: (
    data: Payload<{
      target: 'next' | 'prev';
      auto: boolean;
      trackDescription: TLinkedTrack;
      overlay: boolean;
      videosession_id: string;
      time_cursor: number;
      track_id: number;
      project_id: number;
    }>
  ) => void;
  auto_switch: (
    data: Payload<{
      videosession_id: string;
      time_cursor: number;
      trackDescription: TLinkedTrack;
      trackId: number;
      projectId: number;
    }>
  ) => void;

  inited: (data: Payload<{ adv: boolean }>) => void;
  'inited-player': () => void;
  started: (data: { time: number; payload: { sub_button: boolean } }) => void;
  'video-started': () => void;
  paused: (data: { time: number }) => void;
  ended: (data: { time: number }) => void;
  error: (data: { code: number; payload?: { code: number; type: ERROR_TYPE; track_id: number | null } }) => void;

  rewound: (data: { time: number; previousTime: number }) => void;
  adShown: (data: { time: number }) => void;
  pay_and_watch_button: (data: Payload<{ time_cursor: number; btn_type: string }>) => void;

  subscription_restore: () => void;

  'exit-full-screen': () => void;
  'enter-full-screen': () => void;
  show_payment_popup: () => void;
  button_disable_ad: () => void;
  'launch-player': (data: Payload<{ volume: number; is_sub_button: boolean }>) => void;
  play: (data: Payload<{ videosession_id: string; track_id: number }>) => void;
  view: (data: Payload<{ videosession_id: string; track_id: number }>) => void;
  watchpoint: (
    data: Payload<{
      track_id: number;
      videosession_id: string;
      user_id: string;
      time_cursor: number;
      duration: number;
      value: number;
      sid: string;
    }>
  ) => void;
  time_roll: (
    data: Payload<{
      event_value: string;
      videosession_id: string;
      time_cursor: number;
      track_id: number;
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
  audio: () => void;
  audio_choice: (data: Payload<{ event_value: 'english' | 'russian' }>) => void;
  volume: (data: Payload<{ volume: number }>) => void;

  player_status: (
    data: Payload<{
      time_cursor: number;
      video_type: string;
      loadedmetadata: boolean;
      started: boolean;
      error_code: number;
      error_shown: boolean;
      app_version: string;
    }>
  ) => void;
  watchprogress: (data: {
    data: {
      track_id: number;
      project_id: number;
      time_cursor: number;
      duration: number;
    };
  }) => void;
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
  networkDispatched: (p: any) => void;
  initialInfo: (p: any) => void;
  on_click_bt_close_trial_suggestion: (p: any) => void;
  set_settings: (p: any) => void;
  play: (p: any) => void;
  pause: (p: any) => void;
  seek: (p: any) => void;
  setVolume: (p: any) => void;
  mute: (p: any) => void;
  unmute: (p: any) => void;
  testAdvPoint: (p: any) => void;
};

export type TLinkedTracks = {
  next?: TLinkedTrack;
  previous?: TLinkedTrack;
};

export type TLinkedTrack = {
  canonicalUrl: string;
  caption: string;
  episode: number;
  playerConfig: string;
  playerUrl: string;
  projectId: number;
  season: number;
  thumbnail: string;
  trackHubId: number;
  trackId: number;
  trackVod: {
    link: string;
    playerLink: string;
    queryParams: {
      previewFrom: Nullable<string>;
      previewTo: Nullable<string>;
      sign: Nullable<string>;
    };
  };
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
