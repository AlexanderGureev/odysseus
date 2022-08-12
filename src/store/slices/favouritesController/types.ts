import { FavouritesSource } from 'services/FavouritesService/types';
import { DefaultPayload, WithoutPayload } from 'store/types';

export type State =
  | 'IDLE'
  | 'INITIAL_SYNC_FAVOURITES'
  | 'SYNC_FAVOURITES'
  | 'READY'
  | 'UPDATE_FAVOURITES_PENDING'
  | 'UPDATE_LOCAL_FAVOURITES_PENDING'
  | 'CHECK_TTL_FAVOURITES'
  | 'GET_FAVOURITES_STATUS'
  | 'ERROR';

export type EventsWithPayload =
  | {
      type:
        | 'UPDATE_FAVOURITES_RESOLVE'
        | 'UPDATE_LOCAL_FAVOURITES_RESOLVE'
        | 'TTL_EXPIRED'
        | 'CHECK_TTL_FAVOURITES_RESOLVE'
        | 'INITIAL_SYNC_FAVOURITES_REJECT'
        | 'SYNC_FAVOURITES_RESOLVE'
        | 'SYNC_FAVOURITES_REJECT'
        | 'START_SYNC_FAVOURITES'
        | 'GET_FAVOURITES_STATUS_REJECT'
        | 'INITIAL_SYNC_FAVOURITES_RESOLVE';
    }
  | {
      type: 'SET_FAVOURITES' | 'ROLLBACK_FAVOURITES_STATE' | 'GET_FAVOURITES_STATUS_RESOLVE';
      payload: {
        isFavourites: boolean;
      };
    }
  | {
      type: 'SET_LOCAL_FAVOURITES';
      payload: {
        isFavourites: boolean;
      };
      meta: {
        source: FavouritesSource;
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
  isFavourites: boolean;
};
