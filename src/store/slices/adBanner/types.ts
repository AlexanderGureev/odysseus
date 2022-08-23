import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'INIT_AD_BANNER' | 'HIDDEN' | 'VISIBLE' | 'DISPOSE_PENDING' | 'DISABLED';

export type EventsWithPayload =
  | {
      type: 'SHOW_BANNER' | 'INIT_AD_BANNER_REJECT' | 'DISPOSE_RESOLVE';
    }
  | {
      type: 'INIT_AD_BANNER_RESOLVE';
      payload: {
        bannerParams: string;
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
  bannerParams: string;
};
