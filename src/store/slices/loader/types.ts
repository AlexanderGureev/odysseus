import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'SHOWING';

export type EventsWithPayload = {
  type: 'loader';
};

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
  type: 'overlay' | 'spinner';
};
