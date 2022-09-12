import { useCallback, useEffect, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import { off, on } from 'utils';
import { v4 as uuidv4 } from 'uuid';

import { useMenu } from './useMenu';

export const useMenuState = (ref: React.RefObject<Element>, leaveDelay = 200) => {
  const id = useRef<string>(uuidv4());
  const { state, setState } = useMenu();

  const close = useCallback(() => {
    setState((s) => ({ ...s, [id.current]: s[id.current] ? 'leave' : null }));
  }, [setState]);

  useEffect(() => {
    if (!ref?.current) return;

    let timer: NodeJS.Timeout | null = null;
    setState((s) => ({ ...s, [id.current]: null }));

    const onEnter = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      setState((s) =>
        Object.keys(s).reduce((acc, key) => {
          return { ...acc, [key]: key === id.current ? 'enter' : s[key] ? 'leave' : null };
        }, {})
      );
    };

    const onLeave = () => {
      timer = setTimeout(() => {
        timer = null;
        close();
      }, leaveDelay);
    };

    const onTouchStart = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close();
      }
    };

    on(ref.current, 'mouseenter', onEnter);
    on(ref.current, 'mouseleave', onLeave);
    if (isMobile) on(document, 'touchstart', onTouchStart);

    return () => {
      off(ref.current, 'mouseenter', onEnter);
      off(ref.current, 'mouseleave', onLeave);
      if (isMobile) off(document, 'touchstart', onTouchStart);
    };
  }, [leaveDelay, ref, setState, close]);

  return { state: state[id.current] || null, close };
};
