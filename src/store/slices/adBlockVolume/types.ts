import { DefaultPayload, WithoutPayload } from 'store/types';

export type State =
  | 'IDLE'
  | 'SYNC_VOLUME_PENDING'
  | 'SYNC_VOLUME_STATE'
  | 'CHANGE_VOLUME_AD_BLOCK_PENDING'
  | 'CHANGE_MUTE_AD_BLOCK_PENDING'
  | 'UPDATE_VOLUME_AD_BLOCK_PENDING';

export type EventsWithPayload =
  | {
      type: 'SYNC_VOLUME';
    }
  | {
      type: 'SYNC_VOLUME_PENDING_RESOLVE' | 'SYNC_VOLUME_STATE_RESOLVE' | 'UPDATE_VOLUME_AD_BLOCK_RESOLVE';
      payload: {
        muted: boolean;
        volume: number;
      };
    }
  | {
      type: 'SET_VOLUME_AD_BLOCK';
      payload: {
        value: number;
      };
    }
  | {
      type: 'SET_MUTE_AD_BLOCK';
      payload: {
        value: boolean;
      };
    }
  | {
      type: 'UPDATE_VOLUME_AD_BLOCK';
      meta: { value: number };
    }
  | WithoutPayload<'CHANGE_VOLUME_AD_BLOCK_RESOLVE' | 'CHANGE_MUTE_AD_BLOCK_RESOLVE'>;

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;

  muted: boolean;
  volume: number;
};
