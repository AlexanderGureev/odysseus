import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'SETUP_PAY_NOTIFY' | 'READY' | 'CLICK_SUB_BUTTON_PROCESSING' | 'DISABLED';

export type EventsWithPayload =
  | {
      type: 'SETUP_PAY_NOTIFY_RESOLVE';
      payload: {
        text: string;
        btnText: string;
      };
    }
  | {
      type: 'SETUP_PAY_NOTIFY_REJECT';
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
  text: string;
  btnText: string;
};
