import { DefaultPayload, ErrorPayload, WithoutPayload } from 'store/types';
import { Nullable } from 'types';

import { TrackParams } from '../root';

export type State = 'IDLE' | 'ERROR' | 'FETCH_TRACK_CONFIG' | 'CHECK_TOKEN_PENDING' | 'CHANGE_TRACK_PENDING';

export type EventsWithPayload =
  | {
      type: 'GO_TO_NEXT_TRACK' | 'GO_TO_PREV_TRACK';
      payload?: { params: TrackParams };
    }
  | ErrorPayload<'FETCH_TRACK_CONFIG_REJECT'>
  | {
      type: 'FETCH_TRACK_CONFIG_RESOLVE';
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
  prev: boolean;
  next: boolean;
  type: Nullable<'next' | 'previous'>;
  params: TrackParams;
};
