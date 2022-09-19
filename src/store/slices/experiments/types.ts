import { Experiments } from '@moretv/types';
import { DistributionCfg, ExperimentsState, PlayerExperiment } from 'services/ExperimentsService/types';
import { DefaultPayload } from 'store/types';

export type State = 'IDLE' | 'INIT_EXPERIMENTS_SUBSCRIBER' | 'INIT_EXPERIMENTS';

export type EventsWithPayload =
  | {
      type: 'INIT_EXPERIMENTS_SUBSCRIBER_RESOLVE' | 'INIT_EXPERIMENTS_REJECT';
    }
  | {
      type: 'SET_EXPERIMENT';
      payload: {
        name: Experiments;
        group: string;
      };
    }
  | {
      type: 'INIT_EXPERIMENTS_RESOLVE';
      payload: {
        experiments: ExperimentsState;
        distribution: DistributionCfg;
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;

  web: {
    experiments: { [key in Experiments]?: string };
  };
  player: {
    experiments: ExperimentsState;
    distribution: DistributionCfg;
  };
};
