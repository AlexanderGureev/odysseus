import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE';

export type EventsWithPayload = {
  type: 'asdsdsd';
};

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
};
