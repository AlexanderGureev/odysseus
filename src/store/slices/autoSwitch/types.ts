import { DefaultPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'READY' | 'AUTOSWITCH_NOTIFY' | 'AUTOSWITCH_WAITING' | 'AUTOSWITCH_PENDING' | 'DISABLED';

export type EventsWithPayload = {
  type: 'HIDE_AUTOSWITCH_NOTIFY' | 'START_AUTOSWITCH' | 'AUTOSWITCH_NOTIFY_SHOWN';
};

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;

  controlType: 'project' | 'episode' | null;
  autoswitchType: 'notify' | 'auto' | null;
  autoswitchPoint: number;
  countdown: number;
  countdownValue: number;
  thumbnail: string | null;
  buttonText: string | null;
  cancelButtonText: string | null;

  previousTime: number | null;
  auto: boolean;
};
