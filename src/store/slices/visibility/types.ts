import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'CHECK_VISIBILITY_PENDING' | 'VISIBLE' | 'HIDDEN';

export type EventsWithPayload = {
  type: 'GO_TO_VISIBLE' | 'GO_TO_HIDDEN';
};

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
};
