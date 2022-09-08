import { Nullable } from 'types';

export type TLocalStorageService = {
  init: (host: string | null) => void;
  getItemByDomain: <T>(key: string) => Nullable<T>;
  setItemByDomain: <T>(key: string, value: T) => void;
  getItemByProject: <T>(trackId: number, key: string) => T | null;
  setItemByProject: <T>(trackId: number, key: string, value: T) => void;
  getItem: <T>(key: string) => Nullable<T>;
  setItem: <T>(key: string, value: T) => void;
};

export enum STORAGE_SETTINGS {
  LOCAL_QUALITY = 'local_quality',
  AD_TIMEOUT = 'ad_timeout',
  PLAYBACK_SPEED = 'playback_speed',
  VOLUME = 'volume',
  MUTED = 'muted',
  CURRENT_TIME = 'current_time',
  USER_ID = 'user_id',
  USER_TOKEN = 'user_token',

  AFTER_PREROLL_TIMESTAMP = '@trial_suggestion/after_preroll_ts',
  AFTER_MIDROLL_TIMESTAMP = '@trial_suggestion/after_midroll_ts',
  BEFORE_PAUSEROLL_TIMESTAMP = '@trial_suggestion/before_pauseroll_ts',

  AUTOSWITCH_AVOD_POPUP = '@autoswitch/avod_popup',
  AD_DISABLE_SUGGESTION_BEFORE_PREROLL = '@notice/ad_disable_suggestion_before_preroll',

  COMPLAIN_TIMESTAMP = '@error_reports/timestamp',
}
