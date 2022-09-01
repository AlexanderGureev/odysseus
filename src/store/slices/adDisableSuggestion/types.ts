import { DefaultPayload, WithoutPayload } from 'store/types';

import { NoticeContent } from '../trialSuggestion/utils';

export type State =
  | 'IDLE'
  | 'INIT_AD_DISABLE_SUGGESTION'
  | 'INIT_AD_DISABLE_SUGGESTION_LISTENERS'
  | 'READY'
  | 'CLICK_SUB_BUTTON_PROCESSING'
  | 'SHOWING_AD_DISABLE_SUGGESTION'
  | 'DISABLED'
  | 'DISPOSE_AD_SUGGESTION';

export type EventsWithPayload =
  | {
      type:
        | 'INIT_AD_DISABLE_SUGGESTION_REJECT'
        | 'CLOSE_AD_DISABLE_SUGGESTION'
        | 'CLICK_CLOSE_AD_DISABLE_SUGGESTION'
        | 'DISPOSE_AD_SUGGESTION_RESOLVE'
        | 'INIT_AD_DISABLE_SUGGESTION_LISTENERS_RESOLVE'
        | 'SHOW_AD_DISABLE_SUGGESTION'
        | 'CLICK_SUB_BUTTON_PROCESSING_RESOLVE';
    }
  | {
      type: 'CLOSE_AD_DISABLE_SUGGESTION';
      meta?: {
        source: 'close-icon';
      };
    }
  | {
      type: 'INIT_AD_DISABLE_SUGGESTION_RESOLVE';
      payload: NoticeContent;
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = NoticeContent & {
  step: State;
  isInitialized: boolean;
};
