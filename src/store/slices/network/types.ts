import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'INITIALIZE_NETWORK' | 'ONLINE' | 'OFFLINE';

export type EventsWithPayload =
  | {
      type: 'GO_ONLINE' | 'GO_OFFLINE' | 'GO_REJECT';
    }
  | {
      type: 'CHANGE_CONNECTION_TYPE';
      payload: {
        connectionType: ConnectionType | null;
      };
    }
  | {
      type: 'INITIALIZE_NETWORK_RESOLVE';
      payload: {
        connectionType: ConnectionType | null;
      };
      meta: { isEmbedded: boolean };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
  connectionType: ConnectionType | null;
};
