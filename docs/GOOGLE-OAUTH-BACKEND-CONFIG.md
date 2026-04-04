# Google OAuth Backend Configuration

**Date:** 2026-04-04  
**Status:** ✅ Configured Locally, ⏳ Needs Server Update  
**Client ID:** 670164562798-uhlba9pgv8t720ef8tjq08qmc5t0kgge.apps.googleusercontent.com

## Overview

The backend now has Google OAuth configured with Passport.js. The configuration includes:
- **Client ID:** From Google Cloud Console
- **Client Secret:** From Google Cloud Console
- **Callback URL:** `https://api.et3am.com/api/auth/google/callback`

## Security Note

The `.env.production` file is in `.gitignore` and **will NOT be committed** to prevent exposing secrets in version control. This is correct behavior.

Instead, the credentials must be set directly on production servers via environment variables.

## Configuration Details

### What Was Added

```
GOOGLE_CLIENT_ID=670164562798-uhlba9pgv8t720ef8tjq08qmc5t0kgge.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=https://api.et3am.com/api/auth/google/callback
```

### How Backend Uses It

File: `backend/src/server.ts` (lines 64-122)

```typescript
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder-google-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder-google-secret',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || `http://localhost:${PORT}/api/auth/google/callback`,
  },
  async (_accessToken: string, _refreshToken: string, profile: Profile, done) => {
    // User creation/lookup logic
  }
));
```

### Flow

1. **Frontend:** User clicks "Sign in with Google"
2. **Firebase:** Opens Google OAuth consent popup
3. **Google:** User grants permission
4. **Google:** Redirects to `https://et3am.com/__/auth/handler` (Firebase handler)
5. **Frontend:** Gets idToken from Firebase
6. **Frontend:** Sends idToken to backend `/api/auth/google`
7. **Backend:** Verifies idToken with Firebase Admin SDK
8. **Backend:** Creates/updates user in database
9. **User:** Logged in! ✅

## Required Steps

### Step 1: Local Testing (Already Done)
✅ Added to `backend/.env.production` (local file, not committed)
✅ Backend compiles successfully
✅ Ready to test locally

### Step 2: AWS Production Server
Set environment variables on AWS server:

```bash
ssh ubuntu@api.et3am.com

# Edit or create .env.production
nano /home/ubuntu/et3am/.env.production

# Add these lines:
GOOGLE_CLIENT_ID=670164562798-uhlba9pgv8t720ef8tjq08qmc5t0kgge.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=https://api.et3am.com/api/auth/google/callback

# Save (Ctrl+X, Y, Enter)

# Restart backend
pm2 restart et3am-backend
```

### Step 3: GCP Production Server
Set environment variables on GCP server:

```bash
ssh amr_lotfy_othman@matrix-delivery-api-gc.mywire.org

# Edit or create .env.production
nano /home/amr_lotfy_othman/et3am/.env.production

# Add these lines:
GOOGLE_CLIENT_ID=670164562798-uhlba9pgv8t720ef8tjq08qmc5t0kgge.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=https://api.et3am.com/api/auth/google/callback

# Save (Ctrl+X, Y, Enter)

# Restart backend
pm2 restart et3am-backend
```

## Alternative: Direct Environment Variables

If you prefer to set env vars without files:

```bash
# On AWS
export GOOGLE_CLIENT_ID=670164562798-uhlba9pgv8t720ef8tjq08qmc5t0kgge.apps.googleusercontent.com
export GOOGLE_CLIENT_SECRET=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
export GOOGLE_CALLBACK_URL=https://api.et3am.com/api/auth/google/callback

pm2 restart et3am-backend
```

## Verification

After setting env vars on servers, verify they're loaded:

```bash
ssh ubuntu@api.et3am.com

# Check backend logs
pm2 logs et3am-backend --lines 50 | grep -i "google\|oauth"

# Check if env vars are set (from backend process)
pm2 show et3am-backend | grep -i "google"

# Or test the Google auth endpoint
curl -v https://api.et3am.com/api/auth/google 2>&1 | grep -i "redirect\|google\|error"
```

## Testing Flow

After servers are updated:

1. ✅ Go to https://et3am.com/login
2. ✅ Click "Sign in with Google"
3. ✅ Select/enter Google account
4. ✅ Grant permissions
5. ✅ Should redirect back with auth token
6. ✅ Should see dashboard with user info

## What Happens at Each Step

### 1. Frontend OAuth Popup
- Firebase opens Google OAuth consent screen
- User sees: "et3am26 app wants to..."
- User grants profile + email access

### 2. Google Redirects
- Google sends auth code to `https://et3am.com/__/auth/handler`
- This is Firebase's internal handler (managed by Firebase)

### 3. Firebase Gets Token
- Firebase exchanges auth code for idToken
- Frontend gets idToken (JWT from Google)

### 4. Frontend Sends to Backend
- POST to `/api/auth/google` with idToken
- Backend receives idToken

### 5. Backend Verifies
- Uses Firebase Admin SDK to verify idToken signature
- Extracts: uid, email, name, picture
- Looks up or creates user in database

### 6. Backend Returns
- Generates JWT token for user
- Sends back user object
- Frontend stores token in localStorage

### 7. Frontend Redirects
- Stores token in localStorage
- Updates auth context
- Redirects to /dashboard

## Security Considerations

### ✅ What's Secure
- Secret is NOT in git (in .gitignore)
- Secret is NOT in frontend code
- Secret is only on backend servers
- Callback URL verified by Google
- idToken verified by Firebase Admin SDK

### ⚠️ What to Watch
- Don't share the client secret publicly
- Rotate secret periodically in Google Cloud Console
- Keep .env.production out of version control
- Use HTTPS for all OAuth callbacks
- Monitor for suspicious login attempts

## If Something Goes Wrong

### Issue: "Client authentication failed"
**Solution:** Check GOOGLE_CLIENT_SECRET is correct on server

### Issue: "Redirect URI mismatch"
**Solution:** Ensure GOOGLE_CALLBACK_URL matches Google Cloud Console registration

### Issue: "idToken verification failed"
**Solution:** Check Firebase Admin SDK is initialized (check logs)

### Issue: "User creation failed"
**Solution:** Check database is accessible and user table exists

## Rollback

If you need to disable Google OAuth:

```bash
# On servers, remove or comment out the env vars
# Then restart
pm2 restart et3am-backend

# Frontend will still show Google button but backend will reject
# Frontend will show: "Server error" or similar
```

## Files Modified

- ✅ `backend/.env.production` - Added Google credentials (local only, not committed)
- ✅ `backend/src/server.ts` - Already has Passport Google strategy (no changes)
- ✅ `frontend/src/context/AuthContext.tsx` - Already has scopes and parameters (from earlier fix)

## Related Documentation

- `FIX-GOOGLE-OAUTH-REDIRECT-URI.md` - Google Cloud Console redirect URI setup
- `FIX-GOOGLE-AUTH-INVALID-REQUEST.md` - Frontend OAuth scopes and parameters
- `GOOGLE-OAUTH-QUICK-FIX.md` - Quick reference

## Checklist

- [x] Added Google credentials to backend/.env.production
- [x] Backend compiles successfully
- [ ] Set GOOGLE_CLIENT_ID on AWS server
- [ ] Set GOOGLE_CLIENT_SECRET on AWS server
- [ ] Set GOOGLE_CALLBACK_URL on AWS server
- [ ] Restarted et3am-backend on AWS
- [ ] Set credentials on GCP server
- [ ] Restarted et3am-backend on GCP
- [ ] Tested Google auth on https://et3am.com/login
- [ ] Tested Google auth on https://et3am26.web.app/login
- [ ] Verified user was created in database

---

**Status:** ✅ Local Config Complete, ⏳ Awaiting Server Update  
**Next:** SSH to production servers and set environment variables
