import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'READY' | 'ACCUMULATION';

export type EventsWithPayload =
  | {
      type: 'INC_SEEK' | 'DEC_SEEK';
      payload: {
        value: number;
      };
    }
  | WithoutPayload<'ACCUMULATION_RESOLVE'>;

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
  inc: number;
  dec: number;
  type: 'inc' | 'dec';
};
