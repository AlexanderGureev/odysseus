import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'INITIALIZE_NETWORK' | 'ONLINE' | 'OFFLINE';

export type EventsWithPayload = {
  type: 'INITIALIZE_NETWORK_RESOLVE' | 'GO_ONLINE' | 'GO_OFFLINE';
};

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
};
