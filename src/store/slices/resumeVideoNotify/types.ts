import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'CHECK_RESUME_VIDEO' | 'RESUME_VIDEO_NOTIFY' | 'SENDING_BI';

export type EventsWithPayload =
  | {
      type:
        | 'CHECK_RESUME'
        | 'SKIP_RESUME_VIDEO_NOTIFY'
        | 'RESUME_VIDEO_NOTIFY_RESOLVE'
        | 'RESUME_VIDEO_NOTIFY_REJECT'
        | 'SENDING_BI_RESOLVE';
    }
  | {
      type: 'SHOW_RESUME_VIDEO_NOTIFY';
      payload: {
        time: number;
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
  isActive: boolean;
  time: number | null;
  isResetStartTime: boolean;
};
