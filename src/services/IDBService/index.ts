/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* USAGE EXAMPLE

type TEvent = {
  id: string;
  event: string;
};

const stores: TStoresConfig = [
  {
    name: 'master_window',
    keyPath: 'key',
  },
  {
    name: 'events',
    keyPath: 'timestamp',
    indexes: [
      {
        name: 'by_status',
        field: 'status',
      },
    ],
  },
];

const controller = IndexDBController();
await controller.connect('app_db', stores);

controller.runTransaction<TEvent>('events', 'readonly', async (store, done, { get }) => {
  const record = await get('id');
  done(null, record);
});

*/

import { Nullable } from '../../../types';
import { TDoneFunction, TQuery, TStoresConfig, TTransactionApi } from './types';

const IDBService = () => {
  let db: Nullable<IDBDatabase> = null;
  let version = 1;
  let dbPromise: Promise<IDBDatabase>;
  let databaseName = null;

  const connect = (dbName: string, stores: TStoresConfig, v = 1): Promise<IDBDatabase> => {
    if (dbPromise) return dbPromise;

    databaseName = dbName;
    version = v;

    dbPromise = new Promise((resolve, reject) => {
      const dbRequest = window.indexedDB.open(dbName, version);

      dbRequest.onupgradeneeded = (e: any) => {
        const instanceDB = e.target.result;

        stores.forEach(({ name, keyPath, indexes }) => {
          const objectStore = instanceDB.createObjectStore(name, {
            keyPath,
          });

          if (indexes) {
            indexes.forEach(({ name: indexName, field, options = {} }) => {
              objectStore.createIndex(indexName, field, options);
            });
          }
        });
      };

      dbRequest.onerror = (e) => {
        reject(`failed connect to db - ${dbName}`);
      };

      dbRequest.onsuccess = (e) => {
        db = dbRequest.result;
        resolve(dbRequest.result);
      };

      dbRequest.onblocked = (e) => {
        reject('onblocked');
      };
    });

    return dbPromise;
  };

  const waitRequest = <T>(req: IDBRequest): Promise<T> =>
    new Promise((res, rej) => {
      req.onsuccess = () => res(req.result);
      req.onerror = rej;
    });

  async function runTransaction<T>(collectionName: string, type: IDBTransactionMode, query: TQuery<T>): Promise<T> {
    if (!dbPromise) throw new Error('no database connection (call connect before executing the transaction)');

    await dbPromise;

    const result = await new Promise<T>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const transaction = db!.transaction([collectionName], type);

      const txComplete = new Promise((resolve) => {
        transaction.oncomplete = resolve;
      });

      transaction.onerror = reject;

      const objectStoreRequest = transaction.objectStore(collectionName);

      const api: TTransactionApi<T> = {
        get: async (key) => {
          const req = objectStoreRequest.get(key);
          return await waitRequest(req);
        },
        getAll: async (key) => {
          const req = objectStoreRequest.getAll(key);
          return await waitRequest(req);
        },
        getByIndex: async (indexName, key) => {
          const index = objectStoreRequest.index(indexName);
          const req = index.getAll(key);
          return await waitRequest(req);
        },
        getCount: async (key) => {
          const req = objectStoreRequest.count(key);
          return await waitRequest(req);
        },
        getCountByIndex: async (indexName, key) => {
          const index = objectStoreRequest.index(indexName);
          const req = index.count(key);
          return await waitRequest(req);
        },
        delete: async (key) => {
          const req = objectStoreRequest.delete(key);
          return await waitRequest(req);
        },
      };

      const doneFn: TDoneFunction<T> = (error, record) => {
        if (error) reject(error);
        else txComplete.then(() => resolve(record as T));
      };

      query(objectStoreRequest, doneFn, api).catch(reject);
    });

    return result;
  }

  return {
    connect,
    runTransaction,
    databaseName,
  };
};

const instance = IDBService();
export { instance as IDBService };
