# Google Cloud Console - Complete OAuth Setup

**What to Configure:** OAuth 2.0 Client ID (Web application)  
**Project:** et3am26  
**Time:** 10 minutes

## Complete Configuration Checklist

### Location in Console
```
Google Cloud Console
└── et3am26 project
    └── APIs & Services
        └── Credentials
            └── OAuth 2.0 Client IDs (Web application)
```

## Two Required Fields

### Field 1: Authorized JavaScript Origins

**What it is:** Domains where your frontend code runs  
**Why:** Security check to validate OAuth requests come from your domain  
**Error if missing:** CORS error, OAuth popup won't open

**Add these:**
```
https://et3am.com
https://www.et3am.com
https://et3am26.web.app
http://localhost:3000 (optional, for local dev)
http://localhost:5173 (optional, for local dev)
```

### Field 2: Authorized Redirect URIs

**What it is:** Where Google sends the user after authentication  
**Why:** Security check to validate OAuth response goes to your handler  
**Error if missing:** "Redirect URI mismatch" or "doesn't comply with OAuth policy"

**Add these:**
```
https://et3am.com/__/auth/handler
https://et3am26.firebaseapp.com/__/auth/handler
http://localhost:3000/__/auth/handler (optional, for local dev)
http://localhost:5173/__/auth/handler (optional, for local dev)
```

## Step-by-Step Instructions

### Step 1: Open Google Cloud Console
```
https://console.cloud.google.com/
Project: et3am26
```

### Step 2: Navigate to Credentials
```
Left sidebar:
├── APIs & Services
│   └── Credentials
```

### Step 3: Find Your OAuth Client ID
```
Should see:
├── OAuth 2.0 Client IDs
│   └── Web application (this is what you need)
│       └── Name: Usually something like "Web client 1"
```

Click on it to edit.

### Step 4: Add Authorized JavaScript Origins

In the "Authorized JavaScript origins" section:

1. Click **Add URI**
2. Enter: `https://et3am.com`
3. Click **Add URI** again
4. Enter: `https://www.et3am.com`
5. Click **Add URI** again
6. Enter: `https://et3am26.web.app`

**Optional (for local development):**
7. Click **Add URI** again
8. Enter: `http://localhost:3000`
9. Click **Add URI** again
10. Enter: `http://localhost:5173`

### Step 5: Add Authorized Redirect URIs

In the "Authorized redirect URIs" section:

1. Click **Add URI**
2. Enter: `https://et3am.com/__/auth/handler`
3. Click **Add URI** again
4. Enter: `https://et3am26.firebaseapp.com/__/auth/handler`

**Optional (for local development):**
5. Click **Add URI** again
6. Enter: `http://localhost:3000/__/auth/handler`
7. Click **Add URI** again
8. Enter: `http://localhost:5173/__/auth/handler`

### Step 6: Save
Click the **Save** button at the bottom.

### Step 7: Wait
Wait 5-10 minutes for Google to sync the changes.

## Final Checklist

After completing all steps, verify you see:

```
✓ Authorized JavaScript origins:
  ├─ https://et3am.com
  ├─ https://www.et3am.com
  ├─ https://et3am26.web.app
  └─ (optional) http://localhost:3000, http://localhost:5173

✓ Authorized redirect URIs:
  ├─ https://et3am.com/__/auth/handler
  ├─ https://et3am26.firebaseapp.com/__/auth/handler
  └─ (optional) http://localhost:3000/__/auth/handler, http://localhost:5173/__/auth/handler
```

## Visual Guide

```
┌─ Google Cloud Console ─────────────────────────────────────┐
│ Project: et3am26                                           │
│                                                            │
│ APIs & Services > Credentials                             │
│                                                            │
│ OAuth 2.0 Client ID                                        │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Client ID: 670164562798-...                         │   │
│ │ Client Secret: GOCSPX-...                           │   │
│ │                                                     │   │
│ │ Authorized JavaScript origins:                      │   │
│ │ ┌─────────────────────────────────────────────────┐ │   │
│ │ │ https://et3am.com                               │ │   │
│ │ │ https://www.et3am.com                           │ │   │
│ │ │ https://et3am26.web.app                         │ │   │
│ │ └─────────────────────────────────────────────────┘ │   │
│ │                                                     │   │
│ │ Authorized redirect URIs:                           │   │
│ │ ┌─────────────────────────────────────────────────┐ │   │
│ │ │ https://et3am.com/__/auth/handler               │ │   │
│ │ │ https://et3am26.firebaseapp.com/__/auth/handler │ │   │
│ │ └─────────────────────────────────────────────────┘ │   │
│ │                                                     │   │
│ │ [SAVE]                                              │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## What Each Field Does

### JavaScript Origins
```
Browser makes request to Google:
"I'm at https://et3am.com, can I authenticate?"
        ↓
Google checks:
"Is https://et3am.com in Authorized JavaScript origins?"
        ↓
If YES → Allow OAuth flow ✅
If NO → CORS error ❌
```

### Redirect URIs
```
User authenticates with Google:
"I grant permission to et3am"
        ↓
Google redirects to:
https://et3am.com/__/auth/handler
        ↓
Google checks:
"Is this redirect URI authorized?"
        ↓
If YES → Send auth code to Firebase handler ✅
If NO → "Redirect URI mismatch" error ❌
```

## Testing After Setup

### Test 1: Check JavaScript Origins
```
1. Go to https://et3am.com/login
2. Click "Sign in with Google"
3. Google OAuth popup should open
4. If CORS error appears → JavaScript origin not added
```

### Test 2: Check Redirect URIs
```
1. In Google OAuth popup
2. Select your Google account
3. Grant permissions
4. Should redirect back to app
5. If "Redirect URI mismatch" error → URI not added correctly
```

## Common Mistakes

### ❌ Missing Trailing Slash
```
WRONG: https://et3am.com/
RIGHT: https://et3am.com
```

### ❌ Including Path in JavaScript Origins
```
WRONG: https://et3am.com/login
RIGHT: https://et3am.com
```

### ❌ Wrong Redirect URI Format
```
WRONG: https://et3am.com/__/auth
RIGHT: https://et3am.com/__/auth/handler
```

### ❌ Using Different Domain
```
WRONG: https://api.et3am.com/__/auth/handler
RIGHT: https://et3am.com/__/auth/handler
```

## Troubleshooting

### Issue: "CORS error" when clicking Google button
**Solution:** Add JavaScript origin to Authorized JavaScript origins

### Issue: "Redirect URI mismatch" error
**Solution:** Check Authorized redirect URIs match exactly

### Issue: OAuth popup won't open
**Solution:** Check JavaScript origin is added (refresh page first)

### Issue: Still not working after 5 minutes
**Solution:** 
1. Clear browser cache
2. Clear localStorage
3. Try incognito/private window
4. Check exact domain spelling

## Security Reminders

✅ **Do:**
- Use HTTPS for production domains
- Keep localhost for development only
- Review list regularly
- Only add domains you control

❌ **Don't:**
- Add wildcard domains (*.et3am.com)
- Add production domains to localhost
- Add domains you don't control
- Share this configuration publicly

---

**Time to complete:** 10 minutes (mostly waiting for Google to sync)  
**Status:** Ready to configure  
**Next step:** Go to Google Cloud Console and add the URIs
