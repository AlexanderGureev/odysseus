import { SkinClass, TConfig, TExtendedConfig, TParsedFeatures, TStreamItem } from 'types';
import { PlayerError } from 'types/errors';

export type State =
  | 'IDLE'
  | 'RENDER'
  | 'PAYWALL'
  | 'CHECK_ERROR_PENDING'
  | 'CHECK_PREVIEW_PENDING'
  | 'PARSE_CONFIG_PENDING'
  | 'FETCHING_CONFIG'
  | 'LOADED_CONFIG'
  | 'INIT_PENDING'
  | 'INITIALIZED'
  | 'CHECKING_CAPABILITIES'
  | 'SELECTING_SOURCE'
  | 'LOADING_META'
  | 'READY'
  | 'AWAITING_PLAY'
  | 'PLAYING'
  | 'AWAITING_PAUSE'
  | 'PAUSED'
  | 'END'
  | 'ERROR';

export type Event =
  | 'CHECK_ERROR_RESOLVE'
  | 'CHECK_ERROR_REJECT'
  | 'CHECK_PREVIEW'
  | 'CHECK_PREVIEW_RESOLVE'
  | 'CHECK_PREVIEW_REJECT'
  | 'PARSE_CONFIG'
  | 'PARSE_CONFIG_RESOLVE'
  | 'PARSE_CONFIG_REJECT'
  | 'CHANGE_TRACK'
  | 'FETCH_CONFIG'
  | 'FETCH_CONFIG_RESOLVE'
  | 'FETCH_CONFIG_REJECT'
  | 'DO_INIT'
  | 'INIT_RESOLVE'
  | 'INIT_REJECT'
  | 'DO_PLAY'
  | 'DO_PAUSE'
  | 'CHECK_CAPABILITIES_RESOLVE'
  | 'CHECK_CAPABILITIES_REJECT'
  | 'SET_SOURCE'
  | 'LOAD_META'
  | 'SELECT_SOURCE_ERROR'
  | 'LOAD_META_RESOLVE'
  | 'LOAD_META_REJECT'
  | 'DO_PLAY_RESOLVE'
  | 'DO_PLAY_REJECT'
  | 'DO_PAUSE_RESOLVE'
  | 'DO_PAUSE_REJECT'
  | 'VIDEO_END'
  | 'TIME_UPDATE'
  | 'SHOW_ERROR'
  | 'RELOAD';

export type EventPayload = (
  | {
      type: Event;
      payload?: undefined;
    }
  | {
      type: 'INIT_RESOLVE';
      payload: { meta: Meta; session: SessionState };
    }
  | {
      type: 'PARSE_CONFIG_RESOLVE';
      payload: { config: TExtendedConfig; features: TParsedFeatures; meta: Meta; session: SessionState };
    }
  | {
      type: 'TIME_UPDATE';
      payload: { currentTime: number; duration: number; remainingTime: number };
    }
  | {
      type: 'LOAD_META';
      payload: { currentStream: TStreamItem };
    }
  | {
      type: 'FETCH_CONFIG';
      payload: { meta: Meta };
    }
  | {
      type: 'CHECK_PREVIEW_RESOLVE';
      payload: { previews: TStreamItem[] };
    }
  | {
      type: 'FETCH_CONFIG_RESOLVE';
      payload: { config: TConfig };
    }
  | {
      type: 'SHOW_ERROR';
      payload: { error: PlayerError };
    }
  | {
      type: 'CHECK_ERROR_REJECT';
      payload: { error: PlayerError };
    }
  | {
      type: 'PARSE_CONFIG_REJECT';
      payload: { error: PlayerError };
    }
  | {
      type: 'INIT_REJECT';
      payload: { error: PlayerError };
    }
  | {
      type: 'PARSE_CONFIG';
      payload: undefined;
      meta: TConfig;
    }
) & { meta?: Record<string, any> };

export type Meta = {
  partnerId: number | null;
  trackId: number | null;
  skin: SkinClass | null;
  isEmbedded: boolean;
};

export type SessionState = {
  id: string;
  videosession_id: string;
};

export type FSMState = {
  step: State;
  meta: Meta;
  session: SessionState;
  currentTime: number | null;
  duration: number | null;
  remainingTime: number | null;
  currentStream: TStreamItem | null;
  config: TConfig | null;
  features: TParsedFeatures | null;
  error: PlayerError | null;
  previews: TStreamItem[] | null;
};
