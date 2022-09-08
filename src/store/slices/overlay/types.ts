import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'INIT_OVERLAY' | 'SETUP_OVERLAY' | 'CLOSING_OVERLAY' | 'READY';

export type OverlayType = 'sharing' | 'embedding' | 'hotkeys' | 'complain' | 'none';

export type EventsWithPayload =
  | {
      type: 'SET_OVERLAY';
      payload: {
        overlayType: OverlayType;
      };
    }
  | {
      type: 'CLOSE_OVERLAY' | 'CLOSING_OVERLAY_RESOLVE' | 'INIT_OVERLAY_RESOLVE';
    }
  | {
      type: 'SETUP_OVERLAY_RESOLVE';
      payload: {
        autoPause: boolean;
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
  overlayType: OverlayType;
  autoPause: boolean;
};
