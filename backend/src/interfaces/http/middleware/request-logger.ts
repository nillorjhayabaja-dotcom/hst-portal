import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { logger } from '../../../infrastructure/logging/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = randomUUID();
  req.requestId = requestId;
  const start = Date.now();
  logger.info({ requestId, method: req.method, url: req.url, ip: req.ip }, 'Incoming request');
  res.on('finish', () => {
    logger.info(
      { requestId, method: req.method, url: req.url, status: res.statusCode, durationMs: Date.now() - start },
      'Request completed',
    );
  });
  next();
}
