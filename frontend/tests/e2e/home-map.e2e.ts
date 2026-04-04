import { test, expect } from '@playwright/test';

test.describe('Home Page Map', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display hero map on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(1000);
    
    const heroMap = page.locator('.hero-map');
    await expect(heroMap).toBeVisible();
    
    const leafletContainer = page.locator('.hero-map .leaflet-container');
    await expect(leafletContainer).toBeVisible();
  });

  test('should display hero map on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const heroMap = page.locator('.hero-map');
    await expect(heroMap).toBeVisible();
    
    const leafletContainer = page.locator('.hero-map .leaflet-container');
    await expect(leafletContainer).toBeVisible();
  });

  test('should display hero map on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    const heroMap = page.locator('.hero-map');
    await expect(heroMap).toBeVisible();
    
    const leafletContainer = page.locator('.hero-map .leaflet-container');
    await expect(leafletContainer).toBeVisible();
  });

  test('should display map badge with donations count', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(2000);
    
    const badge = page.locator('.hero-map-badge');
    await expect(badge).toBeVisible();
  });

  test('should display map markers or clusters', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(2000);
    
    const markers = page.locator('.hero-map .leaflet-marker-icon');
    const clusters = page.locator('.hero-map .marker-cluster-custom');
    
    const hasMarkers = await markers.count();
    const hasClusters = await clusters.count();
    
    expect(hasMarkers + hasClusters).toBeGreaterThan(0);
  });
});

test.describe('Mobile Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display hamburger menu on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const hamburger = page.locator('.hamburger');
    await expect(hamburger).toBeVisible();
  });

  test('should open mobile menu when hamburger clicked', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const hamburger = page.locator('.hamburger');
    await hamburger.click();
    await page.waitForTimeout(500);
    
    const mobileMenu = page.locator('.navbar-links.mobile-open');
    await expect(mobileMenu).toBeVisible();
  });

  test('should have admin link in nav for admin users', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const hamburger = page.locator('.hamburger');
    await hamburger.click();
    await page.waitForTimeout(500);
    
    const adminLink = page.locator('.nav-link:has-text("Admin")');
    await expect(adminLink).toBeVisible();
  });
});
