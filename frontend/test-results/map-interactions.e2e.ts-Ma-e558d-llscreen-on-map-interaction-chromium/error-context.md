# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: map-interactions.e2e.ts >> Map Interactions >> should expand map to fullscreen on map interaction
- Location: tests\e2e\map-interactions.e2e.ts:45:3

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('.map-container .leaflet-container')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - navigation [ref=e4]:
      - generic [ref=e5]:
        - button "Menu" [ref=e6] [cursor=pointer]
        - link "إطعام v1.5.4" [ref=e10] [cursor=pointer]:
          - /url: /
          - generic [ref=e11]:
            - generic [ref=e12]: إطعام
            - generic [ref=e13]: v1.5.4
        - generic [ref=e15]:
          - link "🏠 Home" [ref=e16] [cursor=pointer]:
            - /url: /
            - generic [ref=e17]: 🏠
            - generic [ref=e18]: Home
          - link "🎁 Food Donations" [ref=e19] [cursor=pointer]:
            - /url: /donations
            - generic [ref=e20]: 🎁
            - generic [ref=e21]: Food Donations
        - generic [ref=e23]:
          - link "Login" [ref=e24] [cursor=pointer]:
            - /url: /login
          - link "Register" [ref=e25] [cursor=pointer]:
            - /url: /register
    - main [ref=e26]:
      - paragraph [ref=e29]: Loading...
    - contentinfo [ref=e30]:
      - generic [ref=e31]:
        - generic [ref=e32]:
          - generic [ref=e33]: 🤲
          - generic [ref=e34]: إطعام
          - paragraph [ref=e35]: A charitable platform connecting surplus food to those in need
        - link "🌐 et3am.com" [ref=e37] [cursor=pointer]:
          - /url: https://et3am.com
        - generic [ref=e38]:
          - paragraph [ref=e39]: © 2025 إطعام. All rights reserved.
          - paragraph [ref=e40]: "commit: dev | 4/7/2026 05:24 AM"
  - paragraph [ref=e41]: Running in emulator mode. Do not use with production credentials.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Map Interactions', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('/donations');
  6   |     await page.waitForTimeout(2000);
  7   |   });
  8   | 
  9   |   test('should display map container', async ({ page }) => {
  10  |     const mapContainer = page.locator('.map-container');
  11  |     await expect(mapContainer).toBeVisible();
  12  |   });
  13  | 
  14  |   test('should display markers or clusters on map', async ({ page }) => {
  15  |     const markers = page.locator('.map-container .leaflet-marker-icon');
  16  |     const clusters = page.locator('.map-container .marker-cluster-custom');
  17  |     
  18  |     const markersCount = await markers.count();
  19  |     const clustersCount = await clusters.count();
  20  |     
  21  |     expect(markersCount + clustersCount).toBeGreaterThanOrEqual(0);
  22  |   });
  23  | 
  24  |   test('should not trigger fullscreen on marker click', async ({ page }) => {
  25  |     const markers = page.locator('.map-container .leaflet-marker-icon');
  26  |     const markersCount = await markers.count();
  27  |     
  28  |     if (markersCount > 0) {
  29  |       const firstMarker = markers.first();
  30  |       const popupBefore = page.locator('.leaflet-popup').count();
  31  |       
  32  |       await firstMarker.click();
  33  |       await page.waitForTimeout(500);
  34  |       
  35  |       const popupAfter = page.locator('.leaflet-popup').count();
  36  |       const mapWrapper = page.locator('.map-container-wrapper');
  37  |       const isFullscreen = await mapWrapper.evaluate(el => 
  38  |         el.classList.contains('fullscreen')
  39  |       );
  40  |       
  41  |       expect(isFullscreen).toBe(false);
  42  |     }
  43  |   });
  44  | 
  45  |   test('should expand map to fullscreen on map interaction', async ({ page }) => {
  46  |     const mapContainer = page.locator('.map-container .leaflet-container');
> 47  |     await mapContainer.click();
      |                        ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  48  |     await page.waitForTimeout(300);
  49  |     
  50  |     const mapWrapper = page.locator('.map-container-wrapper');
  51  |     await expect(mapWrapper).toHaveClass(/fullscreen/);
  52  |   });
  53  | 
  54  |   test('should close fullscreen map with close button', async ({ page }) => {
  55  |     const mapContainer = page.locator('.map-container .leaflet-container');
  56  |     await mapContainer.click();
  57  |     await page.waitForTimeout(300);
  58  |     
  59  |     const closeBtn = page.locator('.map-fullscreen-close');
  60  |     await expect(closeBtn).toBeVisible();
  61  |     
  62  |     await closeBtn.click();
  63  |     await page.waitForTimeout(300);
  64  |     
  65  |     const mapWrapper = page.locator('.map-container-wrapper');
  66  |     await expect(mapWrapper).not.toHaveClass(/fullscreen/);
  67  |   });
  68  | });
  69  | 
  70  | test.describe('Home Page Hero Map', () => {
  71  |   test.beforeEach(async ({ page }) => {
  72  |     await page.goto('/');
  73  |     await page.waitForTimeout(3000);
  74  |   });
  75  | 
  76  |   test('should display hero map with donations', async ({ page }) => {
  77  |     const heroMap = page.locator('.hero-map');
  78  |     await expect(heroMap).toBeVisible();
  79  |     
  80  |     const leafletContainer = page.locator('.hero-map .leaflet-container');
  81  |     await expect(leafletContainer).toBeVisible();
  82  |   });
  83  | 
  84  |   test('should show donations count badge', async ({ page }) => {
  85  |     const badge = page.locator('.hero-map-badge');
  86  |     await expect(badge).toBeVisible();
  87  |     
  88  |     const badgeText = await badge.textContent();
  89  |     const countMatch = badgeText?.match(/(\d+)/);
  90  |     if (countMatch) {
  91  |       const count = parseInt(countMatch[1]);
  92  |       expect(count).toBeGreaterThanOrEqual(0);
  93  |     }
  94  |   });
  95  | 
  96  |   test('should display markers on hero map', async ({ page }) => {
  97  |     await page.waitForTimeout(2000);
  98  |     
  99  |     const markers = page.locator('.hero-map .leaflet-marker-icon');
  100 |     const clusters = page.locator('.hero-map .marker-cluster-custom');
  101 |     
  102 |     const hasMarkers = await markers.count() > 0;
  103 |     const hasClusters = await clusters.count() > 0;
  104 |     
  105 |     expect(hasMarkers || hasClusters).toBe(true);
  106 |   });
  107 | 
  108 |   test('should open marker popup on click', async ({ page }) => {
  109 |     await page.waitForTimeout(2000);
  110 |     
  111 |     const markers = page.locator('.hero-map .leaflet-marker-icon');
  112 |     const clusters = page.locator('.hero-map .marker-cluster-custom');
  113 |     
  114 |     const markersCount = await markers.count();
  115 |     const clustersCount = await clusters.count();
  116 |     
  117 |     if (markersCount > 0) {
  118 |       await markers.first().click();
  119 |       await page.waitForTimeout(500);
  120 |       
  121 |       const popup = page.locator('.hero-map .leaflet-popup');
  122 |       await expect(popup).toBeVisible();
  123 |     } else if (clustersCount > 0) {
  124 |       await clusters.first().click();
  125 |       await page.waitForTimeout(500);
  126 |     }
  127 |   });
  128 | 
  129 |   test('should not have mouse flickering on marker hover', async ({ page }) => {
  130 |     await page.waitForTimeout(2000);
  131 |     
  132 |     const markers = page.locator('.hero-map .leaflet-marker-icon');
  133 |     const markersCount = await markers.count();
  134 |     
  135 |     if (markersCount > 0) {
  136 |       const firstMarker = markers.first();
  137 |       
  138 |       const boundingBox = await firstMarker.boundingBox();
  139 |       if (boundingBox) {
  140 |         await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
  141 |         await page.waitForTimeout(200);
  142 |         
  143 |         const events: string[] = [];
  144 |         page.on('console', msg => {
  145 |           if (msg.type() === 'error') {
  146 |             events.push(msg.text());
  147 |           }
```