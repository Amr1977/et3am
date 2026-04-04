# Fix Open Graph Image Not Rendering (et3am.com)

## Context
- Domain: https://et3am.com
- Frontend: SPA (likely React) hosted on Firebase Hosting
- Issue: Open Graph image is not rendering on social platforms (Facebook, WhatsApp, LinkedIn)

### Error
Invalid Image Content Type

---

## Root Cause (Likely)
The Open Graph image URL:
https://et3am.com/et3am-og.png?v=3

is returning:
Content-Type: text/html ❌  
instead of:
Content-Type: image/png ✅

---

## Step 1: Verify HTTP Response

Run:
curl -I https://et3am.com/et3am-og.png?v=3

Expected:
Content-Type: image/png

If you see:
Content-Type: text/html
→ Fix required

---

## Step 2: Fix Static File Serving (Firebase)

Ensure the image exists in:
public/et3am-og.png

Update firebase.json:

{
  "hosting": {
    "public": "dist",
    "headers": [
      {
        "source": "**/*.png",
        "headers": [
          {
            "key": "Content-Type",
            "value": "image/png"
          }
        ]
      }
    ],
    "rewrites": [
      {
        "source": "!**/*.png",
        "destination": "/index.html"
      }
    ]
  }
}

IMPORTANT:
Do not let .png files be rewritten to index.html

---

## Step 3: Confirm File Access

Open in browser:
https://et3am.com/et3am-og.png

It must display the image directly (not a webpage)

---

## Step 4: Update Open Graph Tags

Add inside <head>:

<meta property="og:type" content="website" />
<meta property="og:url" content="https://et3am.com/" />
<meta property="og:title" content="شارك الطعام وقرّب الخير | Share Food, Bring Goodness Closer" />
<meta property="og:description" content="اعثر على وجبات قريبة وتبرّع بسهولة مع الحفاظ على الخصوصية — Find nearby meals and donate easily with privacy-first design." />
<meta property="og:image" content="https://et3am.com/et3am-og.png?v=4" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/png" />
<meta property="og:site_name" content="Et3am" />
<meta property="og:locale" content="ar_EG" />

---

## Step 5: Deploy

firebase deploy

---

## Step 6: Force Refresh Cache

Use:
- Facebook Sharing Debugger (Scrape Again)
- LinkedIn Post Inspector
- Twitter Card Validator

---

## Acceptance Criteria

✔ curl returns Content-Type: image/png  
✔ OG preview works on Facebook, WhatsApp, LinkedIn  
✔ No more errors  

---

## Notes

- Do NOT use SVG
- Use PNG (1200x630)
- Always use absolute URLs
- Use versioning (?v=4)

---

## Optional Enhancement

Use versioned images:
/og/og-home-v1.png  
/og/og-home-v2.png  

---

## Deliverables

- Fixed firebase.json
- Correct HTTP headers
- Working OG preview
