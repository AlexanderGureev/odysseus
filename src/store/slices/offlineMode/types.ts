import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'OFFLINE' | 'CHECK_ERROR' | 'ERROR' | 'RECOVERY_SESSION';

export type EventsWithPayload = {
  type: 'CHECK_ERROR_RESOLVE';
};

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
};
