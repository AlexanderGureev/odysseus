import { DefaultPayload, WithoutPayload } from 'store/types';

export type State =
  | 'IDLE'
  | 'READY'
  | 'FETCH_BEHOLDER_TOKEN'
  | 'CHECK_BEHOLDER_TOKEN'
  | 'SEND_VIEWS_PENDING'
  | 'DISABLED';

export type EventsWithPayload =
  | {
      type: 'FETCH_BEHOLDER_TOKEN_RESOLVE';
      payload: {
        token: string;
        tokenExpiredAt: number | null;
      };
    }
  | {
      type: 'FETCH_BEHOLDER_TOKEN_REJECT' | 'SEND_VIEWS_RESOLVE' | 'CHECK_BEHOLDER_TOKEN_RESOLVE';
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;

  hostname: string;
  points: number[];
  period: number;
  token: string | null;
  tokenExpiredAt: number | null;
  serviceId: number;
};
