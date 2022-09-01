import { DefaultPayload, ErrorPayload, WithoutPayload } from 'store/types';
import { RawPlayerError } from 'types/errors';

export type State = 'IDLE' | 'RELOADING' | 'OPENING_NEW_PAGE' | 'ERROR' | 'NETWORK_ERROR' | 'DISABLED';

export type EventsWithPayload =
  | ErrorPayload<'PLAYER_ERROR' | 'NETWORK_ERROR' | 'SHOW_ERROR'>
  | {
      type: 'ERROR_SHOWN' | 'RELOAD' | 'RELOADING_RESOLVE' | 'OPENING_NEW_PAGE_RESOLVE';
    }
  | {
      type: 'OPEN_URL';
      meta: {
        url: string;
        target?: string;
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;

  error: RawPlayerError | null;
};
