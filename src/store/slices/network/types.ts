import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'ERROR';

export type EventsWithPayload = {
  type: '_net';
};

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
};
