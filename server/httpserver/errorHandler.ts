/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';

import { logger } from '../../src/utils/logger';
import { BaseError } from './errors';
import { OpenAPIUtilsError } from './types';

export const errorHandler = (err: Error | BaseError, _req: Request, res: Response, _next: NextFunction) => {
  if (err.name === 'OpenAPIUtilsError') {
    const validationError = err as OpenAPIUtilsError;
    res.status(validationError.status).json({
      status: validationError.status,
      name: 'ValidationError',
      message: validationError.message,
    });

    return;
  }

  logger.error('[httpserver]', 'error', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  if (err instanceof BaseError) {
    const payload = {
      status: err.status || 500,
      name: err.name,
      message: err.message,
    };

    res.status(payload.status).json(payload);
    return;
  }

  res.status(500).json({
    status: 500,
    name: err.name,
    message: err.message,
  });
};
