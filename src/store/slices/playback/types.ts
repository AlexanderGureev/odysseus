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
  | 'RESET_PLAYBACK'
  | 'PLAYBACK_INIT'
  | 'CHECK_AD_PENDING'
  | 'CHECK_AUTOSWITCH_PENDING';

export type EventsWithPayload =
  | WithoutPayload<
      | 'DO_INIT'
      | 'DO_PLAY'
      | 'DO_PAUSE'
      | 'DO_PLAY_REJECT'
      | 'RESET_PLAYBACK_RESOLVE'
      | 'PLAYBACK_INIT_RESOLVE'
      | 'SET_PLAYING'
      | 'ENDED'
      | 'START_END_FLOW'
      | 'AD_DISABLED'
      | 'AUTOSWITCH_DISABLED'
      | 'AUTO_PAUSE'
      | 'AUTO_PAUSE_RESOLVE'
      | 'AUTO_PLAY'
      | 'AUTO_PLAY_RESOLVE'
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
      type: 'DO_PLAY_RESOLVE';
      meta: { isFirstPlay: boolean };
    }
  | {
      type: 'START_PLAYBACK';
      meta: { isFirst: boolean };
    }
  | {
      type: 'END_PLAYBACK';
    }
  | {
      type: 'DO_PAUSE_RESOLVE';
      payload: {
        pausedAt: number;
      };
    }
  | { type: 'VIDEO_END'; meta: { beforeAutoswitch: boolean; isPreview: boolean } }
  | { type: 'SET_PAUSED'; payload: { pausedAt: number | null }; meta: { isEnded: boolean } };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;

  currentTime: number | null;
  duration: number | null;
  remainingTime: number | null;

  pausedAt: number | null;
  ended: boolean;
  isFirstPlay: boolean;
};
