import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'SETUP_PAY_BUTTON' | 'READY' | 'CLICK_PAY_BUTTON_PROCESSING' | 'DISABLED';

export type EventsWithPayload =
  | {
      type: 'CLICK_PAY_BUTTON' | 'CLICK_PAY_BUTTON_PROCESSING_RESOLVE' | 'SETUP_PAY_BUTTON_REJECT';
    }
  | {
      type: 'SETUP_PAY_BUTTON_RESOLVE';
      payload: {
        text: string;
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
  text: string;
};
