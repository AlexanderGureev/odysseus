import { VideoJsPlayer } from 'video.js';

import { TMediatorHandlers } from '../../../MediatorService';

export type TAdsAdapter = {
  init: (mediator: TMediatorHandlers, player: VideoJsPlayer) => any;
};

export enum AdsAdapterEvent {
  AD_START = 'AD_START',
  AD_STOP = 'AD_STOP',
  AD_CLICK = 'AD_CLICK',
  FETCH_AD_MANIFEST = 'FETCH_AD_MANIFEST',
  AD_BREAK_START = 'AD_BREAK_START',
  AD_BREAK_STOP = 'AD_BREAK_STOP',
  AD_JOIN = 'AD_JOIN',
  AD_SKIP = 'AD_SKIP',
  AD_PAUSE = 'AD_PAUSE',
  AD_RESUME = 'AD_RESUME',
  AD_ERROR = 'AD_ERROR',
  AD_QUARTILE = 'AD_QUARTILE',
  SET_AD_CONFIG = 'SET_AD_CONFIG',
}
