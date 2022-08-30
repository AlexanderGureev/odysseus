import express from 'express';

import { asyncHandler } from '../httpserver/asyncHandler';
import { IMetricsService } from '../interfaces';

export const MetricsController = (metricsService: IMetricsService) => {
  return {
    register: (app: express.Application) => {
      /**
       * GET /metrics
       * @tags metrics
       * @summary Get metrics by service
       * @return {object} 200 - success response
       */
      app.get(
        '/metrics',
        asyncHandler(async (_req, res) => {
          const response = await metricsService.stringify();
          res.status(200).send(response);
        })
      );
    },
  };
};
