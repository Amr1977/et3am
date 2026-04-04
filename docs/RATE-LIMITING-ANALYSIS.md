# Rate Limiting Analysis & Recommendations

**Date:** 2026-04-04  
**Status:** Analysis Complete  
**Recommendation:** Increase limits for scalability

## Current Rate Limits

All limits use a **60-second sliding window**.

| Endpoint Group | Current Limit | Per Minute | Use Case |
|---|---|---|---|
| `/api/auth` | 10 req/min | Authentication | Login, Register, Password Reset |
| `/api/donations` | 100 req/min | General API | Browse, Create, Update Donations |
| `/api/users` | 100 req/min | General API | Profile, Location, Settings |
| `/api/maps` | 100 req/min | General API | Tile data, Location search |
| `/api/chat` | 100 req/min | WebSocket API | Messages, Real-time updates |
| `/api/support` | 100 req/min | Support tickets | Contact form, Support requests |
| `/api/reviews` | 100 req/min | General API | Rate, Review donations |
| `/api/admin` | 100 req/min | Admin API | Dashboard, User management |
| `POST /donations` | 20 req/min | Create donations | Special limiter for donation creation |

## Analysis

### 1. Authentication Limits (10 req/min)

**Current:** 10 requests per minute  
**Assessment:** ⚠️ **TOO RESTRICTIVE**

**Why it's low:**
- Only 1-2 auth requests per user per minute reasonable
- But multiple users authenticating simultaneously will hit limit
- Failed login attempts count against limit

**Scenario Analysis:**
- If 5 users try to login simultaneously: 5 requests = OK (under 10)
- If 10 users try to login simultaneously: 10 requests = BLOCKED at request 11
- Password reset request + confirmation token = 2 requests

**Recommendation:** Increase to **20-30 req/min**
- Allows ~3-5 concurrent users authenticating
- Maintains security against brute force (still restrictive)
- More forgiving for legitimate users

### 2. General API Limits (100 req/min)

**Current:** 100 requests per minute  
**Assessment:** ⚠️ **BORDERLINE - May need increase**

**Usage patterns:**
- Donations page: 1 req to load + ~5 pagination requests = ~6 requests
- Meal details page: 1 req to load meal + 1 req to load reservations = ~2 requests
- Chat: 1 initial load + ongoing message sends (~1-2 per message)
- User profile: 1 req to load

**Concurrent user scenario:**
- 10 concurrent users, each making 5 API calls = 50 requests (OK)
- 20 concurrent users, each making 5 API calls = 100 requests (LIMIT HIT)
- 20 concurrent users, each making 6 API calls = 120 requests (BLOCKED)

**Bottleneck endpoints:**
- `/api/maps` - Tile requests can be high if map is constantly panning
- `/api/chat` - If multiple users sending messages rapidly
- `/api/donations` - Search/filter operations generate multiple requests

**Recommendation:** Increase to **200-300 req/min**
- Supports 20-30 concurrent users with normal usage
- Scaling buffer for peak traffic
- Still maintains protection against abuse

### 3. Donation Creation Limiter (20 req/min)

**Current:** 20 requests per minute  
**Assessment:** ✅ **REASONABLE**

**Why it works:**
- Users create donations infrequently
- 20 per minute = ~1 per 3 seconds minimum interval
- Prevents donation spam abuse
- Most users won't hit this limit in normal use

**Recommendation:** Keep at **20 req/min**

## Scaling Considerations

### When Current Limits Are Hit

**Symptoms:**
- HTTP 429 (Too Many Requests) responses
- Frontend error: "Rate limit exceeded"
- Users unable to perform actions even though not abusing

**Current scale (5-50 active users):**
- Auth: 10 req/min is adequate
- API: 100 req/min is adequate

**Projected scale (100-200 active users):**
- Auth: 10 req/min is TOO LOW
- API: 100 req/min is BORDERLINE

**Enterprise scale (500+ active users):**
- Auth: 10 req/min is WAY TOO LOW
- API: 100 req/min is TOO LOW

## Recommended Changes

### Tier 1: Immediate (Ready for 50-100 users)

```typescript
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,  // ↑ from 10
  message: { messageKey: 'auth.too_many_attempts' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,  // ↑ from 100
  message: { messageKey: 'general.rate_limit_exceeded' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const createDonationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,  // Keep same
  message: { messageKey: 'donations.rate_limit_exceeded' },
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Tier 2: Growth Phase (Ready for 100-500 users)

```typescript
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,  // Allow 50 auth attempts per minute
  message: { messageKey: 'auth.too_many_attempts' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,  // ← NEW: Don't count successful logins
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,  // Allow 300 requests per minute
  message: { messageKey: 'general.rate_limit_exceeded' },
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Tier 3: Enterprise (Ready for 500+ users)

- Switch to **Redis-based rate limiting** for distributed counting
- Implement **user-based limits** (per IP + per user ID)
- Add **quota-based limits** (premium users get higher limits)
- Implement **adaptive limits** (increase during off-peak hours)

## Implementation Plan

### Step 1: Update rateLimit.ts (Tier 1)
```bash
# Edit backend/src/middleware/rateLimit.ts
# Change max from 10→30 for authLimiter
# Change max from 100→200 for apiLimiter
# Commit and deploy
```

### Step 2: Monitor
- Watch for 429 errors in logs
- Track rate limit hits per endpoint
- Monitor user complaints about "rate limit exceeded"

### Step 3: Move to Tier 2 (when needed)
- Add `skipSuccessfulRequests: true` to authLimiter
- Increase limits further if needed
- Consider Redis for distributed systems

## Advanced Recommendations

### 1. Skip Successful Requests
Beneficial for auth endpoints to only count failed attempts:
```typescript
skipSuccessfulRequests: true  // Only count failed attempts
```

### 2. Per-User Rate Limiting
Instead of per-IP, rate limit per authenticated user:
```typescript
keyGenerator: (req, res) => {
  return req.user?.id || req.ip;  // User ID if auth'd, else IP
}
```

### 3. Tiered Limits
Implement different limits based on user role:
```typescript
// Premium users get 3x limits
// Admin users get unlimited
// Regular users get base limits
```

### 4. Redis for Distributed Systems
For AWS/GCP clusters, switch to Redis for shared rate limit state:
```typescript
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis.createClient(),
    prefix: 'rate-limit:',
  }),
  windowMs: 60 * 1000,
  max: 200,
});
```

## Current Implementation Details

### How Express Rate Limit Works
- Per-IP based by default
- Tracks requests in memory
- Resets after `windowMs` (60 seconds)
- Doesn't persist across server restarts

### Headers Sent
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1675000000
```

## Testing Rate Limits

```bash
# Test auth limiter (should allow 10 requests, block 11th)
for i in {1..15}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}' \
    | grep -o "rate_limit\|invalid_credentials"
  sleep 0.1
done

# Test general API limiter (should allow 100 requests, block 101st)
for i in {1..105}; do
  curl http://localhost:3001/api/health \
    -H "Authorization: Bearer $TOKEN" \
    -w "\n%{http_code}\n" | tail -1
  sleep 0.01
done
```

## Conclusion

**Current limits are suitable for development/demo** but too restrictive for production with multiple concurrent users.

**Recommendation:** 
1. ✅ Implement Tier 1 changes immediately
2. ⏳ Monitor and plan for Tier 2 when user count reaches 100
3. 📋 Plan Redis implementation for distributed deployment

**Priority:** Medium - Not urgent but should be done before scaling.

## Related Files

- `backend/src/middleware/rateLimit.ts` - Rate limit configuration
- `backend/src/server.ts` - Where limiters are applied
- `backend/src/routes/*` - Individual route implementations

## Next Steps

1. [ ] Review rate limit configuration with team
2. [ ] Implement Tier 1 changes
3. [ ] Deploy and monitor
4. [ ] Update docs based on actual usage data
5. [ ] Plan Tier 2 for next growth phase
