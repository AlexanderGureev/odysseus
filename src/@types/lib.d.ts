interface Window {
  ya?: any;
  ENV: import('../../server/types').TEnvConfig;
  ODYSSEUS_PLAYER_CONFIG: import('../../server/types').TConfig;
  CONTEXT: import('../../server/utils').TParams;
  __type: 'MASTER' | 'WORKER';

  WebKitMediaSource?: any;
  WebKitSourceBuffer?: any;
  WebKitMediaKeys: any;

  tlprt: import('../services/P2PManager/types').TeleportInstance | null;
  DevTools?: import('../services/P2PManager/types').TeleportDevTools;
  yaContextCb: any[];
  Ya?: any;
}

declare interface HTMLVideoElement {
  isFullscreen: () => any;
  webkitSetMediaKeys: any;
}

declare const teleport: import('../services/P2PManager/types').TeleportSDK;
