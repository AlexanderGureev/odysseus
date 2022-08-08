import { useEffect, useRef } from 'react';

export const useUpdateEffect: typeof useEffect = (effect, deps) => {
  const isMount = useRef(false);

  useEffect(() => {
    if (isMount.current) effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    isMount.current = true;
  }, []);
};
