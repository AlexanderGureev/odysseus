import { AppState, store } from 'store';

export const condition = (predicate: (state: AppState) => boolean) =>
  new Promise<void>((resolve) => {
    const unsubscribe = store.subscribe(() => {
      if (predicate(store.getState())) {
        unsubscribe();
        resolve();
      }
    });
  });
