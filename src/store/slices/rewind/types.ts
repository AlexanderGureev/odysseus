import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'REWIND_INIT' | 'READY' | 'ACCUMULATION' | 'SEEK_START' | 'SEEKING';

export type EventsWithPayload =
  | {
      type: 'SEEK';
      meta: {
        to: number;
      };
    }
  | {
      type: 'INC_SEEK' | 'DEC_SEEK';
      payload: {
        value: number;
      };
    }
  | WithoutPayload<'SEEK_END' | 'ACCUMULATION_RESOLVE' | 'REWIND_INIT_RESOLVE' | 'SEEK_START_RESOLVE'>;

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
  inc: number;
  dec: number;
  type: 'inc' | 'dec';
};
