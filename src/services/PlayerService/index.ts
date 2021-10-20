/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import 'videojs-contrib-eme';
import videojs, { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js';
import shaka from 'shaka-player';
import { Mediator, TSubscriber } from '../MediatorService';
import { Nullable } from 'types';
import { VIDEO_TYPE } from 'components/Player/types';

export type TPlayerService = {
  init: (playerId: string, options?: VideoJsPlayerOptions) => Promise<void>;
  setSource: (source: videojs.Tech.SourceObject, type?: VIDEO_TYPE) => Promise<void>;
  initialPlay: (muted?: boolean) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  seek: (value: number) => void;
  onError: (callback: TSubscriber<MediaError>) => void;
  on: (event: string, callback: TSubscriber) => () => void;
  one: (event: string, callback: TSubscriber) => void;
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
  SHAKA_PLAYER = 'SHAKA_PLAYER',
}

type TInitProps = {
  playerId: string;
  onError: TSubscriber<MediaError>;
  options: VideoJsPlayerOptions;
};

const PlayerService = (type: PLAYER_TYPE = PLAYER_TYPE.VIDEO_JS): TPlayerService => {
  let player: Nullable<VideoJsPlayer> = null;
  let state: TState = {
    src: null,
    currentTime: 0,
    volume: 50,
    muted: true,
    paused: true,
    playing: false,
    duration: 0,
    remainingTime: 0,
    loadedPercent: 0,
    videoHeight: 0,
    videoWidth: 0,
    bitrate: null,
    representations: null,
    seeking: false,
    videoType: VIDEO_TYPE.PLAIN,
  };

  const mediator = Mediator();

  const updateState = () => {
    if (!player) return;

    state = {
      ...state,
      src: player.src(),
      currentTime: player.currentTime(),
      volume: player.volume(),
      muted: player.muted(),
      paused: player.paused(),
      playing: !player.paused(),
      duration: player.duration(),
      remainingTime: player.remainingTime(),
      loadedPercent: player.bufferedPercent() * 100,
      videoHeight: player.videoHeight(),
      videoWidth: player.videoWidth(),
      bitrate: getBitrate(),
      representations: getRepresentations(),
    };
  };

  const getState = () => {
    updateState();

    // @ts-ignore
    window.state = { ...state };
    return { ...state };
  };

  const getVhs = () => {
    // @ts-ignore
    return player?.tech?.({ IWillNotUseThisInPlugins: true })?.vhs ?? null;
  };

  const getBitrate = () => getVhs()?.bandwidth ?? null;
  const getRepresentations = () => getVhs()?.representations?.() ?? null;
  const getPlayer = () => player;

  const init = (playerId: string, options: VideoJsPlayerOptions = {}) =>
    new Promise<void>((resolve) => {
      player = videojs(playerId, {
        // @ts-ignore
        enableSourceset: true,
        preload: 'metadata',
        ...options,
      });

      // @ts-ignore
      player.eme();
      player.on('error', onErrorHandler);
      player.one('ready', resolve);

      createBaseListeners();
    });

  const createBaseListeners = () => {
    player?.on('seeking', () => {
      state.seeking = true;
    });

    player?.on('seeked', () => {
      state.seeking = false;
    });
  };

  const setSource = (source: videojs.Tech.SourceObject, type: VIDEO_TYPE = VIDEO_TYPE.PLAIN) =>
    new Promise<void>((resolve) => {
      if (!player) return;

      player.src(source);
      player.ready(() => {
        state.videoType = type;
        player?.one('loadedmetadata', resolve);
      });
    });

  const playVideo = async () => {
    if (!player) return;

    const promise = player.play();

    if (promise !== undefined) {
      try {
        await promise;
      } catch (e) {
        console.error('[PLAYER] PLAY', e);
        throw e;
      }
    }
  };

  const initialPlay = async (muted = false) => {
    if (!player) return;

    try {
      player.muted(muted);
      await playVideo();
    } catch (e: unknown) {
      const error = e as Error;
      console.error(error);

      if (muted) {
        throw new Error(`autoplay with mute is blocked: ${error?.message}`);
      }

      await initialPlay(true);
    }
  };

  const play = async () => {
    await playVideo();
  };

  const pause = () => {
    if (!player) return;
    if (!player.paused()) player.pause();
  };

  const seek = (value: number) => {
    if (!player) return;

    const time = player.currentTime();
    player.currentTime(time + value);
  };

  const on = (event: string, callback: TSubscriber) => {
    player?.on(event, callback);
    return () => {
      player?.off(event, callback);
    };
  };

  const one = (event: string, callback: TSubscriber) => {
    player?.one(event, callback);
  };

  const onError = (callback: TSubscriber<MediaError>) => mediator.on('player_error', callback);

  const onErrorHandler = (event: any) => {
    const error = player?.error() || { code: -1, message: 'unknown error' };
    mediator.emit('player_error', error);
  };

  const isPaused = () => player?.paused() ?? true;
  const isPlaying = () => !player?.paused();
  const isMuted = () => player?.muted() ?? true;
  const setVolume = (value: number) => player?.volume(value);
  const getVolume = () => player?.volume() ?? 50;
  const setMute = (status: boolean) => player?.muted(status);

  const setCurrentTime = (value: number) => {
    if (!player) return;
    player.currentTime(value);
  };

  const getCurrentTime = () => {
    if (!player) return 0;
    return player.currentTime();
  };

  return {
    init,
    setSource,
    play,
    initialPlay,
    pause,
    seek,
    on,
    one,
    onError,
    isPaused,
    isPlaying,
    setCurrentTime,
    getCurrentTime,
    setVolume,
    getVolume,
    isMuted,
    setMute,
    getState,
    getVhs,
    getPlayer,
  };
};

const instance = PlayerService();
export { instance as PlayerService };
