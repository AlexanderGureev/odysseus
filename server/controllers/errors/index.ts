import './schema';

import express from 'express';

import { asyncHandler } from '../../httpserver/asyncHandler';
import { createEnv } from '../../utils';

export const ErrorsPageController = () => {
  return {
    register: (app: express.Application) => {
      /**
       * GET /_errors
       * @tags errors
       * @summary Get errors list page
       * @return {string} 200 - success response - text/html
       */
      app.get(
        '/_errors',
        asyncHandler(async (req, res) => {
          if (process.env.DEBUG_MODE === 'true') {
            res.render('errors', {
              env: createEnv(req),
            });
          } else {
            res.status(404).end();
          }
        })
      );
    },
  };
};
