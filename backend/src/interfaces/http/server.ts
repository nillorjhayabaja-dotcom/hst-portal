import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
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

  // Security headers
  app.use(helmet());

  // Response compression
  app.use(compression() as any);

  // Trust proxy - Required for Cloudflare Tunnel and reverse proxy
  app.set('trust proxy', 1);

  // CORS - Restricted to production domains
  const allowedOrigins = [
    'https://hst-portal.rjabaja.workers.dev',
    'https://hst-portal-api.rjabaja.workers.dev',
    /\.workers\.dev$/,
    /\.trycloudflare\.com$/,
    'http://localhost:5173', // Development
    'http://localhost:3000', // Alternative dev
  ];

  const corsOptions = {
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (server-to-server, mobile apps, Postman)
        if (!origin) return callback(null, true);
        
        // Normalize the origin - remove trailing slash if present
        const normalizedOrigin = origin.replace(/\/$/, '');
        
        // Check if origin matches any allowed domain or regex pattern
        const isAllowed = allowedOrigins.some((allowed) => {
          if (allowed instanceof RegExp) {
            return allowed.test(normalizedOrigin);
          }

          return (
            normalizedOrigin === allowed ||
            normalizedOrigin.startsWith(allowed)
          );
        });

        if (isAllowed) {
          return callback(null, true);
        }

        // In production, reject unknown origins with explicit error
        if (env.nodeEnv === 'production') {
          logger.warn({ origin }, 'CORS blocked request from unauthorized origin');
          return callback(new Error(`Origin '${origin}' not allowed by CORS`));
        }

        // In development, allow all origins
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
      exposedHeaders: ['Content-Disposition'],
      optionsSuccessStatus: 204,
    };

  app.use(cors(corsOptions));

  // Explicit preflight handling for Cloudflare Tunnel / Workers
  app.options('*', cors(corsOptions));

  // Body parsing with size limits
  // Skip JSON parsing for multipart/form-data requests (file uploads)
  app.use(express.json({
    limit: '10mb',
    type: ['application/json', 'application/*+json'],
  }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use(requestLogger);

  // Global rate limiting
  app.use(globalRateLimiter);

  // Health check - no auth required, used by Cloudflare Tunnel and monitoring
  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: env.nodeEnv,
        memoryUsage: process.memoryUsage(),
      },
    });
  });

  // API routes
  app.use('/api/v1', v1Routes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
}

async function start(): Promise<void> {
  try {
    await connectDatabase();
    const app = createApp();
    const server = app.listen(env.port, '0.0.0.0', () => {
      logger.info(`HST Enterprise API listening on port ${env.port} in ${env.nodeEnv} mode`);
      logger.info(`Accepting connections from origins: ${env.nodeEnv === 'production' ? 'https://hst-portal.rjabaja.workers.dev' : 'all origins'}`);
    });

    // Graceful shutdown handler
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, initiating graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');

        // Disconnect database
        await disconnectDatabase();
        logger.info('Database disconnected');

        // Exit successfully
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Register signal handlers
    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));

    // Handle uncaught errors
    process.on('unhandledRejection', (reason, promise) => {
      logger.error({ err: reason }, 'Unhandled Rejection at:', promise);
    });

    process.on('uncaughtException', (error) => {
      logger.error({ err: error }, 'Uncaught Exception');
      process.exit(1);
    });

  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

// Only auto-start when run directly (not when imported by tests)
if (require.main === module) {
  void start();
}

export { start }; // Export for programmatic usage