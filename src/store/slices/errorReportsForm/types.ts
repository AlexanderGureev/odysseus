import { FormState } from 'components/Controls/Menu/Complain';
import { DefaultPayload } from 'store/types';

export type State = 'IDLE' | 'EMAIL_STEP' | 'SENDING_REPORT_STEP' | 'ERROR_STEP' | 'CLOSING_REPORT_FORM' | 'END';

export type EventsWithPayload =
  | {
      type: 'NEXT_STEP';
    }
  | {
      type: 'CLOSING_REPORT_FORM_RESOLVE';
      meta: {
        step: State;
      };
    }
  | {
      type: 'CLICK_REPORT_BUTTON' | 'CLICK_SEND_REPORT_BUTTON';
      meta: FormState;
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
};
