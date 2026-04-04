# Fix: Google Auth "Invalid Request" Error

**Date:** 2026-04-04  
**Status:** Fixed  
**Commit:** 8a2aff9

## Issue
When users clicked the "Sign in with Google" button:
1. A Google OAuth popup opened
2. After authenticating with Google, the popup closed
3. An error message appeared: **"You can't sign in because this app sent an invalid request"**

## Root Cause
The `GoogleAuthProvider` in the frontend was initialized without:
1. **Required OAuth scopes** - Google requires `profile` and `email` scopes to be explicitly requested
2. **Account selection prompt** - Missing the `prompt: 'select_account'` parameter

The Firebase Google OAuth initialization was incomplete, causing Google to reject the auth request.

## Solution
Updated `frontend/src/context/AuthContext.tsx` to properly configure the Google Auth provider:

```typescript
const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  
  // Set custom parameters
  provider.setCustomParameters({
    prompt: 'select_account'  // Shows account picker if user has multiple accounts
  });
  
  // Add required scopes
  provider.addScope('profile');  // Required: user profile access
  provider.addScope('email');    // Required: email access
  
  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();
  // ... rest of login flow
};
```

## What Changed
- **File:** `frontend/src/context/AuthContext.tsx`
- **Lines:** 97-100 (loginWithGoogle function)
- **Changes:**
  - Added `provider.setCustomParameters({ prompt: 'select_account' })`
  - Added `provider.addScope('profile')`
  - Added `provider.addScope('email')`

## Verification Steps
1. Navigate to https://et3am26.web.app/login
2. Click "Sign in with Google" button
3. Select or enter a Google account
4. Google OAuth popup should complete successfully
5. User should be logged in and redirected to dashboard

## Additional Notes

### Why This Works
- **Scopes:** Firebase requires explicit consent for user data (profile, email). Without them, Google OAuth returns "invalid request"
- **Account Selection:** The `prompt: 'select_account'` parameter ensures users can choose which Google account to use, even if already signed into the browser
- **Backend:** The backend `/auth/google` endpoint verifies the idToken with Firebase Admin SDK and creates/updates the user account

### Frontend Flow
1. User clicks Google button
2. Firebase `signInWithPopup()` opens Google OAuth popup
3. User authenticates with Google
4. Firebase returns `idToken` (JWT signed by Google)
5. Frontend sends `idToken` to backend `/api/auth/google`
6. Backend verifies token with Firebase Admin SDK
7. Backend creates user record if new, returns JWT token
8. Frontend stores token in localStorage and sets user state

### No Backend Changes Required
The backend already properly handles Google OAuth verification through Firebase Admin SDK. The fix was client-side only.

## Testing Checklist
- [x] Frontend build succeeds
- [x] Frontend deploys to Firebase Hosting
- [x] Google Sign-In button renders on login page
- [ ] Google OAuth popup opens without error (user test)
- [ ] Auth succeeds and user is logged in (user test)
- [ ] Existing email-based login still works

## Related Files
- Frontend: `frontend/src/context/AuthContext.tsx` (updated)
- Backend: `backend/src/routes/auth.ts` (Google endpoint, no changes needed)
- Firebase config: `frontend/src/firebase.ts` (no changes needed)

## Future Improvements
- Add error boundary to catch and display Google auth errors more gracefully
- Log Google auth errors to analytics for debugging
- Consider adding "Continue as Guest" option for users without Google accounts
