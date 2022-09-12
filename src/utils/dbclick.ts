import { Nullable } from 'types';
import { off, on } from 'utils';

const DEFAULT_DELAY = 300;

export const dbclick = (node: Element, callback: () => void): (() => void) => {
  let timer: Nullable<NodeJS.Timeout> = null;
  const subscriber = (e: MouseEvent) => {
    if (e.target !== e.currentTarget) return;

    if (timer) {
      clearTimeout(timer);
      timer = null;
      callback();
      return;
    }

    timer = setTimeout(() => {
      timer = null;
    }, DEFAULT_DELAY);
  };

  on(node, 'click', subscriber);
  return () => off(node, 'click', subscriber);
};
