import './schema';

import express from 'express';
import expressJSDocSwagger from 'express-jsdoc-swagger';
import { Server } from 'http';
import https from 'https';
import path from 'path';
import responseTime from 'response-time';

import packageJSON from '../../package.json';
import { logger } from '../../src/utils/logger';
import { IMetricsService } from '../interfaces';
import { createBuilder } from './asyncHandler';
import { createDevServer } from './devServer';
import { errorHandler } from './errorHandler';
import { statsMiddleware } from './statsMiddleware';
import { ControllerOpts, ExpressHandler } from './types';
import { Validator } from './validator';

const swaggerOptions = {
  info: {
    version: packageJSON.version,
    title: packageJSON.name,
    description: packageJSON.description,
    license: {
      name: packageJSON.license,
    },
  },
  baseDir: path.resolve('server'),
  // Glob pattern to find your jsdoc files (multiple patterns can be added in an array)
  filesPattern: './**/*.ts',
  swaggerUIPath: '/swagger',
  exposeSwaggerUI: true,
  exposeApiDocs: false,
  apiDocsPath: '/v3/api-docs',
  notRequiredAsNullable: false,
  swaggerUiOptions: {},
};

interface IController {
  register(app: express.Application, opts: ControllerOpts): void;
}

type IMiddleware = ExpressHandler<unknown>;

type HTTPServiceOpts = {
  exposeSwaggerUI?: boolean;
  isDev?: boolean;
  configure?: (app: express.Express) => void;
};

type HTTPSOpts = {
  key: Buffer;
  cert: Buffer;
};

export const httpserver = async (metricsService: IMetricsService, options: HTTPServiceOpts = {}) => {
  const app = express();
  app.set('x-powered-by', false);

  options?.configure?.(app);

  const instance = expressJSDocSwagger(app)({ ...swaggerOptions, exposeSwaggerUI: options.exposeSwaggerUI ?? true });
  const opts = await Validator(instance);
  const builder = createBuilder(opts);

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(responseTime());
  app.use(statsMiddleware(metricsService));

  app.use((_req, res, next) => {
    res.setHeader('X-Service', `${packageJSON.name} ${packageJSON.version}`);
    next();
  });

  if (options.isDev) await createDevServer(app);

  const close = (s: Server) => () =>
    new Promise<Error | undefined>((done) => {
      s.close((e) => {
        logger.info('[httpserver]', 'server stopped');
        done(e);
      });
    });

  return {
    addMiddleware: (middlewares: IMiddleware[]) => {
      for (const mw of middlewares) {
        app.use(mw);
      }
    },
    register: (controllers: IController[]) => {
      for (const controller of controllers) {
        controller.register(app, { ...opts, builder });
      }

      app.use(errorHandler);
    },
    listen: (port: number) => {
      const server = app.listen(port, () => {
        logger.info('[httpserver]', `stated on port ${port}`);
      });

      return { server, close: close(server) };
    },
    httpsListen: (opts: HTTPSOpts, port: number) => {
      const s = https.createServer(opts, app);
      const server = s.listen(port, () => {
        logger.info('[httpserver]', `stated on port ${port}`);
      });

      return { server, close: close(server) };
    },
  };
};
