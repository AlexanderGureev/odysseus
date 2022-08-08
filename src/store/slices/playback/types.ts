import { VIDEO_TYPE } from 'components/Player/types';
import { DefaultPayload, WithoutPayload } from 'store/types';

export type State =
  | 'IDLE'
  | 'READY'
  | 'CHECK_TOKEN_PENDING'
  | 'CHECK_MANIFEST_PENDING'
  | 'PLAY_PENDING'
  | 'INIT_PENDING'
  | 'PLAYING'
  | 'PAUSE_PENDING'
  | 'PAUSED'
  | 'END'
  | 'AD_BREAK'
  | 'RESET'
  | 'PLAYBACK_INIT';

export type EventsWithPayload =
  | WithoutPayload<
      | 'DO_INIT'
      | 'DO_PLAY'
      | 'DO_PAUSE'
      | 'DO_PLAY_REJECT'
      | 'DO_PAUSE_REJECT'
      | 'VIDEO_END'
      | 'START_PLAYBACK'
      | 'RESET_RESOLVE'
      | 'PLAYBACK_INIT_RESOLVE'
      | 'SET_PAUSED'
      | 'SET_PLAYING'
      | 'ENDED'
    >
  | {
      type: 'TIME_UPDATE';
      payload: { currentTime: number; duration: number; remainingTime: number };
    }
  | {
      type: 'META_LOADED';
      payload: { duration: number };
    }
  | {
      type: 'DO_PAUSE_RESOLVE';
    }
  | {
      type: 'DO_PLAY_RESOLVE';
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;

  currentTime: number | null;
  duration: number | null;
  remainingTime: number | null;

  pausedAt: number | null;
};
