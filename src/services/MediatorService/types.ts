export type Subscribe<
  E extends {
    [key in string]: (...args: any[]) => void;
  }
> = <Event extends keyof E, C extends E[Event]>(
  event: Event,
  callback: C
) => { on: Subscribe<E>; unsubscribe: () => void };

export type OnceSubscribe<
  E extends {
    [key in string]: (...args: any[]) => void;
  }
> = <Event extends keyof E, C extends E[Event]>(event: Event, callback: C) => void;

export type Unsubscribe<
  E extends {
    [key in string]: (...args: any[]) => void;
  }
> = <Event extends keyof E, C extends E[Event]>(event: Event, callback: C) => void;

export interface IMediator<
  E extends {
    [key in string]: (...args: any[]) => void;
  }
> {
  on: Subscribe<E>;
  off: Unsubscribe<E>;
  emit: <Event extends keyof E, C extends E[Event]>(event: Event, ...args: Parameters<C>) => void;
  one: OnceSubscribe<E>;
}
