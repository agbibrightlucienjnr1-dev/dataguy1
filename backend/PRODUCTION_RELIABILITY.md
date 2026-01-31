# Production Reliability Guide

## Overview

This document outlines the reliability features implemented to ensure the backend never crashes and recovers gracefully from errors.

## ✅ Implemented Features

### 1. **Global Error Handlers**

- **Uncaught Exception Handler**: Catches synchronous errors that would crash the process
- **Unhandled Rejection Handler**: Catches unhandled promise rejections
- **Warning Handler**: Logs Node.js warnings for monitoring

**Location**: `backend/src/server.js`

### 2. **Database Connection Resilience**

- **Automatic Reconnection**: Retries database connection up to 5 times
- **Connection Pool Error Handling**: Handles pool errors gracefully
- **Health Check**: Database health monitoring endpoint
- **Connection Pool Limits**: Prevents connection exhaustion

**Location**: `backend/src/config/database.js`

### 3. **Graceful Shutdown**

- **Signal Handlers**: Handles SIGTERM and SIGINT for clean shutdown
- **Request Draining**: Stops accepting new requests before shutdown
- **Database Cleanup**: Closes database connections gracefully
- **Timeout Protection**: Forces shutdown after 10 seconds if needed

**Location**: `backend/src/server.js`

### 4. **Request Timeout Protection**

- **30-second timeout**: Prevents hanging requests
- **Automatic cleanup**: Closes timed-out connections

**Location**: `backend/src/app.js`

### 5. **Error Handling Middleware**

- **Global error handler**: Catches all route errors
- **Async handler wrapper**: Prevents unhandled promise rejections
- **Error sanitization**: Hides internal errors in production

**Location**: `backend/src/middlewares/errorHandler.js`

### 6. **Health Check Endpoint**

- **Database health check**: Verifies database connectivity
- **Status monitoring**: Returns 503 if unhealthy
- **Production-ready**: Minimal information exposure

**Location**: `backend/src/app.js` (GET `/health`)

### 7. **PM2 Process Manager Configuration**

- **Auto-restart**: Automatically restarts on crash
- **Memory limits**: Restarts if memory exceeds 500MB
- **Multiple instances**: Supports cluster mode
- **Logging**: Centralized log management

**Location**: `backend/ecosystem.config.js`

## 🚀 Deployment Options

### Option 1: PM2 (Recommended for Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# View logs
pm2 logs

# Restart
pm2 restart dataguy-backend

# Stop
pm2 stop dataguy-backend
```

### Option 2: Systemd (Linux)

Create `/etc/systemd/system/dataguy-backend.service`:

```ini
[Unit]
Description=DataGuy Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/dataguy/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=dataguy-backend

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable dataguy-backend
sudo systemctl start dataguy-backend
sudo systemctl status dataguy-backend
```

### Option 3: Docker with Restart Policy

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["node", "src/server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## 📊 Monitoring & Alerts

### Health Check Monitoring

Set up monitoring to check `/health` endpoint:

```bash
# Simple health check script
curl -f http://localhost:3000/health || echo "Health check failed"
```

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Process list
pm2 list

# Process info
pm2 info dataguy-backend
```

### Log Monitoring

```bash
# PM2 logs
pm2 logs dataguy-backend

# System logs (if using systemd)
journalctl -u dataguy-backend -f
```

## 🔧 Configuration

### Environment Variables

```env
# Process Management
PM2_INSTANCES=1  # Number of PM2 instances (or "max" for cluster)

# Database Connection
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_CONNECTION_TIMEOUT=2000

# Server
PORT=3000
NODE_ENV=production
```

## 🛡️ Best Practices

### 1. **Always Use Process Manager**

Never run Node.js directly in production. Always use:
- PM2 (recommended)
- systemd
- Docker with restart policy
- Kubernetes with health checks

### 2. **Monitor Health Endpoint**

Set up external monitoring (e.g., UptimeRobot, Pingdom) to check `/health`:
- Interval: Every 1-5 minutes
- Alert on: Non-200 status codes
- Alert on: Response time > 5 seconds

### 3. **Set Up Logging**

- Use centralized logging (e.g., Winston, Pino)
- Send logs to external service (e.g., Loggly, Papertrail)
- Set up log rotation
- Monitor error rates

### 4. **Database Monitoring**

- Monitor database connection pool usage
- Set up alerts for connection failures
- Monitor query performance
- Set up database backups

### 5. **Resource Limits**

- Set memory limits (PM2: `max_memory_restart`)
- Monitor CPU usage
- Set up alerts for resource exhaustion

## 🚨 Troubleshooting

### Server Keeps Crashing

1. **Check logs**: `pm2 logs` or `journalctl -u dataguy-backend`
2. **Check memory**: `pm2 monit` or `top`
3. **Check database**: Verify database is accessible
4. **Check environment variables**: Ensure all required vars are set

### Database Connection Issues

1. **Check database status**: `systemctl status postgresql`
2. **Check connection string**: Verify `DATABASE_URL` is correct
3. **Check network**: Ensure database is accessible from server
4. **Check pool limits**: Adjust `DB_POOL_MAX` if needed

### High Memory Usage

1. **Check for memory leaks**: Use `node --inspect` and Chrome DevTools
2. **Reduce pool size**: Lower `DB_POOL_MAX`
3. **Enable PM2 memory limit**: Already set to 500MB
4. **Check for large queries**: Review database queries

### Slow Response Times

1. **Check database queries**: Use Prisma query logging
2. **Check external APIs**: Monitor Paystack/Hubnet response times
3. **Check rate limiting**: Verify rate limits aren't too strict
4. **Check server resources**: Monitor CPU and memory

## 📈 Performance Tuning

### PM2 Cluster Mode

For better performance, use cluster mode:

```javascript
// ecosystem.config.js
instances: "max", // Use all CPU cores
exec_mode: "cluster", // Cluster mode
```

### Database Connection Pool

Adjust based on load:

```env
DB_POOL_MAX=50  # Increase for high traffic
DB_POOL_IDLE_TIMEOUT=60000  # Keep connections longer
```

### Request Timeout

Adjust based on slowest endpoint:

```javascript
// backend/src/app.js
req.setTimeout(60000, ...) // 60 seconds for slow operations
```

## ✅ Checklist

Before deploying to production:

- [ ] PM2 or process manager configured
- [ ] Health check endpoint working
- [ ] Database connection retry logic tested
- [ ] Graceful shutdown tested
- [ ] Error handlers in place
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Alerts configured
- [ ] Resource limits set
- [ ] Backup strategy in place

## 🔗 Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express Production Best Practices](https://expressjs.com/en/advanced/best-practice-production.html)
