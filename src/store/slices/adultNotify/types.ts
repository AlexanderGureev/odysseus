import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'ADULT_NOTIFY_INIT' | 'CHECK_ADULT_CONTENT' | 'ADULT_NOTIFY' | 'ADULT_NOTIFY_REJECTED';

export type EventsWithPayload =
  | {
      type: 'CHECK_ADULT' | 'SHOW_ADULT_NOTIFY' | 'SKIP_ADULT_NOTIFY' | 'ADULT_NOTIFY_RESOLVE' | 'ADULT_NOTIFY_REJECT';
    }
  | {
      type: 'ADULT_NOTIFY_INIT_RESOLVE';
      payload: {
        confirmed: boolean;
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
  confirmed: boolean;
};
