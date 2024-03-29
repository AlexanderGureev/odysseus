import { DefaultPayload, EventPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'POSTMESSAGE_LISTENERS_INIT' | 'READY' | 'PROCESSING_POSTMESSAGE_EVENT';

export type EventsWithPayload =
  | {
      type: 'POSTMESSAGE_LISTENERS_INIT_RESOLVE' | 'PROCESSING_POSTMESSAGE_EVENT_RESOLVE';
    }
  | {
      type: 'POSTMESSAGE_EVENT';
      meta: {
        event: EventPayload;
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
};
