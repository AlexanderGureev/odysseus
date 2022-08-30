import express, { NextFunction, Request, Response } from 'express';

export type ExpressHandler<TParams, ResBody = unknown, ReqBody = unknown, TQuery = qs.ParsedQs> = (
  req: Request<TParams, ResBody, ReqBody, TQuery>,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

export type EHandler<P, Q = qs.ParsedQs, ReqB = unknown, ResB = unknown> = (
  req: Request<P, ResB, ReqB, Q>,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

export type HandlerOpts<P, Q, ReqB, ResB> = {
  isValidate?: boolean;
  validateOpts?: Partial<ValidateFnOpts>;
  parser?: { [key in keyof (P & Q)]?: (v: string | undefined) => unknown };
  handler: EHandler<P, Q, ReqB, ResB>;
};

export type ValidateFnOpts = {
  body: boolean;
  params: boolean;
  headers: boolean;
  query: boolean;
  required: boolean;
  errorStatusCode: number;
};

export type OpenAPIUtilsError = {
  name: string;
  type: string;
  message: string;
  extra: any[];
  status: number;
  statusCode: number;
};

export type ValidatorOpts = {
  validateRequest: <P, Q = qs.ParsedQs, ReqB = unknown, ResB = unknown>(
    opts?: Partial<ValidateFnOpts>
  ) => EHandler<P, Q, ReqB, ResB>;
  validateResponse: <T>(payload: T, req: express.Request, status: number) => boolean;
};

export type ControllerOpts = ValidatorOpts & {
  builder: <P, Q = qs.ParsedQs, ReqB = unknown, ResB = unknown>(
    opts: HandlerOpts<P, Q, ReqB, ResB>
  ) => EHandler<P, Q, ReqB, ResB>;
};
