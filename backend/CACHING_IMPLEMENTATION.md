# Caching Implementation Guide

This document outlines the caching strategy implemented in the DataGuy backend to reduce database load and improve performance.

## 📦 Features

### 1. **In-Memory Cache**
- Simple, fast in-memory cache using Map
- TTL (Time To Live) support for automatic expiration
- Automatic cleanup of expired entries
- Memory usage estimation
- Can be upgraded to Redis for distributed caching

**Location**: `backend/src/utils/cache.js`

### 2. **Cache Middleware**
- Express middleware for automatic response caching
- Customizable TTL per route
- Cache key generation
- Conditional caching based on request/response

**Location**: `backend/src/middlewares/cacheMiddleware.js`

### 3. **Cached Endpoints**

#### Data Bundles
- **GET /api/bundles** - Cached for 10 minutes
- **GET /api/bundles/active** - Cached for 10 minutes
- **GET /api/bundles/:id** - Cached for 10 minutes
- **Cache invalidation**: On create, update, delete, or toggle status

#### Admin Statistics
- **GET /api/admin/statistics** - Cached for 2 minutes
- **GET /api/admin/database/stats** - Cached for 2 minutes
- **GET /api/admin/memory/stats** - Cached for 30 seconds
- **Cache invalidation**: After cleanup or optimization

### 4. **Cache Management Endpoints**
- **GET /api/admin/cache/stats** - Get cache statistics
- **POST /api/admin/cache/clear** - Clear all cache

## 🚀 Usage

### Automatic Caching

Most GET endpoints are automatically cached with appropriate TTLs:

```javascript
// In controller
const cache = (await import("../utils/cache.js")).default;
const cacheKey = `bundles:${id}`;
const cached = cache.get(cacheKey);

if (cached) {
  res.setHeader("X-Cache", "HIT");
  return res.status(200).json(cached);
}

// ... fetch data ...

cache.set(cacheKey, response, 10 * 60 * 1000); // 10 minutes
res.setHeader("X-Cache", "MISS");
res.status(200).json(response);
```

### Cache Invalidation

Invalidate cache when data changes:

```javascript
// After updating a bundle
const cacheStore = cache.store;
cacheStore.forEach((_, key) => {
  if (key.startsWith("bundles:")) {
    cache.delete(key);
  }
});
```

### Cache Headers

Responses include `X-Cache` header:
- `X-Cache: HIT` - Response served from cache
- `X-Cache: MISS` - Response fetched from database

## 📊 Cache Statistics

Get cache statistics via API:

```bash
curl -X GET http://localhost:3000/api/admin/cache/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "success": true,
  "total": 15,
  "active": 12,
  "expired": 3,
  "memoryUsage": "2.45 MB"
}
```

## 🔧 Configuration

### TTL (Time To Live) Settings

| Endpoint | TTL | Reason |
|----------|-----|--------|
| Data Bundles | 10 minutes | Rarely change |
| Statistics | 2 minutes | Change frequently |
| Database Stats | 2 minutes | Expensive query |
| Memory Stats | 30 seconds | Changes very frequently |

### Memory Limits

The cache uses in-memory storage. Monitor memory usage:
- Automatic cleanup every 5 minutes
- Expired entries are removed automatically
- Memory usage is estimated and reported

## ⚠️ Important Notes

1. **In-Memory Cache**: Current implementation uses in-memory cache. For distributed systems, consider Redis.

2. **Cache Invalidation**: Always invalidate relevant caches when data changes to prevent stale data.

3. **Memory Usage**: Monitor cache memory usage, especially with high traffic.

4. **TTL Selection**: Choose TTL based on data change frequency:
   - Static data (bundles): 10+ minutes
   - Semi-static data (statistics): 2-5 minutes
   - Dynamic data (memory): 30 seconds - 1 minute

## 🔄 Upgrading to Redis

For production with multiple servers, upgrade to Redis:

1. Install Redis and `ioredis` package
2. Replace `backend/src/utils/cache.js` with Redis implementation
3. Update cache middleware to use Redis client
4. Configure Redis connection in environment variables

Example Redis implementation:
```javascript
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export default {
  async set(key, value, ttl) {
    await redis.setex(key, Math.floor(ttl / 1000), JSON.stringify(value));
  },
  async get(key) {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },
  // ... other methods
};
```

## 📈 Performance Benefits

- **Reduced Database Load**: Frequently accessed data served from cache
- **Faster Response Times**: Cache hits are much faster than database queries
- **Better Scalability**: Less database pressure allows more concurrent users
- **Cost Savings**: Fewer database queries reduce costs

## 🔗 Related Files

- `backend/src/utils/cache.js` - Cache implementation
- `backend/src/middlewares/cacheMiddleware.js` - Cache middleware
- `backend/src/controllers/dataBundleController.js` - Cached bundle endpoints
- `backend/src/controllers/adminController.js` - Cached admin endpoints
