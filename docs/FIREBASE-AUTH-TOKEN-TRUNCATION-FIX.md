# 🔐 Firebase Auth Token Integrity Fix & Hardening Guide

**Date:** April 5, 2026  
**Status:** ✅ FIXED & HARDENED  
**Severity:** Critical (Login blocked for all Google OAuth users)

---

## Context

The system experienced authentication failures during Google OAuth login due to **invalid Firebase ID token signatures**.

### Root Cause

The backend middleware (`sanitizeRequest`) was **truncating the Firebase ID token** from ~1160 characters to 1000 characters:
- This **cut off part of the JWT signature**
- Resulted in **cryptographic verification failure**
- Produced misleading errors like:
  - `auth.invalid_token`
  - `invalid signature`
  - `kid not found`

---

## 🎯 Objective

Fix the token corruption issue and implement **robust safeguards** to prevent similar failures in the future.

---

## ✅ Step 1 — Fix Token Truncation

### File: `backend/src/utils/sanitizers.ts`

### Problematic Code:
```ts
const sanitizeString = (str: unknown, maxLength = 1000): string => {
  if (typeof str !== 'string') return '';
  return str.trim().substring(0, maxLength).replace(/[<>"'&]/g, '');
};
```

### Fix:
Increase max length OR bypass sanitization for tokens.

#### Option A (Quick Fix)
```ts
const sanitizeString = (str: unknown, maxLength = 10000): string => {
  if (typeof str !== 'string') return '';
  return str.trim().substring(0, maxLength).replace(/[<>"'&]/g, '');
};
```

---

## ✅ Step 2 — Exclude Tokens from Sanitization (RECOMMENDED)

### Modify sanitizer logic:
```ts
const RAW_FIELDS = ['token', 'idToken', 'authorization'];

function sanitizeInput(key: string, value: unknown) {
  if (RAW_FIELDS.includes(key)) {
    return value; // 🔥 DO NOT MODIFY TOKENS
  }
  if (typeof value === 'string') {
    return sanitizeString(value);
  }
  return value;
}
```

---

## ✅ Step 3 — Add Token Integrity Validation

### Backend (before verification):
```ts
function validateJWTStructure(token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed JWT: invalid structure');
  }
  if (token.length < 1000) {
    throw new Error('Suspicious token: too short');
  }
}
```

### Use it:
```ts
validateJWTStructure(token);
const decoded = await admin.auth().verifyIdToken(token);
```

---

## ✅ Step 4 — Add Debug Logging (Temporary)

### Backend:
```ts
console.log('Token length:', token.length);
const payload = JSON.parse(
  Buffer.from(token.split('.')[1], 'base64').toString());
console.log('ISS:', payload.iss);
console.log('AUD:', payload.aud);
```

---

## ✅ Step 5 — Ensure Correct Token Source (Frontend)

### ONLY use Firebase ID token:
```ts
const user = auth.currentUser;
const idToken = await user.getIdToken(); // ✅ Correct
```

### DO NOT use:
```ts
result.credential.idToken // ❌ Google token
```

---

## ✅ Step 6 — Secure Middleware Design

### Rule:
> Never mutate cryptographically signed data

### Recommended Middleware Strategy

#### 1. Apply sanitization ONLY to:
- user input fields (forms, text inputs)
- query params

#### 2. NEVER sanitize:
- tokens
- passwords
- hashes
- binary/base64 data

---

## ✅ Step 7 — Add Monitoring & Alerts

### Add checks:
```ts
if (token.length < 1000 || token.length > 20000) {
  console.warn('Abnormal token length:', token.length);
}
```

---

## ✅ Step 8 — Integration Test (CRITICAL)

Create a test to ensure tokens are not modified:
```ts
test('Firebase token integrity preserved', async () => {
  const originalToken = await getTestFirebaseToken();
  const response = await request(app)
    .post('/api/auth/google')
    .send({ idToken: originalToken });
  expect(response.status).not.toBe(401);
});
```

---

## 🧠 Key Engineering Lessons

1. **JWTs are signed artifacts**
   - Any modification invalidates them

2. **Security middleware can introduce bugs**
   - Especially when applied globally

3. **Length limits must consider real-world data**
   - Firebase tokens ≈ 1000–1500 chars

4. **Always log before and after boundaries**
   - Frontend vs backend comparison is critical

---

## 🛡️ Final Architecture Rule

```
[Frontend]   → (raw token)
[Transport]  → (no mutation)
[Backend]    → (validate structure)
[Verify Token] →
[Authenticated User]
```

---

## ✅ Final Checklist

- [x] Token not truncated
- [x] Tokens excluded from sanitization
- [x] JWT structure validated
- [x] Correct token type used (Firebase ID token)
- [x] Logging added for debugging
- [x] Integration test added
- [x] Middleware hardened

---

## 🏁 Summary

The failure was caused by **token truncation in middleware**, not Firebase or Google.

> Fixing input handling and protecting token integrity fully resolves the issue.
