import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { off, on } from 'utils';
import { throttle } from 'utils/debounce';

type State = {
  docX: number;
  docY: number;
  posX: number;
  posY: number;
  elX: number;
  elY: number;
  elH: number;
  elW: number;
  isEnter: boolean;
  isMouseDown: boolean;
  isMouseUp: boolean;
};

export const useMouse = (ref: React.RefObject<Element>): State => {
  const [state, setState] = useState<State>({
    docX: 0,
    docY: 0,
    posX: 0,
    posY: 0,
    elX: 0,
    elY: 0,
    elH: 0,
    elW: 0,
    isEnter: false,
    isMouseDown: false,
    isMouseUp: true,
  });

  useEffect(() => {
    if (!ref?.current) return;

    const mouseupHandler = () => {
      setState((prev) => ({ ...prev, isMouseDown: false, isMouseUp: true }));
    };
    const mousedownHandler = () => {
      setState((prev) => ({ ...prev, isMouseDown: true, isMouseUp: false }));
    };

    if (isMobile) {
      on(ref.current, 'touchcancel', mouseupHandler);
      on(ref.current, 'touchend', mouseupHandler);
      on(ref.current, 'touchstart', mousedownHandler);
    } else {
      on(document, 'mouseup', mouseupHandler);
      on(ref.current, 'mouseup', mouseupHandler);
      on(ref.current, 'mousedown', mousedownHandler);
    }

    return () => {
      if (isMobile) {
        off(ref.current, 'touchcancel', mouseupHandler);
        off(ref.current, 'touchend', mouseupHandler);
        off(ref.current, 'touchstart', mousedownHandler);
      } else {
        off(document, 'mouseup', mouseupHandler);
        off(ref.current, 'mouseup', mouseupHandler);
        off(ref.current, 'mousedown', mousedownHandler);
      }
    };
  }, [ref]);

  useEffect(() => {
    const getRect = () => {
      if (!ref.current) return {};

      const { left, top, width: elW, height: elH } = ref.current.getBoundingClientRect();
      const posX = left + window.scrollX;
      const posY = top + window.scrollY;

      return {
        posX,
        posY,
        elW,
        elH,
      };
    };

    const moveHandler = (event: MouseEvent | TouchEvent) => {
      if (!ref?.current) return;

      const { posX = 0, posY = 0, elW = 0, elH = 0 } = getRect();
      const pageX = event instanceof MouseEvent ? event.pageX : event.targetTouches[0].pageX;
      const pageY = event instanceof MouseEvent ? event.pageY : event.targetTouches[0].pageY;

      const elX = pageX - posX;
      const elY = pageY - posY;

      setState((prev) => ({
        ...prev,
        isEnter: elX >= 0 && elX <= elW && elY >= 0 && elY <= elH,
        docX: pageX,
        docY: pageY,
        posX,
        posY,
        elX,
        elY,
        elH,
        elW,
      }));
    };

    setState((prev) => ({ ...prev, ...getRect() }));

    const onResize = throttle(() => {
      setState((prev) => ({ ...prev, ...getRect() }));
    }, 120);

    on(window, 'resize', onResize);

    if (isMobile) {
      on(document, 'touchstart', moveHandler);
      on(document, 'touchmove', moveHandler);
    } else {
      on(document, 'mousemove', moveHandler);
    }

    return () => {
      off(window, 'resize', onResize);

      if (isMobile) {
        off(document, 'touchstart', moveHandler);
        off(document, 'touchmove', moveHandler);
      } else {
        off(document, 'mousemove', moveHandler);
      }
    };
  }, [ref]);

  return state;
};
