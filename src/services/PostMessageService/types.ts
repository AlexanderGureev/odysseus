import { PLAYER_ERROR_TYPE } from 'components/ErrorManager/types';
import { OnceSubscribe, Subscribe, Unsubscribe } from 'services/MediatorService/types';
import { Nullable } from 'types';

export enum ERROR_CODE {
  ADULT_CONTENT = 154,
  RESUME_NOTIFY = 155,
}

// Ивенты направленные от плеера к вебу
export type OUTPUT_PLAYER_POST_MESSAGE =
  | 'getPageLocation'
  | 'switch_cancel'
  | 'new_track'
  | 'auto_switch'
  | 'inited'
  | 'inited-player'
  | 'started'
  | 'video-started'
  | 'paused'
  | 'ended'
  | 'error'
  | 'autoplay'
  | 'resumed'
  | 'rewound'
  | 'adShown'
  | 'pay_and_watch_button'
  | 'adTestShown'
  | 'subscription_restore'
  | 'new-video-started'
  | 'exit-full-screen'
  | 'enter-full-screen'
  | 'show_payment_popup'
  | 'button_disable_ad'
  | 'launch-player'
  | 'play'
  | 'view'
  | 'watchpoint'
  | 'time_roll'
  | 'player_refresh'
  | 'playerStarted'
  | 'notify'
  | 'token_expired'
  | 'BI';

// export enum NOTIFY_TYPES {
//   PAYWALL_ON_START = 1,
//   PAYWALL_AFTER_PREVIEW = 2,
// }

export type PlayerParams = {
  startAt?: number | null;
  adult?: boolean;
  trial_available?: boolean;
  pf?: number | null;
  pt?: number | null;
  sign?: string | null;
  p2p?: number | null;
  splash_screen?: boolean;
  user_token?: string | null;
  video_theme?: 'DEFAULT' | 'TRAILER';
};

export type UpdateConfigType = PlayerParams & {
  config_url: string;
  action: 'refresh' | 'token_update';
};

// Команды направленные к плееру от веба
export type INPUT_PLAYER_POST_MESSAGE = {
  setPageLocation: (p: any) => void;
  updateLinkedTracks: (p: any) => void;
  userReachedCorrectAge: (p: any) => void;
  userNotReachedCorrectAge: (p: any) => void;
  changeTrack: (p: any) => void;
  updateConfig: (p: { data: UpdateConfigType }) => void;
  terminatePlayer: (p: any) => void;
  networkDispatched: (p: any) => void;
  initialInfo: (p: any) => void;
  on_click_bt_close_trial_suggestion: (p: any) => void;
  set_settings: (p: any) => void;
  play: (p: any) => void;
  pause: (p: any) => void;
  seek: (p: any) => void;
  setVolume: (p: any) => void;
  mute: (p: any) => void;
  unmute: (p: any) => void;
  testAdvPoint: (p: any) => void;
};

export type TLinkedTracks = {
  next?: TLinkedTrack;
  previous?: TLinkedTrack;
};

export type TLinkedTrack = {
  canonicalUrl: string;
  caption: string;
  episode: number;
  playerConfig: string;
  playerUrl: string;
  projectId: number;
  season: number;
  thumbnail: string;
  trackHubId: number;
  trackId: number;
  trackVod: {
    link: string;
    playerLink: string;
    queryParams: {
      previewFrom: Nullable<string>;
      previewTo: Nullable<string>;
      sign: Nullable<string>;
    };
  };
};

export type TOutputMessage = {
  code?: ERROR_CODE;
  volume?: string;
  time?: number;
  duration?: number;
  previousTime?: number;
  target?: string;
  trackDescription?: TLinkedTrack;
  payload?: {
    code?: string;
    type?: PLAYER_ERROR_TYPE;
    track_id?: number | null;
    videosession_id?: string | null;
    time_cursor?: number;
    trackDescription?: TLinkedTrack;
    trackId?: number;
    projectId?: number;
    adv?: boolean;
    value?: number | string | null;
    answer?: string;
  };
};

export type TMessage = {
  event: keyof INPUT_PLAYER_POST_MESSAGE;
  location?: string;
  data?: Record<string, any>;
};

export type TLegacyMessage = {
  method: string;
  payload: Record<string, any>;
  callback?: () => void; // TODO REMOVE
  cmd?: any; // TODO REMOVE
};

export type TInputMessage = TMessage & TLegacyMessage;

export type TPostMessageService = {
  init: () => void;
  emit: (event: OUTPUT_PLAYER_POST_MESSAGE, data?: TOutputMessage) => void;
  on: Subscribe<INPUT_PLAYER_POST_MESSAGE>;
  one: OnceSubscribe<INPUT_PLAYER_POST_MESSAGE>;
  off: Unsubscribe<INPUT_PLAYER_POST_MESSAGE>;
};
