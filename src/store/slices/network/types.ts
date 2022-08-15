import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'INITIALIZE_NETWORK' | 'ONLINE' | 'OFFLINE';

export type EventsWithPayload =
  | {
      type: 'GO_ONLINE' | 'GO_OFFLINE';
    }
  | {
      type: 'CHANGE_CONNECTION_TYPE' | 'INITIALIZE_NETWORK_RESOLVE';
      payload: {
        connectionType: ConnectionType | null;
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
  connectionType: ConnectionType | null;
};
