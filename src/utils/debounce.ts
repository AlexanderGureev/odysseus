import { Nullable } from 'types';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const debounce = <T extends (...args: any[]) => any>(fn: T, timeout = 500) => {
  let timer: Nullable<NodeJS.Timeout> = null;

  return (...args: Parameters<T>) => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    timer = setTimeout(() => {
      fn(...args);
    }, timeout);
  };
};
