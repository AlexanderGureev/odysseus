interface Window {
  ya?: import('../../types/yasdk').Ya;
  ENV: import('../../types').TEnvConfig;
  ODYSSEUS_PLAYER_CONFIG: import('../../types').TConfig;
  CONTEXT: import('../../server/utils').TParams;
  __type: 'MASTER' | 'WORKER';

  WebKitMediaSource?: any;
  WebKitSourceBuffer?: any;
  WebKitMediaKeys: any;

  tlprt: import('../services/P2PManager/types').TeleportInstance | null;
  DevTools?: import('../services/P2PManager/types').TeleportDevTools;
  yaContextCb: any[];
  Ya?: any;

  ym?: (counterId: number, ...rest: any[]) => void;
  dataLayer?: any[];

  initVigo: (
    videoTag: HTMLElement,
    opts: import('../services/VigoService/types').VigoInitOpts
  ) => import('../services/VigoService/types').VigoSDK;
  _vigo: import('../services/VigoService/types').VigoSDK | null;
  V_VIGO_SCRIPT_LOADED: boolean;

  adcm?: {
    configure: (cfg: any, cb: () => void) => void;
    call: () => void;
  };

  _player: import('video.js').VideoJsPlayer;

  mozIndexedDB?: any;
  webkitIndexedDB?: any;
  msIndexedDB?: any;

  meta: import('../../types/TrackMeta').TrackMeta | null;
  mediaFile: import('../../types/MediaFile').MediaFile;

  debug?: {
    play: () => void;
    pause: () => void;
    seek: (to: number) => void;
    seekToAutoswitch: () => void;
    seekToEnd: () => void;
    getAdPoints: () => import('../../types/ad').TAdPointsConfig;
    seekToAd: (index: number) => void;
    invokeError: (code: number) => void;
  };
}

declare interface HTMLVideoElement {
  isFullscreen: () => any;
  webkitSetMediaKeys: any;
}

declare const teleport: import('../services/P2PManager/types').TeleportSDK;
