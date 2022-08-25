import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'SETUP_PAYWALL' | 'READY' | 'CLICK_SUB_BUTTON_PROCESSING';

export type EventsWithPayload =
  | {
      type: 'SETUP_PAYWALL_RESOLVE';
      payload: {
        title: string;
        description: string | null;
        paywallButtonText: string;
      };
    }
  | {
      type: 'SHOW_PAYWALL' | 'CLICK_SUB_BUTTON_PROCESSING_RESOLVE' | 'CLICK_SUB_BUTTON';
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type SubType = 'FULL_PRICE' | 'TRIAL';

export type FSMState = {
  step: State;
  title: string;
  description: string | null;
  paywallButtonText: string;
};
