import express from 'express';
import responseTime from 'response-time';
import { IMetricsService } from 'server/interfaces';

import { logger } from '../../src/utils/logger';

export const statsMiddleware = (metricsService: IMetricsService) =>
  responseTime((req: express.Request, res: express.Response, time: number) => {
    const { route, method } = req;
    const { statusCode: status_code } = res;

    if (!route) return;

    const labels = ['path', 'method', 'status_code'] as const;
    const values = { path: route.path, method, status_code };

    logger.info('[httpserver]', 'request', { ...values, time });

    metricsService
      .counter({
        name: `http_requests_total`,
        help: 'Counter for total requests received',
        labelNames: labels,
      })
      .inc(values);

    metricsService
      .histogram({
        name: 'http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: labels,
        buckets: [0.3, 0.7, 2, 7, 20],
      })
      .observe(values, time / 1000);
  });
