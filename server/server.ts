import express from 'express';
import path from 'path';
import requestIp from 'request-ip';
import https from 'https';
import fs from 'fs';
import { createDevServer } from './devServer';
import { ERROR, TConfigSource } from './types';
import { isNumber, createEnv, isValidBase64, URL_MAP_BY_SOURCE, TParams, createHeaders } from './utils';
import { hydraRequest, configRequest, serviceTariffsRequest } from './utils/requests';

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

  app.get('/player/:partner_id/:track_id/:user_token?', async (req, res) => {
    const params = { ...req.params, ...req.query } as TParams;

    if (!isNumber(params.partner_id)) throw new Error(ERROR.INVALID_PARTNER_ID);
    if (!isNumber(params.track_id)) throw new Error(ERROR.INVALID_TRACK_ID);

    const options = { headers: createHeaders(req) };
    const features = await hydraRequest(params.partner_id, options);

    if (!features) throw new Error(ERROR.NOT_FOUND);

    const config = await configRequest(req, features.config_source, params, options);
    const serviceTariffs = await serviceTariffsRequest(params.partner_id, params.user_token, options);

    res.status(200).render('index', {
      isProduction: !IS_DEV,
      env: createEnv(req),
      config: {
        config: config?.data?.config || null,
        playlist: config?.data?.playlist || null,
        features,
        serviceTariffs,
      },
    });
  });

  app.get('/config/:base64', async (req, res) => {
    const { base64 } = req.params;
    if (!base64 || !isValidBase64(base64)) throw new Error(ERROR.INVALID_BODY);

    const buff = Buffer.from(base64, 'base64');
    const encodedUrl = buff.toString('ascii') || '';
    const url = decodeURIComponent(encodedUrl);

    const { hostname, searchParams, pathname } = new URL(url);

    const params: Record<string, any> = {};
    searchParams.forEach((key, value) => {
      params[key] = value;
    });

    if (!hostname) throw new Error(ERROR.INVALID_BODY);
    if (!isNumber(params.partner_id)) throw new Error(ERROR.INVALID_PARTNER_ID);

    const options = { headers: createHeaders(req) };
    const features = await hydraRequest(params.partner_id, options);

    if (!features) throw new Error(ERROR.NOT_FOUND);

    const data = new URL(URL_MAP_BY_SOURCE[features.config_source]);
    if (data.hostname !== hostname) throw new Error(ERROR.NOT_FOUND);

    ({
      [TConfigSource.HUB]: () => {
        if (!isNumber(params.track_id)) throw new Error(ERROR.INVALID_TRACK_ID);
        if (pathname !== '/player/config') throw new Error(ERROR.INVALID_BODY);
      },
      [TConfigSource.SIREN_CTC]: () => {
        if (!isNumber(params.track_id)) throw new Error(ERROR.INVALID_TRACK_ID);
        if (pathname !== '/player/config') throw new Error(ERROR.INVALID_BODY);
      },
      [TConfigSource.PAK]: () => {
        const result = pathname.split('/');
        if (result.length !== 5 || result[1] !== 'video' || result[2] !== 'tracks' || result[4] !== 'track_config.json') {
          throw new Error(ERROR.INVALID_BODY);
        }

        if (!isNumber(result[3])) throw new Error(ERROR.INVALID_TRACK_ID);
        params.track_id = result[3];
        params.user_token = params.userToken;
      },
    }[features.config_source]?.());

    const config = await configRequest(req, features.config_source, params as TParams, options);
    res.status(200).json({
      ...config?.data,
      features,
    });
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
