import { logger } from 'utils/logger';

import { Mediator } from '../MediatorService';
import { INPUT_PLAYER_POST_MESSAGE, InputMessage, OutputEvents } from './types';

const DEFAULT_PARAMS = { app_version: window?.ENV?.APP_VERSION || '' };

const PostMessageService = () => {
  const mediator = Mediator<INPUT_PLAYER_POST_MESSAGE>();

  const emit = <E extends keyof OutputEvents, C extends OutputEvents[E]>(event: E, data?: Parameters<C>[0]) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.parent.postMessage({ event, ...data, payload: { ...data?.payload, ...DEFAULT_PARAMS } }, '*');
  };

  const eventHandler = (event: MessageEvent<InputMessage>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { event: eventName, method = '', cmd: command, callback, ...rest } = event?.data ?? {};

    const name = eventName || method;
    if (name) {
      mediator.emit(name, rest);
    }
  };

  const init = () => {
    logger.log('[PostMessageService]', 'init');
    window.addEventListener('message', eventHandler);
  };

  return { init, emit, on: mediator.on, one: mediator.one, off: mediator.off };
};

const instance = PostMessageService();
export { instance as PostMessageService };
