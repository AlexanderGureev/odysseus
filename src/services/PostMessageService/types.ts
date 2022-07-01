import { PLAYER_ERROR_TYPE } from 'components/ErrorManager/types';
import { TSubscriber } from 'services/MediatorService';
import { Nullable } from 'types';

// Ивенты направленные от плеера к вебу
export enum OUTPUT_PLAYER_POST_MESSAGE {
  GET_PAGE_LOCATION = 'getPageLocation',
  // postmessage events for Yandex.Video
  SWITCH_CANCEL = 'switch_cancel',
  NEW_TRACK = 'new_track',
  AUTOSWITCH = 'auto_switch',
  INITED = 'inited',
  INITED_PLAYER = 'inited-player',
  STARTED = 'started',
  VIDEO_STARTED = 'video-started',
  PAUSED = 'paused',
  ENDED = 'ended',
  ERROR = 'error',
  AUTOPLAY = 'autoplay',
  RESUMED = 'resumed',
  REWOUND = 'rewound',
  AD_SHOWN = 'adShown',
  PAY_AND_WATCH_BUTTON = 'pay_and_watch_button',
  AD_TEST_SHOWN = 'adTestShown',
  SUBSCRIPTION_RESTORE = 'subscription_restore',
  NEW_VIDEO_STARTED = 'new-video-started',
  EXIT_FULLSCREEN = 'exit-full-screen',
  ENTER_FULLSCREEN = 'enter-full-screen',
  SHOW_PAYMENT_POPUP = 'show_payment_popup',
  BUTTON_DISABLE_AD = 'button_disable_ad',
  LAUNCH_PLAYER = 'launch-player',
  PLAY = 'play',
  VIEW = 'view',
  WATCH_POINT = 'watchpoint',
  TIME_ROLL = 'time_roll',
  PLAYER_REFRESH = 'player_refresh',
  // postmessage events for player
  PLAYER_STARTED = 'playerStarted',
  NOTIFY = 'notify',
  TOKEN_EXPIRED = 'token_expired',
}

export enum NOTIFY_TYPES {
  PAYWALL_ON_START = 1,
  PAYWALL_AFTER_PREVIEW = 2,
}

// Команды направленные к плееру от веба
export enum INPUT_PLAYER_POST_MESSAGE {
  SET_PAGE_LOCATION = 'setPageLocation',

  UPDATE_LINKED_TRACKS = 'updateLinkedTracks',
  USER_REACHED_CORRECT_AGE = 'userReachedCorrectAge',
  USER_NOT_REACHED_CORRECT_AGE = 'userNotReachedCorrectAge',
  CHANGE_TRACK = 'changeTrack',
  UPDATE_CONFIG = 'updateConfig',
  TERMINATE_PLAYER = 'terminatePlayer',
  NETWORK_DISPATCHED = 'networkDispatched',
  INITIAL_INFO = 'initialInfo',
  ON_CLICK_BT_CLOSE_TRIAL_SUGGESTION = 'on_click_bt_close_trial_suggestion',
  SET_SETTINGS = 'set_settings',

  PLAY = 'play',
  PAUSE = 'pause',
  SEEK = 'seek',
  SET_VOLUME = 'setVolume',
  MUTE = 'mute',
  UNMUTE = 'unmute',
  TEST_ADV_POINT = 'testAdvPoint',
}

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
  code?: NOTIFY_TYPES;
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
  };
};

export type TMessage = {
  event: INPUT_PLAYER_POST_MESSAGE;
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
  on: (event: INPUT_PLAYER_POST_MESSAGE, callback: TSubscriber) => () => void;
  one: (event: INPUT_PLAYER_POST_MESSAGE, callback: TSubscriber) => void;
};
