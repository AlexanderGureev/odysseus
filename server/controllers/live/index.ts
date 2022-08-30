import './schema';

import express from 'express';

import Storage from '../../../live/live-storage.json';
import { asyncHandler } from '../../httpserver/asyncHandler';
import { RequestError } from '../../utils/error';
import { getChannels } from '../../utils/requests';

const mockStorage: Record<string, string> = Storage;

export const LivePlayerController = () => {
  return {
    register: (app: express.Application) => {
      /**
       * GET /live/{channelId}
       * @tags live
       * @summary Get live player html
       * @param {integer} channelId.path.required - channel id (example: 1)
       * @return {string} 200 - success response - text/html
       * @return {Error} 400 - invalid channel id
       * @return {Error} 404 - not found channel
       * @return {Error} 500 - internal error
       * @return {Error} 503 - service unavailable
       */
      app.get(
        '/live/:channelId',
        asyncHandler<{ channelId: string }>(async (req, res) => {
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
        })
      );
    },
  };
};
