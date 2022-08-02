import { VideoJsPlayer } from 'video.js';

export type TVideoAdapter = {
  init: (mediator: any, player: VideoJsPlayer) => any;
};

export enum VideoAdapterEvent {
  ERROR = 'ERROR',
  CUSTOM_EVENT = 'CUSTOM_EVENT',
  STOP_SESSION = 'STOP_SESSION',
}
