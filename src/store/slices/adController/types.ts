import { DefaultPayload, WithoutPayload } from 'store/types';
import { TAdConfig, TAdPointConfig } from 'types/ad';

export type State =
  | 'IDLE'
  | 'END'
  | 'INIT_AD_PENDING'
  | 'AD_BREAK'
  | 'PRELOAD_AD_BLOCK_PENDING'
  | 'CHECK_TIME_POINT_PENDING'
  | 'DISABLED'
  | 'CHECK_PAUSE_ROLL'
  | 'CHECK_POST_ROLL';

export type EventsWithPayload =
  | WithoutPayload<
      | 'AD_INIT'
      | 'INIT_AD_REJECT'
      | 'PLAY_AD_SKIP'
      | 'CHECK_TIME_POINT_RESOLVE'
      | 'PRELOAD_AD_BLOCK_REJECT'
      | 'NEXT_AD_RESOLVE'
      | 'NEXT_AD_REJECT'
      | 'RESET'
      | 'CHECK_PAUSE_ROLL_RESOLVE'
      | 'CHECK_POST_ROLL_RESOLVE'
      | 'AD_BREAK_STARTED'
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
};
