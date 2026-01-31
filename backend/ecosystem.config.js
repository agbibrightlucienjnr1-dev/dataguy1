/**
 * PM2 Ecosystem Configuration
 * Process manager for production deployment
 * 
 * Install PM2: npm install -g pm2
 * Start: pm2 start ecosystem.config.js
 * Stop: pm2 stop ecosystem.config.js
 * Restart: pm2 restart ecosystem.config.js
 * Monitor: pm2 monit
 * Logs: pm2 logs
 */

module.exports = {
  apps: [
    {
      name: "dataguy-backend",
      script: "src/server.js",
      instances: process.env.PM2_INSTANCES || 1, // Use 1 for single instance, or "max" for cluster mode
      exec_mode: "fork", // Use "cluster" for multiple instances
      watch: false, // Disable in production
      max_memory_restart: "500M", // Restart if memory exceeds 500MB
      min_uptime: "10s", // Minimum uptime before considering app stable
      max_restarts: 10, // Maximum restarts in 1 minute
      restart_delay: 4000, // Delay between restarts (ms)
      kill_timeout: 5000, // Time to wait for graceful shutdown (ms)
      listen_timeout: 10000, // Time to wait for app to listen (ms)
      
      // Environment variables
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
      
      // Logging
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      
      // Auto-restart on file changes (development only)
      ignore_watch: ["node_modules", "logs", ".git"],
      
      // Advanced settings
      autorestart: true, // Auto-restart on crash
      cron_restart: "0 4 * * *", // Restart daily at 4 AM (optional)
      exp_backoff_restart_delay: 100, // Exponential backoff for restarts
    },
  ],
};
