import './schema';

import express from 'express';

import { isNil } from '../../../src/utils';
import { logger } from '../../../src/utils/logger';
import { asyncHandler } from '../../httpserver/asyncHandler';
import { createEnv } from '../../utils';
import { getInspectStreams, getTrackMeta, uploadScreenshotToPAK } from '../../utils/requests';

export const PAKAdminPlayerController = () => {
  return {
    register: (app: express.Application) => {
      /**
       * GET /private/pak_admin_player/{trackId}
       * @tags PAK
       * @summary Get PAK admin player html
       * @param {integer} trackId.path.required - track id
       * @return {string} 200 - success response - text/html
       * @return {Error} 400 - invalid request
       * @return {Error} 404 - not found track config
       * @return {Error} 500 - internal error
       * @return {Error} 503 - service unavailable
       */
      app.get(
        '/private/pak_admin_player/:trackId',
        asyncHandler<{ trackId: string }>(async (req, res) => {
          try {
            const track_id = parseInt(req?.params?.trackId);
            if (!track_id || !Number.isFinite(track_id)) {
              res.status(400).end();
              return;
            }

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
        })
      );

      /**
       * GET /private/siren/inspect_streams/{trackId}
       * @tags PAK
       * @summary Get inspect streams by track id
       * @param {integer} trackId.path.required - track id
       * @return {Mediafile} 200 - success response - text/html
       * @return {Error} 400 - invalid track_id
       * @return {Error} 404 - not found track config
       * @return {Error} 500 - internal error
       * @return {Error} 503 - service unavailable
       */
      app.get(
        '/private/siren/inspect_streams/:trackId',
        asyncHandler<{ trackId: string }>(async (req, res) => {
          const track_id = parseInt(req?.params?.trackId);
          if (!track_id || !Number.isFinite(track_id)) {
            res.status(400).end();
            return;
          }

          try {
            const response = await getInspectStreams(track_id);
            res.status(200).json(response);
          } catch (err) {
            logger.error('[/private/siren/inspect_streams]', err);
            res.status(err?.status || 503).end();
          }
        })
      );

      /**
       * POST /private/pak/uploadScreenshot
       * @tags PAK
       * @summary upload screenshot
       * @param {ScreenshotData} request.body.required - screenshot data - application/json
       * @return 201 - screenshot uploaded success
       * @return 400 - invalid request body
       * @return {Error} 500 - internal error
       * @return {Error} 503 - service unavailable
       */
      app.post(
        '/private/pak/uploadScreenshot',
        asyncHandler<unknown, unknown, { endpoint: string; image: string }>(async (req, res) => {
          const endpoint = req?.body?.endpoint;
          const dataUri64 = req?.body?.image;

          if (!endpoint || !dataUri64) {
            logger.log('[/private/pak/uploadScreenshot]', `Invalid request received: ${JSON.stringify(req?.body)}`);
            res.status(400).end();
            return;
          }

          try {
            if (!/data:image\//.test(dataUri64)) {
              throw new Error('It seems that uploaded is not a Image Data URI. Couldn\'t match "data:image/"');
            }

            const regExMatches = dataUri64.match('data:(image/.*);base64,(.*)') || [];
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
        })
      );
    },
  };
};
