import { DefaultPayload, ErrorPayload, WithoutPayload } from 'store/types';

export type State =
  | 'IDLE'
  | 'ERROR'
  | 'END'
  | 'LOADING_META_PENDING'
  | 'LAUNCH_SETUP'
  | 'CHECK_TOKEN_PENDING'
  | 'CHECK_MANIFEST_PENDING'
  | 'FETCHING_MANIFEST';

export type EventsWithPayload =
  | WithoutPayload<'RESUME_VIDEO_RESOLVE' | 'RESUME_VIDEO' | 'LOAD_META_RESOLVE' | 'INIT_RESUME_VIDEO'>
  | ErrorPayload<'LOAD_META_REJECT'>;

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
};
