import { IDBService } from 'interfaces';

export const PersistentStore = <T>(collectionName: string, db: IDBService) => {
  const put = (data: T[]) =>
    db.runTransaction<void>(collectionName, 'readwrite', async (dbStore, done) => {
      data.forEach((data) => {
        dbStore.put(data);
      });

      done();
    });

  const getBy = <K extends IDBValidKey>(indexName: string, key: K) =>
    db.runTransaction<T[]>(collectionName, 'readonly', async (dbStore, done, { getByIndex }) => {
      const data = await getByIndex(indexName, key);
      done(null, data);
    });

  const getAll = () =>
    db.runTransaction<T[]>(collectionName, 'readonly', async (dbStore, done, { getAll }) => {
      const data = await getAll();
      done(null, data);
    });

  const deleteByKey = <K extends IDBValidKey>(key: K) =>
    db.runTransaction<void>(collectionName, 'readwrite', async (dbStore, done, { delete: deleteRecord }) => {
      await deleteRecord(key);
      done();
    });

  const clear = () =>
    db.runTransaction<void>(collectionName, 'readwrite', async (dbStore, done) => {
      dbStore.clear();
      done();
    });

  return {
    put,
    getBy,
    getAll,
    deleteByKey,
    clear,
  };
};
