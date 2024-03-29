import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'SETUP_PAYWALL' | 'READY' | 'CLICK_SUB_BUTTON_PROCESSING';

export type SubButtonType = 'about';

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
      type: 'SHOW_PAYWALL' | 'CLICK_SUB_BUTTON_PROCESSING_RESOLVE';
    }
  | {
      type: 'CLICK_SUB_BUTTON';
      meta?: {
        btn_type: SubButtonType;
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type SubType = 'FULL_PRICE' | 'TRIAL';

export type FSMState = {
  step: State;
  title: string | null;
  description: string | null;
  paywallButtonText: string | null;
};
