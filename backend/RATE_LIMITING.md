# Rate Limiting Implementation

## ✅ Implementation Complete

Rate limiting has been successfully implemented across all API endpoints to prevent abuse, brute force attacks, and DoS attacks.

## 📦 Package Installed

- **express-rate-limit**: `^7.x.x` - Industry-standard rate limiting middleware for Express

## 🎯 Rate Limiting Strategy

The implementation uses a **layered approach** with different limits for different endpoint types:

### 1. Global Rate Limiter (Base Layer)
- **Limit**: 1000 requests per 15 minutes per IP
- **Applied to**: All `/api/*` routes
- **Purpose**: Catches extreme abuse and DoS attempts
- **Location**: `app.js` - applied globally to all API routes

### 2. Authentication Endpoints (Strict)
- **Limit**: 5 requests per 15 minutes per IP
- **Applied to**: 
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- **Purpose**: Prevents brute force attacks on authentication
- **Rationale**: Legitimate users won't need more than 5 login attempts in 15 minutes

### 3. API Endpoints (Moderate)
- **Limit**: 100 requests per 15 minutes per IP
- **Applied to**: 
  - Protected endpoints (wallet, bundles, pricing, etc.)
  - General API operations
- **Purpose**: Prevents API abuse while allowing normal usage

### 4. Public Endpoints (Lenient)
- **Limit**: 200 requests per 15 minutes per IP
- **Applied to**: 
  - Order tracking
  - Payment link pages
  - Public bundle listings
- **Purpose**: Allows higher traffic for public-facing pages

### 5. Payment Endpoints (Moderate-Strict)
- **Limit**: 50 requests per 15 minutes per IP
- **Applied to**: 
  - Payment webhooks
  - Payment verification
  - Payment callbacks
- **Purpose**: Prevents payment endpoint abuse

### 6. Admin Endpoints (Strict)
- **Limit**: 30 requests per 15 minutes per IP
- **Applied to**: All `/api/admin/*` routes
- **Purpose**: Protects sensitive admin operations

### 7. Order Creation (Moderate-Strict)
- **Limit**: 20 orders per 15 minutes per IP
- **Applied to**: 
  - `POST /api/orders/link/:code/purchase`
  - `POST /api/orders/purchase`
- **Purpose**: Prevents order spam and abuse

### 8. Withdrawal Requests (Very Strict)
- **Limit**: 5 withdrawal requests per hour per IP
- **Applied to**: `POST /api/withdrawals`
- **Purpose**: Prevents withdrawal abuse and fraud

## 📁 Files Modified

### New Files
- `backend/src/middlewares/rateLimiter.js` - Rate limiting middleware configurations

### Updated Files
- `backend/src/app.js` - Added global rate limiter
- `backend/src/routes/authRoutes.js` - Added auth rate limiter
- `backend/src/routes/orderRoutes.js` - Added public and order creation rate limiters
- `backend/src/routes/paymentRoutes.js` - Added payment rate limiter
- `backend/src/routes/adminRoutes.js` - Added admin rate limiter
- `backend/src/routes/withdrawalRoutes.js` - Added withdrawal and admin rate limiters
- `backend/src/routes/dataBundleRoutes.js` - Added public, API, and admin rate limiters
- `backend/src/routes/walletRoutes.js` - Added API rate limiter
- `backend/src/routes/hubnetRoutes.js` - Added payment and API rate limiters
- `backend/src/routes/agentPriceRoutes.js` - Added API rate limiter
- `backend/src/routes/subAgentPriceRoutes.js` - Added API rate limiter

## 🔧 Configuration Details

### IP Detection
The rate limiter uses the following priority for IP detection:
1. `req.ip` (Express trusted proxy)
2. `req.headers['x-forwarded-for']` (first IP if behind proxy)
3. `req.connection.remoteAddress` (fallback)
4. `"unknown"` (if all fail)

### Response Format
When rate limit is exceeded, the API returns:
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later.",
  "error": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 900
}
```

**HTTP Status**: `429 Too Many Requests`

### Headers
Rate limit information is included in response headers:
- `RateLimit-Limit`: Maximum number of requests allowed
- `RateLimit-Remaining`: Number of requests remaining
- `RateLimit-Reset`: Time when the rate limit resets (Unix timestamp)

## 🚫 Excluded Endpoints

The following endpoints are **NOT** rate limited:
- `GET /health` - Health check endpoint (for monitoring)

## 🔒 Security Benefits

1. **Brute Force Protection**: Strict limits on authentication endpoints
2. **DoS Prevention**: Global rate limiter catches extreme abuse
3. **API Abuse Prevention**: Moderate limits prevent scraping and abuse
4. **Financial Protection**: Strict limits on withdrawal and payment endpoints
5. **Resource Protection**: Prevents server overload from excessive requests

## ⚙️ Customization

Rate limits can be customized by modifying `backend/src/middlewares/rateLimiter.js`:

```javascript
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // Time window (15 minutes)
  max: 5, // Maximum requests per window
  message: "Custom error message",
});
```

## 📊 Monitoring

Rate limit violations are logged automatically by express-rate-limit. Monitor:
- 429 status code responses
- Rate limit headers in responses
- Server logs for rate limit events

## 🧪 Testing

To test rate limiting:

1. **Test Authentication Limits**:
   ```bash
   # Make 6 requests quickly (5th should succeed, 6th should fail)
   for i in {1..6}; do curl -X POST http://localhost:3000/api/auth/login -d '{"phone":"test","password":"test"}'; done
   ```

2. **Test Global Limits**:
   ```bash
   # Make 1001 requests to any /api endpoint
   # 1000th should succeed, 1001st should fail with 429
   ```

3. **Verify Headers**:
   ```bash
   curl -I http://localhost:3000/api/bundles
   # Check for RateLimit-* headers in response
   ```

## 🔄 Production Considerations

1. **Redis Store** (Optional): For distributed rate limiting across multiple servers
   ```javascript
   import RedisStore from "rate-limit-redis";
   // Use RedisStore in createRateLimiter options
   ```

2. **Proxy Configuration**: Ensure Express trust proxy is configured if behind a reverse proxy:
   ```javascript
   app.set('trust proxy', 1); // Trust first proxy
   ```

3. **Environment-Based Limits**: Consider different limits for development vs production:
   ```javascript
   const max = process.env.NODE_ENV === 'production' ? 5 : 50;
   ```

## 📝 Notes

- Rate limits are **per IP address**
- Limits reset after the time window expires
- Multiple rate limiters can be applied to the same route (most restrictive wins)
- Health check endpoint is intentionally excluded for monitoring purposes

## 🎯 Summary

Rate limiting is now fully implemented with:
- ✅ 8 different rate limit configurations
- ✅ Applied to all API endpoints
- ✅ Proper error responses
- ✅ Security headers
- ✅ IP detection for proxy environments
- ✅ Excluded health check endpoint

The system is now protected against:
- ✅ Brute force attacks
- ✅ API abuse
- ✅ DoS attempts
- ✅ Payment endpoint abuse
- ✅ Withdrawal fraud
