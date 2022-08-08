import { DefaultPayload, WithoutPayload } from 'store/types';
import { TAdPointConfig } from 'types/ad';

export type State = 'IDLE' | 'DISABLED';

export type EventsWithPayload =
  | {
      type: 'UPDATE_NOTIFY_TIME';
      payload: {
        time: number;
      };
    }
  | {
      type: 'SETUP_NOTIFY_REJECT';
      payload: {
        time: null;
        point: null;
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
  points: TAdPointConfig[];
  time: number | null;
};
