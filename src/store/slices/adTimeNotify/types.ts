import { DefaultPayload, WithoutPayload } from 'store/types';
import { TAdPointConfig } from 'types/ad';

export type State = 'IDLE' | 'RESET' | 'DISABLED' | 'TIME_UPDATE_PENDING' | 'UPDATE_POINTS';

export type EventsWithPayload =
  | {
      type: 'UPDATE_NOTIFY_TIME';
      payload: {
        time: number;
      };
    }
  | {
      type: 'UPDATE_TIME';
      payload: {
        time: number | null;
      };
    }
  | {
      type: 'SETUP_NOTIFY_REJECT';
      payload: {
        time: null;
        point: null;
      };
    }
  | {
      type: 'UPDATE_POINTS_RESOLVE';
      payload: {
        points: TAdPointConfig[];
      };
    }
  | {
      type: 'DONE';
      payload: {
        time: null;
        points: TAdPointConfig[];
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
  points: TAdPointConfig[];
  time: number | null;
};
