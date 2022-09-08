import { DefaultPayload, WithoutPayload } from 'store/types';

export type State =
  | 'IDLE'
  | 'CHECK_ATTEMPT'
  | 'REJECTED'
  | 'RETRY_PENDING'
  | 'RELOADING'
  | 'TIMEOUT_WAITING'
  | 'DISABLED';

export type EventsWithPayload =
  | {
      type: 'START_RETRY' | 'RETRY_FAILED' | 'CLICK_RETRY_BUTTON' | 'NEXT_RETRY' | 'RELOADING_RESOLVE';
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
};
