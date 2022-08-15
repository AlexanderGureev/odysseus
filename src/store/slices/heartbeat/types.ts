import { VIDEO_TYPE } from 'components/Player/types';
import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'CHECK_HEARBEAT_PENDING';

export type EventsWithPayload =
  | {
      type: 'HEARTBEAT_VIDEO' | 'HEARTBEAT_AD';
      payload: {
        value: number;
      };
    }
  | {
      type: 'CHECK_HEARBEAT_RESOLVE';
      payload: {
        progress: {
          [VIDEO_TYPE.AD]: Record<string, number>;
          [VIDEO_TYPE.PLAIN]: Record<string, number>;
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
    [VIDEO_TYPE.AD]: Record<string, number>;
    [VIDEO_TYPE.PLAIN]: Record<string, number>;
  };

  heartbeats: number[];
};
