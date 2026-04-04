# Google Cloud Console - Quick Setup

**Goal:** Add OAuth configuration so Google can verify your requests  
**Time:** 10 minutes  
**Status:** ⏳ Needs manual configuration

## TL;DR - What to Add

Go to: https://console.cloud.google.com/  
Project: `et3am26`  
Path: **APIs & Services** → **Credentials** → **OAuth 2.0 Client ID (Web)**

### Add These JavaScript Origins:
```
https://et3am.com
https://www.et3am.com
https://et3am26.web.app
```

### Add These Redirect URIs:
```
https://et3am.com/__/auth/handler
https://et3am26.firebaseapp.com/__/auth/handler
```

### Click Save
Done! ✅

---

## What Does Each Do?

| Field | Purpose | Error If Missing |
|-------|---------|-----------------|
| **Authorized JavaScript Origins** | Validate "your domain makes this request" | CORS error, popup won't open |
| **Authorized Redirect URIs** | Validate "responses go to your domain" | "Redirect URI mismatch" |

---

## Testing

```
1. Go to https://et3am.com/login
2. Click "Sign in with Google"
   ├─ If popup opens → JavaScript origins ✅
   ├─ If CORS error → Add JavaScript origins ❌
3. Grant permissions
   ├─ If redirects back → Redirect URIs ✅
   ├─ If "mismatch" error → Fix redirect URIs ❌
```

---

## Authorized JavaScript Origins Explained

**JavaScript Origins = Where your frontend code runs**

When user clicks "Sign in with Google":
```
Frontend (JavaScript) says:
"I'm running at https://et3am.com"
        ↓
Google checks:
"Is https://et3am.com in the authorized list?"
        ↓
If YES → Open OAuth popup ✅
If NO → CORS error ❌
```

**This is CORS/security to prevent fake websites from stealing auth.**

---

## Screenshots

### Step 1: Navigate to Credentials
```
Google Cloud Console
└── et3am26
    └── APIs & Services
        └── Credentials
            └── OAuth 2.0 Client ID (Web)
```

### Step 2: Find These Sections
```
┌─ OAuth 2.0 Client ID ──────────────────────┐
│                                            │
│ Authorized JavaScript origins:             │
│ ├─ https://et3am.com                       │
│ ├─ https://www.et3am.com                   │
│ └─ https://et3am26.web.app                 │
│                                            │
│ Authorized redirect URIs:                  │
│ ├─ https://et3am.com/__/auth/handler       │
│ └─ https://et3am26.firebaseapp.com/...     │
│                                            │
│ [SAVE]                                     │
└────────────────────────────────────────────┘
```

---

## Why Two Different Things?

### 🔵 JavaScript Origins
- **When:** When user clicks "Sign in with Google" button
- **What:** Validates the button is on YOUR website
- **Example:** `https://et3am.com`

### 🔴 Redirect URIs
- **When:** After user authenticates with Google
- **What:** Validates where Google sends the auth response
- **Example:** `https://et3am.com/__/auth/handler`

**Both must be configured!**

---

## Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| OAuth popup won't open | Add to JavaScript Origins |
| "Redirect URI mismatch" error | Add to Redirect URIs |
| Still not working after 5 min | Clear browser cache, try incognito |
| Different domain shows error | Use exact domain (et3am.com not localhost) |

---

## Order of Operations

1. ✅ Add **Authorized JavaScript Origins**
2. ✅ Add **Authorized Redirect URIs**
3. ⏳ **SAVE**
4. ⏳ **Wait 5-10 minutes** (Google syncs)
5. ✅ **Test on https://et3am.com/login**

---

## Credentials for Reference

**Client ID:**
```
670164562798-uhlba9pgv8t720ef8tjq08qmc5t0kgge.apps.googleusercontent.com
```

**Secret:** (already configured on backend servers)

---

**Estimated time:** 5 minutes (+ 5 min Google sync)  
**Difficulty:** Easy - just copy-paste URIs  
**Breaks:** Nothing (fully reversible)

See `GOOGLE-CLOUD-CONSOLE-SETUP.md` for detailed step-by-step.
