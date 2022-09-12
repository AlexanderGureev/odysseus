import { DefaultPayload, WithoutPayload } from 'store/types';

export type State =
  | 'IDLE'
  | 'SETUP_INITIAL_VOLUME'
  | 'CHANGE_MUTE_PENDING'
  | 'CHANGE_VOLUME_PENDING'
  | 'INIT_VOLUME_SUBSCRIBERS'
  // ad
  | 'SYNC_VOLUME_PENDING'
  | 'CHANGE_VOLUME_AD_BLOCK_PENDING'
  | 'CHANGE_MUTE_AD_BLOCK_PENDING'
  | 'UPDATE_VOLUME_AD_BLOCK_PENDING';

export type EventsWithPayload =
  | {
      type: 'SET_INITIAL_VOLUME' | 'INIT_VOLUME_SUBSCRIBERS_RESOLVE';
    }
  | {
      type: 'SETUP_INITIAL_VOLUME_RESOLVE';
      payload: {
        muted: boolean;
        volume: number;
      };
    }
  | {
      type: 'SET_MUTE' | 'UPDATE_MUTE';
      payload: {
        value: boolean;
      };
    }
  | {
      type: 'SET_VOLUME';
      payload: {
        value: number;
      };
    }
  | WithoutPayload<'CHANGE_MUTE_RESOLVE' | 'CHANGE_VOLUME_RESOLVE' | 'CHECK_VOLUME_RESOLVE'>;

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;

  unmuted: boolean;
  muted: boolean;
  volume: number;
};
