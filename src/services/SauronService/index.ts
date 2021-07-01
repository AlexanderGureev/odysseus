import { Nullable } from 'types';
import { getCookie } from 'utils/cookie';

const SAURON_ID_KEY = 'sauron_id';
const SAURON_API_URL = window.ENV.SAURON_API_URL ? window.ENV.SAURON_API_URL + '/identify' : null;

type TSauronSubscriber = (sauronId: string | null) => void;
type TSauronService = {
  init: () => void;
  subscribe: (callback: TSauronSubscriber) => void;
};

const SauronServiceProvider = (): TSauronService => {
  let callbacks: TSauronSubscriber[] = [];
  let sauronIdGlobal: Nullable<string> = null;
  let storage: Nullable<Storage> = null;
  let initialized = false;

  if (window && localStorage) storage = localStorage;

  const subscribe = (callback: TSauronSubscriber) => {
    if (initialized) callback(sauronIdGlobal);
    else callbacks.push(callback);
  };

  const broadcast = () => {
    callbacks.forEach((cb) => {
      cb(sauronIdGlobal);
    });

    callbacks = [];
  };

  const persist = (guid?: string) => {
    if (guid) {
      storage?.setItem(SAURON_ID_KEY, guid);
      sauronIdGlobal = guid;
    }

    initialized = true;
    broadcast();
  };

  const init = () => {
    const cookieSauronId = getCookie('Sauron-ID');
    if (cookieSauronId) persist(cookieSauronId);
    else connect();
  };

  const connect = async () => {
    if (!SAURON_API_URL) {
      console.error('SAURON_API_URL is undefined');
      persist();
      return;
    }

    let sid = null;

    try {
      const response = await fetch(SAURON_API_URL, {
        credentials: 'include',
      });
      const { guid } = await response.json();
      if (guid) sid = guid;
    } catch (error) {
      console.error(error);
    }

    persist(sid);
  };

  return { init, subscribe };
};

const instance = SauronServiceProvider();
export { instance as SauronService };
