export enum ChannelEvent {
  WINDOW_CLOSE = '@window_controller/window_close',
}

export type TChannelEventSubscriber = Array<() => void>;

export type TChannelEvents = {
  [eventName in ChannelEvent]?: TChannelEventSubscriber;
};
