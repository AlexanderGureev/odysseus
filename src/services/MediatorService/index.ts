const MediatorService = <
  E extends {
    [key in string]: (...args: any[]) => void;
  }
>() => {
  const state: {
    [key in keyof E]?: Array<E[key]>;
  } = {};

  const on = <Event extends keyof E, C extends E[Event]>(event: Event, callback: C) => {
    const subscribers = state[event] as C[] | undefined;
    state[event] = [...(subscribers || []), callback];
    const unsubscribe = () => off(event, callback);
    return { on, unsubscribe };
  };

  const off = <Event extends keyof E, C extends E[Event]>(event: Event, callback: C) => {
    state[event] = state[event]?.filter((f) => f !== callback);
  };

  const emit = <Event extends keyof E, C extends E[Event]>(event: Event, ...args: Parameters<C>) => {
    state[event]?.forEach((cb) => cb(...args));
  };

  const one = <Event extends keyof E, C extends E[Event]>(event: Event, callback: C) => {
    const cb = ((...args: Parameters<C>) => {
      off(event, cb);
      callback(...args);
    }) as C;

    on(event, cb);
  };

  return { on, off, emit, one };
};

export { MediatorService as Mediator };
