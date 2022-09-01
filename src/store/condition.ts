import { AppState, store } from 'store';

export const condition = (predicate: (state: AppState) => Promise<boolean> | boolean) =>
  new Promise<void>((resolve, reject) => {
    const unsubscribe = store.subscribe(async () => {
      try {
        if (await predicate(store.getState())) {
          unsubscribe();
          resolve();
        }
      } catch (err) {
        unsubscribe();
        reject(err);
      }
    });
  });
