import { TAdLinkItem } from 'services/AdService/types';
import { DefaultPayload, WithoutPayload } from 'store/types';
import { TAdConfig, TAdPointConfig } from 'types/ad';

export type State =
  | 'IDLE'
  | 'INIT_AD_SERVICE'
  | 'INIT_AD_PENDING'
  | 'INITIALIZING_AD_BREAK'
  | 'AD_BREAK'
  | 'DISPOSE_AD_BREAK'
  | 'PRELOAD_AD_BLOCK_PENDING'
  | 'CHECK_TIME_POINT_PENDING'
  | 'DISABLED'
  | 'CHECK_PAUSE_ROLL_PENDING'
  | 'CHECK_POST_ROLL_PENDING';

export type EventsWithPayload =
  | WithoutPayload<
      | 'AD_INIT'
      | 'INIT_AD_REJECT'
      | 'CHECK_TIME_POINT_RESOLVE'
      | 'PRELOAD_AD_BLOCK_REJECT'
      | 'NEXT_AD_RESOLVE'
      | 'NEXT_AD_REJECT'
      | 'CHECK_PAUSE_ROLL_RESOLVE'
      | 'CHECK_POST_ROLL_RESOLVE'
      | 'AD_BREAK_STARTED'
      | 'INIT_AD_SERVICE_RESOLVE'
      | 'CHECK_POST_ROLL'
    >
  | {
      type: 'INIT_AD_RESOLVE';
      payload: { isActive: boolean };
    }
  | {
      type: 'CHECK_TIME_POINT';
      meta: { currentTime: number };
    }
  | {
      type: 'PRELOAD_AD_BLOCK';
      meta: TAdPointConfig;
    }
  | {
      type: 'AD_CREATIVE_INITIALIZED';
      meta: TAdLinkItem;
    }
  | {
      type: 'INIT_AD_BREAK';
      payload: {
        data: TAdConfig;
        point: TAdPointConfig;
      };
    }
  | {
      type: 'PRELOAD_AD_BLOCK_RESOLVE';
      payload: { preloadedPoint: TAdPointConfig };
    }
  | {
      type: 'PRELOAD_AD_BLOCK_STARTED';
    }
  | {
      type: 'AD_BREAK_END';
      meta: TAdPointConfig;
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;

  data: TAdConfig | null;
  point: TAdPointConfig | null;
  isStarted: boolean;
  adBreaksCount: number;
};
