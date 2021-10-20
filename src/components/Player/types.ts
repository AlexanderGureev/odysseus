import { TPlayerService, TState } from 'services/PlayerService';
import { TSource } from 'services/StreamService/types';

export const DEFAULT_PLAYER_ID = 'video-player';

export enum PLAYER_ERROR {
  MEDIA_ERR_CUSTOM,
  MEDIA_ERR_ABORTED,
  MEDIA_ERR_NETWORK,
  MEDIA_ERR_DECODE,
  MEDIA_ERR_SRC_NOT_SUPPORTED,
  MEDIA_ERR_ENCRYPTED,
}

export enum VIDEO_TYPE {
  PLAIN = 'PLAIN',
  AD = 'AD',
}

export type TPlayerApi = TPlayerService & {
  resumePlainVideo: () => Promise<void>;
  initializeAdvertisement: () => Promise<void>;
  isInitialized: boolean;
};

export type TPlayerState = TState;

export type TProps = { source: TSource };
