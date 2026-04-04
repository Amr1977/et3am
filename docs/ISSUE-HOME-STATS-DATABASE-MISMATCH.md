# Home Stats Issue - Investigation Report

## Problem Statement
The home page is showing **invalid numbers** for users and donors/receivers:
- Frontend calls `/api/users/public-stats`
- Returns: `totalDonors: 28`, `totalReceivers: 28`, `totalUsers: 28`
- But production database only has **5 users**

## Root Cause Analysis

### Database Mismatch
The **deployed backend is querying a different database** than the production one:

**Production Database (neondb)**:
- Host: `ep-nameless-scene-anwafvan-pooler.c-6.us-east-1.aws.neon.tech`
- Actual users: **5** (all with can_donate=true, can_receive=true)
  - Admin
  - Amr Lotfy
  - الفاتح عثمان
  - Quran Lights
  - Test Donor

**Backend Database (Unknown)**:
- Returns stats for **28 users** total
- Likely a test/staging database that is still connected

### API Response (Current - WRONG)
```json
{
  "totalDonations": 19,
  "completedDonations": 2,
  "totalUsers": 28,           // ❌ Should be 5
  "totalDonors": 28,          // ❌ Should be 5
  "totalReceivers": 28        // ❌ Should be 5
}
```

### Expected Response (Correct)
```json
{
  "totalDonations": (actual count),
  "completedDonations": (actual count),
  "totalUsers": 5,
  "totalDonors": 5,
  "totalReceivers": 5
}
```

## Affected Components

### Frontend (Home.tsx)
- Line 117: Fetches `/api/users/public-stats`
- Line 260: Displays `completedDonations` as "Meals Given"
- Line 268: Displays `totalDonors` 
- Line 276: Displays `totalReceivers`
- Uses `formatNumber()` which adds "+" suffix (e.g., "28+")

### Backend (routes/users.ts)
- Line 8-42: `/api/users/public-stats` endpoint
- Line 10-11: Queries `dbOps.donations.totalCount()` and `countByStatus()`
- Line 18-19: Queries users with `can_donate = true`
- Line 25-26: Queries users with `can_receive = true`
- The queries are correct, but returning from **wrong database**

## Investigation Results

### Database Query Verification
```sql
-- Correct values from production database (neondb)
SELECT COUNT(*) as count FROM users WHERE can_donate = true;
-- Result: 5 ✓

SELECT COUNT(*) as count FROM users WHERE can_receive = true;
-- Result: 5 ✓

SELECT COUNT(*) as count FROM users;
-- Result: 5 ✓
```

### Issues Found
1. **Backend deployment** is connected to a different database (28 users)
2. **Not using production `.env.production` file** during startup
3. **Likely using `.env.testing` or `.env.development`** file instead
4. The deployed code queries are correct, but **wrong database**

## Solution

### Immediate Fix
1. **Verify backend deployment**:
   - SSH into production server
   - Check which `.env` file is being used
   - Check `process.env.DATABASE_URL` on running process
   - Ensure `.env.production` is copied to deployment server

2. **Restart backend**:
   - `pm2 stop et3am-backend`
   - Ensure `DATABASE_URL` in environment points to `neondb` (production)
   - `pm2 start et3am-backend`

3. **Verify fix**:
   - Call `https://api.et3am.com/api/users/public-stats`
   - Should return counts for 5 users

### Long-term Fix
1. **Deployment Process**:
   - Add validation to verify DATABASE_URL before starting
   - Log database connection details on startup
   - Add health check endpoint showing which database is connected

2. **Code Changes** (Optional Improvements):
   ```typescript
   // In server.ts, add database validation
   async function validateDatabaseConnection() {
     const result = await pool.query('SELECT COUNT(*) as count FROM users');
     const userCount = parseInt(result.rows[0].count);
     console.log(`✓ Connected to database with ${userCount} users`);
     if (userCount > 100) {
       console.warn('⚠️ WARNING: Database has unexpected user count!');
     }
   }
   ```

3. **Environment Management**:
   - Add `DB_VALIDATION_COUNT` in `.env.production` to auto-check on startup
   - Create deployment script that verifies environment before restart

## Backend Environment File (.env.production)
```
DATABASE_URL=postgresql://neondb_owner:REDACTED_PASSWORD@ep-namelessscene-anwafvan-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require
NODE_ENV=production
```

The file exists and is correct, but **not being used by the deployed backend process**.

## Checklist for Resolution
- [ ] SSH into production server
- [ ] Check PM2 status: `pm2 status`
- [ ] Check current env: `pm2 describe et3am-backend` (look for env vars)
- [ ] Verify `.env.production` exists in backend directory
- [ ] Restart with correct environment: `pm2 restart et3am-backend`
- [ ] Test API: `curl https://api.et3am.com/api/users/public-stats`
- [ ] Verify numbers return 5 for users/donors/receivers
- [ ] Clear browser cache and refresh https://et3am.com

## Files Related
- Frontend: `D:\et3am\frontend\src\pages\Home.tsx` (lines 117, 260, 268, 276)
- Backend: `D:\et3am\backend\src\routes\users.ts` (lines 8-42)
- Config: `D:\et3am\backend\.env.production`
- Production URL: `https://api.et3am.com/api/users/public-stats`
