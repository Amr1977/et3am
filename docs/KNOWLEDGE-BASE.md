# Project Knowledge Base

## Adding Automated i18n Validation

Create a validation script that runs before deploy:

```bash
# scripts/validate-i18n.sh
# Compares all translation keys between en.json and ar.json
# Fails if any key is missing in either language

npm run validate:i18n      # Run validation manually
npm run predeploy          # Runs automatically before deploy
```

This catches missing translations early and prevents broken UIs.

## Task Management

- **Always visible task stack**: Maintain todo list that is always visible during work
- **Never leave task incomplete**: Every task must be either done or explicitly cancelled
- **Use todo tool**: Track progress with `todowrite` for all ongoing work
- **Priority levels**: high, medium, low
- **Status values**: pending, in_progress, completed, cancelled

## AI Agent Roles & Capabilities

This project is maintained by an AI agent with multiple expert roles:

- **World Top Class Senior Cyber Security Engineer** - Security audits, vulnerability assessment, penetration testing, secure code review, threat modeling
- **World Top Class Senior Software Architect** - System design, architecture patterns, scalability planning, technology selection
- **World Top Class Senior Software Engineer** - Full-stack development, code quality, performance optimization, debugging
- **World Top Class Full Stack Developer** - Frontend (React, Vite, TypeScript), backend (Node.js, Express), database (PostgreSQL)
- **World Top Class Senior Project Manager** - Sprint planning, task estimation, risk management, delivery coordination
- **World Top Class Marketing Engineer** - SEO, growth hacking, user acquisition strategies, analytics
- **World Top Class Senior UI/UX Designer** - User research, design systems, accessibility, responsive design
- **World Top Class Senior Quality Assurance Engineer** - Test strategy, quality metrics, bug tracking, test coverage analysis
- **World Top Class Senior Test Automation Engineer** - E2E automation (Playwright), test frameworks, CI/CD integration, regression testing

### Testing Organization

```
tests/
├── e2e/
│   ├── scenarios/          # Happy path user flows
│   │   ├── fixtures.ts
│   │   ├── donation-flow.spec.ts
│   │   └── user-flow.spec.ts
│   ├── bugs/              # Regression tests for fixed bugs
│   │   └── geolocation-bugs.spec.ts
│   └── README.md
├── api/                   # Backend API tests (future)
└── integration/          # Integration tests (future)
```

**Test Commands:**
- `npm run test:e2e` - Run all E2E tests
- `npm run test:e2e:ui` - Open Playwright UI
- `npm run test:e2e:scenarios` - Run user flows only
- `npm run test:e2e:bugs` - Run bug regression only

---

## Projects Overview

### 1. **Et3am** - Food Donation Platform
**Location**: `D:\et3am`

#### Purpose
A comprehensive food donation platform with multi-language support (English/Arabic) that connects food donors with recipients through a real-time system.

#### Tech Stack
- **Backend**: Node.js + Express (TypeScript)
- **Frontend**: React + Vite (TypeScript)
- **Database**: PostgreSQL
- **Real-time**: Socket.io
- **Authentication**: JWT + Google OAuth20
- **Deployment**: Firebase (frontend), PM2 (backend)
- **Firebase Project**: foodshare777 (switched from et3am26 on 2026-04-05)
- **Testing**: Vitest (backend), Playwright (E2E)

#### Deployment Scripts
```bash
# Deploy frontend (Firebase)
./deploy-frontend.sh

# Deploy backend (AWS + GCP)
./deploy-backend.sh
```
- **deploy-frontend.sh**: Builds React/Vite app and deploys to Firebase (foodshare777)
  - Note: Requires `NODE_OPTIONS="--max-old-space-size=4096"` for build due to large bundle
- **deploy-backend.sh**: Pulls latest code, builds TypeScript, restarts PM2 on both AWS and GCP servers

#### Best Practices & Lessons Learned
- **Record everything**: Any lesson learned, technique, or workaround must be added to KNOWLEDGE-BASE.md
- **Deployment**: Always use `npm install` (not `--omit=dev`) for TypeScript compilation to get type definitions
- **Build memory**: Large frontend builds may need `NODE_OPTIONS="--max-old-space-size=4096"`
- **Firebase migrations**: When switching Firebase projects, update package.json deploy script, AGENTS.md, and all docs

#### Bug: Geolocation Modal Hanging
**Issue**: Location prompt modal blocked user interaction, showing loading spinner indefinitely on timeout (error code 3).

**Root Cause**: Modal waited for geolocation to complete before dismissing, with no timeout on the operation.

**Fix**:
1. Dismiss modal immediately on user action (Enable/Cancel/Overlay click)
2. Process location retrieval async in background after dismissal
3. Add timeout option to prevent hanging: `{ timeout: 10000, maximumAge: 300000 }`
4. Never block UI flow - user experience comes first

**Lessons**:
- Never hang on async operations in modals
- UI should respond immediately to user action
- Handle async side-effects after dismissing blocking UI
- Add timeouts to all browser APIs that can hang

#### Project Structure
```
et3am/
├── backend/
│   ├── src/
│   │   ├── server.ts          # Main Express server
│   │   ├── database.ts        # PostgreSQL connection & operations
│   │   ├── firebase-admin.ts  # Firebase Admin SDK
│   │   ├── middleware/        # Auth, i18n, security, rate limiting
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic (serverRegistry)
│   │   ├── config/            # Socket, logger, constants
│   │   └── locales/           # i18n translation files
│   ├── migrations/            # Database migrations
│   ├── package.json
│   └── vitest.config.ts
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── i18n.ts           # i18next configuration
│   │   ├── firebase.ts        # Firebase client config
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── locales/           # Translation JSON files
│   │   └── types/
│   ├── vite.config.ts
│   ├── playwright.config.ts
│   └── firebase.json
└── et3am-ecosystem.config.js  # PM2 configuration
```

#### Key Features
- **Multi-language i18n**: Full English/Arabic support with localStorage persistence
- **Dual role system**: User can be donor, recipient, or both
- **Real-time updates**: Socket.io for live notifications
- **Firebase integration**: Google OAuth, Firestore messaging
- **Server registry pattern**: Dynamic server discovery via Firebase
- **Rate limiting**: Auth and API-level rate limiters
- **Security**: Helmet, CORS, sanitization, JWT tokens

#### Database Schema (Key Tables)
- **users**: With roles (user, donor, recipient, admin), language preference, reputation
- **donations**: Food items with location, status tracking
- **reviews**: User ratings and feedback
- **chat/messages**: Real-time messaging
- **support_tickets**: Customer support

#### Authentication Flow
```
1. Google OAuth via Passport → Firebase Admin verification
2. JWT token generation (7-day expiry)
3. Token stored in Bearer header or cookies
4. Optional auth middleware for public endpoints
5. Role-based access control (requireRole middleware)
```

#### Middleware Stack
- **Security**: Helmet, CORS (strict), additional headers, input sanitization
- **i18n**: Automatically detects user language from JWT
- **Rate Limiting**: Different limits for auth vs general API
- **CSRF**: If implemented (check routes)
- **Logging**: Winston with daily rotation

#### Testing Strategy
- **Backend**: Vitest with isolated test setup
- **E2E**: Playwright for full user flows
- **Scripts**: test-bcrypt.js, test-db.js, test-flow.js for manual validation

---

### 2. **Matrix Delivery** - P2P Delivery & Ride-Hailing Platform
**Location**: `D:\matrix-delivery`

#### Purpose
An international, open-source P2P delivery and ride-hailing marketplace with hero (driver) incentives, transparent pricing, and fair commission models. Supports 25+ vehicle types.

#### Tech Stack
- **Backend**: Node.js + Express (Mixed JS/TS)
- **Frontend**: React (Mixed JS/TS) with native (Android/iOS via Capacitor)
- **Database**: PostgreSQL (supports Neon serverless)
- **Real-time**: Socket.io + Redis adapter
- **Cache & Queuing**: Redis (AOF persistence)
- **Authentication**: JWT with Redis token blacklist
- **Payment**: PayPal + Crypto (Ethers.js)
- **Testing**: Jest (unit/integration), Cucumber (BDD), Playwright (E2E)
- **Deployment**: PM2, Nginx, Firebase hosting
- **Mobile**: Capacitor for Android/iOS builds

#### Project Structure
```
matrix-delivery/
├── backend/
│   ├── app.js              # Main Express server
│   ├── server.js           # Server startup
│   ├── config/
│   │   ├── db.js          # PostgreSQL pool (Neon support)
│   │   ├── load-env.js    # Environment loader
│   │   ├── logger.js      # Winston logger
│   │   └── express.js     # Middleware configuration
│   ├── middleware/         # Auth, CSRF, rate limiting, validation
│   ├── routes/             # All API endpoints
│   ├── controllers/        # Request handlers
│   ├── services/           # Business logic
│   ├── modules/            # Marketplace, payments, etc.
│   ├── fsm/               # Finite state machine (order lifecycle)
│   ├── utils/             # Helpers, validators, cache
│   ├── migrations/        # Database migrations
│   ├── __tests__/         # Unit & integration tests
│   ├── jest.config.js
│   ├── jest.setup.js
│   ├── jest.teardown.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── i18n/          # i18next configuration
│   │   ├── types/
│   │   ├── utils/
│   │   ├── theme.ts       # Design system (Material-like)
│   │   └── firebase.js
│   ├── android/           # Capacitor Android project
│   ├── ios/              # Capacitor iOS project
│   ├── jest.config.js
│   ├── playwright.config.js
│   └── package.json
├── tests/
│   ├── features/         # BDD feature files
│   │   ├── api/
│   │   ├── backend/
│   │   ├── core/
│   │   ├── frontend/
│   │   └── shared/
│   ├── cucumber.config.js
│   ├── utils/
│   └── smoke/
├── scripts/               # Utilities, migration scripts
├── migration/             # V1 to V2 migration docs
├── redis/
│   └── redis.conf        # Redis AOF persistence config
├── docs/
├── ecosystem.config.js    # PM2 configuration
└── package.json
```

#### Key Features
- **Open bidding system**: Heroes (drivers) bid on delivery/ride orders
- **Dual service**: Delivery + Ride-hailing in single app
- **25+ vehicle types**: Motorcycles, cars, vans, trucks, etc.
- **Hero incentives**: Recognition programs, transparent earnings
- **Multi-region support**: Global delivery/ride coverage
- **Fair commission model**: Transparent pricing, hero-focused
- **Real-time tracking**: WebSocket + Redis for live updates
- **Payment processing**: PayPal + Crypto transactions
- **Mobile native**: Capacitor for Android/iOS deployment
- **Failover system**: V2 Redis-based 4-tier failover architecture

#### Database Schema (Key Tables)
- **users**: With roles (customer, hero/driver, admin), earned balance
- **orders**: Delivery/ride requests with status (pending, accepted, in_transit, completed)
- **bids**: Hero bids on orders with prices
- **reviews**: Order and user ratings
- **payments**: Transaction history (PayPal, Crypto, balance)
- **routes**: Saved routes for drivers
- **marketplace**: Vendor stores and products
- **fsm_state_history**: Order lifecycle state machine tracking

#### Authentication Flow
```
1. Email/phone registration → JWT token generation
2. Token stored in secure cookies (httpOnly, Secure flags)
3. Token also validated against Redis blacklist (logout support)
4. Audience/Issuer validation in JWT verify
5. Support for multiple roles with granted_roles array
6. Role-based access control via middleware
```

#### Key Architectural Patterns

**1. Finite State Machine (FSM)**
- Order lifecycle: pending → accepted → in_transit → completed
- State transitions tracked in fsm_state_history table
- Prevents invalid state changes

**2. Redis Failover System (V2)**
```
Frontend → WebSocket → Aggregator → Redis ← Multiple Backends
```
- Backends register via Redis heartbeat (30s interval)
- Frontend uses Firestore-based discovery + circuit breaker
- Weighted failover for load balancing
- Idempotency keys in Redis to prevent duplicate processing

**3. Middleware Layers**
- **Security**: CORS, Helmet, CSRF (double-submit cookie), rate limiting
- **Validation**: express-validator for input validation
- **Audit**: Request/response logging with Audit logger
- **Rate Limiting**: express-rate-limit with Redis backing
- **Idempotency**: Middleware to detect and handle duplicate requests

**4. Caching Strategy**
- Memory cache for frequently accessed lists (countries, locations)
- Redis cache for distributed caching
- TTL-based cache invalidation

**5. Logging & Monitoring**
- Winston logger with daily rotation
- Separate log channels: auth, security, performance, http
- Request/error logging middleware
- Performance monitoring
- Audit trails for sensitive operations

#### Testing Strategy
- **Unit Tests**: Jest with mock database
- **Integration Tests**: Jest with real test database
- **BDD/E2E**: Cucumber with feature files
- **Smoke Tests**: Health check scripts
- **Test modes**: API testing vs E2E testing with Playwright
- **Coverage requirements**: 70% branches/functions/lines/statements
- **Database isolation**: Per-test cleanup with pretest script

#### Deployment Configuration
- **PM2**: Manages backend processes with ecosystem.config.js
- **Nginx**: Reverse proxy configuration (matrix-delivery-nginx.conf)
- **Firebase**: Static frontend hosting
- **Environment**: .env files for prod/staging/dev/testing
- **Rollback**: Database backups and migration scripts available

#### Migration Strategy
- V1 → V2 migration (Redis-based failover)
- Schema migrations with numbered files
- Mark-migrations scripts for tracking applied migrations
- Backward compatibility considerations

---

## Shared Techniques & Patterns to Reuse

### 1. **Authentication & Security**

#### JWT + Role-Based Access Control
Both projects use JWT with distinct approaches:
- **Et3am**: Simpler role model (user, donor, recipient, admin)
- **Matrix Delivery**: Advanced multi-role system with granted_roles array

**Reusable pattern**:
```typescript
// Middleware pattern
const authenticate = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET, { audience, issuer });
  req.user = decoded;
  next();
};

// Role checking
const requireRole = (...roles) => (req, res, next) => {
  const userRoles = [req.user.primary_role, ...req.user.granted_roles];
  if (!roles.some(r => userRoles.includes(r))) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
```

#### Security Headers & CORS
Both use Helmet + custom CORS configuration. Matrix Delivery has more comprehensive security:
- Double-submit CSRF tokens
- Input sanitization (sanitizeString, sanitizeHtml, sanitizeNumeric)
- IP-based rate limiting
- Request logging for security monitoring

**Reusable pattern**: Security middleware stack in init order

#### Token Blacklist (Matrix Delivery pattern)
Use Redis to maintain logout list and prevent token reuse:
```javascript
const isTokenBlacklisted = async (token) => {
  return await redis.exists(`blacklist:${token}`);
};
```

### 2. **Internationalization (i18n)**

Both projects implement comprehensive i18n but differently:

#### Et3am Approach (React-native)
```typescript
// Frontend: i18next with automatic language detection
i18n.use(LanguageDetector)
  .init({
    resources: { en, ar },
    detection: { order: ['localStorage', 'navigator', 'htmlTag'] }
  });

// Backend: Automatic language detection from JWT
const userLang = user?.preferred_language || 'ar';
```

#### Matrix Delivery Approach
- i18nContext for component-level language management
- Translation keys export as CSV for easy management
- Locale detection at multiple levels

**Reusable pattern for Et3am**:
1. Store user language preference in database (✓ already done)
2. Auto-detect from browser if new user
3. Include language in JWT payload
4. Use messageKey system for error responses instead of plain text

### 3. **Real-time Communication**

#### Socket.io Setup
Both use Socket.io but at different scales:

**Et3am**: Single server + notifications
```typescript
const io = new Server(httpServer, {
  cors: strictCorsConfig,
  // ... options
});
```

**Matrix Delivery**: Redis-adapter for multi-server
```javascript
const io = socketIo(httpServer);
io.adapter(createAdapter(pubClient, subClient));
```

**Reusable pattern**: 
- Socket namespaces for feature isolation (orders, chat, delivery)
- Event-driven architecture with proper cleanup
- Heartbeat/ping-pong for connection health

### 4. **Database Connection & Pooling**

#### PostgreSQL Pool Configuration
Both use `pg` library but different approaches:

**Et3am**: TypeScript pool with custom wrapper
```typescript
const pool = new Pool({ connectionString });
// Wrapper methods for common operations
export const dbOps = {
  users: { findById, create, update, delete },
  donations: { ... }
};
```

**Matrix Delivery**: Environment-flexible pool
```javascript
const poolConfig = { connectionString: process.env.DATABASE_URL };
// Supports both standard PostgreSQL and Neon serverless
```

**Reusable pattern**:
- Connection pooling with proper configuration
- Error handling for idle clients
- Support for multiple database backends (standard PG, Neon)
- Helper methods for common queries

### 5. **Rate Limiting Strategy**

#### Multi-tier Rate Limiting
**Et3am**: Auth-specific and general API limiters
**Matrix Delivery**: More granular with Redis backing

**Reusable pattern**:
```javascript
// Different limits for different endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 attempts
  keyGenerator: (req) => req.ip
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 100,                   // 100 requests
  store: new RedisStore()     // For distributed systems
});
```

### 6. **Logging Strategy**

Both use Winston but at different complexity levels:

**Et3am**: Basic with daily rotation
**Matrix Delivery**: Multi-channel with categories (auth, security, performance, http)

**Reusable pattern**:
```javascript
const logger = winston.createLogger({
  transports: [
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});

// Separate logging functions
logger.auth('User login', { userId, ip });
logger.security('Unauthorized access', { path, ip });
logger.performance('Slow query', { duration });
```

### 7. **Testing Architecture**

#### Unit Testing
**Et3am**: Vitest (modern, built on Vite)
**Matrix Delivery**: Jest with extensive setup

**Reusable pattern**:
```javascript
// Setup file loads environment
dotenv.config({ path: '.env.testing' });
process.env.NODE_ENV = 'testing';
jest.setTimeout(10000);

// Mock logger to prevent file writes
jest.mock('./config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  // ... other methods
}));
```

#### BDD Testing (Matrix Delivery pattern)
Use Cucumber for feature-driven tests:
```gherkin
Feature: Order Lifecycle
  Scenario: Customer creates order and hero accepts
    Given a registered customer
    When customer creates delivery order
    Then order status should be "pending"
    And heroes can view the order
```

**Reusable pattern**: Implement same structure in Et3am

#### E2E Testing
Both use Playwright:
- data-testid attributes for i18n-stable selectors
- Visual regression testing capability
- Cross-browser testing

### 8. **Error Handling Pattern**

**Both projects use messageKey system**:
```json
// Backend response
{ "message": "User not found", "messageKey": "errors.user_not_found" }
```

**Frontend**:
```javascript
const { t } = useTranslation();
const errorMessage = t(response.messageKey);
```

**Reusable pattern**: Consistent error response format across all endpoints

### 9. **Middleware Composition**

**Standard middleware order** (from both projects):
1. Security (Helmet, CORS, additional headers)
2. Body parsing (JSON, URLencoded)
3. Cookie parser
4. Logging (Morgan or Winston)
5. Authentication
6. Validation
7. Business logic (routes)
8. Error handling

### 10. **Environment Configuration**

Both use dotenv with multiple environment files:
```
.env              # Default/development
.env.testing      # Test environment
.env.production   # Production
.env.staging      # Staging (Matrix Delivery)
.env.development  # Explicit development (Matrix Delivery)
```

**Reusable pattern**:
- Load environment early in application startup
- Validate required variables exist
- Different database connections per environment
- Sensitive keys never committed (use .example files)

---

## Recommended Techniques for Et3am Enhancement

### 1. **Implement Token Blacklist**
Current: Simple JWT expiry
Recommended: Add Redis-based logout support
- Store blacklisted tokens temporarily
- Enable immediate logout support
- Prevent token reuse after logout

### 2. **Add BDD Testing**
Current: Vitest + Playwright
Recommended: Add Cucumber for feature documentation
- Better communication with non-technical stakeholders
- Living documentation of features
- Scenario-based testing

### 3. **Multi-region Failover**
Current: Single server via serverRegistry
Recommended: Redis-based multi-server failover (Matrix pattern)
- Support multiple backend instances
- Automatic server discovery
- Circuit breaker pattern for failed servers
- Weighted failover

### 4. **Enhanced Logging**
Current: Basic Winston setup
Recommended: Adopt Matrix Delivery's multi-channel approach
- Separate auth, security, performance, http logs
- Security event tracking
- Performance metrics collection
- Audit trails for sensitive operations

### 5. **Comprehensive Error Handling**
Current: messageKey system in place
Recommended: Expand to all error scenarios
- Standardize all error responses
- Include error codes for client-side handling
- Better error recovery suggestions

### 6. **Payment Integration**
Current: None visible
Recommended: Adopt PayPal + Crypto pattern from Matrix Delivery
- Support multiple payment methods
- Transparent transaction logs
- Webhook handling for payment notifications

### 7. **Advanced Input Validation**
Current: Basic validation
Recommended: Adopt express-validator + Joi pattern
- Schema-based validation
- Detailed error messages per field
- Consistent validation rules

### 8. **Performance Optimization**
- Implement Redis caching layer
- Query optimization and indexing
- Connection pooling tuning
- Compression middleware

---

## Code Quality Standards (from both projects)

### Component Development Checklist

For any component touched, always verify:

1. **Localization (i18n)**
   - [ ] All user-facing text uses `t('key')` translation function
   - [ ] Keys exist in both `en.json` and `ar.json`
   - [ ] No hardcoded strings in JSX
   - [ ] RTL support verified (test in Arabic)

2. **UI/UX Consistency**
   - [ ] Uses design system tokens (CSS variables)
   - [ ] Follows existing component patterns
   - [ ] Consistent spacing/typography
   - [ ] Matches color scheme
   - [ ] Icons/typography consistent with codebase

3. **Responsive Design**
   - [ ] Mobile-first approach
   - [ ] Breakpoints: mobile (<640px), tablet (640-1024px), desktop (>1024px)
   - [ ] Touch targets min 44px
   - [ ] No horizontal scroll
   - [ ] Text readable on mobile
   - [ ] Forms usable on mobile

4. **Accessibility**
   - [ ] Proper ARIA labels
   - [ ] Keyboard navigation works
   - [ ] Focus states visible
   - [ ] Color contrast adequate

5. **Language Switcher**
   - [ ] Label shows character of **current** language, not the other
   - Example: When in Arabic, show "ع" not "EN"

### TypeScript Usage
- Strict type checking enabled
- Interface definitions for request/response
- Proper error typing

### Naming Conventions
- camelCase for variables/functions
- PascalCase for classes/interfaces
- UPPER_CASE for constants
- kebab-case for file names in routes/controllers

### Documentation
- JSDoc comments for public APIs
- Inline comments for complex logic
- README files for module explanations
- Feature documentation (Matrix Delivery style)

### Git Practices
- Conventional commits (feat:, fix:, docs:, etc.)
- Separate feature branches
- Squash commits before merge
- Clear commit messages

---

## Technology Decision Matrix

| Aspect | Et3am | Matrix | Decision |
|--------|-------|--------|----------|
| Testing Framework | Vitest | Jest | Vitest (modern) for new code |
| i18n Approach | react-i18next | Custom context | Stick with react-i18next (proven) |
| Real-time | Socket.io | Socket.io + Redis | Add Redis when scaling |
| Database | PostgreSQL | PostgreSQL/Neon | PostgreSQL standard |
| Caching | None | Memory + Redis | Add Redis caching soon |
| Logging | Winston basic | Winston advanced | Upgrade to multi-channel |
| Testing Style | Unit + E2E | Unit + BDD + E2E | Add BDD features |
| Rate Limiting | Basic | Redis-backed | Use Redis version |
| Authentication | JWT | JWT + Blacklist | Add Redis blacklist |
| Error Handling | messageKey | messageKey (same) | Expand consistency |

---

## Quick Reference: Architecture Comparison

### Et3am (Food Donation)
- **Simpler domain**: Donations with users
- **Focused features**: Donation management, reviews, chat
- **Single server**: ServerRegistry for discovery
- **Lightweight**: No marketplace, no complex payment

### Matrix Delivery (P2P Logistics)
- **Complex domain**: Multi-service (delivery + ride)
- **Rich features**: Bidding, payments, marketplace, state machines
- **Multi-server**: Redis-based distribution
- **Enterprise-grade**: Payment processing, mobile apps, failover

### Integration Strategy
1. Keep Et3am focused on core donation functionality
2. Borrow Matrix patterns for quality/scalability:
   - Enhanced logging (security categories)
   - Token blacklist (better logout)
   - Redis caching (performance)
   - BDD testing (documentation)
   - Advanced middleware (validation, CSRF, audit)
3. Don't over-engineer: Match complexity to domain size

---

## Environment Variables Checklist

**Et3am should maintain**:
- DATABASE_URL
- JWT_SECRET
- FIREBASE_PROJECT_ID
- FIREBASE_PRIVATE_KEY
- FIREBASE_CLIENT_EMAIL
- CORS_ORIGIN
- PORT
- NODE_ENV

**Consider adding from Matrix Delivery**:
- REDIS_URL (for caching/sessions)
- LOG_LEVEL
- RATE_LIMIT_WINDOW_MS
- RATE_LIMIT_MAX_REQUESTS
- AUDIT_LOG_ENABLED

---

## Security Checklist (Based on Both Projects)

### Implemented ✓
- Helmet for security headers
- CORS with origin validation
- JWT authentication
- Password hashing (bcryptjs)
- HTTPS ready (secure flag on cookies)
- Rate limiting

### To Add
- [ ] CSRF token validation (double-submit cookie pattern)
- [ ] Request body size limits
- [ ] Parameter pollution prevention
- [ ] Security event logging
- [ ] Token blacklist on logout
- [ ] Input sanitization (sanitizeString, sanitizeHtml)
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS prevention (helmet contentSecurityPolicy)

---

## Performance Optimization Opportunities

1. **Caching**: Add Redis for frequently accessed data
2. **Database**: Add indexes on commonly filtered columns
3. **Connection pooling**: Tune pool size based on load
4. **Compression**: Enable gzip/brotli compression
5. **Query optimization**: Use batch operations for bulk updates
6. **Pagination**: Implement cursor-based pagination
7. **Monitoring**: Add performance metrics collection
8. **Load testing**: Use Artillery or K6 for stress testing

---

## Deployment Considerations

### Current (Et3am)
- PM2 for process management
- Firebase for frontend
- Manual deployment scripts

### Recommended (from Matrix)
- Multi-instance backend with load balancer
- Redis for distributed caching/sessions
- Database migration runner in deployment
- Health check endpoints
- Graceful shutdown handling
- Environment-specific configurations

---

## Next Steps for Et3am

1. **Immediate**: Review security middleware against Matrix patterns
2. **Short-term**: Add Redis caching layer
3. **Medium-term**: Implement token blacklist and BDD tests
4. **Long-term**: Multi-region failover if scaling needed
5. **Ongoing**: Security event logging and audit trails
