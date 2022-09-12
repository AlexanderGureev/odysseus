import { DefaultPayload, WithoutPayload } from 'store/types';
import { Nullable } from 'types';

export type State = 'IDLE' | 'SHOWING';

export type EventsWithPayload = {
  type: 'loader';
};

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type HotkeysAction = 'play' | 'pause' | 'forward_seek' | 'backward_seek' | 'volume' | 'mute';

export type FSMState = {
  step: State;
  type: Nullable<HotkeysAction>;
  text: string | null;
  key: number;
};
