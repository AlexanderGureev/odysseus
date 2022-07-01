import { Mediator, TSubscriber } from '../MediatorService';
import {
  INPUT_PLAYER_POST_MESSAGE,
  OUTPUT_PLAYER_POST_MESSAGE,
  TInputMessage,
  TOutputMessage,
  TPostMessageService,
} from './types';

const PostMessageService = (): TPostMessageService => {
  const mediator = Mediator();

  const emit = (event: OUTPUT_PLAYER_POST_MESSAGE, data: TOutputMessage = {}) => {
    window.parent.postMessage({ event, ...data }, '*');
  };

  const eventHandler = (event: MessageEvent<TInputMessage>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { event: eventName, method = '', cmd: command, callback, ...rest } = event?.data ?? {};

    const name = eventName || method;
    if (name) mediator.emit(name, rest);
  };

  const init = () => {
    window.addEventListener('message', eventHandler);
  };

  const on = (event: INPUT_PLAYER_POST_MESSAGE, callback: TSubscriber) => {
    mediator.on(event, callback);
    return () => mediator.off(event, callback);
  };

  const one = (event: INPUT_PLAYER_POST_MESSAGE, callback: TSubscriber) => mediator.one(event, callback);

  return { init, emit, on, one };
};

const instance = PostMessageService();
export { instance as PostMessageService };
