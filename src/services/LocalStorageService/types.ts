import { Nullable } from 'types';

export type TLocalStorageService = {
  init: (host: string | null) => void;
  getItemByDomain: <T>(key: string) => Nullable<T>;
  setItemByDomain: <T>(key: string, value: T) => void;
  getItemByProject: <T>(projectId: number, key: string) => T | null;
  setItemByProject: <T>(projectId: number, key: string, value: T) => void;
  getItem: <T>(key: string) => Nullable<T>;
  setItem: <T>(key: string, value: T) => void;
};

export enum STORAGE_SETTINGS {
  LOCAL_QUALITY = 'LOCAL_QUALITY',
  AD_TIMEOUT = 'AD_TIMEOUT',
  PLAYBACK_SPEED = 'PLAYBACK_SPEED',
}
