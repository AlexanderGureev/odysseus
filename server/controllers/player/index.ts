import './schema';

import express from 'express';

import { logger } from '../../../src/utils/logger';
import { ERROR, SERVICE_GROUP_ID, TConfigSource } from '../../../types';
import { IS_DEV } from '../../bootstrap';
import { asyncHandler } from '../../httpserver/asyncHandler';
import { createEnv, createHeaders, isNumber, isValidBase64, TParams, URL_MAP_BY_SOURCE } from '../../utils';
import { createError, RequestError } from '../../utils/error';
import {
  configRequest,
  hydraRequest,
  mediascopeCounterRequest,
  serviceTariffsRequest,
  trackInfoRequest,
  userSubscriptionRequest,
} from '../../utils/requests';

export const PlayerController = () => {
  return {
    register: (app: express.Application) => {
      /**
       * GET /player/{partner_id}/{track_id}/{user_token}
       * @tags player
       * @summary Get player html
       * @param {integer} partner_id.path.required - partner id (example: 1677)
       * @param {integer} track_id.path.required - track id (example: 19363)
       * @param {string} user_token.path - user token
       * @return {string} 200 - success response - text/html
       * @return {Error} 400 - invalid request
       * @return {Error} 500 - internal error
       * @return {Error} 503 - service unavailable
       */
      app.get(
        '/player/:partner_id/:track_id/:user_token?',
        asyncHandler<TParams>(async (req, res) => {
          const params = { ...req.params, ...req.query };

          try {
            if (!isNumber(params.partner_id)) throw new RequestError(ERROR.INVALID_PARTNER_ID, 400);
            if (!isNumber(params.track_id)) throw new RequestError(ERROR.INVALID_TRACK_ID, 400);

            const { isNcanto, ...reqParams } = params;
            const options = { headers: createHeaders(req) };
            const features = await hydraRequest(params.partner_id, options);

            const [config, serviceTariffs, trackInfo, subscription, mediascopeCounter] = await Promise.all([
              configRequest(req, features.config_source, reqParams, { headers: { ...options.headers, isNcanto } }),
              serviceTariffsRequest(reqParams.user_token, features.skin_theme_class, options),
              trackInfoRequest(reqParams.track_id, features.skin_theme_class, options),
              userSubscriptionRequest(reqParams.user_token, features.skin_theme_class, options),
              mediascopeCounterRequest(SERVICE_GROUP_ID[features.skin_theme_class], options),
            ]);

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
                ...reqParams,
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
        })
      );

      /**
       * GET /manifest/{partner_id}/{track_id}/{user_token}
       * @tags player
       * @summary Get raw siren config
       * @param {integer} partner_id.path.required - partner id (example: 1677)
       * @param {integer} track_id.path.required - track id (example: 19363)
       * @param {string} user_token.path - user token
       * @return {SirenConfig} 200 - success response - application/json
       * @return {Error} 400 - invalid request
       * @return {Error} 500 - internal error
       * @return {Error} 503 - service unavailable
       */
      app.get(
        '/manifest/:partner_id/:track_id/:user_token?',
        asyncHandler<TParams, { config_source: TConfigSource }>(async (req, res) => {
          try {
            const params = { ...req.params, ...req.query };

            if (!params.config_source) throw new RequestError(ERROR.INVALID_CONFIG_SOURCE, 400);
            if (!isNumber(params.partner_id)) throw new RequestError(ERROR.INVALID_PARTNER_ID, 400);
            if (!isNumber(params.track_id)) throw new RequestError(ERROR.INVALID_TRACK_ID, 400);

            const options = { headers: createHeaders(req) };
            const [config] = await Promise.all([configRequest(req, params.config_source, params, options)]);

            res.status(200).json({
              ...config,
            });
          } catch (err) {
            logger.error('GET /manifest', err);
            const { status, errors } = createError(err);
            res.status(status).json(errors);
          }
        })
      );

      /**
       * GET /config/{base64}
       * @tags player
       * @summary Get player config by siren url (base64)
       * @param {string} base64.path.required - base64 siren config url
       * @return {PlayerConfig} 200 - success response - application/json
       * @return {Error} 400 - invalid request
       * @return {Error} 500 - internal error
       * @return {Error} 503 - service unavailable
       */
      app.get(
        '/config/:base64',
        asyncHandler<{ base64: string }>(async (req, res) => {
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
        })
      );
    },
  };
};
