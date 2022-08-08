import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'REWIND_INIT' | 'READY' | 'SEEK_START' | 'SEEKING';

export type EventsWithPayload =
  | {
      type: 'SEEK';
      meta: {
        to: number;
      };
    }
  | WithoutPayload<'SEEK_END' | 'REWIND_INIT_RESOLVE' | 'SEEK_START_RESOLVE'>;

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
};
