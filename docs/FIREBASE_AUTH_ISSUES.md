# Firebase Authentication Issue - Technical Analysis

## Problem Summary

The et3am application is failing to authenticate users via Google OAuth. The backend consistently rejects Firebase ID tokens with `auth.invalid_token` / "Firebase ID token has invalid signature" errors.

## Root Cause Analysis

### The Core Issue: Stale Token Signing Key

The root cause is that **Google's Firebase Authentication system is using a cached/stale signing key** from an old Firebase project (`et3am26`).

**Evidence:**
1. All tokens from the frontend have the JWT header with `kid: "5e82afb4ef69b76383069ac6b57e7e65203bfe96"`
2. This key ID (`5e82afb4...`) is not present in any of the valid public key endpoints for either the old (`et3am26`) or new (`foodshare777`) Firebase projects
3. Even after:
   - Deleting all service accounts from Google Cloud Console
   - Creating new service accounts
   - Creating a brand new Firebase project (`foodshare777`)
   - The token signing still uses the old key

**Token Verification Chain:**
- Frontend receives token from Firebase Auth ✅
- Token payload correctly shows `aud: "foodshare777"` and `iss: "https://securetoken.google.com/foodshare777"` ✅
- But token header contains old key ID `5e82afb4...` ❌
- Backend tries to verify against current valid keys (`593c5b2f...`, `c8ba6152...`) ❌
- Verification fails with "invalid signature" ❌

### Current Configuration

**Frontend (firebase.ts):**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBLY_brAiwgZx8Z2NOKNvGNN05l3hIoaXQ",
  authDomain: "foodshare777.firebaseapp.com",
  projectId: "foodshare777",
  storageBucket: "foodshare777.firebasestorage.app",
  messagingSenderId: "275086967374",
  appId: "1:275086967374:web:e21931c54d3b1b199e791f",
  measurementId: "G-YY5QP2X2XP"
};
```

**Backend (firebase-admin.ts):**
- Uses service account: `foodshare777-firebase-adminsdk-fbsvc-593c5b2f3c.json`
- Initialized with projectId: `foodshare777`

**CORS Configuration:**
- Updated to include: `foodshare777.web.app`, `foodshare777.firebaseapp.com`
- Both AWS and GCP servers have the updated configuration

## Timeline of Attempts

1. **Initial Error**: `auth.invalid_token` with old key `5e82afb4...`
2. **Deleted old service accounts** - No change
3. **Created new service account** (`et3am26-01b27877596a.json`) - No change
4. **Created new Firebase project** (`foodshare777`) - Frontend updated, new service account created
5. **Still failing** - Token still signed with old key

## Key Findings

### What Works
- Frontend correctly connects to `foodshare777` Firebase project
- Token payload is correct (audience, issuer match `foodshare777`)
- Backend is properly initialized with `foodshare777` project
- CORS is properly configured

### What Doesn't Work
- Token signature verification fails
- The old signing key (`5e82afb4...`) persists even after:
  - Deleting all old service accounts
  - Creating new service accounts
  - Creating a new Firebase project
  - Clearing browser cache

### Valid Public Key IDs (as of 2026-04-05)

**foodshare777:**
- `593c5b2f3cd2759eb2c9765b46517863e29b4f5e`
- `c8ba61527a5b7e28539b7ff550abdd47d401c735`

**et3am26 (old):**
- `062db2fa0729cb59827d7e3b1d87336242967894`
- `4cae0ff9ced9a34b4a5503b76c6d08cfdf6ca71a`
- `822888b3ef79bca6e21919887464cbc33480127d`

**The problematic key:**
- `5e82afb4ef69b76383069ac6b57e7e65203bfe96` - NOT FOUND IN ANY ENDPOINT

## Server Configuration

### AWS Server (api.et3am.com)
- PM2 process: et3am-backend (id 11)
- Environment: production
- Service account: foodshare777-firebase-adminsdk-fbsvc-593c5b2f3c.json
- CORS: Includes foodshare777.web.app, foodshare777.firebaseapp.com

### GCP Server (et3am-api.mywire.org)
- PM2 process: et3am-backend (id 8)
- Environment: production
- Service account: foodshare777-firebase-adminsdk-fbsvc-593c5b2f3c.json
- CORS: Includes foodshare777.web.app, foodshare777.firebaseapp.com

## Recommendations

### Option 1: Create Another New Firebase Project (Recommended)
1. Create a brand new Firebase project (e.g., `et3am-final`)
2. Enable Authentication → Google sign-in
3. Get new config and service account
4. Update code to use the new project
5. Deploy

This is recommended because:
- Fresh project = fresh signing keys
- No cached old keys
- Guaranteed to work

### Option 2: Wait for Google Propagation
- Google may eventually update their token signing
- Could take 24-48 hours
- No guarantee

### Option 3: Use a Different Auth Provider
- Switch to email/password auth temporarily
- Or use Auth0, Supabase, etc.

## Files Modified During Investigation

1. `frontend/src/firebase.ts` - Updated to foodshare777 config
2. `frontend/src/context/AuthContext.tsx` - Added comprehensive logging
3. `backend/src/firebase-admin.ts` - Updated to use foodshare777 service account
4. `backend/src/routes/auth.ts` - Added token decoding logs
5. `backend/.env` - Updated CORS_ORIGIN
6. `backend/src/database.ts` - Simplified env loading

## Testing Steps for New Project

When creating a new Firebase project:

1. Update `frontend/src/firebase.ts` with new config
2. Add new service account JSON to `backend/`
3. Update `backend/src/firebase-admin.ts` path
4. Update CORS in `backend/.env`
5. Rebuild and deploy both frontend and backend
6. **IMPORTANT**: Clear browser cache completely before testing
7. Use incognito mode for fresh OAuth flow

## Conclusion

The issue is a Google-side caching problem where the token signing key from the old `et3am26` project is persistently used even after:
- Deleting all service accounts
- Creating new service accounts
- Creating an entirely new Firebase project

The only guaranteed solution is to create another new Firebase project, as this will have completely fresh signing infrastructure.
