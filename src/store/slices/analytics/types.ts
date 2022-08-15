import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'INIT_ANALYTICS_SUBCRIBERS';

export type EventsWithPayload =
  | {
      type: 'INIT_ANALYTICS_SUBCRIBERS_RESOLVE';
    }
  | {
      type: 'SET_ANALYTICS_DATA';
      payload: {
        ym_client_id?: string | null;
        hacks_detected?: string[];
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;

  ym_client_id: string | null;
  hacks_detected: string[];
};
