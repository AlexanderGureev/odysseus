import { DefaultPayload, WithoutPayload } from 'store/types';
import { PlayerError } from 'utils/errors';

export type State = 'IDLE' | 'ERROR';

export type EventsWithPayload = {
  type: 'SET_ERROR';
  payload: {
    error: PlayerError | null;
  };
};

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;

  error: PlayerError | null;
};
