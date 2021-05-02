type TSubscribeCallback = (payload?: any) => void;

const MediatorFactory = () => {
  const subscribers: Record<string, Set<TSubscribeCallback>> = {};

  const on = (event: string, callback: TSubscribeCallback) => {
    if (!subscribers[event]) {
      subscribers[event] = new Set();
    }

    subscribers[event].add(callback);
    return () => {
      subscribers[event].delete(callback);
    };
  };

  const emit = (event: string, payload?: TSubscribeCallback) => {
    if (!subscribers[event]) return;
    subscribers[event].forEach((cb) => cb(payload));
  };

  return {
    on,
    emit,
  };
};

const MediatorService = MediatorFactory();
export { MediatorService, MediatorFactory };
