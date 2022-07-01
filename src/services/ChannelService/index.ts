import { getCurrentTime } from 'utils';
import { logger } from 'utils/logger';

import { ChannelEvent,TChannelEvents } from './types';

const getLogInfo = () => `[ChannelService]:${getCurrentTime()}:`;

const ChannelService = () => {
  let channelKeys: TChannelEvents = {};
  let isInitialized = false;

  const init = () => {
    if (!window?.localStorage) throw new Error('localStorage is undefined');
    if (isInitialized) return;

    window.addEventListener('storage', handleStorageEvent);
    isInitialized = true;
  };

  const on = (channelKey: ChannelEvent, handler: () => void) => {
    const subscribers = channelKeys[channelKey];
    channelKeys[channelKey] = subscribers ? [...subscribers, handler] : [handler];
  };

  const emit = (channelKey: ChannelEvent) => {
    window.localStorage.setItem(channelKey, `${Date.now()}`);
  };

  const destroy = () => {
    window.removeEventListener('storage', handleStorageEvent);
    channelKeys = {};
  };

  const handleStorageEvent = (e: StorageEvent) => {
    const key = e.key as ChannelEvent;

    if (!Boolean(channelKeys[key])) return;

    logger.log('[ChannelService]', 'handleStorageEvent', { key: e.key, value: e.newValue });

    channelKeys[key]?.forEach((subscriber) => {
      subscriber?.(e.newValue);
    });
  };

  return {
    init,
    on,
    emit,
    destroy,
  };
};

const instance = ChannelService();
export { instance as ChannelService };
