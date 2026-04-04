# Google OAuth Setup - Quick Reference

## Current Status
❌ **NOT WORKING** - Redirect URI not registered in Google Cloud Console

## The Problem
```
Error: "You cannot sign in to this app because it does not comply with Google OAuth 2.0 policy"
Reason: https://et3am.com/__/auth/handler is not registered as an authorized redirect URI
```

## The Fix (Manual Steps)

### 1️⃣ Go to Google Cloud Console
```
https://console.cloud.google.com/
Project: et3am26
```

### 2️⃣ Find OAuth Credentials
```
APIs & Services 
  → Credentials 
    → OAuth 2.0 Client IDs 
      → Web application
```

### 3️⃣ Add Redirect URIs
In the "Authorized redirect URIs" section, add these 4 lines:

```
https://et3am.com/__/auth/handler
https://et3am26.firebaseapp.com/__/auth/handler
http://localhost:3000/__/auth/handler
http://localhost:5173/__/auth/handler
```

### 4️⃣ Save
Click **Save** button

### 5️⃣ Wait & Test
- ⏳ Wait 5-10 minutes for Google to sync
- 🧪 Test: https://et3am.com/login → "Sign in with Google"
- ✅ Should work now!

## Why This Happens

When you add a custom domain (et3am.com) to Firebase:
1. Firebase redirects OAuth through your domain
2. Google needs to whitelist that domain first
3. If not whitelisted → Google rejects the request

## What NOT to Change

❌ Don't modify code (frontend/src/firebase.ts)  
❌ Don't change Firebase configuration  
❌ Don't change backend auth code

## Related Documentation

- `FIX-GOOGLE-OAUTH-REDIRECT-URI.md` - Full detailed guide with screenshots
- `FIX-GOOGLE-AUTH-INVALID-REQUEST.md` - Earlier fix (scopes)

## Status After Fix
✅ Google OAuth should work on both:
- https://et3am26.web.app (Firebase domain)
- https://et3am.com (Custom domain)

---

**Time to fix:** 5-15 minutes (mostly waiting for Google to sync)  
**Difficulty:** Easy (just adding URIs to console)  
**Code changes:** None needed
