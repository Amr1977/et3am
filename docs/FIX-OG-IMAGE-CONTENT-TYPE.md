# Fix: OG Image Content Type Issue

## Problem
Social media crawlers were unable to process the OG image:
```
https://et3am.com/et3am-og.png?v=3 could not be processed as an image because it has an invalid content type
```

Server responses showed:
- Status: 404 Not Found
- Content-Type: text/html; charset=utf-8

## Root Cause
Firebase Hosting was rewriting PNG requests to index.html despite the SPA rewrite exclusion rule. The file existed in dist/ but wasn't being deployed or was being overwritten by the rewrite rule.

## Solution
Rebuilt and redeployed frontend to ensure:
1. OG image file (`dist/et3am-og.png`) is included in build
2. Firebase rewrite rules correctly exclude `.png` files
3. PNG Content-Type headers are applied

## Verification
After redeployment, both URLs now work correctly:

```bash
# Without query parameter
curl -I https://et3am.com/et3am-og.png
# HTTP/1.1 200 OK
# Content-Type: image/png
# Content-Length: 1600089

# With query parameter
curl -I https://et3am.com/et3am-og.png?v=3
# HTTP/1.1 200 OK
# Content-Type: image/png
```

## Firebase Configuration
The following rules in `firebase.json` ensure proper serving:

**Headers** (lines 9-22):
- Matches `**/*.png`
- Sets Content-Type: image/png
- Sets long-term cache (31536000 seconds)

**Rewrites** (lines 33-38):
- Excludes `.png` files from SPA rewrite
- Pattern: `!**/*.@(js|css|jpg|jpeg|png|gif|webp|svg|ico|json|xml|txt|woff|woff2|ttf|eot)`

## Impact
✅ Social media crawlers can now process OG image
✅ Link previews will display correctly on Facebook, Twitter, LinkedIn, etc.
✅ Image is cached long-term at edge locations
✅ Query parameters don't bypass content type headers
