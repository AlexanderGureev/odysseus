import { DefaultPayload, WithoutPayload } from 'store/types';

export type State =
  | 'IDLE'
  | 'INIT_FAVOURITES_LISTENERS'
  | 'READY'
  | 'SELECT_MODE_PENDING'
  | 'LOADING_FAVOURITES'
  | 'DISABLED';

export type EventsWithPayload =
  | {
      type: 'INIT_FAVOURITES_LISTENERS_RESOLVE' | 'SET_DISABLED_MODE';
    }
  | {
      type: 'SET_FAVOURITES_MODE';
      payload: {
        mode: Mode;
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type Mode = 'DISABLED' | 'AUTHORIZED_MODE_WITHOUT_DB' | 'AUTHORIZED_MODE' | 'ANONYMOUS_MODE';

export type FSMState = {
  step: State;
  mode: Mode;
};
