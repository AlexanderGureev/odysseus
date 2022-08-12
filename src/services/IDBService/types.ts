export type TDoneFunction<T> = (error?: any, result?: T) => void;
export type TTransactionApi<DefaultT> = {
  get: <T = DefaultT>(key: IDBValidKey | IDBKeyRange) => Promise<T>;
  getAll: <T = DefaultT>(key?: IDBValidKey | IDBKeyRange) => Promise<T>;
  getByIndex: <T = DefaultT>(indexName: string, key: IDBValidKey) => Promise<T>;
  getCountByIndex: (indexName: string, key: IDBValidKey) => Promise<number>;
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
  FAVOURITES = 'favourites',
}

export enum Indexes {
  BY_STATUS = 'by_status',
  BY_PROJECT_ID = 'by_project_id',
  BY_IS_STORED_IN_GONDWANA = 'by_is_stored_in_gondwana',
}

export const APP_DB_NAME = 'odysseus_db';
