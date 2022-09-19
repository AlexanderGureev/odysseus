import { DefaultPayload, WithoutPayload } from 'store/types';

export type State =
  | 'IDLE'
  | 'OFFLINE'
  | 'AD_BREAK'
  | 'CHECK_ERROR'
  | 'INIT_RESTORE_MEDIA_LOADER'
  | 'RESTORE_MEDIA_LOADER_PENDING'
  | 'ERROR'
  | 'SETUP_PLAYBACK';

export type EventsWithPayload =
  | {
      type: 'CHECK_ERROR_RESOLVE' | 'RESTORE_MEDIA_LOADER_RESOLVE';
    }
  | {
      type: 'RESTORE_MEDIA_LOADER';
      payload: { initialPlaybackStep: 'PAUSED' | 'PLAYING' };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
  initialPlaybackStep: 'PAUSED' | 'PLAYING' | null;
};
