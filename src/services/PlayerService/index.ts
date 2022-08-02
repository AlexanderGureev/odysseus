/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import 'videojs-contrib-eme';

import { VIDEO_TYPE } from 'components/Player/types';
import { IMediator, OnceSubscribe, Subscribe, Unsubscribe } from 'services/MediatorService/types';
import { createFakeSource } from 'services/StreamService/utils';
import { Nullable } from 'types';
import { ERROR_CODES, ERROR_ITEM_MAP, ERROR_TYPE } from 'types/errors';
import { toFixed } from 'utils';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';
import videojs, { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js';

import { Mediator } from '../MediatorService';
import { Events, Hooks, HookType, PLAYER_TYPE, PlayerHooks, TState } from './types';

const PlayerService = (type: PLAYER_TYPE = PLAYER_TYPE.VIDEO_JS) => {
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

  let hooks: PlayerHooks = {
    beforeSetSource: [],
  };

  const addHook = <T extends HookType, C extends Hooks[T]>(type: T, hook: C) => {
    hooks = {
      ...hooks,
      [type]: [...hooks[type], hook],
    };
  };

  const mediator = Mediator<Events>();

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

  const getTech = () => {
    // @ts-ignore
    return player?.tech?.({ IWillNotUseThisInPlugins: true })?.vhs ?? null;
  };

  const getBitrate = () => getTech()?.bandwidth ?? null;
  const getRepresentations = () => getTech()?.representations?.() ?? null;
  const getPlayer = () => player;

  const intitializePlayer = (playerId: string, options: VideoJsPlayerOptions) => {
    if (player) return player;

    return videojs(playerId, {
      // @ts-ignore
      enableSourceset: true,
      preload: 'metadata',
      ...options,
    });
  };

  const init = (playerId: string, options: VideoJsPlayerOptions = {}) =>
    new Promise<void>((resolve) => {
      logger.log('[PlayerService]', 'init');

      hooks = {
        beforeSetSource: [],
      };

      player = intitializePlayer(playerId, options);

      // const v = document.querySelector('video');
      // if (!v) return;

      // const oldSetAttribute = v.setAttribute;
      // const oldLoad = v.load;
      // const oldSrc = v.src;

      // Object.defineProperty(v, 'src', {
      //   set(v) {
      //     console.log('[TEST] set src', { v });

      //     // debugger;
      //     oldSetAttribute('src', v);
      //   },
      // });

      // v.setAttribute = function (attr, value) {
      //   // if (/src/i.test(attr)) {
      //   //   console.log('[TEST] setAttribute', { src: value });
      //   // }

      //   return oldSetAttribute(attr, value);
      // };

      // v.load = function () {
      //   console.log('[TEST] load');

      //   // return oldLoad();
      // };

      player.eme();
      player.on('error', onErrorHandler);
      player.one('ready', resolve);

      player.on('seeking', () => {
        state.seeking = true;
        if (state.videoType !== VIDEO_TYPE.FAKE_VIDEO) mediator.emit('seeking');
      });
      player.on('seeked', () => {
        state.seeking = false;
        if (state.videoType !== VIDEO_TYPE.FAKE_VIDEO) mediator.emit('seeked');
      });
      player.on('ended', () => {
        if (state.videoType !== VIDEO_TYPE.FAKE_VIDEO) mediator.emit('ended');
      });
      player.on('waiting', () => {
        if (state.videoType !== VIDEO_TYPE.FAKE_VIDEO) mediator.emit('waiting');
      });
      player.on('canplay', () => {
        if (state.videoType !== VIDEO_TYPE.FAKE_VIDEO) mediator.emit('canplay');
      });
      player.on('ratechange', () => {
        if (state.videoType !== VIDEO_TYPE.FAKE_VIDEO) mediator.emit('ratechange', getPlaybackRate());
      });
      player.on('timeupdate', () => {
        if (state.videoType !== VIDEO_TYPE.FAKE_VIDEO) {
          mediator.emit('timeupdate', {
            currentTime: toFixed(player!.currentTime()),
            duration: player!.duration(),
            remainingTime: toFixed(player!.remainingTime()),
          });
        }
      });
    });

  const setSource = (source: videojs.Tech.SourceObject, type: VIDEO_TYPE = VIDEO_TYPE.PLAIN) =>
    new Promise<void>(async (resolve) => {
      if (!player) return;

      if (type === VIDEO_TYPE.FAKE_VIDEO && state.videoType === VIDEO_TYPE.FAKE_VIDEO) return resolve();

      for (const hook of hooks.beforeSetSource) {
        await hook(type);
      }

      player.src(source);
      player.ready(() => {
        state.videoType = type;
        player?.one('loadedmetadata', resolve);
      });
    });

  const playVideo = async () => {
    if (!player) throw new Error('player inst initialized');

    const promise = player.play();

    if (promise !== undefined) {
      try {
        await promise;
      } catch (e) {
        logger.error('[playerService] playVideo', e);
        throw e;
      }
    }
  };

  const checkPermissions = async () => {
    await setSource(createFakeSource(), VIDEO_TYPE.FAKE_VIDEO);

    const play = async (muted = false): Promise<{ autoplay: boolean; mute: boolean }> => {
      if (!player) throw new Error('player inst initialized');

      try {
        player.muted(muted);
        await playVideo();
        return { autoplay: true, mute: muted };
      } catch (e: unknown) {
        const error = e as Error;

        if (muted) {
          logger.error('[playerService] checkPermissions', error);
          return { autoplay: false, mute: false };
        }

        return await play(true);
      }
    };

    const permissions = await play();
    return permissions;
  };

  const play = async () => {
    player?.muted(true); // TODO FIX
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

  const onErrorHandler = () => {
    const nativeError = player?.error();
    const err = new PlayerError(nativeError?.code ?? ERROR_CODES.UNKNOWN, nativeError?.message);
    mediator.emit('error', err);
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

  const setPlaybackRate = (value: number) => {
    if (!player) return;
    player.playbackRate(value);
  };

  const getPlaybackRate = () => {
    return player!.playbackRate();
  };

  return {
    init,
    setSource,
    play,
    checkPermissions,
    pause,
    seek,
    on: mediator.on,
    one: mediator.one,
    off: mediator.off,
    isPaused,
    isPlaying,
    setCurrentTime,
    getCurrentTime,
    setVolume,
    getVolume,
    isMuted,
    setMute,
    getState,
    getTech,
    getRepresentations,
    getPlayer,
    addHook,
    setPlaybackRate,
    getPlaybackRate,
  };
};

const instance = PlayerService();
export { instance as PlayerService };
