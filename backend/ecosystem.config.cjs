/**
 * PM2 Ecosystem Configuration for HST Enterprise Portal Backend
 * 
 * Usage:
 *   pm2 start ecosystem.config.cjs          # Start all instances
 *   pm2 start ecosystem.config.cjs --env production  # Start with production env
 *   pm2 stop hst-portal-api                 # Stop the service
 *   pm2 restart hst-portal-api              # Restart the service
 *   pm2 logs hst-portal-api                 # View logs
 *   pm2 monit                               # Monitor all services
 *   pm2 save                                # Save process list for auto-restart
 *   pm2 startup                             # Generate startup script for auto-restart on reboot
 */

module.exports = {
  apps: [
    {
      name: 'hst-portal-api',
      script: 'dist/src/interfaces/http/server.js',
      cwd: __dirname,
      instances: 1, // Single instance for Windows; use 'max' for Linux/Ubuntu
      exec_mode: 'fork', // Use 'cluster' for Linux/Ubuntu with multiple instances
      watch: false,
      max_memory_restart: '1G',
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      
      // Restart behavior
      max_restarts: 10,
      restart_delay: 5000,
      min_uptime: 10000,
      
      // Graceful shutdown
      kill_timeout: 30000,
      listen_timeout: 10000,
      
      // Health monitoring
      autorestart: true,
      exp_backoff_restart_delay: 100,
    },
  ],
};