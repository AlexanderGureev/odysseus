import ejs from 'ejs';
import express from 'express';
import fs from 'fs';
import https from 'https';
import path from 'path';
import requestIp from 'request-ip';

import Storage from '../live/live-storage.json';
import { isNil } from '../src/utils';
import { logger } from '../src/utils/logger';
import { ERROR, SERVICE_GROUP_ID, TConfigSource } from '../types';
import { createDevServer } from './devServer';
import { createEnv, createHeaders, isNumber, isValidBase64, TParams, URL_MAP_BY_SOURCE } from './utils';
import { createError, RequestError } from './utils/error';
import {
  configRequest,
  getChannels,
  getInspectStreams,
  getTrackMeta,
  hydraRequest,
  mediascopeCounterRequest,
  serviceTariffsRequest,
  trackInfoRequest,
  uploadScreenshotToPAK,
  userSubscriptionRequest,
} from './utils/requests';

export const IS_DEV = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3000;

let options = {};
const mockStorage: Record<string, string> = Storage;

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
  app.use(express.static(path.resolve(__dirname, '..', 'client-vitrina')));

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

      if (!params.config_source) throw new RequestError(ERROR.INVALID_CONFIG_SOURCE, 400);
      if (!isNumber(params.partner_id)) throw new RequestError(ERROR.INVALID_PARTNER_ID, 400);
      if (!isNumber(params.track_id)) throw new RequestError(ERROR.INVALID_TRACK_ID, 400);

      const [config] = await Promise.all([configRequest(req, params.config_source, params, options)]);
      if (!config) throw new RequestError(ERROR.SIREN_UNAVAILABLE, 500, 'config is undefined');

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
      if (!isNumber(params.partner_id)) throw new RequestError(ERROR.INVALID_PARTNER_ID, 400);
      if (!isNumber(params.track_id)) throw new RequestError(ERROR.INVALID_TRACK_ID, 400);

      const options = { headers: createHeaders(req) };
      const features = await hydraRequest(params.partner_id, options);

      if (!features) throw new RequestError(ERROR.NOT_FOUND, 404);

      const [config, serviceTariffs, trackInfo, subscription, mediascopeCounter] = await Promise.all([
        configRequest(req, features.config_source, params, options),
        serviceTariffsRequest(params.user_token, features.skin_theme_class, options),
        trackInfoRequest(params.track_id, features.skin_theme_class, options),
        userSubscriptionRequest(params.user_token, features.skin_theme_class, options),
        mediascopeCounterRequest(SERVICE_GROUP_ID[features.skin_theme_class], options),
      ]);

      if (!config) throw new RequestError(ERROR.SIREN_UNAVAILABLE, 500);

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
      if (!base64 || !isValidBase64(base64)) throw new RequestError(ERROR.INVALID_BODY, 400);

      const buff = Buffer.from(base64, 'base64');
      const encodedUrl = buff.toString('ascii') || '';
      const url = decodeURIComponent(encodedUrl);

      const { hostname, searchParams, pathname } = new URL(url);

      const params: Record<string, any> = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      if (!hostname) throw new RequestError(ERROR.INVALID_BODY, 400);
      if (!isNumber(params.partner_id)) throw new RequestError(ERROR.INVALID_PARTNER_ID, 400);

      const options = { headers: createHeaders(req) };
      const features = await hydraRequest(params.partner_id, options);

      if (!features) throw new RequestError(ERROR.NOT_FOUND, 404);

      const data = new URL(URL_MAP_BY_SOURCE[features.config_source]);
      if (data.hostname !== hostname) throw new RequestError(ERROR.NOT_FOUND, 404);

      ({
        [TConfigSource.HUB]: () => {
          if (!isNumber(params.track_id)) throw new RequestError(ERROR.INVALID_TRACK_ID, 400);
          if (pathname !== '/player/config') throw new RequestError(ERROR.INVALID_BODY, 400);
        },
        [TConfigSource.SIREN_CTC]: () => {
          if (!isNumber(params.track_id)) throw new RequestError(ERROR.INVALID_TRACK_ID, 400);
          if (pathname !== '/player/config') throw new RequestError(ERROR.INVALID_BODY, 400);
        },
        [TConfigSource.PAK]: () => {
          const result = pathname.split('/');
          if (
            result.length !== 5 ||
            result[1] !== 'video' ||
            result[2] !== 'tracks' ||
            result[4] !== 'track_config.json'
          ) {
            throw new RequestError(ERROR.INVALID_BODY, 400);
          }

          if (!isNumber(result[3])) throw new RequestError(ERROR.INVALID_TRACK_ID, 400);
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

      if (!config) throw new RequestError(ERROR.SIREN_UNAVAILABLE, 500);

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

  app.get('/live/:channelId', async (req, res) => {
    try {
      const id = req.params.channelId;
      if (!id) throw new RequestError('INVALID_CHANNEL_ID', 400);

      const channels = await getChannels();
      const link = channels?.[id] || mockStorage[id];

      if (!link) throw new RequestError('NOT_FOUND', 404, `not found link by channel id: ${id}`);

      return res.render('live', {
        FRAME_SRC: `window.FRAME_SRC = "${link}"`,
      });
    } catch (err) {
      res.status(err.status || 500).json({ status: err.status || 500, message: err.message });
    }
  });

  app.get('/private/pak_admin_player/:trackId', async (req, res) => {
    try {
      const track_id = parseInt(req?.params?.trackId);
      if (!track_id || !Number.isFinite(track_id)) return res.status(400).end();

      for (const key of ['SIREN_API_TOKEN', 'SIREN_HOST', 'MORPHEUS_ENDPOINT']) {
        const value = process.env[key];
        if (isNil(value)) {
          throw {
            name: 'InvalidEnv',
            message: `${key} env is undefined`,
          };
        }
      }

      const [mediaFile, trackMeta] = await Promise.all([getInspectStreams(track_id), getTrackMeta(track_id)]);

      return res.render('pak_player', {
        data: mediaFile.data.attributes,
        meta: trackMeta.data[0]?.attributes || null,
        env: createEnv(req),
      });
    } catch (err) {
      logger.error('[/private/pak_admin_player]', err);

      const status = err?.status || 503;
      res.status(status).json({
        name: err?.name || 'UnknownError',
        status,
        message: err?.message,
      });
    }
  });

  app.get('/private/siren/inspect_streams/:trackId', async (req, res) => {
    const track_id = parseInt(req?.params?.trackId);
    if (!track_id || !Number.isFinite(track_id)) return res.status(400).end();

    try {
      const response = await getInspectStreams(track_id);
      res.status(200).json(response);
    } catch (err) {
      logger.error('[/private/siren/inspect_streams]', err);
      res.status(err?.status || 503).end();
    }
  });

  app.get('/_metrics', () => {
    return;
  });

  app.post('/send/mail', express.json(), () => {
    return;
  });

  app.post('/private/pak/uploadScreenshot', express.json(), async (req, res) => {
    const endpoint = req?.body?.endpoint;
    const dataUri64 = req?.body?.image;

    if (!endpoint || !dataUri64) {
      logger.log('[/private/pak/uploadScreenshot]', `Invalid request received: ${JSON.stringify(req?.body)}`);
      return res.status(400).end();
    }

    try {
      if (!/data:image\//.test(dataUri64)) {
        throw new Error('It seems that uploaded is not a Image Data URI. Couldn\'t match "data:image/"');
      }

      const regExMatches = dataUri64.match('data:(image/.*);base64,(.*)');
      const [_, imageType, dataBase64] = regExMatches;

      if (imageType !== 'image/jpeg') {
        throw new Error(`Expecting uploaded image to be jpeg, got ${imageType} instead`);
      }

      const dataBuffer = Buffer.from(dataBase64, 'base64');
      const uploadResult = await uploadScreenshotToPAK(endpoint, dataBuffer);

      res.status(201).json(uploadResult).end();
    } catch (err) {
      logger.error('[/private/pak/uploadScreenshot]', err);
      res.status(err?.status || 503).end();
    }
  });

  app.options('/check_connection', (req, res) => {
    res.status(200).end();
  });

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
