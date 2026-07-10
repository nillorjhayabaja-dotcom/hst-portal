import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from '../../infrastructure/config/env';
import { logger } from '../../infrastructure/logging/logger';
import { connectDatabase, disconnectDatabase } from '../../infrastructure/database/prisma.service';
import { requestLogger } from './middleware/request-logger';
import { globalRateLimiter } from './middleware/rate-limiter';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import v1Routes from './routes/v1';

export function createApp(): express.Express {
  const app = express();

  app.use(helmet());
  // Reflect the incoming Origin when present to support multi-host dev setups.
  // This prevents CORS preflight failures when the frontend origin differs (e.g. 10.x.x.x vs localhost).
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        return callback(null, true);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);
  app.use(globalRateLimiter);

  app.use('/api/v1', v1Routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

async function start(): Promise<void> {
  try {
    await connectDatabase();
    const app = createApp();
    const server = app.listen(env.port, () => {
      logger.info(`HST Enterprise API listening on port ${env.port}`);
    });
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down...`);
      server.close();
      await disconnectDatabase();
      process.exit(0);
    };
    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

// Only auto-start when run directly (not when imported by tests).
if (require.main === module) {
  void start();
}
