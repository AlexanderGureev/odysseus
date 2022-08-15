import { DefaultPayload, ErrorPayload, WithoutPayload } from 'store/types';
import { RawPlayerError } from 'types/errors';

export type State = 'IDLE' | 'ERROR' | 'NETWORK_ERROR';

export type EventsWithPayload =
  | ErrorPayload<'PLAYER_ERROR' | 'NETWORK_ERROR'>
  | {
      type: 'ERROR_SHOWN';
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;

  error: RawPlayerError | null;
};
