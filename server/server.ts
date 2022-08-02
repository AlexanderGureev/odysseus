import ejs from 'ejs';
import express from 'express';
import fs from 'fs';
import https from 'https';
import path from 'path';
import requestIp from 'request-ip';

import { logger } from '../src/utils/logger';
import { ERROR, SERVICE_GROUP_ID, TConfigSource } from '../types';
import { createDevServer } from './devServer';
import { createEnv, createHeaders, isNumber, isValidBase64, TParams, URL_MAP_BY_SOURCE } from './utils';
import { createError, RequestError } from './utils/error';
import {
  configRequest,
  hydraRequest,
  mediascopeCounterRequest,
  serviceTariffsRequest,
  trackInfoRequest,
  userSubscriptionRequest,
} from './utils/requests';

export const IS_DEV = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3000;

let options = {};

if (IS_DEV) {
  const privateKey = fs.readFileSync(path.resolve('server', 'cert', 'cert.key'));
  const certificate = fs.readFileSync(path.resolve('server', 'cert', 'cert.crt'));
  options = {
    key: privateKey,
    cert: certificate,
  };
}

const bootstrap = async () => {
  const app = express();
  app.disable('x-powered-by');
  app.use(requestIp.mw());

  app.set('views', path.resolve(__dirname, 'views'));
  app.set('view engine', 'ejs');
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  app.engine('ejs', ejs.__express);

  app.use((req, res, next) => {
    if (process.env.CANARY_RELEASE) res.setHeader('x-canary', 'true');
    next();
  });

  app.use(express.static(path.resolve(__dirname, '..', 'client')));
  //   app.use(express.static(path.resolve(__dirname, '..', 'client-vitrina')));

  app.use((req, res, next) => {
    res.setHeader('X-Service', APP_VERSION);
    next();
  });

  if (IS_DEV) await createDevServer(app);

  app.use((req, res, next) => {
    if (req?.headers?.['x-routing-key'] === 'rendertron') res.status(200).end();
    else next();
  });

  app.get('/manifest/:partner_id/:track_id/:user_token?', async (req, res) => {
    try {
      const params = { ...req.params, ...req.query } as TParams & { config_source: TConfigSource };

      if (!params.config_source) throw new RequestError(ERROR.INVALID_CONFIG_SOURCE);
      if (!isNumber(params.partner_id)) throw new RequestError(ERROR.INVALID_PARTNER_ID);
      if (!isNumber(params.track_id)) throw new RequestError(ERROR.INVALID_TRACK_ID);

      const [config] = await Promise.all([configRequest(req, params.config_source, params, options)]);
      if (!config) throw new RequestError(ERROR.SIREN_UNAVAILABLE, 'config is undefined');

      res.status(200).json({
        ...config,
      });
    } catch (err) {
      logger.error('GET /manifest', err);
      const { status, errors } = createError(err);
      res.status(status).json(errors);
    }
  });

  app.get('/player/:partner_id/:track_id/:user_token?', async (req, res) => {
    const params = { ...req.params, ...req.query } as TParams;

    try {
      if (!isNumber(params.partner_id)) throw new RequestError(ERROR.INVALID_PARTNER_ID);
      if (!isNumber(params.track_id)) throw new RequestError(ERROR.INVALID_TRACK_ID);

      const options = { headers: createHeaders(req) };
      const features = await hydraRequest(params.partner_id, options);

      if (!features) throw new RequestError(ERROR.NOT_FOUND);

      const [config, serviceTariffs, trackInfo, subscription, mediascopeCounter] = await Promise.all([
        configRequest(req, features.config_source, params, options),
        serviceTariffsRequest(params.user_token, features.skin_theme_class, options),
        trackInfoRequest(params.track_id, features.skin_theme_class, options),
        userSubscriptionRequest(params.user_token, features.skin_theme_class, options),
        mediascopeCounterRequest(SERVICE_GROUP_ID[features.skin_theme_class], options),
      ]);

      if (!config) throw new RequestError(ERROR.SIREN_UNAVAILABLE);

      res.status(200).render('index', {
        isProduction: !IS_DEV,
        env: createEnv(req),
        config: {
          config: config?.config || null,
          playlist: config?.playlist || null,
          features,
          serviceTariffs: serviceTariffs || null,
          trackInfo: trackInfo || null,
          subscription: subscription || null,
          mediascopeCounter,
        },
        context: {
          ...params,
        },
      });
    } catch (err) {
      logger.error('GET /player', err);
      const { errors } = createError(err);

      res.status(200).render('index', {
        isProduction: !IS_DEV,
        env: createEnv(req),
        config: {
          config: null,
          playlist: {
            items: [
              {
                errors,
              },
            ],
          },
          features: null,
          serviceTariffs: null,
          trackInfo: null,
          subscription: null,
          mediascopeCounter: null,
        },
        context: {
          ...params,
        },
      });
    }
  });

  app.get('/config/:base64', async (req, res) => {
    try {
      const { base64 } = req.params;
      if (!base64 || !isValidBase64(base64)) throw new RequestError(ERROR.INVALID_BODY);

      const buff = Buffer.from(base64, 'base64');
      const encodedUrl = buff.toString('ascii') || '';
      const url = decodeURIComponent(encodedUrl);

      const { hostname, searchParams, pathname } = new URL(url);

      const params: Record<string, any> = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      if (!hostname) throw new RequestError(ERROR.INVALID_BODY);
      if (!isNumber(params.partner_id)) throw new RequestError(ERROR.INVALID_PARTNER_ID);

      const options = { headers: createHeaders(req) };
      const features = await hydraRequest(params.partner_id, options);

      if (!features) throw new RequestError(ERROR.NOT_FOUND);

      const data = new URL(URL_MAP_BY_SOURCE[features.config_source]);
      if (data.hostname !== hostname) throw new RequestError(ERROR.NOT_FOUND);

      ({
        [TConfigSource.HUB]: () => {
          if (!isNumber(params.track_id)) throw new RequestError(ERROR.INVALID_TRACK_ID);
          if (pathname !== '/player/config') throw new RequestError(ERROR.INVALID_BODY);
        },
        [TConfigSource.SIREN_CTC]: () => {
          if (!isNumber(params.track_id)) throw new RequestError(ERROR.INVALID_TRACK_ID);
          if (pathname !== '/player/config') throw new RequestError(ERROR.INVALID_BODY);
        },
        [TConfigSource.PAK]: () => {
          const result = pathname.split('/');
          if (
            result.length !== 5 ||
            result[1] !== 'video' ||
            result[2] !== 'tracks' ||
            result[4] !== 'track_config.json'
          ) {
            throw new RequestError(ERROR.INVALID_BODY);
          }

          if (!isNumber(result[3])) throw new RequestError(ERROR.INVALID_TRACK_ID);
          params.track_id = result[3];
          params.user_token = params.userToken;
        },
      }[features.config_source]?.());

      const [config, serviceTariffs, trackInfo, subscription] = await Promise.all([
        configRequest(req, features.config_source, params as TParams, options),
        serviceTariffsRequest(params.user_token, features.skin_theme_class, options),
        trackInfoRequest(params.track_id, features.skin_theme_class, options),
        userSubscriptionRequest(params.user_token, features.skin_theme_class, options),
      ]);

      if (!config) throw new RequestError(ERROR.SIREN_UNAVAILABLE);

      res.status(200).json({
        config: config?.config || null,
        playlist: config?.playlist || null,
        features,
        serviceTariffs: serviceTariffs || null,
        trackInfo: trackInfo || null,
        subscription: subscription || null,
      });
    } catch (err) {
      logger.error('GET /config', err);
      const { status, errors } = createError(err);
      res.status(status).json(errors);
    }
  });

  //   app.get('/live/:channelId', LivePlayerHandler, EndpointLogger('live'));
  //   app.get('/_metrics', MetricsHandler);

  app.use('*', (req, res, next) => {
    res.status(404).end();
  });

  app.use((err: any, req: express.Request, res: express.Response) => {
    console.error(err);
    res.status(err?.status || 500).end();
  });

  const log = () => console.log(`Server running at https://local.more.tv:${PORT}`);

  if (IS_DEV) {
    const server = https.createServer(options, app);
    server.listen(PORT, log);
  } else {
    app.listen(PORT, log);
  }
};

export { bootstrap };
