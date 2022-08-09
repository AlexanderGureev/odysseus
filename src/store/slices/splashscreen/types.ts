import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'INIT_SPLASHCREEN' | 'SHOWING_SPLASHCREEN' | 'DISABLED';

export type EventsWithPayload =
  | WithoutPayload<'SHOWING_SPLASHCREEN_END'>
  | {
      type: 'INIT_SPLASHCREEN_RESOLVE' | 'INIT_SPLASHCREEN_REJECT';
      payload: {
        screens: Screens;
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type Screens = Array<{ img: string; duration: number }>;

export type FSMState = {
  step: State;
  screens: Screens;
};
