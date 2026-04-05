# Google Login Failure Debugging Guide (Et3am)

## Summary

Google login via Firebase is **working correctly**.  
The failure occurs in your backend endpoint:

```
POST /api/auth/google → 500 Internal Server Error
```

This document provides:
- Root cause analysis
- Fix steps
- Ready-to-use implementation
- AI agent prompt for auto-fixing

---

## Architecture Flow

```
Frontend (Firebase Google Auth)
        ↓
Get Firebase ID Token
        ↓
POST /api/auth/google
        ↓
Backend verifies token
        ↓
Create / fetch user
        ↓
Return session/user
```

---

## Root Cause

Your backend is failing to:

1. Verify Firebase ID token correctly
2. Handle request payload properly
3. Or initialize Firebase Admin SDK

---

## Step-by-Step Fix

### 1. Ensure Frontend Sends Correct Token

```js
const user = auth.currentUser;
const idToken = await user.getIdToken();

await fetch('/api/auth/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken })
});
```

---

### 2. Install Firebase Admin SDK

```
npm install firebase-admin
```

---

### 3. Initialize Firebase Admin

```js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
```

---

### 4. Correct Backend Endpoint

```js
app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Missing idToken' });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);

    const { uid, email, name, picture } = decoded;

    let user = await db.findUserByUid(uid);

    if (!user) {
      user = await db.createUser({
        uid,
        email,
        name,
        picture
      });
    }

    res.json({ success: true, user });

  } catch (err) {
    console.error('GOOGLE AUTH ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});
```

---

## Common Mistakes

### ❌ Using wrong token
- accessToken → WRONG
- credential → WRONG
- idToken → CORRECT

---

### ❌ Not initializing Firebase Admin

---

### ❌ Payload mismatch

Backend expects:
```
{ "idToken": "..." }
```

---

### ❌ Database crash

Check:
- duplicate keys
- null constraints
- connection issues

---

## Debugging Checklist

- [ ] Log backend errors
- [ ] Confirm idToken is sent
- [ ] Verify Firebase Admin is initialized
- [ ] Test endpoint manually (curl/Postman)
- [ ] Check DB operations

---

## Prevent Rate Limiting

Frontend fix:

```js
if (isLoggingIn) return;
isLoggingIn = true;
```

---

## AI Agent Fix Prompt

Use this prompt with your coding agent:

---

### PROMPT

You are debugging a Node.js backend endpoint `/api/auth/google` that fails with HTTP 500 after successful Firebase Google authentication.

Context:
- Frontend uses Firebase Authentication (Google provider)
- Authentication succeeds
- Backend receives request but crashes

Your tasks:

1. Ensure Firebase Admin SDK is installed and initialized
2. Verify backend uses:
   ```
   admin.auth().verifyIdToken(idToken)
   ```
3. Ensure request body contains:
   ```
   { idToken: string }
   ```
4. Add robust error handling and logging
5. Validate token before processing
6. Implement user creation or retrieval logic
7. Prevent duplicate users
8. Return structured JSON response

Output:
- Fully working `/api/auth/google` implementation
- Any required setup code
- Clear error handling

Constraints:
- Use Node.js + Express
- Do not use manual JWT decoding
- Use Firebase Admin SDK only

---

## Expected Outcome

After applying fixes:

- Google login succeeds
- Backend returns user
- No 500 errors
- No repeated requests
