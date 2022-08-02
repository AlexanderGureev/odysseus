import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'REBUFFERING_INIT' | 'READY' | 'BUFFERING' | 'DISABLED';

export type EventsWithPayload =
  | WithoutPayload<'BUFFERING_END' | 'REBUFFERING_INIT_RESOLVE'>
  | {
      type: 'BUFFERING_START';
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
  startAt: number | null;
  bufferingTime: number;
  initialBufferTime: number | null;
};
