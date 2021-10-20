export type TSubscriber<T extends any = any> = (...params: T[]) => void;

export type TMediatorHandlers = {
  on: (event: string, callback: TSubscriber) => { on: TMediatorHandlers['on'] };
  off: (event: string, callback: TSubscriber) => void;
  emit: (event: string, ...payload: any[]) => void;
  one: (event: string, callback: TSubscriber) => void;
};

export type TMediator = () => TMediatorHandlers;

const MediatorService: TMediator = () => {
  const state: Record<string, TSubscriber[]> = {};

  const on = (event: string, callback: TSubscriber) => {
    state[event] = state[event] ? [...state[event], callback] : [callback];
    return { on };
  };

  const off = (event: string, callback: TSubscriber) => {
    state[event] = state[event].filter((f) => f !== callback);
  };

  const emit = (event: string, ...payload: any[]) => {
    state[event]?.forEach((cb) => cb(...payload));
  };

  const one = (event: string, callback: TSubscriber) => {
    const cb = (...args: any[]) => {
      off(event, cb);
      callback(...args);
    };

    on(event, cb);
  };

  return { on, off, emit, one };
};

const instance = MediatorService();
export { instance as MediatorService, MediatorService as Mediator };
