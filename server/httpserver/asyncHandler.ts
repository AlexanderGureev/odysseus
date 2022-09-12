import { NextFunction, Request, Response } from 'express';

import { excludeNil } from '../utils';
import { ExpressHandler, HandlerOpts, ValidatorOpts } from './types';

export const asyncHandler =
  <P, Q = qs.ParsedQs, ReqB = unknown, ResB = unknown>(
    handler: ExpressHandler<P, ResB, ReqB, Q>
  ): ExpressHandler<P, ResB, ReqB, Q> =>
  async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (err) {
      next(err);
    }
  };

export const createBuilder =
  (validateOpts: ValidatorOpts) =>
  <P extends Record<string, any>, Q extends Record<string, any> = qs.ParsedQs, ReqB = unknown, ResB = unknown>(
    opts: HandlerOpts<P, Q, ReqB, ResB>
  ) =>
  (req: Request<P, ResB, ReqB, Q>, res: Response, next: NextFunction) => {
    const isValidate = opts.isValidate ?? true;

    const fn: NextFunction = async (e) => {
      if (e) return next(e);

      try {
        const params = Object.entries(req.params).reduce((acc, [key, value]) => {
          const parser = opts.parser?.[key as keyof P];

          return {
            ...acc,
            [key]: parser ? parser(value) : value,
          };
        }, {});

        const query = Object.entries(req.query).reduce((acc, [key, value]) => {
          const parser = opts.parser?.[key as keyof Q];

          return {
            ...acc,
            [key]: parser ? parser(value) : value,
          };
        }, {});

        req.params = excludeNil(params) as P;
        req.query = excludeNil(query) as Q;

        await opts.handler(req, res, next);
      } catch (err) {
        next(err);
      }
    };

    if (isValidate) {
      const mw = validateOpts.validateRequest<P, Q, ReqB, ResB>(opts.validateOpts);
      mw(req, res, fn);
    } else {
      fn();
    }
  };
