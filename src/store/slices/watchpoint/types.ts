import { VIDEO_TYPE } from 'components/Player/types';
import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'CHECK_AD_WATCHPOINT_PENDING' | 'CHECK_PLAIN_WATCHPOINT_PENDING';

export type EventsWithPayload = {
  type: 'CHECK_PLAIN_WATCHPOINT_RESOLVE';
  payload?: {
    previousTime: number;
    progress: {
      [VIDEO_TYPE.AD]: number;
      [VIDEO_TYPE.PLAIN]: number;
    };
  };
};

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;

  previous: {
    [VIDEO_TYPE.AD]: number;
    [VIDEO_TYPE.PLAIN]: number;
  };
  progress: {
    [VIDEO_TYPE.AD]: number;
    [VIDEO_TYPE.PLAIN]: number;
  };

  previousTime: number;
};

export type WatchPoint = { value: number | '3min' | '1min' | '30sec'; num: number; measure: 'percents' | 'seconds' };
export const watchPoints: WatchPoint[] = [
  {
    value: 0,
    num: 0,
    measure: 'percents',
  },
  {
    value: 25,
    num: 25,
    measure: 'percents',
  },
  {
    value: 50,
    num: 50,
    measure: 'percents',
  },
  {
    value: 75,
    num: 75,
    measure: 'percents',
  },
  {
    value: '30sec',
    num: 30,
    measure: 'seconds',
  },
  {
    value: '1min',
    num: 60,
    measure: 'seconds',
  },
  {
    value: '3min',
    num: 180,
    measure: 'seconds',
  },
];
