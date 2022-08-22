import { Experiments } from '@moretv/types';
import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'INIT_EXPERIMENTS_SUBSCRIBER';

export type EventsWithPayload =
  | {
      type: 'INIT_EXPERIMENTS_SUBSCRIBER_RESOLVE';
    }
  | {
      type: 'SET_EXPERIMENT';
      payload: {
        name: Experiments;
        group: string;
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
  experiments: { [key in Experiments]?: string };
};
