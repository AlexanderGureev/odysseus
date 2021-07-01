/* eslint-disable @typescript-eslint/ban-ts-comment */
import { LocalStorageService } from 'services/LocalStorageService';
import { Nullable } from 'types';
import { v4 as uuidv4 } from 'uuid';

type TWindowItem = Record<string, number>;

type TState = {
  id: string;
  isMaster: boolean;
};

const STORAGE_KEY = '@window_manager';
const STORAGE_TTL = 30 * 1000;
const CHECK_INTERVAL = 10 * 1000;

const WindowManagerService = () => {
  const state: TState = {
    id: uuidv4(),
    isMaster: false,
  };

  let timer: Nullable<number> = null;

  const runUpdateLoop = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    // @ts-ignore
    timer = setTimeout(setMaster, CHECK_INTERVAL);
  };

  // const setMaster = () => {
  //   console.log('[WINDOW MANAGER] set master', state.id);
  //   LocalStorageService.setItem(STORAGE_KEY, { id: state.id, updateAt: Date.now() });
  // };

  // const isMaster = () => {
  //   const data = LocalStorageService.getItem<TWindowItem>(STORAGE_KEY);

  //   console.log(`[WINDOW MANAGER] id - ${state.id}, isMaster - ${state.isMaster}`, data);
  //   if (!data || Date.now() - data.updateAt > STORAGE_TTL) {
  //     setMaster();
  //     return state.isMaster;
  //   }

  //   if (state.id !== data.id) {
  //     state.isMaster = false;
  //     return false;
  //   }

  //   state.isMaster = true;
  //   return state.isMaster;
  // };

  const set = () => {
    const data = LocalStorageService.getItem<TWindowItem>(STORAGE_KEY);
    const newState = { ...data, [state.id]: Date.now() };
    const res = Object.keys(newState).reduce((acc, key) => {
      if (Date.now() - newState[key] > 45000) {
        return acc;
      }

      return { ...acc, [key]: newState[key] };
    }, {});

    LocalStorageService.setItem<TWindowItem>(STORAGE_KEY, res);
    setTimeout(() => {
      const data = LocalStorageService.getItem<TWindowItem>(STORAGE_KEY);
      if (!data) {
        state.isMaster = true;
        return;
      }

      state.isMaster = Object.keys(data)[0] === state.id;
    }, 5000);
  };

  const init = () => {
    set();

    setInterval(set, 30000);
    // isMaster();

    // window.addEventListener('storage', function (event) {
    //   if (event.key === STORAGE_KEY) {
    //     const value = JSON.parse(event.newValue || '{}');
    //     state.isMaster = value.id === state.id;
    //   }
    // });
  };

  return {
    init,
    get isMaster() {
      return state.isMaster;
    },
    get id() {
      return state.id;
    },
  };
};

const instance = WindowManagerService();
export { instance as WindowManagerService };

const HorusService = () => {
  const init = () => {
    setInterval(() => {
      if (instance.isMaster) {
        console.log('SEND EVENTS TO HORUS', instance.id);
      }
    }, 10000);
  };

  return { init };
};

const ins = HorusService();
export { ins as HorusService };
