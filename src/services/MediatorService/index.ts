export type TSubscriber<T extends any = any> = (...params: T[]) => void;

export const MediatorFactory = () => {
  const state: Record<string, Set<TSubscriber>> = {};

  const on = (event: string, callback: TSubscriber) => {
    if (!state[event]) state[event] = new Set();

    state[event].add(callback);
    return () => {
      state[event].delete(callback);
    };
  };

  const emit = (event: string, ...payload: any[]) => {
    state[event]?.forEach((cb) => cb(...payload));
  };

  const one = (event: string, callback: TSubscriber) => {
    const cb = on(event, (...args: any[]) => {
      callback(...args);
      cb();
    });
  };

  return { on, emit, one };
};

const instance = MediatorFactory();
export { instance as MediatorService, MediatorFactory as Mediator };
