import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function num(name: string, fallback: number): number {
  const v = process.env[name];
  return v ? Number(v) : fallback;
}

function bool(name: string, fallback = false): boolean {
  const v = process.env[name];
  if (v === undefined) return fallback;
  return v === 'true' || v === '1';
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: num('PORT', 3000),
  databaseUrl: required('DATABASE_URL'),
  jwt: {
    secret: required('JWT_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  rateLimit: {
    windowMs: num('RATE_LIMIT_WINDOW_MS', 900000),
    max: num('RATE_LIMIT_MAX_REQUESTS', 100),
    loginMax: num('RATE_LIMIT_LOGIN_MAX', 5),
  },
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: num('MAX_FILE_SIZE', 10485760),
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: num('SMTP_PORT', 587),
    secure: bool('SMTP_SECURE', false),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'HST Portal <noreply@hst-corp.com>',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: num('REDIS_PORT', 6379),
    password: process.env.REDIS_PASSWORD || '',
  },
  app: {
    name: process.env.APP_NAME || 'HST Enterprise Portal',
    url: process.env.APP_URL || 'http://localhost:3000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
  logLevel: process.env.LOG_LEVEL || 'info',
} as const;

export type Env = typeof env;