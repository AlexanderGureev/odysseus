import { DefaultPayload, WithoutPayload } from 'store/types';

export type State =
  | 'IDLE'
  | 'PREPARE_AUTOSWITCH'
  | 'READY'
  | 'AUTOSWITCH_NOTIFY'
  | 'AUTOSWITCH_WAITING'
  | 'AUTOSWITCH_PENDING'
  | 'SELECT_AUTOSWITCH_NOTIFY_TYPE'
  | 'DISABLED';

export type EventsWithPayload =
  | {
      type:
        | 'PREPARE_AUTOSWITCH_RESOLVE'
        | 'START_AUTOSWITCH'
        | 'AUTOSWITCH_NOTIFY_SHOWN'
        | 'START_VIDEO_END_AUTOSWITCH'
        | 'CLOSE_AUTOSWITCH_NOTIFY';
    }
  | {
      type: 'SELECT_AUTOSWITCH_NOTIFY_TYPE_RESOLVE';
      payload: {
        autoswitchNotifyType: AutoswitchNotifyType;
        autoswitchNotifyText: string | null;
        buttonText: string | null;
        cancelButtonText: string | null;
      };
    }
  | {
      type: 'HIDE_AUTOSWITCH_NOTIFY';
      meta?: {
        source: 'close-icon';
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type AutoswitchNotifyType = 'default' | 'avod_popup';

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

  autoswitchNotifyType: AutoswitchNotifyType;
  autoswitchNotifyText: string | null;
};
