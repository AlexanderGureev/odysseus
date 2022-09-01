import { DefaultPayload } from 'store/types';

import { NoticeContent, TS_TRIGGER } from './utils';

export type State =
  | 'IDLE'
  | 'READY'
  | 'AD_BREAK'
  | 'CHECKING_TRIGGERS'
  | 'DISPOSE_NOTICE'
  | 'SHOWING_TRIAL_NOTICE'
  | 'INITIALIZING_TRIAL_NOTICE'
  | 'INITIALIZING_NOTICE_LISTENERS'
  | 'AWAITING_START_PLAYBACK'
  | 'AUTO_CLOSE'
  | 'CLICK_PAY_BUTTON_TRIAL_NOTICE_PROCESSING'
  | 'DISABLED';

export type EventsWithPayload =
  | {
      type:
        | 'NOT_FOUND_NOTICE'
        | 'CLICK_PAY_BUTTON_TRIAL_NOTICE'
        | 'CLICK_CLOSE_TRIAL_NOTICE'
        | 'CLOSE_TRIAL_NOTICE'
        | 'AUTO_CLOSE_TRIAL_NOTICE'
        | 'SET_TRIAL_NOTICE'
        | 'INITIALIZING_TRIAL_NOTICE_RESOLVE'
        | 'INITIALIZING_TRIAL_NOTICE_REJECT'
        | 'INITIALIZING_NOTICE_LISTENERS_RESOLVE'
        | 'DISPOSE_NOTICE_RESOLVE'
        | 'CLICK_PAY_BUTTON_TRIAL_NOTICE_PROCESSING_RESOLVE'
        | 'TRIAL_NOTICE_SHOWN';
    }
  | {
      type: 'SHOW_TRIAL_NOTICE' | 'SET_TRIAL_NOTICE';
      payload: {
        notifyType: TS_TRIGGER;
        notifyContent: NoticeContent;
        timerId: string;
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
  isInitialized: boolean;
  notifyType: TS_TRIGGER | null;
  notifyContent: NoticeContent | null;
  timerId: string | null;
};
