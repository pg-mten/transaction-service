import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Histogram, Counter, register } from 'prom-client';

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

const httpRequestErrors = new Counter({
  name: 'http_request_errors_total',
  help: 'Total number of error responses (4xx/5xx)',
  labelNames: ['method', 'route', 'status_code'],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestErrors);

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const end = httpRequestDuration.startTimer({
      service: process.env.APP_NAME || 'transaction-service',
      method: req.method,
      route: req.route?.path || req.path,
    });

    res.on('finish', () => {
      const labels = {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode,
      };

      end(labels);

      if (res.statusCode >= 400) {
        httpRequestErrors.inc(labels);
      }
    });

    next();
  }
}