import { DefaultPayload, WithoutPayload } from 'store/types';

export type State =
  | 'IDLE'
  | 'INIT_FULLSCREEN_SUBSCRIBERS'
  | 'FULLSCREEN'
  | 'DEFAULT'
  | 'ENTER_FULLCREEN_PENDING'
  | 'EXIT_FULLCREEN_PENDING';

export type EventsWithPayload = WithoutPayload<
  | 'ENTER_FULLCREEN'
  | 'EXIT_FULLCREEN'
  | 'INIT_FULLSCREEN_SUBSCRIBERS_RESOLVE'
  | 'ENTER_FULLCREEN_RESOLVE'
  | 'EXIT_FULLCREEN_RESOLVE'
  | 'ENTER_FULLCREEN_REJECT'
  | 'EXIT_FULLCREEN_REJECT'
  | 'EVENT_SET_DEFAULT'
  | 'EVENT_SET_FULLSCREEN'
>;

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
};
