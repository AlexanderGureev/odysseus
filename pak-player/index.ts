import 'videojs-dock';
import 'videojs-dock/dist/videojs-dock.css';
import 'videojs-contrib-quality-levels';
import 'videojs-http-source-selector';
import 'video.js/dist/video-js.min.css';
import './css/index.css';

import { VIDEO_EXTENSION } from 'services/StreamService';
import { getCapabilities } from 'services/StreamService/utils/supports';
import { ERROR_CODES, ERROR_TYPE } from 'types/errors';
import { isKeyPressed, isKeySupported, SUPPORTED_KEY_CODES } from 'utils/keyboard';
import videojs, { VideoJsPlayer } from 'video.js';

import { InspectStream } from '../types/MediaFile';
import {
  advPointObserver,
  advPointTestHandler,
  communicateToParent,
  moduleState,
  PAK_POSTMESSAGES,
  PLAYER_SEEK_STEP_LEGACY,
  screenshotMessageObserver,
} from './utils';

const targetId = 'my-player';
const bufferId = 'image-buffer';

const CONTAINER_ID = 'error-manager';

let playerObject: VideoJsPlayer;

const getPoster = (images: Record<string, string>) => {
  const [key] = Object.keys(images);
  return images[key];
};

const createSource = (stream: InspectStream, options = {}) => {
  return {
    src: stream.url,
    type: VIDEO_EXTENSION[stream.protocol],
    ...options,
  };
};

const appendError = (type: ERROR_TYPE, message?: string) => {
  const container = document.getElementById(CONTAINER_ID);
  if (!container) return;

  container.innerHTML = `
    <div class='error-wrapper'>
        <div class='error-type'>Ошибка: ${type} (код: ${ERROR_CODES[type]})</div>
        <div class='error-message'>${message}</div>
    </div>
    `;
};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const supportedStreams = await getCapabilities();
    const streams = window.mediaFile.streams;
    const meta = window.meta;

    playerObject = videojs(targetId, {
      preload: 'metadata',
      controls: true,
      autoplay: false,
      poster: meta?.images ? getPoster(meta.images) : undefined,
      html5: {
        nativeAudioTracks: false,
        nativeVideoTracks: false,
        enableLowInitialPlaylist: true,
      },
      plugins: {
        httpSourceSelector: {
          default: 'auto',
        },
      },
    });

    playerObject.httpSourceSelector();
    if (meta) playerObject.dock({ title: meta.title ?? undefined, description: meta.title_ru ?? undefined });
    const videoObject = playerObject.tech({ IWillNotUseThisInPlugins: true }).el();

    console.log('PAK Player loaded:', videoObject);
    console.log('Streams available', streams);

    const screenshotEventHandler = screenshotMessageObserver(videoObject.id, bufferId);

    playerObject.ready(() => {
      window.addEventListener('keydown', (e) => {
        if (e.defaultPrevented) return;
        switch (true) {
          case isKeyPressed(e, SUPPORTED_KEY_CODES.ARROW_LEFT):
            playerObject.currentTime(Math.max(0, playerObject.currentTime() - PLAYER_SEEK_STEP_LEGACY));
            break;
          case isKeyPressed(e, SUPPORTED_KEY_CODES.ARROW_RIGHT):
            playerObject.currentTime(
              Math.min(playerObject.duration(), playerObject.currentTime() + PLAYER_SEEK_STEP_LEGACY)
            );
            break;
          case isKeyPressed(e, SUPPORTED_KEY_CODES.SPACE):
            if (playerObject.paused()) {
              playerObject.play();
            } else {
              playerObject.pause();
            }
            break;
          case !isKeySupported(e):
            e.preventDefault();
            break;
          default:
            return;
        }
      });

      window.addEventListener('message', (e) => {
        console.log('Received postmessage from parent', e.data);

        if (!moduleState.bufferingDone) return;

        switch (e.data?.method) {
          case PAK_POSTMESSAGES.doScreenshot:
            screenshotEventHandler(e.data);
            return;
          case PAK_POSTMESSAGES.testAdvPoint:
            advPointTestHandler(playerObject, e.data);
            return;
          case PAK_POSTMESSAGES.play:
            playerObject.play();
            return;
          case PAK_POSTMESSAGES.getCurrentTime:
            communicateToParent('currentTime', {
              value: playerObject.currentTime(),
            });
            return;
          default:
            return;
        }
      });

      playerObject.on('progress', () => {
        if (!moduleState.bufferingDone && playerObject.bufferedPercent() > 0) {
          console.log('Buffering done');
          moduleState.bufferingDone = true;
        }
      });

      playerObject.on('timeupdate', () => {
        advPointObserver(playerObject);
      });

      playerObject.on('play', () => {
        communicateToParent('started');
      });
    });

    const selectedStream = streams.find(
      (stream) => stream.protocol === (supportedStreams.includes('hls') ? 'HLS' : 'DASH')
    );

    if (!selectedStream?.url) {
      throw {
        type: ERROR_TYPE.SRC_NOT_SUPPORTED,
        message: `No supported streams found; supported formats: ${supportedStreams.join(',')}`,
      };
    }

    playerObject.src(createSource(selectedStream));
    playerObject.ready(() => {
      playerObject.volume(0.5);
    });

    console.log(`Playing ${selectedStream.protocol} stream from ${selectedStream.url}`);
  } catch (e) {
    console.error(e);
    appendError(e?.type || ERROR_TYPE.UNKNOWN, e?.message);
  }
});
