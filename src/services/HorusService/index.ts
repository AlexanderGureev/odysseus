import { IDBService } from '../../services/IDBService';
import { WindowController } from '../WindowController';
import { PARAMS_SELECTOR } from './selectors';
import {
  THorusConfig,
  TDBEvent,
  THorusEvent,
  HorusEventName,
  ParamsByEventName,
  EventStatus,
  TEventParams,
  HORUS_EVENT,
} from './types';
import { CollectionName, Indexes } from '../IDBService/types';
import { Mediator, TMediator, TMediatorHandlers } from 'services/MediatorService';
import { retry, runInterval, sleep } from 'utils/retryUtils';
import { getCurrentTime, isNil } from 'utils';
import { Nullable } from 'types';

const getLogInfo = () => `[HorusService]:${getCurrentTime()}:`;
const Logger = console;

const DEFAULT_CONFIG = { heartbeat_period: 30, max_event_list_items: 20, flush_buffer_period: 60 };
const CONFIG_FETCH_TIMEOUT = 600_000; // 10 минут
const MIN_H_PERIOD = 10;
const DEFAULT_SENDING_DELAY = 600_000; // 10 минут
const DEFAULT_PENDING_TTL = 30_000;
const MAX_BUFFER_LIMIT = window?.ENV?.INDEXED_DB_LIMIT ?? 3000;
const HORUS_ENABLED = window?.ENV?.HORUS_ENABLED ?? true;
const HORUS_BLACKLIST = window?.ENV?.HORUS_BLACKLIST ?? null;
const HORUS_SRC = window?.ENV?.HORUS_SRC;
const RETRY_AFTER_HEADER = 'retry-after';
const EVENTS_PATH = `${HORUS_SRC}/v1/events`;
const CONFIG_PATH = `${HORUS_SRC}/v1/config`;

const HorusService = () => {
  // let mediator: TMediatorHandlers = Mediator();
  let previousTime: Nullable<number> = null;
  let heartBeatTime = 0;
  let blacklist: string[] = [];
  let isStopSending = false;
  let config = DEFAULT_CONFIG;
  let isInitialized = false;

  const init = async () => {
    if (isInitialized) return;

    if (!HORUS_SRC || !HORUS_ENABLED) {
      Logger.error('[HorusService] horus endpoint is undefined or horus disabled');
      return;
    }

    blacklist = createBlackList();

    // ping запрос раз в N секунд
    // mediator.subscribe(M_EVENTS.PROGRESS_NOTIFIER_NOTIFY, () => {
    //   heartbeatHandler();
    // });

    // подписка на ивенты плеера (старт видео, плей/пауза...)
    // Object.values(HORUS_EVENT).forEach((type) => {
    //   mediator.subscribe(type, () => {
    //     routeEvent(type);
    //   });
    // });

    Logger.log(getLogInfo(), 'init', JSON.stringify({ HORUS_SRC, HORUS_ENABLED, DEFAULT_CONFIG, blacklist }, null, 2));

    // запрос конфига из хоруса
    runInterval(async () => {
      const data = await fetchConfig();

      if (data) {
        Logger.log(getLogInfo(), 'update config', JSON.stringify(data, null, 2));
        config = data;
      }
    }, CONFIG_FETCH_TIMEOUT);

    // основной цикл отправки ивентов
    runInterval(async () => {
      if (isStopSending || !(await WindowController.isMaster())) return;
      await sendEvents();
    }, config.flush_buffer_period * 1000);

    // cброс зависших ивентов (если прошлый мастер отвалился на этапе отправки ивентов)
    runInterval(async () => {
      if (isStopSending || !(await WindowController.isMaster())) return;
      const events = await selectEventsByStatus(EventStatus.PENDING);

      const pendingEvents = events.filter((ev) => Date.now() - ev.updatedAt > DEFAULT_PENDING_TTL);
      if (pendingEvents.length) {
        await setEventsStatus(pendingEvents, EventStatus.IDLE);
      }
    }, config.flush_buffer_period * 1000 * 2);

    isInitialized = true;
  };

  const isServerError = (response: Response) => response.status === 503;
  const isSuccess = (response: Response) => response.status === 202;
  const mapEvents = (events: TDBEvent[]) => events.map((ev) => ev.payload);

  const heartbeatHandler = () => {
    const currentTime = Math.round(Date.now() / 1000);

    if (previousTime !== currentTime) {
      heartBeatTime += 1;
      previousTime = currentTime;
    }

    if (heartBeatTime >= config.heartbeat_period) {
      routeEvent(HORUS_EVENT.HEARTBEAT);
      heartBeatTime = 0;
    }
  };

  const createBlackList = () => {
    if (!HORUS_BLACKLIST) return [];
    return HORUS_BLACKLIST.split(',').map((eventName) => eventName.trim());
  };

  const parseConfig = (data: THorusConfig): THorusConfig => ({
    ...data,
    heartbeat_period: data.heartbeat_period > MIN_H_PERIOD ? data.heartbeat_period : MIN_H_PERIOD,
  });

  const fetchConfig = async (): Promise<Nullable<THorusConfig>> => {
    try {
      Logger.log(getLogInfo(), 'fetchConfig');

      const response = await fetch(CONFIG_PATH);
      if (!response.ok) throw new Error('Failed to fetch horus config');

      const data = await response.json();
      return {
        ...DEFAULT_CONFIG,
        ...parseConfig(data),
      };
    } catch (e) {
      Logger.error('[HorusService] fetchConfig error: ', e?.message);
      return null;
    }
  };

  const selectEventsByStatus = async (status: EventStatus) => {
    const events = await IDBService.runTransaction<TDBEvent[]>(
      CollectionName.EVENTS,
      'readonly',
      async (store, done, { getByIndex }) => {
        const data = await getByIndex(Indexes.BY_STATUS, status);
        done(null, data);
      }
    );

    return events;
  };

  const selectAndUpdateEvents = async (status: EventStatus, payload: Partial<TDBEvent>) => {
    const events = await IDBService.runTransaction<Nullable<TDBEvent[]>>(
      CollectionName.EVENTS,
      'readwrite',
      async (dbStore, done, { getByIndex }) => {
        const data = await getByIndex(Indexes.BY_STATUS, status);

        if (!data?.length) {
          done(null, null);
          return;
        }

        data.forEach((eventData) => {
          dbStore.put({
            ...eventData,
            ...payload,
            updatedAt: Date.now(),
          });
        });

        done(null, data);
      }
    );

    return events;
  };

  const pushToBuffer = async (payload: THorusEvent) => {
    await IDBService.runTransaction(
      CollectionName.EVENTS,
      'readwrite',
      async (dbStore, done, { getAll, getCount, delete: deleteRecord }) => {
        const count = await getCount();

        if (count > MAX_BUFFER_LIMIT) {
          const [event] = await getAll<TDBEvent[]>();
          await deleteRecord(event.timestamp);
        }

        dbStore.add({
          timestamp: Date.now(),
          status: EventStatus.IDLE,
          payload,
        });

        done();
      }
    );
  };

  const setEventsStatus = async (events: TDBEvent[], status: EventStatus) => {
    await IDBService.runTransaction(CollectionName.EVENTS, 'readwrite', async (dbStore, done) => {
      events.forEach((data) => {
        dbStore.put({
          ...data,
          status,
          updatedAt: Date.now(),
        });
      });

      done();
    });
  };

  const deletePendingEvents = async (events: TDBEvent[]) => {
    Logger.log(getLogInfo(), 'deletePendingEvents', JSON.stringify({ count: events.length }, null, 2));

    await IDBService.runTransaction(
      CollectionName.EVENTS,
      'readwrite',
      async (dbStore, done, { delete: deleteRecords }) => {
        await deleteRecords(IDBKeyRange.bound(events[0].timestamp, events[events.length - 1].timestamp));
        done();
      }
    );
  };

  const isNeedToSend = async () => {
    const status = await IDBService.runTransaction<boolean>(
      CollectionName.EVENTS,
      'readonly',
      async (dbStore, done, { getCountByIndex }) => {
        const count = await getCountByIndex(Indexes.BY_STATUS, EventStatus.IDLE);
        done(null, count > config.max_event_list_items);
      }
    );

    return status;
  };

  const selectParams = (event: HorusEventName) => {
    return ParamsByEventName[event].reduce<Partial<TEventParams>>((acc, paramName) => {
      const paramValue = PARAMS_SELECTOR[paramName]?.({});

      return isNil(paramValue)
        ? acc
        : {
            ...acc,
            [paramName]: paramValue,
          };
    }, {});
  };

  const createPayload = (eventName: HorusEventName): THorusEvent => ({
    event_name: eventName,
    event_params: selectParams(eventName),
  });

  const routeEvent = async (event: HORUS_EVENT) => {
    const eventName = HorusEventName[event];

    try {
      if (blacklist.includes(eventName)) return;

      // dispatchEventNum();

      const payload = createPayload(eventName);

      Logger.log(getLogInfo(), `routeEvent >>> ${eventName}, ${payload}`);

      if (!isStopSending && (await WindowController.isMaster()) && (await isNeedToSend())) {
        await sendEvents();
      } else {
        await pushToBuffer(payload);
      }
    } catch (e) {
      Logger.error(getLogInfo(), `routeEvent error >>> ${eventName} `, e?.message);
    }
  };

  const setSendingDelay = async (ms: number) => {
    isStopSending = true;
    await sleep(ms);
    isStopSending = false;
  };

  const request = async (url: string, events: THorusEvent[]) => {
    const response = await retry(
      () =>
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ events }),
        }),
      {
        attempts: 3,
        timeoutFn: () => 1000,
        isSuccess: (res: Response) => res.ok,
      }
    );

    return response;
  };

  const send = async (events: THorusEvent[]) => {
    try {
      const response = await request(EVENTS_PATH, events);
      if (!response) throw new Error('response is undefined');

      const retryAfter = Number(response.headers.get(RETRY_AFTER_HEADER));

      if (isServerError(response)) {
        setSendingDelay(retryAfter ? retryAfter * 1000 : DEFAULT_SENDING_DELAY);
        return false;
      }

      return isSuccess(response);
    } catch (e) {
      Logger.error('[HorusService] sendEvents failed', e?.message);
      return false;
    }
  };

  const sendRawEvents = async (events: THorusEvent[]) => {
    if (HORUS_SRC && HORUS_ENABLED) {
      await send(events);
    }
  };

  const sendEvents = async () => {
    try {
      const events = await selectAndUpdateEvents(EventStatus.IDLE, { status: EventStatus.PENDING });
      if (!events?.length) return;

      Logger.log(
        getLogInfo(),
        'sendEvents',
        JSON.stringify({ events: events.map((p) => p.payload.event_name), count: events.length }, null, 2)
      );

      if (await send(mapEvents(events))) {
        await deletePendingEvents(events);
      } else {
        await setEventsStatus(events, EventStatus.IDLE);
      }
    } catch (e) {
      Logger.error(getLogInfo(), 'sendEvents error: ', e?.message);
    }
  };

  return {
    init,
    routeEvent,
    sendRawEvents,
    isInitialized,
  };
};

const instance = HorusService();
export { instance as HorusService };
