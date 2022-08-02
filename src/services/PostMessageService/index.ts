import { logger } from 'utils/logger';

import { Mediator } from '../MediatorService';
import {
  INPUT_PLAYER_POST_MESSAGE,
  OUTPUT_PLAYER_POST_MESSAGE,
  TInputMessage,
  TOutputMessage,
  TPostMessageService,
} from './types';

const DEFAULT_PARAMS = { app_version: window?.ENV?.APP_VERSION || '' };

const PostMessageService = (): TPostMessageService => {
  const mediator = Mediator<INPUT_PLAYER_POST_MESSAGE>();

  const emit = (event: OUTPUT_PLAYER_POST_MESSAGE, data: TOutputMessage = {}) => {
    window.parent.postMessage({ event, ...data, ...DEFAULT_PARAMS }, '*');
  };

  const eventHandler = (event: MessageEvent<TInputMessage>) => {
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
