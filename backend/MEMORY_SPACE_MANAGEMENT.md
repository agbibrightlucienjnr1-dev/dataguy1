# Memory and Space Management Guide

This document outlines the memory and database space management features implemented in the DataGuy backend.

## 📊 Features

### 1. **Pagination Limits**
- **Maximum limit**: 100 items per page (standard endpoints)
- **Admin limit**: 200 items per page
- **Default limit**: 20 items (standard), 50 items (admin)
- Prevents excessive data retrieval that could cause memory issues

**Location**: `backend/src/middlewares/paginationLimiter.js`

### 2. **Database Cleanup Service**
Automated cleanup of old data to free up database space:

- **Old Orders**: Archive/delete orders older than 90 days (configurable)
- **Old Transactions**: Clean up wallet transactions older than 180 days
- **Database Optimization**: Run PostgreSQL VACUUM to reclaim space

**Location**: `backend/src/services/cleanupService.js`

### 3. **Memory Monitoring**
Real-time memory usage tracking:

- Process memory (RSS, heap)
- System memory usage
- Memory warnings when usage exceeds thresholds
- Force garbage collection (if enabled)

**Location**: `backend/src/utils/memoryMonitor.js`

### 4. **Log Rotation**
PM2 log rotation configuration:

- Maximum log file size: 10MB
- Retain last 10 log files
- Automatic compression of old logs

**Location**: `backend/ecosystem.config.js`

### 5. **Database Size Monitoring**
Admin endpoints to monitor database size:

- Database total size
- Table sizes
- Row counts per table

**Endpoints**:
- `GET /api/admin/database/stats` - Database size statistics
- `GET /api/admin/memory/stats` - Memory usage statistics
- `POST /api/admin/database/cleanup` - Run manual cleanup
- `POST /api/admin/database/optimize` - Optimize database

## 🚀 Usage

### Manual Cleanup

Run cleanup via API:

```bash
# Get database stats
curl -X GET http://localhost:3000/api/admin/database/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Run cleanup
curl -X POST http://localhost:3000/api/admin/database/cleanup \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "archiveOrdersDays": 90,
    "cleanupTransactionsDays": 180,
    "hardDeleteOrders": false,
    "optimize": true
  }'
```

### Scheduled Cleanup (Cron Job)

Set up a cron job to run cleanup automatically:

```bash
# Edit crontab
crontab -e

# Add this line to run cleanup daily at 2 AM
0 2 * * * cd /path/to/backend && node src/scripts/cleanupCron.js >> logs/cleanup.log 2>&1
```

Or use PM2 cron restart (already configured):

```javascript
// ecosystem.config.js
cron_restart: "0 4 * * *", // Restart daily at 4 AM
```

### Environment Variables

Configure cleanup behavior:

```env
# Cleanup configuration
CLEANUP_ORDERS_DAYS=90              # Archive orders older than 90 days
CLEANUP_TRANSACTIONS_DAYS=180       # Clean up transactions older than 180 days
CLEANUP_HARD_DELETE=false           # Set to true to permanently delete (not recommended)
CLEANUP_OPTIMIZE=true               # Run VACUUM after cleanup

# Database connection pool
DB_POOL_MAX=20                      # Maximum pool size
DB_POOL_IDLE_TIMEOUT=30000         # Idle timeout (30 seconds)
DB_POOL_CONNECTION_TIMEOUT=2000     # Connection timeout (2 seconds)

# Memory limits
PM2_MAX_MEMORY=500M                 # PM2 memory limit (restart if exceeded)
```

## 📈 Monitoring

### Health Check with Memory

```bash
# Basic health check
curl http://localhost:3000/health

# Health check with memory info (development only)
curl http://localhost:3000/health?memory=true
```

### Memory Usage

```bash
# Get memory stats
curl -X GET http://localhost:3000/api/admin/memory/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Database Size

```bash
# Get database size
curl -X GET http://localhost:3000/api/admin/database/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔧 Best Practices

### 1. **Regular Cleanup**
- Run cleanup weekly or monthly depending on data volume
- Monitor database size and adjust cleanup frequency
- Keep at least 90 days of order history for reporting

### 2. **Memory Management**
- Monitor memory usage regularly
- Set appropriate PM2 memory limits
- Use pagination for all list endpoints
- Avoid loading large datasets into memory

### 3. **Database Optimization**
- Run VACUUM ANALYZE weekly
- Monitor table sizes and growth
- Add indexes for frequently queried fields
- Archive old data instead of deleting (if possible)

### 4. **Log Management**
- Enable log rotation (already configured)
- Monitor log file sizes
- Archive old logs to external storage
- Set up log aggregation (e.g., ELK stack)

### 5. **Query Optimization**
- Use pagination for all list queries
- Limit result sets with `take` and `skip`
- Use indexes for filtering and sorting
- Avoid N+1 queries (use `include` or `select`)

## ⚠️ Warnings

1. **Hard Delete**: Only use `hardDeleteOrders: true` if you're certain you don't need the data. Consider archiving instead.

2. **Cleanup Frequency**: Don't run cleanup too frequently (e.g., every hour) as it can impact performance. Daily or weekly is recommended.

3. **Backup Before Cleanup**: Always backup your database before running cleanup, especially with hard delete enabled.

4. **Transaction Cleanup**: The cleanup service preserves:
   - All withdrawals (financial records)
   - Transactions with associated orders (audit trail)
   - Recent transactions (within cutoff period)

## 📊 Monitoring Dashboard

Consider adding these metrics to your monitoring dashboard:

- Database size over time
- Memory usage trends
- Cleanup job execution status
- Number of records cleaned per run
- Space reclaimed per cleanup

## 🔗 Related Files

- `backend/src/services/cleanupService.js` - Cleanup service implementation
- `backend/src/utils/memoryMonitor.js` - Memory monitoring utilities
- `backend/src/middlewares/paginationLimiter.js` - Pagination limits
- `backend/src/scripts/cleanupCron.js` - Scheduled cleanup script
- `backend/ecosystem.config.js` - PM2 configuration with log rotation
