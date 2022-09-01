import { Nullable } from 'types';
import { logger } from 'utils/logger';

import { TLocalStorageService } from './types';

const MockStorage = (): Storage => {
  let state: Record<string, any> = {};

  const getItem = (name: string) => state[name];
  const setItem = (name: string, value: any) => {
    state[name] = value;
  };

  const removeItem = (name: string) => {
    delete state[name];
  };

  const clear = () => {
    state = {};
  };

  return {
    getItem,
    setItem,
    removeItem,
    clear,
    get length() {
      return Object.keys(state).length;
    },
    key: (idx: number) => Object.keys(state)[idx],
  };
};

type ProjectData<T> = {
  [key in string]?: Record<string, T>;
};

const LocalStorageService = (): TLocalStorageService => {
  let storage: Storage;

  try {
    storage = window?.localStorage || MockStorage();
  } catch (err) {
    logger.error('[LocalStorageService]', err?.message);
    storage = MockStorage();
  }

  let parentHost = 'odysseus';

  const init = (host: string | null) => {
    if (host) parentHost = host;
  };

  const getDomainData = <T extends Record<string, any>>(): T => {
    try {
      const data = storage.getItem(parentHost);
      const payload = data ? JSON.parse(data) : {};
      return payload;
    } catch (e) {
      logger.error('[getDomainData]', e);
      return {} as T;
    }
  };

  const getItemByDomain = <T>(key: string): Nullable<T> => {
    try {
      const payload = getDomainData();
      return payload[key] ?? null;
    } catch (e) {
      logger.error('[getItemByDomain]', e);
      return null;
    }
  };

  const setItemByDomain = <T>(key: string, value: T) => {
    try {
      const payload = getDomainData();
      payload[key] = value;
      storage.setItem(parentHost, JSON.stringify(payload));
    } catch (e) {
      logger.error('[setItemByDomain]', e);
    }
  };

  const setItemByProject = <T>(trackId: number, key: string, value: T) => {
    try {
      const payload = getDomainData();
      const projectData = payload[trackId] || {};
      const newProjectData = {
        ...payload,
        [trackId]: {
          ...projectData,
          [key]: value,
        },
      };

      storage.setItem(parentHost, JSON.stringify(newProjectData));
    } catch (e) {
      logger.error('[setItemByProject]', e);
    }
  };

  const getItemByProject = <T>(trackId: number, key: string): T | null => {
    try {
      const payload = getDomainData<ProjectData<T>>();
      const value = payload[trackId]?.[key];
      return value ?? null;
    } catch (e) {
      logger.error('[getItemByProject]', e);
      return null;
    }
  };

  const getItem = <T>(key: string): Nullable<T> => {
    try {
      const payload = storage.getItem(key);
      return payload ? JSON.parse(payload) : null;
    } catch (e) {
      logger.error('[getItem]', e);
      return null;
    }
  };

  const setItem = <T>(key: string, value: T) => {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (e) {
      logger.error('[setItem]', e);
    }
  };

  return { init, getItemByDomain, setItemByDomain, setItemByProject, getItemByProject, getItem, setItem };
};

const instance = LocalStorageService();
export { instance as LocalStorageService };
