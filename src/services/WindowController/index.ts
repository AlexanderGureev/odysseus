import { v4 as uuidv4 } from 'uuid';
import { IDBService } from '../../services/IDBService';
import { ChannelService } from '../../services/ChannelService';
import { ChannelEvent } from '../../services/ChannelService/types';
import { CollectionName } from '../IDBService/types';
import { getCurrentTime } from 'utils';

/* USAGE EXAMPLE
WindowController.init();
await WindowController.isMaster();
 */

type TWindowRecord = {
  id: string;
  key: string;
  timestamp: number;
};

const getLogInfo = () => `[WindowController]:${getCurrentTime()}:`;
const Logger = console;

const WINDOW_ID = uuidv4();
const KEY = 'master';
const TIMEOUT = 20_000;
const MAX_DELAY = 10_000;

const WindowController = () => {
  let isInitialized = false;

  const init = async () => {
    try {
      if (isInitialized) return;

      await runUpdater();

      ChannelService.init();
      ChannelService.on(ChannelEvent.WINDOW_CLOSE, onEvent);
      window.addEventListener('beforeunload', dispose);

      isInitialized = true;

      Logger.log(getLogInfo(), `isInitialized`);
    } catch (e) {
      Logger.log(getLogInfo(), `init error: ${e}`);
    }
  };

  const setCurrentStatus = (isMaster: boolean) => {
    const type = isMaster ? 'MASTER' : 'WORKER';
    if (window?.ENV?.NODE_ENV === 'development') {
      document.title = type;
    } else {
      window.__type = type;
    }
  };

  const runUpdater = async (): Promise<void> => {
    const status = await isMaster();
    setCurrentStatus(status);
    setTimeout(runUpdater, TIMEOUT);
  };

  const onEvent = async (): Promise<void> => {
    const status = await isMaster();
    setCurrentStatus(status);
  };

  const isMaster = async (): Promise<boolean> => {
    try {
      const status = await IDBService.runTransaction<boolean>(
        CollectionName.MASTER_WINDOW,
        'readwrite',
        async (store, done, { get }) => {
          const setMaster = () => {
            store.put({
              key: KEY,
              id: WINDOW_ID,
              timestamp: Date.now(),
            });

            done(null, true);
          };

          const record = await get<TWindowRecord>(KEY);

          if (!record) {
            setMaster();
            return;
          }

          const { id, timestamp } = record;
          if (id === WINDOW_ID) {
            setMaster();
            return;
          }

          if (Date.now() - timestamp > TIMEOUT + MAX_DELAY) {
            setMaster();
            return;
          }

          done(null, false);
        }
      );

      Logger.log(getLogInfo(), 'check master window success: ', { status, window_id: WINDOW_ID });

      return status;
    } catch (e) {
      Logger.log(getLogInfo(), `check master window error: ${e}`);
      return false;
    }
  };

  const dispose = async () => {
    await IDBService.runTransaction(CollectionName.MASTER_WINDOW, 'readwrite', async (store, done, { get }) => {
      const record = await get<TWindowRecord>(KEY);
      if (record && record.id === WINDOW_ID) {
        store.put({
          key: KEY,
          id: WINDOW_ID,
          timestamp: 0,
        });
      }

      done();
    });

    ChannelService.emit(ChannelEvent.WINDOW_CLOSE);
  };

  return {
    init,
    isMaster,
  };
};

const instance = WindowController();
export { instance as WindowController };
