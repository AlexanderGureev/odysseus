type MemoryStoreOpts<T> = {
  keyPath: keyof T;
};

export const MemoryStore = <T>({ keyPath }: MemoryStoreOpts<T>) => {
  let store: { [key in string]: T } = {};

  const put = (data: T[]) => {
    const updatedStore = data.reduce((acc, item) => {
      return { ...acc, [`${item[keyPath]}`]: { ...store[`${item[keyPath]}`], ...item } };
    }, {});

    store = {
      ...store,
      ...updatedStore,
    };
  };

  const getAll = () => Object.values(store);
  const getByKey = (key: string | number) => store[`${key}`];
  const deleteByKey = (keys: Array<string | number>) => {
    for (const k of keys) {
      delete store[`${k}`];
    }
  };

  const clear = () => {
    store = {};
  };

  return {
    put,
    getAll,
    clear,
    getByKey,
    deleteByKey,
  };
};
