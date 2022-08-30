import ejs from 'ejs';
import express from 'express';
import fs from 'fs';
import path from 'path';
import requestIp from 'request-ip';

import { LivePlayerController, MetricsController, PAKAdminPlayerController, PlayerController } from './controllers';
import { httpserver } from './httpserver';
import { MetricsService } from './services/metrics_service';

export const IS_DEV = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3000;

const bootstrap = async () => {
  const metricsService = MetricsService();

  const server = await httpserver(metricsService, {
    isDev: IS_DEV,
    configure: (app) => {
      app.use(requestIp.mw());

      app.set('views', path.resolve(__dirname, 'views'));
      app.set('view engine', 'ejs');
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      app.engine('ejs', ejs.__express);
    },
  });

  server.addMiddleware([
    express.static(path.resolve(__dirname, '..', 'client')),
    express.static(path.resolve(__dirname, '..', 'client-vitrina')),
    (_, res, next) => {
      if (process.env.CANARY_RELEASE) res.setHeader('x-canary', 'true');
      next();
    },
    (req, res, next) => {
      if (req?.headers?.['x-routing-key'] === 'rendertron') res.status(200).end();
      else next();
    },
  ]);

  server.register([
    PlayerController(),
    LivePlayerController(),
    PAKAdminPlayerController(),
    MetricsController(metricsService),
  ]);

  if (IS_DEV)
    server.httpsListen(
      {
        key: fs.readFileSync(path.resolve('server', 'cert', 'cert.key')),
        cert: fs.readFileSync(path.resolve('server', 'cert', 'cert.crt')),
      },
      +PORT
    );
  else server.listen(+PORT);
};

export { bootstrap };
