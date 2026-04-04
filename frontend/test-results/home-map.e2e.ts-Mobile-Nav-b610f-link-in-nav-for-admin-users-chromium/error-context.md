# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home-map.e2e.ts >> Mobile Navigation >> should have admin link in nav for admin users
- Location: tests\e2e\home-map.e2e.ts:88:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.nav-link:has-text("Admin")')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.nav-link:has-text("Admin")')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - navigation [ref=e4]:
      - generic [ref=e5]:
        - button "Menu" [expanded] [active] [ref=e6] [cursor=pointer]
        - link "إطعام" [ref=e9] [cursor=pointer]:
          - /url: /
          - img [ref=e11]
          - generic [ref=e13]: إطعام
        - generic [ref=e14]:
          - generic [ref=e15]:
            - generic [ref=e16]: الرئيسية
            - link "🏠 الرئيسية" [ref=e17] [cursor=pointer]:
              - /url: /
              - generic [ref=e18]: 🏠
              - generic [ref=e19]: الرئيسية
            - link "🎁 التبرعات" [ref=e20] [cursor=pointer]:
              - /url: /donations
              - generic [ref=e21]: 🎁
              - generic [ref=e22]: التبرعات
          - generic [ref=e24]:
            - link "دخول" [ref=e25] [cursor=pointer]:
              - /url: /login
            - link "تسجيل" [ref=e26] [cursor=pointer]:
              - /url: /register
        - generic [ref=e27]:
          - button "theme.light" [ref=e28] [cursor=pointer]:
            - img [ref=e29]
          - button "EN" [ref=e31] [cursor=pointer]:
            - img
            - generic [ref=e34]: EN
    - main [ref=e36]:
      - generic [ref=e37]:
        - generic [ref=e38]:
          - generic [ref=e39]:
            - generic [ref=e40]:
              - generic [ref=e41]: ✨
              - generic [ref=e42]: منصة إطعام
            - heading "إطعام" [level=1] [ref=e43]
            - paragraph [ref=e44]: ﴿وَيُطْعِمُونَ الطَّعَامَ عَلَى حُبِّهِ مِسْكِينًا وَيَتِيمًا وَأَسِيرًا ۝ إِنَّمَا نُطْعِمُكُمْ لِوَجْهِ اللَّهِ لَا نُرِيدُ مِنكُمْ جَزَاءً وَلَا شُكُورًا﴾ — سورة الإنسان الآيتان ٨-٩
            - generic [ref=e45]:
              - link "ابدأ الإطعام" [ref=e46] [cursor=pointer]:
                - /url: /register
              - link "تصفح الإطعام" [ref=e47] [cursor=pointer]:
                - /url: /donations
          - generic [ref=e52]:
            - generic [ref=e53]: 🗺️
            - generic [ref=e54]: 0 التبرعات
        - generic [ref=e55]:
          - generic [ref=e56]:
            - generic [ref=e57]: كيف نعمل
            - heading "كيف نعمل" [level=2] [ref=e58]
            - paragraph [ref=e59]: أضف طعامك الفائض بالتفاصيل.
          - generic [ref=e60]:
            - generic [ref=e61]:
              - generic [ref=e62]: 🍽️
              - generic [ref=e63]: "1"
              - heading "انشر" [level=3] [ref=e64]
              - paragraph [ref=e65]: أضف طعامك الفائض بالتفاصيل. حدد موقع التسليم - هويتك تبقى خاصة.
              - generic [ref=e66]: المتبرع
            - generic [ref=e67]: ←
            - generic [ref=e68]:
              - generic [ref=e69]: 🔍
              - generic [ref=e70]: "2"
              - heading "تصفح واحجز" [level=3] [ref=e71]
              - paragraph [ref=e72]: اعثر على الوجبات المتاحة بالقرب منك واحجز ما تحتاجه.
              - generic [ref=e73]: المتلقي
            - generic [ref=e74]: ←
            - generic [ref=e75]:
              - generic [ref=e76]: 🤲
              - generic [ref=e77]: "3"
              - heading "استلام سريع" [level=3] [ref=e78]
              - paragraph [ref=e79]: التقي بالموقع وتحقق بالرمز السري. لا يتم تبادل أي معلومات شخصية.
              - generic [ref=e80]: الاستلام
        - generic [ref=e82]:
          - generic [ref=e83]:
            - generic [ref=e84]: ...
            - generic [ref=e85]: وجبات مُقدَّمة
          - generic [ref=e86]:
            - generic [ref=e87]: ...
            - generic [ref=e88]: متبرعين
          - generic [ref=e89]:
            - generic [ref=e90]: ...
            - generic [ref=e91]: مستفيدين
        - generic [ref=e93]:
          - img [ref=e95]
          - heading "ادعم التطوير" [level=2] [ref=e97]
          - paragraph [ref=e98]: مساهماتكم الكريمة تساعدنا على مواصلة تطوير ميزات جديدة لربط المزيد من الناس الفائض بالطعام للمحتاجين.
          - generic [ref=e99]:
            - generic [ref=e100]: رقم الجوال
            - generic [ref=e101]:
              - generic [ref=e102]: "01094450141"
              - button "نسخ" [ref=e103] [cursor=pointer]:
                - img [ref=e104]
                - generic [ref=e107]: نسخ
          - generic [ref=e108]:
            - generic [ref=e109]:
              - img [ref=e110]
              - generic [ref=e112]: Instapay
            - generic [ref=e113]:
              - img [ref=e114]
              - generic [ref=e116]: Vodafone Cash
          - paragraph [ref=e117]: جزاك الله خيراً على دعمك! 🤲
        - generic [ref=e120]:
          - heading "إطعام" [level=2] [ref=e121]
          - paragraph [ref=e122]: منصة خيرية لتوصيل الطعام الفائض للمحتاجين
          - generic [ref=e123]:
            - link "ابدأ الإطعام" [ref=e124] [cursor=pointer]:
              - /url: /register
            - link "تصفح الإطعام" [ref=e125] [cursor=pointer]:
              - /url: /donations
    - contentinfo [ref=e126]:
      - generic [ref=e127]:
        - generic [ref=e128]:
          - generic [ref=e129]: 🤲
          - generic [ref=e130]: إطعام
          - paragraph [ref=e131]: منصة خيرية لتوصيل الطعام الفائض للمحتاجين
        - link "🌐 et3am.com" [ref=e133] [cursor=pointer]:
          - /url: https://et3am.com
        - generic [ref=e134]:
          - paragraph [ref=e135]: © 2025 إطعام. All rights reserved.
          - paragraph [ref=e136]: "commit: dev | 4/4/2026 11:12 PM"
    - generic [ref=e137]: Signing in...
  - paragraph [ref=e138]: Running in emulator mode. Do not use with production credentials.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Home Page Map', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('/');
  6   |   });
  7   | 
  8   |   test('should display hero map on desktop', async ({ page }) => {
  9   |     await page.setViewportSize({ width: 1280, height: 800 });
  10  |     await page.waitForTimeout(1000);
  11  |     
  12  |     const heroMap = page.locator('.hero-map');
  13  |     await expect(heroMap).toBeVisible();
  14  |     
  15  |     const leafletContainer = page.locator('.hero-map .leaflet-container');
  16  |     await expect(leafletContainer).toBeVisible();
  17  |   });
  18  | 
  19  |   test('should display hero map on mobile', async ({ page }) => {
  20  |     await page.setViewportSize({ width: 375, height: 667 });
  21  |     await page.waitForTimeout(1000);
  22  |     
  23  |     const heroMap = page.locator('.hero-map');
  24  |     await expect(heroMap).toBeVisible();
  25  |     
  26  |     const leafletContainer = page.locator('.hero-map .leaflet-container');
  27  |     await expect(leafletContainer).toBeVisible();
  28  |   });
  29  | 
  30  |   test('should display hero map on tablet', async ({ page }) => {
  31  |     await page.setViewportSize({ width: 768, height: 1024 });
  32  |     await page.waitForTimeout(1000);
  33  |     
  34  |     const heroMap = page.locator('.hero-map');
  35  |     await expect(heroMap).toBeVisible();
  36  |     
  37  |     const leafletContainer = page.locator('.hero-map .leaflet-container');
  38  |     await expect(leafletContainer).toBeVisible();
  39  |   });
  40  | 
  41  |   test('should display map badge with donations count', async ({ page }) => {
  42  |     await page.setViewportSize({ width: 1280, height: 800 });
  43  |     await page.waitForTimeout(2000);
  44  |     
  45  |     const badge = page.locator('.hero-map-badge');
  46  |     await expect(badge).toBeVisible();
  47  |   });
  48  | 
  49  |   test('should display map markers or clusters', async ({ page }) => {
  50  |     await page.setViewportSize({ width: 1280, height: 800 });
  51  |     await page.waitForTimeout(2000);
  52  |     
  53  |     const markers = page.locator('.hero-map .leaflet-marker-icon');
  54  |     const clusters = page.locator('.hero-map .marker-cluster-custom');
  55  |     
  56  |     const hasMarkers = await markers.count();
  57  |     const hasClusters = await clusters.count();
  58  |     
  59  |     expect(hasMarkers + hasClusters).toBeGreaterThan(0);
  60  |   });
  61  | });
  62  | 
  63  | test.describe('Mobile Navigation', () => {
  64  |   test.beforeEach(async ({ page }) => {
  65  |     await page.goto('/');
  66  |   });
  67  | 
  68  |   test('should display hamburger menu on mobile', async ({ page }) => {
  69  |     await page.setViewportSize({ width: 375, height: 667 });
  70  |     await page.waitForTimeout(500);
  71  |     
  72  |     const hamburger = page.locator('.hamburger');
  73  |     await expect(hamburger).toBeVisible();
  74  |   });
  75  | 
  76  |   test('should open mobile menu when hamburger clicked', async ({ page }) => {
  77  |     await page.setViewportSize({ width: 375, height: 667 });
  78  |     await page.waitForTimeout(500);
  79  |     
  80  |     const hamburger = page.locator('.hamburger');
  81  |     await hamburger.click();
  82  |     await page.waitForTimeout(500);
  83  |     
  84  |     const mobileMenu = page.locator('.navbar-links.mobile-open');
  85  |     await expect(mobileMenu).toBeVisible();
  86  |   });
  87  | 
  88  |   test('should have admin link in nav for admin users', async ({ page }) => {
  89  |     await page.setViewportSize({ width: 375, height: 667 });
  90  |     await page.waitForTimeout(500);
  91  |     
  92  |     const hamburger = page.locator('.hamburger');
  93  |     await hamburger.click();
  94  |     await page.waitForTimeout(500);
  95  |     
  96  |     const adminLink = page.locator('.nav-link:has-text("Admin")');
> 97  |     await expect(adminLink).toBeVisible();
      |                             ^ Error: expect(locator).toBeVisible() failed
  98  |   });
  99  | });
  100 | 
```