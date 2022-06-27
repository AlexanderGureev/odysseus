interface Window {
  ya?: any;
  ENV: import('../../server/types').TEnvConfig;
  ODYSSEUS_PLAYER_CONFIG: import('../../server/types').TConfig;
  CONTEXT: import('../../server/utils').TParams;
  WebKitMediaSource?: any;
  WebKitSourceBuffer?: any;
  __type: 'MASTER' | 'WORKER';
}
