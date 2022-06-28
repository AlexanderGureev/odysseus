import { VideoJsPlayer } from 'video.js';
import { TMediatorHandlers } from '../../../MediatorService';

export type TVideoAdapter = {
  init: (mediator: TMediatorHandlers, player: VideoJsPlayer) => any;
};

export enum VideoAdapterEvent {
  ERROR = 'ERROR',
  CUSTOM_EVENT = 'CUSTOM_EVENT',
  STOP_SESSION = 'STOP_SESSION',
}
