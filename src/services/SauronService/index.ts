import { Nullable } from 'types';
import { getCookie } from 'utils/cookie';
import { logger } from 'utils/logger';

const SAURON_ID_KEY = 'sauron_id';
const SAURON_API_URL = window.ENV.SAURON_API_URL ? window.ENV.SAURON_API_URL + '/identify' : null;

const SauronServiceProvider = () => {
  let sauronIdGlobal: Nullable<string> = null;
  let storage: Nullable<Storage> = null;

  if (window && localStorage) storage = localStorage;

  const getSauronId = () => sauronIdGlobal;

  const persist = (guid?: string) => {
    if (guid) {
      storage?.setItem(SAURON_ID_KEY, guid);
      sauronIdGlobal = guid;
    }
  };

  const init = async () => {
    logger.log('[SauronService]', 'init');

    const cookieSauronId = getCookie('Sauron-ID');
    if (cookieSauronId) persist(cookieSauronId);
    else {
      await connect();
    }
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

  return { init, getSauronId };
};

const instance = SauronServiceProvider();
export { instance as SauronService };
