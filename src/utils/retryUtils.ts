import { Nullable } from '../../types';

export const sleep = (timeout: number) => new Promise((resolve) => setTimeout(resolve, timeout));

export const runInterval = async <T extends () => Promise<void>>(fn: T, interval: number) => {
  await fn();
  await sleep(interval);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  runInterval(fn, interval);
};

export const DEFAULT_RETRY_ATTEMPTS = 5;
export const DEFAULT_RETRY_TIMEOUT = 50;

type RetryRequest<T> = () => Promise<T>;
type RetryOptions<T> = {
  isSuccess: (response: T) => boolean;
  attempts?: number;
  timeoutFn?: (attempt: number) => number;
};

// ~ 100, 400, 1000, 2800
const getTimeoutForNextAttempt = (attempt: number) => Math.exp(attempt) * DEFAULT_RETRY_TIMEOUT;

export const retry = async <T>(request: RetryRequest<T>, options: RetryOptions<T>): Promise<null | T> => {
  let isSuccess = false;
  let currentAttempt = 0;
  let response: Nullable<T> = null;

  const { timeoutFn = getTimeoutForNextAttempt, attempts = DEFAULT_RETRY_ATTEMPTS } = options;

  while (!isSuccess && currentAttempt < attempts) {
    currentAttempt++;

    try {
      response = await request();
      isSuccess = options.isSuccess(response);
    } catch (err) {
      const isLastAttempt = currentAttempt === attempts;

      if (isLastAttempt) {
        throw err;
      }
    }

    if (!isSuccess) {
      await sleep(timeoutFn(currentAttempt));
    }
  }

  return response;
};