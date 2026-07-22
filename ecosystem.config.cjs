/**
 * PM2 Ecosystem Configuration for HST Enterprise Portal
 * 
 * Manages ALL services required to run the application:
 * - Frontend (Vite/Cloudflare Dev Server)
 * - Backend API (Express/NestJS)
 * - Cloudflare Tunnel (exposes backend to internet)
 * - PostgreSQL (database server)
 *
 * Usage:
 *   npm run services:start        # Start all services
 *   npm run services:stop         # Stop all services
 *   npm run services:status       # Check status
 *   pm2 save                      # Save process list
 *   pm2 startup                   # Auto-start on Windows reboot
 */

const path = require('path');
const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  apps: [
    // ============================================================
    // Service 1: Frontend - Vite/Cloudflare Dev Server
    // Run `npm run build` first for production
    // ============================================================
    {
      name: 'hst-portal-frontend',
      cwd: __dirname,
      script: 'cmd.exe',
      args: ['/c', 'npm', 'run', isProd ? 'preview' : 'dev'],
      env: {
        NODE_ENV: process.env.NODE_ENV || 'development',
        VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:3001',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      merge_logs: true,
      max_restarts: 10,
      restart_delay: 5000,
      autorestart: true,
    },

    // ============================================================
    // Service 2: Backend API
    // Uses npm run dev in development
    // ============================================================
    {
      name: 'hst-portal-api',
      cwd: path.join(__dirname, 'backend'),
      script: 'cmd.exe',
      args: ['/c', 'npm', 'run', 'dev'],
      instances: 1,
      exec_mode: 'fork',
      watch: isProd ? false : ['src'],
      ignore_watch: ['node_modules', 'dist', 'logs'],
      max_memory_restart: '1G',
      
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      merge_logs: true,
      
      max_restarts: 10,
      restart_delay: 5000,
      min_uptime: 10000,
      
      kill_timeout: 30000,
      listen_timeout: 10000,
      autorestart: true,
      exp_backoff_restart_delay: 100,
    },

    // ============================================================
    // Service 3: Cloudflare Tunnel
    // Exposes local backend to the internet via Cloudflare
    // Only runs if cloudflared is installed
    // ============================================================
    {
      name: 'hst-portal-tunnel',
      cwd: __dirname,
      script: 'cloudflared',
      args: ['tunnel', 'run', process.env.TUNNEL_NAME || 'hst-portal-backend'],
      interpreter: 'none',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/tunnel-error.log',
      out_file: './logs/tunnel-out.log',
      merge_logs: true,
      max_restarts: 5,
      restart_delay: 10000,
      autorestart: true,
      // Only start if cloudflared is available
      stop_exit_codes: [0, 1, 2],
    },

    // ============================================================
    // Service 4: PostgreSQL (Windows Service Check)
    // Ensures PostgreSQL is running - starts if not
    // ============================================================
    {
      name: 'hst-portal-db',
      script: 'cmd',
      args: [
        '/c',
        '"C:\\Program Files\\PostgreSQL\\18\\bin\\pg_ctl.exe"',
        'start',
        '-D',
        '"C:\\Program Files\\PostgreSQL\\18\\data"',
        '-l',
        '"C:\\Program Files\\PostgreSQL\\18\\data\\pg_log.log"',
      ],
      interpreter: 'none',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/db-error.log',
      out_file: './logs/db-out.log',
      max_restarts: 3,
      restart_delay: 30000,
      autorestart: true,
    },
  ],
};