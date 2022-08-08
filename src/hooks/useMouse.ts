import { useEffect, useState } from 'react';
import { off, on } from 'utils';

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

    on(document, 'mouseup', mouseupHandler);
    on(ref.current, 'mouseup', mouseupHandler);
    on(ref.current, 'mousedown', mousedownHandler);

    on(ref.current, 'touchend', mouseupHandler);
    on(ref.current, 'touchstart', mousedownHandler);

    return () => {
      off(document, 'mouseup', mouseupHandler);
      off(ref.current, 'mouseup', mouseupHandler);
      off(ref.current, 'mousedown', mousedownHandler);

      off(ref.current, 'touchend', mouseupHandler);
      off(ref.current, 'touchstart', mousedownHandler);
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

    on(document, 'mousemove', moveHandler);
    on(document, 'touchstart', moveHandler);
    on(document, 'touchmove', moveHandler);

    return () => {
      off(document, 'touchstart', moveHandler);
      off(document, 'mousemove', moveHandler);
      off(document, 'touchmove', moveHandler);
    };
  }, [ref]);

  return state;
};
