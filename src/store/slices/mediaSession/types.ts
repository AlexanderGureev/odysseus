import { DefaultPayload, EventPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'INITIALIZE_MEDIASESSION' | 'READY' | 'PROCESSING_MEDIA_EVENT' | 'DISABLED';

export type EventsWithPayload =
  | {
      type: 'INITIALIZE_MEDIASESSION_RESOLVE' | 'INITIALIZE_MEDIASESSION_REJECT' | 'PROCESSING_MEDIA_EVENT_RESOLVE';
    }
  | {
      type: 'MEDIA_EVENT';
      meta: {
        event: EventPayload;
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
};
