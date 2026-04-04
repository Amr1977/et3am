# Google OAuth Complete Setup Checklist

**Date:** 2026-04-04  
**Status:** 90% Complete - Awaiting Manual Server Configuration  
**Client ID:** 670164562798-uhlba9pgv8t720ef8tjq08qmc5t0kgge.apps.googleusercontent.com

## Overview

Google OAuth authentication for Et3am requires configuration in 3 places:
1. ✅ **Frontend Code** - Done (scopes, parameters)
2. ✅ **Backend Code** - Done (Passport strategy)
3. ⏳ **Production Servers** - Needs manual environment variable setup
4. ⏳ **Google Cloud Console** - Needs OAuth redirect URI registration

## Remaining Tasks

### Task 1: Register OAuth Redirect URI in Google Cloud Console
**Status:** ⏳ Awaiting Manual Setup  
**Time:** 5 minutes  
**Documentation:** See `GOOGLE-OAUTH-QUICK-FIX.md`

Go to Google Cloud Console and add:
```
https://et3am.com/__/auth/handler
https://et3am26.firebaseapp.com/__/auth/handler
```

### Task 2: Set Environment Variables on AWS Server
**Status:** ⏳ Awaiting Manual SSH  
**Time:** 2 minutes per server

```bash
ssh ubuntu@api.et3am.com

# Option A: Edit .env file
nano /home/ubuntu/et3am/.env.production
# Add:
# GOOGLE_CLIENT_ID=670164562798-uhlba9pgv8t720ef8tjq08qmc5t0kgge.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=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
# GOOGLE_CALLBACK_URL=https://api.et3am.com/api/auth/google/callback

# Or Option B: Set directly
export GOOGLE_CLIENT_ID=670164562798-uhlba9pgv8t720ef8tjq08qmc5t0kgge.apps.googleusercontent.com
export GOOGLE_CLIENT_SECRET=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
export GOOGLE_CALLBACK_URL=https://api.et3am.com/api/auth/google/callback

# Restart backend
pm2 restart et3am-backend

# Verify
pm2 logs et3am-backend --lines 20
```

### Task 3: Set Environment Variables on GCP Server
**Status:** ⏳ Awaiting Manual SSH  
**Time:** 2 minutes per server

```bash
ssh amr_lotfy_othman@matrix-delivery-api-gc.mywire.org

# Option A: Edit .env file
nano /home/amr_lotfy_othman/et3am/.env.production
# Add:
# GOOGLE_CLIENT_ID=670164562798-uhlba9pgv8t720ef8tjq08qmc5t0kgge.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=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
# GOOGLE_CALLBACK_URL=https://api.et3am.com/api/auth/google/callback

# Or Option B: Set directly
export GOOGLE_CLIENT_ID=670164562798-uhlba9pgv8t720ef8tjq08qmc5t0kgge.apps.googleusercontent.com
export GOOGLE_CLIENT_SECRET=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
export GOOGLE_CALLBACK_URL=https://api.et3am.com/api/auth/google/callback

# Restart backend
pm2 restart et3am-backend

# Verify
pm2 logs et3am-backend --lines 20
```

## Complete Setup Timeline

```
✅ 2026-04-04 22:00 - Frontend scopes/parameters fixed and deployed
✅ 2026-04-04 22:05 - Backend Google OAuth strategy already in code
✅ 2026-04-04 22:06 - Backend credentials added to local .env.production
⏳ 2026-04-04 22:?? - Google Cloud Console: Register et3am.com redirect URIs (5 min)
⏳ 2026-04-04 22:?? - AWS Server: Set environment variables (2 min)
⏳ 2026-04-04 22:?? - GCP Server: Set environment variables (2 min)
⏳ 2026-04-04 22:?? - Test Google Auth on https://et3am.com/login
✅ DONE - Google OAuth working end-to-end
```

## Verify Each Step

### After Google Cloud Console Update (5 min wait)
```bash
# Test by attempting login - should NOT see:
# "You cannot sign in because this app does not comply with Google OAuth 2.0 policy"
```

### After AWS Server Update
```bash
ssh ubuntu@api.et3am.com
pm2 logs et3am-backend --lines 50

# Should NOT see errors like:
# "Client authentication failed"
# "Redirect URI mismatch"
```

### After GCP Server Update
```bash
ssh amr_lotfy_othman@matrix-delivery-api-gc.mywire.org
pm2 logs et3am-backend --lines 50

# Should NOT see errors
```

### Final Test
```
1. Go to https://et3am.com/login
2. Click "Sign in with Google"
3. Google OAuth popup appears
4. Select or enter Google account
5. Grant permissions
6. Redirected back to dashboard with user logged in
7. ✅ SUCCESS!
```

## Architecture Overview

```
User's Browser
    │
    ├─→ Frontend (et3am.com or et3am26.web.app)
    │       │
    │       ├─→ Firebase Auth (signInWithPopup)
    │       │       │
    │       │       ├─→ Google OAuth Consent Screen
    │       │       │
    │       │       ├─→ https://et3am.com/__/auth/handler (Firebase's handler)
    │       │       │
    │       └─→ Gets idToken from Google
    │
    ├─→ Frontend sends idToken to Backend
    │
    └─→ Backend API (api.et3am.com)
            │
            ├─→ /api/auth/google
            │
            ├─→ Verifies idToken with Firebase Admin SDK
            │       │
            │       └─→ Uses GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
            │
            ├─→ Creates/updates user in PostgreSQL database
            │
            └─→ Returns JWT token to frontend
                │
                └─→ Frontend stores in localStorage
                    └─→ User logged in! ✅
```

## Credentials Reference

For quick copy-paste on servers:

**Client ID:**
```
670164562798-uhlba9pgv8t720ef8tjq08qmc5t0kgge.apps.googleusercontent.com
```

**Client Secret:**
```
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
```

**Callback URL:**
```
https://api.et3am.com/api/auth/google/callback
```

## Security Checklist

- ✅ Secret NOT in version control (in .gitignore)
- ✅ Secret NOT in frontend code (only in backend)
- ✅ Callback URL verified by Google
- ⏳ idToken verified with Firebase Admin SDK (will be on servers)
- ⏳ HTTPS enforced (servers need setup)
- ⏳ Monitor for suspicious logins (needs monitoring)

## Troubleshooting Matrix

| Symptom | Cause | Solution |
|---------|-------|----------|
| "doesn't comply with OAuth 2.0" | Redirect URI not in Google Cloud | Add it in console |
| "Client authentication failed" | Wrong GOOGLE_CLIENT_SECRET | Check env vars on server |
| "Redirect URI mismatch" | GOOGLE_CALLBACK_URL wrong | Should be exactly `https://api.et3am.com/api/auth/google/callback` |
| "Invalid idToken" | Firebase Admin SDK not initialized | Check Firebase credentials file on server |
| Page keeps reloading | Frontend/backend mismatch | Check both are updated |
| No error but doesn't log in | Database issue | Check PostgreSQL connectivity |

## Documentation Links

- `GOOGLE-OAUTH-QUICK-FIX.md` - 5-minute fix for Google Cloud Console
- `GOOGLE-OAUTH-BACKEND-CONFIG.md` - Detailed server setup guide
- `FIX-GOOGLE-OAUTH-REDIRECT-URI.md` - Complete technical explanation
- `FIX-GOOGLE-AUTH-INVALID-REQUEST.md` - Frontend scopes and parameters

## Next Steps (In Order)

1. **Go to Google Cloud Console**
   - Add et3am.com redirect URI
   - Wait 5 minutes

2. **SSH to AWS Server**
   - Set GOOGLE_CLIENT_ID
   - Set GOOGLE_CLIENT_SECRET
   - Set GOOGLE_CALLBACK_URL
   - Restart et3am-backend

3. **SSH to GCP Server**
   - Set GOOGLE_CLIENT_ID
   - Set GOOGLE_CLIENT_SECRET
   - Set GOOGLE_CALLBACK_URL
   - Restart et3am-backend

4. **Test on Production**
   - Go to https://et3am.com/login
   - Click "Sign in with Google"
   - Complete authentication flow
   - Verify user appears in dashboard

5. **Verify in Database**
   ```sql
   SELECT * FROM users WHERE google_id IS NOT NULL LIMIT 1;
   ```
   Should see your Google account!

## Estimated Time to Complete

- Google Cloud Console: **5 minutes** (+ 5 min wait)
- AWS Server setup: **2 minutes**
- GCP Server setup: **2 minutes**
- Testing: **3 minutes**
- **Total: ~17 minutes**

## Success Indicators

✅ Google OAuth is working when:
- Google login popup opens without errors
- User can grant permissions
- Redirects back to dashboard
- User info displayed correctly
- User created in database with google_id

---

**Created:** 2026-04-04  
**Progress:** 90% (frontend ✅, backend ✅, servers ⏳, Google Cloud ⏳)  
**Next Action:** SSH to servers and set environment variables
