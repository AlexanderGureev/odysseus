import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'REWIND_INIT' | 'READY' | 'SEEK_START' | 'SEEKING' | 'DISABLED';

export type EventsWithPayload =
  | {
      type: 'SEEK';
      meta: {
        to: number;
      };
    }
  | {
      type: 'SEEK_STARTED';
      meta: {
        to: number;
        from: number;
      };
    }
  | WithoutPayload<'SEEK_END' | 'REWIND_INIT_RESOLVE'>;

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
};
