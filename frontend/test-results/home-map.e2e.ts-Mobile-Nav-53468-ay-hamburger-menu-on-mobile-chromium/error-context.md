# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home-map.e2e.ts >> Mobile Navigation >> should display hamburger menu on mobile
- Location: tests\e2e\home-map.e2e.ts:68:3

# Error details

```
Error: page.goto: Page crashed
Call log:
  - navigating to "http://localhost:5173/", waiting until "load"

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
> 65  |     await page.goto('/');
      |                ^ Error: page.goto: Page crashed
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
  97  |     await expect(adminLink).toBeVisible();
  98  |   });
  99  | });
  100 | 
```