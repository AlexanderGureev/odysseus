/* eslint-disable @typescript-eslint/ban-ts-comment */
import './index.css';

import { getQueryParams } from 'services/AdService/utils';
import { logger } from 'utils/logger';
import videojs from 'video.js';

import { P2PInitOpts, TeleportInstance } from './types';

const API_KEY = '857a5bde7fd44740';
const DEV_TOOLS_CONTAINER_ID = 'teleport-devtools';
const IS_DEBUG = false;

const TELEPORT_SDK_SRC = 'https://cdn.teleport.media/stable/teleport.videojs.v7.bundle.js';
const TELEPORT_DEV_TOOLS_SRC = 'https://cdn.teleport.media/stable/teleport.dev-tools.js';

const SEGMENT_TYPE_REGEXP = /-f\d+-(v|a)\d+/;

const NEW_MANIFEST_FORMAT_REGEXP = /(\/vod)(\/\d+)?(\/\w+)(\/\w+)(\/.+)(\/[a-f0-9]{32}-.+)/;
const OLD_MANIFEST_FORMAT_REGEXP = /(\/video\/file)(\/.+)(\/\d+\.\w+)/;
const CHUNK_MANIFEST_REGEXP = /(\/[0-9a-f]{32}-.+)/;

const SCRIPT_LOAD_TIMEOUT = 5000;
const P2P_DEBUG_PARAM = 'p2p_debug';
const DEBUG_MODE = window?.ENV?.DEBUG_MODE;

const params = getQueryParams(window.location.href);
const USE_DEVTOOLS = ['1', 'true'].includes(params[P2P_DEBUG_PARAM]);

const P2PManager = () => {
  let promise: Promise<boolean[]> | null = null;
  let tlprt: TeleportInstance | null = null;
  let devtoolsContainer: HTMLElement | null = null;
  let opts: P2PInitOpts;

  const getContainer = () => {
    const [head] = document.getElementsByTagName('head');
    return head;
  };

  const append = (node: HTMLElement) => {
    const container = getContainer();
    container.appendChild(node);
  };

  const loadScript = (src: string) => {
    return new Promise<boolean>((resolve, reject) => {
      const script = document.createElement('script');
      script.async = true;
      script.src = src;
      script.onload = () => {
        logger.log('[P2PManager]', `script - ${src} load success`);
        resolve(true);
      };

      script.onerror = () => {
        logger.log('[P2PManager]', `script - ${src} load failure`);
        reject(false);
      };

      append(script);

      setTimeout(() => {
        reject(new Error(`SCRIPT_LOAD_TIMEOUT (${SCRIPT_LOAD_TIMEOUT / 1000}s) expired`));
      }, SCRIPT_LOAD_TIMEOUT);
    });
  };

  const createDevtools = (instance: TeleportInstance) => {
    devtoolsContainer = document.getElementById(DEV_TOOLS_CONTAINER_ID);

    if (!devtoolsContainer) return;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    new window.DevTools(instance, {
      container: devtoolsContainer,
      apiKey: API_KEY,
    });

    devtoolsContainer.classList.add('active');
  };

  const segmentTypeGetter = (uri: string) => {
    const res = uri.match(SEGMENT_TYPE_REGEXP);

    if (res) {
      switch (res[1]) {
        case 'v':
          return teleport.SegmentType.Video;
        case 'a':
          return teleport.SegmentType.Audio;
        default:
          return teleport.SegmentType.Unknown;
      }
    }

    return teleport.SegmentType.Unknown;
  };

  const urlCleaner = (url: string) => {
    try {
      let path = new URL(url).pathname;

      if (['data:application/dash+xml;', 'data:application/x-mpegURL;'].some((s) => url.includes(s))) {
        path = new URL(opts.currentStream.url).pathname;
      }

      if (NEW_MANIFEST_FORMAT_REGEXP.test(path)) {
        return path.replace(NEW_MANIFEST_FORMAT_REGEXP, '$1$3$4$6');
      }

      if (OLD_MANIFEST_FORMAT_REGEXP.test(path)) {
        return path.replace(OLD_MANIFEST_FORMAT_REGEXP, '$1$3');
      }

      if (CHUNK_MANIFEST_REGEXP.test(path)) {
        return path.replace(CHUNK_MANIFEST_REGEXP, '$1');
      }

      return path;
    } catch (e) {
      console.error('[P2PManager] urlCleaner error', e?.message);
    }

    return url;
  };

  const init = async (params: P2PInitOpts) => {
    try {
      if (tlprt) return;
      opts = params;

      const scripts = USE_DEVTOOLS && DEBUG_MODE ? [TELEPORT_SDK_SRC, TELEPORT_DEV_TOOLS_SRC] : [TELEPORT_SDK_SRC];

      if (promise) {
        await promise;
      } else {
        promise = Promise.all(scripts.map(loadScript));
        await promise;
      }

      tlprt = await teleport.initialize({
        apiKey: API_KEY,
        loader: {
          type: 'videojs.v7',
          params: {
            videojs,
            segmentTypeGetter,
            urlCleaner,
          },
        },
      });

      // Для тестирования, если в аккаунте принудительно выключен p2p
      // tlprt.peeringMode = PeeringMode.Full;

      if (window.DevTools && tlprt) createDevtools(tlprt);

      if (IS_DEBUG) {
        (() => {
          const subscribers: any = {};

          [
            'onPeeringModeChanged',
            'onPeerConnectionOpened',
            'onPeerConnectionClosed',
            'onSegmentLoaded',
            'onSegmentUploaded',
          ].forEach((event) => {
            // @ts-ignore
            subscribers[event] = tlprt[event];
            // @ts-ignore
            tlprt[event] = (...args: unknown[]) => {
              subscribers[event]?.(...args);
              logger.log('[P2PManager]', `${event}`, ...args);
            };
          });
        })();
      }

      window.tlprt = tlprt;
      window.addEventListener('unload', dispose);

      logger.log('[P2PManager]', 'init', {
        version: tlprt.version,
        connected: tlprt.connected,
        connectionId: tlprt.connectionId,
        peeringMode: teleport.PeeringMode[tlprt.peeringMode],
      });
    } catch (e) {
      logger.error('[P2PManager]', 'initialize error', e?.message);
    }
  };

  const dispose = () => {
    logger.log('[P2PManager]', 'dispose');

    if (tlprt) {
      window.removeEventListener('unload', dispose);
      tlprt.dispose();
      tlprt = null;
      window.tlprt = null;
    }
  };

  return {
    init,
    dispose,
  };
};

const instance = P2PManager();
export { instance as P2PManager };
