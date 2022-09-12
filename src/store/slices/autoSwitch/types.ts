import { DefaultPayload, WithoutPayload } from 'store/types';
import { Badge, Nullable } from 'types';

export type State =
  | 'IDLE'
  | 'PREPARE_AUTOSWITCH'
  | 'READY'
  | 'AUTOSWITCH_NOTIFY'
  | 'AUTOSWITCH_WAITING'
  | 'AUTOSWITCH_PENDING'
  | 'AUTOSWITCH_NOTIFY_PAUSED'
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

export type AutoswitchType = 'notify' | 'auto' | null;

export type FSMState = {
  step: State;

  controlType: 'project' | 'episode' | null;
  autoswitchType: AutoswitchType;
  autoswitchPoint: number;
  countdown: number;
  countdownValue: number;
  thumbnail: string | null;
  thumbnailText: string | null;
  buttonText: string | null;
  cancelButtonText: string | null;
  badge: Nullable<{ text: string | null; badgeColor: string; textColor: string }>;

  previousTime: number | null;
  auto: boolean;

  autoswitchNotifyType: AutoswitchNotifyType;
  autoswitchNotifyText: string | null;
};
