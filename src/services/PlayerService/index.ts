/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import 'videojs-contrib-eme';

import { PLAYER_ID, VIDEO_TYPE } from 'components/Player/types';
import { isAndroid, isIOS } from 'react-device-detect';
import { IMediator, OnceSubscribe, Subscribe, Unsubscribe } from 'services/MediatorService/types';
import { createFakeSource } from 'services/StreamService/utils';
import { Nullable } from 'types';
import { ERROR_CODES, ERROR_ITEM_MAP, ERROR_TYPE } from 'types/errors';
import { toFixed } from 'utils';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';
import videojs, { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js';

import { Mediator } from '../MediatorService';
import { Events, Hooks, HookType, PLAYER_TYPE, PlayerHooks, SetSourceOpts, TState } from './types';

const PlayerService = (type: PLAYER_TYPE = PLAYER_TYPE.VIDEO_JS) => {
  let player: VideoJsPlayer;
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

  let isSetupSource = false;

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
    return videojs(playerId, {
      preload: 'metadata',
      html5: {
        vhs: {
          overrideNative: isAndroid,
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false,
        enableLowInitialPlaylist: true,
      },
      ...options,
    });
  };

  const parseNativeError = () => {
    const nativeError = player.error();
    const err = new PlayerError(nativeError?.code ?? ERROR_CODES.UNKNOWN, nativeError?.message);
    return err;
  };

  const init = (playerId: string, options: VideoJsPlayerOptions = {}) =>
    new Promise<void>((resolve) => {
      logger.log('[PlayerService]', 'init');

      hooks = {
        beforeSetSource: [],
      };

      if (player) return resolve();

      player = intitializePlayer(playerId, options);
      player.eme();

      window._player = player;

      const events: { [key in keyof Events]?: () => void } = {
        seeking: () => mediator.emit('seeking'),
        seeked: () => mediator.emit('seeked'),
        ended: () => mediator.emit('ended'),
        waiting: () => mediator.emit('waiting'),
        canplay: () => mediator.emit('canplay'),
        ratechange: () => mediator.emit('ratechange', getPlaybackRate()),
        fullscreenchange: () => mediator.emit('fullscreenchange', isFullscreen()),
        play: () => mediator.emit('play'),
        pause: () => mediator.emit('pause'),
        progress: () =>
          mediator.emit('progress', {
            loadedPercent: player.bufferedPercent() * 100,
            bufferedEnd: player.bufferedEnd(),
          }),
        timeupdate: () =>
          mediator.emit('timeupdate', {
            currentTime: toFixed(player.currentTime()),
            remainingTime: toFixed(player.remainingTime()),
            duration: player.duration(),
          }),
        error: () => {
          if (isSetupSource) return;
          const err = parseNativeError();
          mediator.emit('error', err);
        },
        loadedmetadata: () => {
          mediator.emit('loadedmetadata', { duration: player.duration() });
        },
      };

      Object.keys(events).forEach((event) => {
        player.on(event, () => {
          if (isDispatch()) {
            events[event as keyof Events]?.();
          }
        });
      });

      player.one('ready', resolve);
    });

  const isDispatch = () => player.duration() > 0.1;

  const setSource = (source: videojs.Tech.SourceObject, { type = VIDEO_TYPE.PLAIN, timeout }: SetSourceOpts = {}) =>
    new Promise<void>(async (resolve, reject) => {
      if (type === VIDEO_TYPE.FAKE_VIDEO && state.videoType === VIDEO_TYPE.FAKE_VIDEO) return resolve();

      isSetupSource = true;

      for (const hook of hooks.beforeSetSource) {
        await hook(type);
      }

      let timer = timeout
        ? setTimeout(() => {
            const error = new PlayerError(
              ERROR_CODES.ERROR_DATA_LOADING,
              `source set timeout ${timeout / 1000}s expired`
            );

            reject(error);
          }, timeout)
        : null;

      const onError = () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }

        const err = parseNativeError();
        reject(err);
      };

      player.one('error', onError);
      player.src(source);
      player.loop(false);
      player.ready(() => {
        state.videoType = type;
        player.one('loadedmetadata', () => {
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }

          player.off('error', onError);
          resolve();
        });
      });
    }).finally(() => {
      isSetupSource = false;
    });

  const playVideo = async () => {
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
    await setSource(createFakeSource(), {
      type: VIDEO_TYPE.FAKE_VIDEO,
    });

    const play = async (muted = false): Promise<{ autoplay: boolean; mute: boolean }> => {
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
    await playVideo();
  };

  const pause = () => {
    if (!player.paused()) player.pause();
  };

  const seek = (value: number) => {
    const time = player.currentTime();
    player.currentTime(time + value);
  };

  const getCurrentTime = () => player.currentTime();
  const setPlaybackRate = (value: number) => player.playbackRate(value);
  const getPlaybackRate = () => player.playbackRate();
  const enterFullcreen = async () => {
    await player.requestFullscreen();
  };
  const exitFullcreen = async () => {
    await player.exitFullscreen();
  };
  const isFullscreen = () => player.isFullscreen();
  const isMuted = () => player.muted();
  const getVolume = () => player.volume();
  const setVolume = (value: number) => {
    player.volume(value);
  };
  const setMute = (status: boolean) => {
    player.muted(status);
  };
  const setCurrentTime = (value: number) => {
    player.currentTime(value);
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
    enterFullcreen,
    exitFullcreen,
  };
};

const instance = PlayerService();
export { instance as PlayerService };
