/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { getCurrentTime } from '../utils';

const LevelValue = {
  log: 500,
  info: 400,
  warn: 300,
  error: 200,
};

export type LogLevel = keyof typeof LevelValue;

type Opts = {
  logLevel?: LogLevel;
};

type LoggerApi = { [key in LogLevel]: (prefix: string, ...data: unknown[]) => void };

const Logger = ({ logLevel = 'info' }: Opts = {}) => {
  const methods = Object.keys(LevelValue) as LogLevel[];

  const api: Partial<LoggerApi> = {};

  methods.forEach((key) => {
    const raw = console[key];

    api[key] = (prefix: string, ...data: unknown[]) => {
      if (LevelValue[logLevel]! < LevelValue[key]!) return;

      raw?.(`${prefix}:${getCurrentTime()}:`, ...data);
    };
  });

  return api as LoggerApi;
};

export const logger = Logger({
  logLevel: process?.env?.LOG_LEVEL || window?.ENV?.LOG_LEVEL || 'info',
});
