import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'FETCH_CONFIG_PENDING';

export type EventsWithPayload = WithoutPayload<'CHANGE_TRACK'>;

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
};
