# Quick Start - Production Deployment

## 🚀 Fast Setup with PM2

### 1. Install PM2

```bash
npm install -g pm2
```

### 2. Start the Server

```bash
cd backend
pm2 start ecosystem.config.js --env production
```

### 3. Verify It's Running

```bash
# Check status
pm2 status

# View logs
pm2 logs dataguy-backend

# Monitor in real-time
pm2 monit
```

### 4. Set PM2 to Start on Boot

```bash
# Save current PM2 process list
pm2 save

# Generate startup script
pm2 startup

# Follow the instructions it prints
```

## ✅ That's It!

Your server is now:
- ✅ Auto-restarting on crashes
- ✅ Monitoring memory usage
- ✅ Logging all output
- ✅ Running in production mode

## 📊 Common Commands

```bash
# Restart server
pm2 restart dataguy-backend

# Stop server
pm2 stop dataguy-backend

# View logs
pm2 logs dataguy-backend

# Monitor
pm2 monit

# Check health
curl http://localhost:3000/health
```

## 🔧 Configuration

Edit `ecosystem.config.js` to customize:
- Number of instances
- Memory limits
- Log locations
- Environment variables

## 📚 Full Documentation

See `PRODUCTION_RELIABILITY.md` for complete details.
