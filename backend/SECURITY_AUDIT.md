# Security Audit Report - Production Readiness

## 🔴 Critical Security Issues (Must Fix Before Production)

### 1. **CORS Configuration - Allows All Origins**
**Location**: `backend/src/app.js:26`
**Issue**: `app.use(cors())` allows requests from any origin
**Risk**: CSRF attacks, unauthorized API access
**Fix**: Configure allowed origins
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
}));
```

### 2. **No Request Size Limits**
**Location**: `backend/src/app.js:27-28`
**Issue**: No limits on JSON/URL-encoded payload sizes
**Risk**: DoS attacks via large payloads
**Fix**: Add size limits
```javascript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

### 3. **Missing Security Headers**
**Issue**: No security headers middleware (Helmet)
**Risk**: XSS, clickjacking, MIME type sniffing attacks
**Fix**: Install and configure Helmet
```bash
npm install helmet
```
```javascript
import helmet from 'helmet';
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

### 4. **No Environment Variable Validation**
**Issue**: Missing env vars only discovered at runtime
**Risk**: Application starts with invalid/missing config
**Fix**: Validate all required env vars on startup
```javascript
// Create: backend/src/config/env.js
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'PAYSTACK_SECRET_KEY',
  'HUBNET_API_KEY',
  'HUBNET_BASE_URL'
];

export const validateEnv = () => {
  const missing = requiredEnvVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
};
```

### 5. **JWT Secret Validation at Runtime**
**Location**: `backend/src/utils/jwt.js:3-8`
**Issue**: JWT secret checked on each request, not at startup
**Risk**: Application runs without valid JWT secret
**Fix**: Validate on startup (see #4)

### 6. **Token Storage in localStorage (Frontend)**
**Location**: `frontend/src/stores/authStore.js`
**Issue**: JWT tokens stored in localStorage (XSS vulnerable)
**Risk**: XSS attacks can steal tokens
**Fix**: Consider httpOnly cookies for production (requires backend changes)
**Alternative**: Ensure XSS protection (CSP headers, input sanitization)

### 7. **No HTTPS Enforcement**
**Issue**: No middleware to enforce HTTPS in production
**Risk**: Man-in-the-middle attacks, token interception
**Fix**: Add HTTPS redirect middleware
```javascript
// Only in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### 8. **Health Check Exposes Environment**
**Location**: `backend/src/app.js:43-49`
**Issue**: Health check returns environment name
**Risk**: Information disclosure
**Fix**: Remove or sanitize environment info in production
```javascript
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && { 
      environment: process.env.NODE_ENV 
    }),
  });
});
```

## 🟡 High Priority Security Issues

### 9. **No Input Sanitization Middleware**
**Issue**: No sanitization of user inputs
**Risk**: XSS, injection attacks
**Fix**: Install and use express-validator or DOMPurify
```bash
npm install express-validator
```

### 10. **Weak Password Requirements**
**Location**: `backend/src/utils/password.js:41-64`
**Issue**: No special character requirement, only 8 chars minimum
**Risk**: Weak passwords vulnerable to brute force
**Fix**: Strengthen requirements
```javascript
if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
  errors.push("Password must contain at least one special character");
}
if (password.length < 12) { // Increase minimum
  errors.push("Password must be at least 12 characters long");
}
```

### 11. **No CSRF Protection**
**Issue**: No CSRF tokens for state-changing operations
**Risk**: CSRF attacks on authenticated endpoints
**Fix**: Install csrf middleware
```bash
npm install csurf
```
**Note**: May not be needed if using SameSite cookies and proper CORS

### 12. **Error Messages May Leak Information**
**Location**: `backend/src/middlewares/errorHandler.js`
**Issue**: Stack traces in development, but error messages might still leak info
**Risk**: Information disclosure
**Fix**: Sanitize error messages in production
```javascript
const sanitizedMessage = process.env.NODE_ENV === 'production' 
  ? 'An error occurred' 
  : message;
```

### 13. **No Audit Logging for Sensitive Operations**
**Issue**: No logging for admin actions, withdrawals, etc.
**Risk**: No audit trail for security incidents
**Fix**: Add comprehensive audit logging
```javascript
// Log all sensitive operations
logger.audit({
  action: 'withdrawal_approved',
  userId: adminId,
  targetUserId: withdrawal.userId,
  amount: withdrawal.amount,
  timestamp: new Date(),
  ip: req.ip
});
```

### 14. **Webhook Signature Verification**
**Location**: `backend/src/controllers/paymentController.js:24`
**Status**: ✅ Implemented for Paystack
**Note**: Ensure Hubnet webhooks also verify signatures if available

### 15. **No Request ID/Tracing**
**Issue**: No request IDs for tracing requests across logs
**Risk**: Difficult to debug security incidents
**Fix**: Add request ID middleware
```javascript
import { randomUUID } from 'crypto';
app.use((req, res, next) => {
  req.id = randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});
```

## 🟢 Medium Priority Security Issues

### 16. **JWT Token Expiry**
**Location**: `backend/src/utils/jwt.js:11`
**Issue**: 7 days expiry might be too long
**Risk**: Stolen tokens remain valid for long period
**Fix**: Reduce to 24 hours, implement refresh tokens
```javascript
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
```

### 17. **No Rate Limiting on Webhooks**
**Location**: `backend/src/routes/paymentRoutes.js`
**Issue**: Webhooks have rate limiting but should be IP-whitelisted
**Risk**: Webhook endpoint abuse
**Fix**: Whitelist Paystack/Hubnet IPs (if available)

### 18. **Database Connection Pool Configuration**
**Location**: `backend/src/config/database.js:18-20`
**Issue**: No explicit pool size limits
**Risk**: Connection exhaustion
**Fix**: Configure pool limits
```javascript
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 19. **No SQL Injection Protection Review**
**Status**: ✅ Using Prisma ORM (parameterized queries)
**Note**: Continue using Prisma, avoid raw SQL

### 20. **Password Reset Functionality Missing**
**Issue**: No password reset endpoint
**Risk**: Users locked out, security risk if implemented poorly
**Fix**: Implement secure password reset with tokens

## 📋 Security Checklist for Production

### Before Deployment

- [ ] **Configure CORS** - Restrict to specific origins
- [ ] **Add Request Size Limits** - Prevent DoS
- [ ] **Install Helmet** - Security headers
- [ ] **Validate Environment Variables** - Fail fast on missing vars
- [ ] **Enforce HTTPS** - Redirect HTTP to HTTPS
- [ ] **Sanitize Health Check** - Remove sensitive info
- [ ] **Add Input Sanitization** - Prevent XSS/injection
- [ ] **Strengthen Password Requirements** - 12+ chars, special chars
- [ ] **Reduce JWT Expiry** - 24h instead of 7d
- [ ] **Add Audit Logging** - Track sensitive operations
- [ ] **Configure Database Pool** - Set connection limits
- [ ] **Review Error Messages** - Sanitize in production
- [ ] **Add Request ID Middleware** - For tracing
- [ ] **Webhook IP Whitelisting** - If possible
- [ ] **Security Headers** - CSP, HSTS, etc.

### Environment Variables to Secure

- [ ] `JWT_SECRET` - Must be 32+ characters, random
- [ ] `DATABASE_URL` - Never commit to git
- [ ] `PAYSTACK_SECRET_KEY` - Use live keys in production
- [ ] `HUBNET_API_KEY` - Keep secret
- [ ] `NODE_ENV=production` - Set in production

### Frontend Security

- [ ] **Content Security Policy** - Configure CSP headers
- [ ] **XSS Protection** - Sanitize all user inputs
- [ ] **Token Storage** - Consider httpOnly cookies
- [ ] **HTTPS Only** - Enforce in production
- [ ] **Environment Variables** - Don't expose secrets

### Monitoring & Incident Response

- [ ] **Set up Logging** - Centralized logging (e.g., Winston, Pino)
- [ ] **Error Tracking** - Sentry or similar
- [ ] **Rate Limit Monitoring** - Alert on excessive 429s
- [ ] **Failed Login Tracking** - Alert on brute force attempts
- [ ] **Audit Trail** - Log all admin actions

## 🔐 Security Best Practices Already Implemented

✅ **Password Hashing** - Using bcrypt with salt rounds
✅ **JWT Authentication** - Token-based auth
✅ **Role-Based Access Control** - Proper authorization
✅ **Rate Limiting** - Comprehensive rate limiting
✅ **Webhook Signature Verification** - Paystack webhooks verified
✅ **Prisma ORM** - SQL injection protection
✅ **Transaction Safety** - Proper transaction handling
✅ **Error Handling** - Centralized error handling
✅ **Input Validation** - Basic validation in place

## 🚀 Recommended Security Enhancements

### Immediate (Before Production)

1. **Install Helmet**
   ```bash
   npm install helmet
   ```

2. **Configure CORS properly**
   ```javascript
   const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
   app.use(cors({
     origin: (origin, callback) => {
       if (!origin || allowedOrigins.includes(origin)) {
         callback(null, true);
       } else {
         callback(new Error('Not allowed by CORS'));
       }
     },
     credentials: true
   }));
   ```

3. **Add Request Size Limits**
   ```javascript
   app.use(express.json({ limit: '10mb' }));
   app.use(express.urlencoded({ extended: true, limit: '10mb' }));
   ```

4. **Environment Variable Validation**
   - Create validation script
   - Run on startup
   - Fail fast if missing

5. **HTTPS Enforcement**
   - Add redirect middleware
   - Configure reverse proxy (nginx/Apache)

### Short-term (Within 1-2 Weeks)

1. **Input Sanitization**
   - Install express-validator
   - Add sanitization middleware
   - Validate all inputs

2. **Audit Logging**
   - Log all sensitive operations
   - Store in separate audit table
   - Include IP, user, action, timestamp

3. **Password Reset**
   - Secure token-based reset
   - Rate limit reset requests
   - Email verification

4. **Refresh Tokens**
   - Implement refresh token rotation
   - Shorter access token expiry
   - Secure token storage

### Long-term (Within 1 Month)

1. **Security Monitoring**
   - Set up error tracking (Sentry)
   - Monitor failed login attempts
   - Alert on suspicious activity

2. **Penetration Testing**
   - Professional security audit
   - Vulnerability scanning
   - Code review

3. **Backup & Recovery**
   - Automated database backups
   - Disaster recovery plan
   - Regular restore testing

4. **Compliance**
   - GDPR compliance (if applicable)
   - Data retention policies
   - Privacy policy

## 📝 Environment Variables Checklist

Create `.env.example` with all required variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dataguy

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=24h

# Paystack
PAYSTACK_SECRET_KEY=sk_live_xxx
PAYSTACK_PUBLIC_KEY=pk_live_xxx

# Hubnet
HUBNET_API_KEY=your-hubnet-api-key
HUBNET_BASE_URL=https://hubnetapi.com/api
HUBNET_WEBHOOK_URL=https://yourdomain.com/api/hubnet/webhook

# Frontend
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Server
NODE_ENV=production
PORT=3000
TRUST_PROXY=true
```

## 🎯 Priority Order for Fixes

1. **Critical** (Do First):
   - CORS configuration
   - Request size limits
   - Helmet security headers
   - Environment variable validation
   - HTTPS enforcement

2. **High Priority** (Do Next):
   - Input sanitization
   - Password strength
   - Error message sanitization
   - Audit logging

3. **Medium Priority** (Do Soon):
   - JWT expiry reduction
   - Request ID middleware
   - Database pool configuration
   - Health check sanitization

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
