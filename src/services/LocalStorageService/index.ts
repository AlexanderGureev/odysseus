import { Nullable } from 'types';

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

type TLocalStorageService = {
  getItemByDomain: <T>(domain: string, key: string) => Nullable<T>;
  setItemByDomain: <T>(domain: string, key: string, value: T) => void;
  getItem: <T>(key: string) => Nullable<T>;
  setItem: <T>(key: string, value: T) => void;
};

export enum STORAGE_SETTINGS {
  LOCAL_QUALITY = 'LOCAL_QUALITY',
}

const LocalStorageService = (): TLocalStorageService => {
  const storage = window?.localStorage || MockStorage();

  const getDomainData = (domain: string): Record<string, any> => {
    try {
      const data = storage.getItem(domain);
      const payload = data ? JSON.parse(data) : {};
      return payload;
    } catch (e) {
      console.error(e);
      return {};
    }
  };

  const getItemByDomain = <T>(domain: string, key: string): Nullable<T> => {
    try {
      const payload = getDomainData(domain);
      return payload[key] ?? null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const setItemByDomain = <T>(domain: string, key: string, value: T) => {
    try {
      const payload = getDomainData(domain);
      payload[key] = value;
      storage.setItem(domain, JSON.stringify(payload));
    } catch (e) {
      console.error(e);
    }
  };

  const getItem = <T>(key: string): Nullable<T> => {
    try {
      const payload = storage.getItem(key);
      return payload ? JSON.parse(payload) : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const setItem = <T>(key: string, value: T) => {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(e);
    }
  };

  return { getItemByDomain, setItemByDomain, getItem, setItem };
};

const instance = LocalStorageService();
export { instance as LocalStorageService };
