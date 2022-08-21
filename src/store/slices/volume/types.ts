import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'SETUP_INITIAL_VOLUME' | 'CHANGE_MUTE_PENDING' | 'CHANGE_VOLUME_PENDING';

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
      type: 'SET_MUTE';
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
  | WithoutPayload<'CHANGE_MUTE_RESOLVE' | 'CHANGE_VOLUME_RESOLVE'>;

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;

  muted: boolean;
  volume: number;
};
