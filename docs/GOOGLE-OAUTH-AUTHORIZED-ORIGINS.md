# Authorized JavaScript Origins

**What It Is:** A security feature that restricts which websites can make Google OAuth requests from JavaScript code.

## Simple Explanation

When you click "Sign in with Google" on a website:
1. **Frontend JavaScript** running in your browser makes a request to Google
2. Google needs to verify: "Is this request coming from a legitimate website?"
3. Google checks: "Is this domain in the Authorized JavaScript Origins list?"
4. If YES → Allow OAuth flow ✅
5. If NO → Reject request ❌

**Authorized JavaScript Origins = Whitelist of allowed domains**

## Why It Exists

Without this restriction, a malicious website could:
- Make OAuth requests pretending to be your legitimate site
- Steal user authentication tokens
- Impersonate your application

**Authorized JavaScript Origins prevent this by verifying the request source.**

## For Et3am

You need to add these JavaScript Origins in Google Cloud Console:

```
https://et3am.com
https://www.et3am.com
https://et3am26.web.app
http://localhost:3000
http://localhost:5173
```

## Why These Domains?

| Domain | Purpose |
|--------|---------|
| `https://et3am.com` | Production custom domain |
| `https://www.et3am.com` | www variant of custom domain |
| `https://et3am26.web.app` | Firebase default hosting domain |
| `http://localhost:3000` | Local development (alternative port) |
| `http://localhost:5173` | Local development (Vite default port) |

## How to Add Them

### In Google Cloud Console:

1. Go to https://console.cloud.google.com/
2. Select project **et3am26**
3. **APIs & Services** → **Credentials**
4. Click your OAuth 2.0 Client ID (Web application)
5. Under **Authorized JavaScript origins**, click **Add URI**
6. Add each domain:
   - `https://et3am.com`
   - `https://www.et3am.com`
   - `https://et3am26.web.app`
   - `http://localhost:3000` (optional, for local dev)
   - `http://localhost:5173` (optional, for local dev)

### Visual Example

```
Authorized JavaScript origins:
├── https://et3am.com
├── https://www.et3am.com
├── https://et3am26.web.app
├── http://localhost:3000 (optional)
└── http://localhost:5173 (optional)

Authorized redirect URIs:
├── https://et3am.com/__/auth/handler
├── https://et3am26.firebaseapp.com/__/auth/handler
├── http://localhost:3000/__/auth/handler (optional)
└── http://localhost:5173/__/auth/handler (optional)
```

**Note:** JavaScript origins are different from Redirect URIs!

## JavaScript Origins vs Redirect URIs

### Authorized JavaScript Origins
- **Where:** The domain where your frontend code runs
- **What:** Validates that the OAuth request comes from your domain
- **Error if missing:** CORS error, OAuth popup won't open
- **Examples:** `https://et3am.com`, `https://et3am26.web.app`

### Authorized Redirect URIs
- **Where:** Where Google sends the user AFTER authentication
- **What:** Validates that the OAuth response goes to your handler
- **Error if missing:** "Redirect URI mismatch" or "doesn't comply with OAuth policy"
- **Examples:** `https://et3am.com/__/auth/handler`, `https://et3am26.firebaseapp.com/__/auth/handler`

## Error Messages if Missing

### Missing JavaScript Origin
```
Error: "Cross-Origin Request Blocked"
or
CORS error in console
or
Google OAuth popup won't open
```

### Missing Redirect URI
```
Error: "You cannot sign in because this app 
does not comply with Google OAuth 2.0 policy"
or
"Redirect URI mismatch"
```

## Complete Checklist for Google Cloud Console

```
OAuth 2.0 Client ID Configuration:

Authorized JavaScript origins:
☐ https://et3am.com
☐ https://www.et3am.com
☐ https://et3am26.web.app

Authorized redirect URIs:
☐ https://et3am.com/__/auth/handler
☐ https://et3am26.firebaseapp.com/__/auth/handler
```

## Security Notes

### ✅ Good Practice
- Only add domains you control
- Use HTTPS for production
- Keep HTTP localhost for development only
- Review list periodically

### ⚠️ Don't Do
- Don't add wildcard domains like `https://*.com`
- Don't add random test domains
- Don't leave localhost in production
- Don't add domains you don't control

## Testing After Adding

After adding JavaScript origins, test:

```javascript
// Open browser console (F12)
// Go to https://et3am.com/login
// Click "Sign in with Google"

// Should NOT see:
// "Access to XMLHttpRequest at 'https://accounts.google.com/...' 
//  from origin 'https://et3am.com' has been blocked by CORS policy"
```

## Local Development Setup

If developing locally:

1. Add to Google Cloud Console:
   ```
   http://localhost:3000
   http://localhost:5173
   ```

2. Add corresponding redirect URIs:
   ```
   http://localhost:3000/__/auth/handler
   http://localhost:5173/__/auth/handler
   ```

3. Run frontend locally:
   ```bash
   cd frontend
   npm run dev
   ```

4. Test at `http://localhost:5173/login`

## Summary

| Term | Means | Example |
|------|-------|---------|
| **JavaScript Origins** | Where your frontend code runs (validates request source) | `https://et3am.com` |
| **Redirect URIs** | Where Google sends the user after auth (validates response destination) | `https://et3am.com/__/auth/handler` |

**Both are required for Google OAuth to work!**

## Step-by-Step Setup

1. ✅ Go to Google Cloud Console
2. ✅ Find OAuth Client ID
3. ✅ Add **Authorized JavaScript origins**:
   - `https://et3am.com`
   - `https://www.et3am.com`
   - `https://et3am26.web.app`
4. ✅ Add **Authorized redirect URIs**:
   - `https://et3am.com/__/auth/handler`
   - `https://et3am26.firebaseapp.com/__/auth/handler`
5. ✅ Save
6. ✅ Wait 5 minutes
7. ✅ Test!

---

**Key Takeaway:** Authorized JavaScript origins are a CORS/security check that verifies the OAuth request is coming from your legitimate domain.
