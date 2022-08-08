import { DefaultPayload, WithoutPayload } from 'store/types';

export type State =
  | 'IDLE'
  | 'SETUP_INITIAL_VOLUME'
  | 'CHANGE_MUTE_PENDING'
  | 'CHANGE_VOLUME_PENDING'
  | 'CHANGE_AD_VOLUME_STATE'
  | 'CHANGE_VOLUME_AD_BLOCK_PENDING'
  | 'CHANGE_MUTE_AD_BLOCK_PENDING';

export type EventsWithPayload =
  | {
      type: 'SET_INITIAL_VOLUME';
    }
  | {
      type: 'SETUP_INITIAL_VOLUME_RESOLVE';
      payload: {
        muted: boolean;
        volume: number;
      };
    }
  | {
      type: 'CHANGE_AD_VOLUME_STATE_RESOLVE';
      payload: {
        muted: boolean;
      };
    }
  | {
      type: 'SET_VOLUME' | 'SET_VOLUME_AD_BLOCK';
      payload: {
        value: number;
      };
    }
  | {
      type: 'SET_MUTE' | 'SET_MUTE_AD_BLOCK';
      payload: {
        value: boolean;
      };
    }
  | WithoutPayload<
      | 'CHANGE_MUTE_RESOLVE'
      | 'CHANGE_VOLUME_RESOLVE'
      | 'CHANGE_AD_VOLUME_STATE_RESOLVE'
      | 'CHANGE_VOLUME_AD_BLOCK_RESOLVE'
      | 'CHANGE_MUTE_AD_BLOCK_RESOLVE'
    >;

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;

  beforeAdState: {
    muted: boolean;
    volume: number;
  } | null;

  muted: boolean;
  volume: number;
};
