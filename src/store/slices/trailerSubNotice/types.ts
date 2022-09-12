import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'INITIALIZE_TRAILER_NOTICE' | 'READY' | 'CLICK_SUB_BUTTON_PROCESSING' | 'DISABLED';

export type EventsWithPayload =
  | {
      type: 'INITIALIZE_TRAILER_NOTICE_RESOLVE';
      payload: {
        buttonText: string;
        description: string;
      };
    }
  | {
      type: 'CLICK_SUB_BUTTON_PROCESSING_RESOLVE';
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
  buttonText: string | null;
  description: string | null;
};
