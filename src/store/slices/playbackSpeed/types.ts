import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'READY' | 'PLAYBACK_SPEED_INIT' | 'CHANGE_PLAYBACK_SPEED_PENDING';

export type EventsWithPayload =
  | {
      type: 'SET_PLAYBACK_SPEED';
      payload: {
        value: number;
      };
    }
  | {
      type: 'CHANGE_PLAYBACK_SPEED_RESOLVE';
    }
  | {
      type: 'PLAYBACK_SPEED_INIT_RESOLVE';
      payload: {
        currentSpeed: number;
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
  list: number[];
  currentSpeed: number;
};
