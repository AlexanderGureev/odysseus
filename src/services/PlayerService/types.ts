import { OnceSubscribe, Subscribe, Unsubscribe } from 'services/MediatorService/types';
import { Nullable } from 'types';
import { RawPlayerError } from 'types/errors';
import videojs, { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js';

type TimeData = { currentTime: number; duration: number; remainingTime: number };

export const DEFAULT_PLAYER_ID = 'video-player';
export const PLAYER_ID = `${DEFAULT_PLAYER_ID}_html5_api`;

export enum VIDEO_TYPE {
  PLAIN = 'PLAIN',
  AD = 'AD',
  FAKE_VIDEO = 'FAKE_VIDEO',
}

export type Events = {
  timeupdate: (payload: TimeData) => void;
  error: (payload: RawPlayerError) => void;
  seeking: () => void;
  seeked: () => void;
  ended: () => void;
  waiting: () => void;
  canplay: () => void;
  ratechange: (value: number) => void;
  progress: (payload: { loadedPercent: number; bufferedEnd: number }) => void;
  fullscreenchange: (isFullscreen: boolean) => void;
  play: () => void;
  pause: () => void;
  loadedmetadata: (payload: { duration: number }) => void;
};

export type TPlayerService = {
  init: (playerId: string, options?: VideoJsPlayerOptions) => Promise<void>;
  setSource: (source: videojs.Tech.SourceObject, opts?: SetSourceOpts) => Promise<void>;
  initialPlay: (muted?: boolean) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  seek: (value: number) => void;
  on: Subscribe<Events>;
  one: OnceSubscribe<Events>;
  off: Unsubscribe<Events>;
  isPaused: () => boolean;
  isPlaying: () => boolean;
  setCurrentTime: (value: number) => void;
  getCurrentTime: () => number;
  setVolume: (value: number) => void;
  getVolume: () => number;
  isMuted: () => boolean;
  setMute: (status: boolean) => void;
  getState: () => TState;
  getVhs: () => any;
  getPlayer: () => Nullable<VideoJsPlayer>;
  enterFullcreen: () => Promise<void>;
  exitFullcreen: () => Promise<void>;
};

export type TState = {
  src: Nullable<string>;
  currentTime: number;
  volume: number;
  muted: boolean;
  paused: boolean;
  playing: boolean;
  duration: number;
  remainingTime: number;
  loadedPercent: number;
  videoHeight: number;
  videoWidth: number;
  bitrate: Nullable<number>;
  representations: Nullable<any[]>;
  seeking: boolean;
  videoType: VIDEO_TYPE;
};

export enum PLAYER_TYPE {
  VIDEO_JS = 'VIDEO_JS',
}

export type Hooks = {
  beforeSetSource: (type: VIDEO_TYPE) => Promise<void> | void;
};

export type SetSourceOpts = { type?: VIDEO_TYPE; timeout?: number };

export type HookType = keyof Hooks;

export type PlayerHooks = {
  [key in HookType]: Hooks[key][];
};
