import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'INITIALIZE_P2P_PENDING' | 'INITIALIZED' | 'DISPOSING_P2P' | 'DISABLED';

export type EventsWithPayload = {
  type: 'INITIALIZE_P2P_RESOLVE' | 'INITIALIZE_P2P_REJECT' | 'INIT_P2P' | 'DISPOSE_P2P' | 'DISPOSING_P2P_RESOLVE';
};

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
};
