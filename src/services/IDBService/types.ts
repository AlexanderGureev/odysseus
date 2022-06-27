export type TDoneFunction<T> = (error?: any, result?: T) => void;
export type TTransactionApi<DefaultT> = {
  get: <T = DefaultT>(key: string | IDBKeyRange) => Promise<T>;
  getAll: <T = DefaultT>(key?: string | IDBKeyRange) => Promise<T>;
  getByIndex: <T = DefaultT>(indexName: string, key: string) => Promise<T>;
  getCountByIndex: (indexName: string, key: string) => Promise<number>;
  getCount: (key?: IDBValidKey | IDBKeyRange) => Promise<number>;
  delete: (key: IDBValidKey | IDBKeyRange) => Promise<void>;
};

export type TQuery<T> = (
  store: IDBObjectStore,
  done: TDoneFunction<T>,
  transactionApi: TTransactionApi<T>
) => Promise<void>;

export type TIndex = {
  name: string;
  field: string;
  options?: Partial<{ unique: boolean }>;
};

export type TIndexes = Array<TIndex>;

export type TStoreConfig = {
  name: string;
  keyPath: string;
  indexes?: TIndexes;
};

export type TStoresConfig = Array<TStoreConfig>;

export enum CollectionName {
  MASTER_WINDOW = 'master_window',
  EVENTS = 'events',
}

export enum Indexes {
  BY_STATUS = 'by_status',
}

export const APP_DB_NAME = 'horus_db';
