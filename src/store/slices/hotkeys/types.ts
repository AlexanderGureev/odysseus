import { DefaultPayload, EventPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'HOTKEYS_INIT' | 'PROCESSING_KEYBOARD_EVENT' | 'READY' | 'DISABLED';

export type EventsWithPayload =
  | {
      type: 'HOTKEYS_INIT_RESOLVE' | 'HOTKEYS_INIT_REJECT' | 'PROCESSING_KEYBOARD_EVENT_RESOLVE' | 'DISABLE_HOTKEYS';
    }
  | {
      type: 'KEYBOARD_EVENT';
      meta: {
        event: EventPayload;
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
};
