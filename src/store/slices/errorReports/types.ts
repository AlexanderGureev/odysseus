import { Problem } from 'services/MailService/types';
import { DefaultPayload, WithoutPayload } from 'store/types';

export type State =
  | 'IDLE'
  | 'READY'
  | 'REPORT_SEND_SUCCESS'
  | 'REPORT_SEND_ERROR'
  | 'TEMPORARY_BLOCK'
  | 'SEND_ERROR_REPORT_PENDING'
  | 'DISABLED';

export type EventsWithPayload =
  | {
      type: 'SEND_ERROR_REPORT';
      meta: {
        problems: Problem[];
        description?: string;
        email?: string;
      };
    }
  | {
      type: 'SEND_ERROR_REPORT_RESOLVE' | 'SEND_ERROR_REPORT_REJECT';
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
};
