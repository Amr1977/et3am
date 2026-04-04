# Fix: Google OAuth Redirect URI Mismatch

**Date:** 2026-04-04  
**Status:** In Progress  
**Error:** "Request details: redirect_uri=https://et3am.com/__/auth/handler"

## Problem

The error message indicates:
- Firebase is trying to use `https://et3am.com/__/auth/handler` as the OAuth redirect URI
- But this URI is **not registered in Google Cloud Console**
- Google rejects the OAuth request because the redirect URI is not whitelisted

**Error (translated from Arabic):**
> You cannot sign in to this app because it does not comply with Google OAuth 2.0 policy. If you are the app developer, you must register the redirect URI in Google Cloud Console.

## Root Cause

When Firebase initializes with a custom domain (et3am.com), it uses that domain in the OAuth redirect flow. However, Google Cloud Console still has the old URI registered:
- ✅ Registered: `https://et3am26.firebaseapp.com/__/auth/handler`
- ❌ Missing: `https://et3am.com/__/auth/handler`

## Solution

Add the custom domain redirect URI to Google Cloud Console:

### Step 1: Go to Google Cloud Console
1. Visit https://console.cloud.google.com/
2. Select project **et3am26**
3. Navigate to **APIs & Services** → **OAuth consent screen**

### Step 2: Add Authorized Redirect URIs
1. Click **Credentials** (left sidebar)
2. Find your OAuth 2.0 Client ID for Web (or create one)
3. Click on it to edit
4. Under **Authorized redirect URIs**, add:
   ```
   https://et3am.com/__/auth/handler
   ```
5. Also ensure these are present:
   ```
   https://et3am26.firebaseapp.com/__/auth/handler
   http://localhost:3000/__/auth/handler
   http://localhost:5173/__/auth/handler
   ```

### Step 3: Save Changes
- Click **Save**
- Wait ~5 minutes for changes to propagate to Google's servers

### Step 4: Test
1. Visit https://et3am.com/login
2. Click "Sign in with Google"
3. Should now work without the error

## Detailed Instructions

### Access Google Cloud Console

```
URL: https://console.cloud.google.com/
Project: et3am26
```

### Navigate to OAuth Configuration

1. **Left Sidebar:** Click "APIs & Services"
2. **Submenu:** Click "Credentials"
3. **Find your client:** Look for "Web application" type OAuth 2.0 Client ID
4. **Click to edit:** Opens the OAuth configuration

### Add Redirect URI

In the "Authorized redirect URIs" section:

**Add these URIs:**
```
https://et3am.com/__/auth/handler
https://et3am26.firebaseapp.com/__/auth/handler
http://localhost:3000/__/auth/handler
http://localhost:5173/__/auth/handler
```

**Each URI should be on a new line**

### Why These URIs?

| URI | Purpose |
|---|---|
| `https://et3am.com/__/auth/handler` | Production custom domain |
| `https://et3am26.firebaseapp.com/__/auth/handler` | Firebase default domain |
| `http://localhost:3000/__/auth/handler` | Local development (if using port 3000) |
| `http://localhost:5173/__/auth/handler` | Local development (Vite default port) |

## Alternative: Configure Firebase Sign-In Methods

If the above doesn't work, Firebase Sign-In Methods might also need configuration:

1. Go to **Firebase Console** (https://console.firebase.google.com/)
2. Select project **et3am26**
3. Go to **Authentication** → **Sign-in method**
4. Click **Google**
5. Check that these are configured:
   - ✅ Enable Google Sign-In
   - ✅ Project Support Email set correctly
   - ✅ Web Client ID matches Google Cloud Console

## Technical Details

### How Firebase Google Sign-In Works

```
1. User clicks "Sign in with Google"
   ↓
2. FirebaseAuth.signInWithPopup() opens OAuth consent screen
   ↓
3. User grants permission on Google's OAuth screen
   ↓
4. Google redirects to: https://[YOUR_DOMAIN]/__/auth/handler
   ↓
5. Firebase's handler processes the redirect
   ↓
6. User is authenticated in Firebase
   ↓
7. Frontend gets idToken
   ↓
8. Frontend sends idToken to backend /api/auth/google
   ↓
9. Backend verifies with Firebase Admin SDK
   ↓
10. User logged in!
```

The `/__/auth/handler` is a Firebase internal endpoint that handles OAuth redirects.

## Debugging

### If Still Getting Error After Changes:

1. **Clear browser cache:**
   ```javascript
   // In browser console
   localStorage.clear()
   sessionStorage.clear()
   // Refresh page
   ```

2. **Check Google Cloud Console shows the URI:**
   ```
   https://console.cloud.google.com/
   → APIs & Services
   → Credentials
   → Your OAuth Client ID
   → Should list your URIs under "Authorized redirect URIs"
   ```

3. **Check Firebase shows the domain:**
   ```
   https://console.firebase.google.com/
   → et3am26 project
   → Project Settings
   → Your apps
   → Web app
   → Should list et3am.com as authorized domain
   ```

4. **Check browser console for errors:**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for any Firebase auth errors
   - Check Network tab - Google's redirect request

## If Custom Domain Not Linked

If et3am.com is not yet linked to Firebase Hosting, you need to:

1. Go to Firebase Console
2. Project **et3am26**
3. Hosting → Custom Domains
4. Add domain `et3am.com`
5. Follow verification steps
6. Wait for SSL certificate (24-48 hours)

## Prevention

To avoid this in the future:

1. **When adding custom domains:** Always add corresponding URIs to Google Cloud Console
2. **When changing domains:** Update both Firebase AND Google Cloud Console
3. **Test thoroughly:** Test OAuth flow after domain changes
4. **Allow propagation:** Give 5-10 minutes for Google to sync changes

## Files Affected

- Frontend: `frontend/src/firebase.ts` (no code change needed)
- Google Cloud Console: OAuth credentials (needs manual update)
- Firebase Console: Already configured (custom domain linked)

## Next Steps

1. [ ] Go to Google Cloud Console
2. [ ] Find OAuth 2.0 Client ID for Web
3. [ ] Add `https://et3am.com/__/auth/handler`
4. [ ] Save changes
5. [ ] Wait 5 minutes
6. [ ] Test login at https://et3am.com/login
7. [ ] Click "Sign in with Google"
8. [ ] Should work without error

---

**Created:** 2026-04-04  
**Status:** Awaiting manual Google Cloud Console update  
**Priority:** High - Blocking Google authentication
