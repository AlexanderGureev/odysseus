import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'CHECK_ATTEMPT' | 'REJECTED' | 'RETRY_PENDING' | 'TIMEOUT_WAITING';

export type EventsWithPayload =
  | {
      type: 'START_RETRY' | 'GO_REJECT' | 'RETRY_FAILED' | 'CLICK_RETRY_BUTTON' | 'NEXT_RETRY';
    }
  | {
      type: 'UPDATE_TIMER';
      payload: {
        timerValue: number;
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;

  offlineTimer: number[];
  offlineRetryQuantity: number;
  offlineRetryTime: number;

  attempt: number;
  timerValue: number;
  timerTimestamp: number | null;
};
