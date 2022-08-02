import { DefaultPayload, WithoutPayload } from 'store/types';
import { TLinkedTracks, TStreamsConfig } from 'types';

export type State = 'IDLE' | 'CHECK_TOKEN_PENDING' | 'CHECK_MANIFEST_PENDING';

export type TokenUpdateResponse = {
  linked_tracks: TLinkedTracks;
  tokenExpiredAt: number | null;
  userToken: string;
};

export type EventsWithPayload =
  | WithoutPayload<
      | 'DO_INIT'
      | 'CHECK_TOKEN'
      | 'CHECK_MANIFEST'
      | 'CHECK_TOKEN_RESOLVE'
      | 'CHECK_MANIFEST_RESOLVE'
      | 'CHECK_TOKEN_REJECT'
      | 'CHECK_MANIFEST_REJECT'
    >
  | {
      type: 'UPDATE_MANIFEST';
      payload: {
        streams: TStreamsConfig;
      };
    }
  | {
      type: 'UPDATE_TOKEN';
      payload: TokenUpdateResponse;
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
};
