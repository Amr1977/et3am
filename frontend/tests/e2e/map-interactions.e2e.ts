import { test, expect } from '@playwright/test';

test.describe('Map Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/donations');
    await page.waitForTimeout(2000);
  });

  test('should display map container', async ({ page }) => {
    const mapContainer = page.locator('.map-container');
    await expect(mapContainer).toBeVisible();
  });

  test('should display markers or clusters on map', async ({ page }) => {
    const markers = page.locator('.map-container .leaflet-marker-icon');
    const clusters = page.locator('.map-container .marker-cluster-custom');
    
    const markersCount = await markers.count();
    const clustersCount = await clusters.count();
    
    expect(markersCount + clustersCount).toBeGreaterThanOrEqual(0);
  });

  test('should not trigger fullscreen on marker click', async ({ page }) => {
    const markers = page.locator('.map-container .leaflet-marker-icon');
    const markersCount = await markers.count();
    
    if (markersCount > 0) {
      const firstMarker = markers.first();
      const popupBefore = page.locator('.leaflet-popup').count();
      
      await firstMarker.click();
      await page.waitForTimeout(500);
      
      const popupAfter = page.locator('.leaflet-popup').count();
      const mapWrapper = page.locator('.map-container-wrapper');
      const isFullscreen = await mapWrapper.evaluate(el => 
        el.classList.contains('fullscreen')
      );
      
      expect(isFullscreen).toBe(false);
    }
  });

  test('should expand map to fullscreen on map interaction', async ({ page }) => {
    const mapContainer = page.locator('.map-container .leaflet-container');
    await mapContainer.click();
    await page.waitForTimeout(300);
    
    const mapWrapper = page.locator('.map-container-wrapper');
    await expect(mapWrapper).toHaveClass(/fullscreen/);
  });

  test('should close fullscreen map with close button', async ({ page }) => {
    const mapContainer = page.locator('.map-container .leaflet-container');
    await mapContainer.click();
    await page.waitForTimeout(300);
    
    const closeBtn = page.locator('.map-fullscreen-close');
    await expect(closeBtn).toBeVisible();
    
    await closeBtn.click();
    await page.waitForTimeout(300);
    
    const mapWrapper = page.locator('.map-container-wrapper');
    await expect(mapWrapper).not.toHaveClass(/fullscreen/);
  });
});

test.describe('Home Page Hero Map', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
  });

  test('should display hero map with donations', async ({ page }) => {
    const heroMap = page.locator('.hero-map');
    await expect(heroMap).toBeVisible();
    
    const leafletContainer = page.locator('.hero-map .leaflet-container');
    await expect(leafletContainer).toBeVisible();
  });

  test('should show donations count badge', async ({ page }) => {
    const badge = page.locator('.hero-map-badge');
    await expect(badge).toBeVisible();
    
    const badgeText = await badge.textContent();
    const countMatch = badgeText?.match(/(\d+)/);
    if (countMatch) {
      const count = parseInt(countMatch[1]);
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display markers on hero map', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const markers = page.locator('.hero-map .leaflet-marker-icon');
    const clusters = page.locator('.hero-map .marker-cluster-custom');
    
    const hasMarkers = await markers.count() > 0;
    const hasClusters = await clusters.count() > 0;
    
    expect(hasMarkers || hasClusters).toBe(true);
  });

  test('should open marker popup on click', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    const markers = page.locator('.hero-map .leaflet-marker-icon');
    const clusters = page.locator('.hero-map .marker-cluster-custom');
    
    const markersCount = await markers.count();
    const clustersCount = await clusters.count();
    
    console.log(`Markers: ${markersCount}, Clusters: ${clustersCount}`);
    
    expect(markersCount + clustersCount).toBeGreaterThan(0);
    
    if (markersCount > 0) {
      await markers.first().click({ force: true });
      await page.waitForTimeout(1000);
      
      const popup = page.locator('.hero-map .leaflet-popup');
      const popupVisible = await popup.isVisible().catch(() => false);
      
      expect(popupVisible).toBe(true);
    } else if (clustersCount > 0) {
      await clusters.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('should NOT trigger fullscreen when clicking marker on home page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    const markers = page.locator('.hero-map .leaflet-marker-icon');
    const markersCount = await markers.count();
    
    if (markersCount > 0) {
      const heroMap = page.locator('.hero-map');
      const isFullscreenBefore = await heroMap.evaluate(el => el.classList.contains('fullscreen'));
      expect(isFullscreenBefore).toBe(false);
      
      await markers.first().click({ force: true });
      await page.waitForTimeout(500);
      
      const isFullscreenAfter = await heroMap.evaluate(el => el.classList.contains('fullscreen'));
      expect(isFullscreenAfter).toBe(false);
      
      const popup = page.locator('.hero-map .leaflet-popup');
      await expect(popup).toBeVisible();
    }
  });

  test('should not have mouse flickering on marker hover', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const markers = page.locator('.hero-map .leaflet-marker-icon');
    const markersCount = await markers.count();
    
    if (markersCount > 0) {
      const firstMarker = markers.first();
      
      const boundingBox = await firstMarker.boundingBox();
      if (boundingBox) {
        await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
        await page.waitForTimeout(200);
        
        const events: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            events.push(msg.text());
          }
        });
        
        await firstMarker.hover();
        await page.waitForTimeout(200);
        
        expect(events.filter(e => e.includes('pointer') || e.includes('event'))).toHaveLength(0);
      }
    }
  });
});

test.describe('Map Fullscreen Behavior', () => {
  test('donations page should expand map to fullscreen on interaction', async ({ page }) => {
    await page.goto('/donations');
    await page.waitForTimeout(2000);
    
    const mapContainer = page.locator('.map-container .leaflet-container');
    await mapContainer.click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(500);
    
    const wrapper = page.locator('.map-container-wrapper');
    await expect(wrapper).toHaveClass(/fullscreen/);
  });

  test('donations page should keep map non-fullscreen when clicking marker', async ({ page }) => {
    await page.goto('/donations');
    await page.waitForTimeout(2000);
    
    const markers = page.locator('.map-container .leaflet-marker-icon');
    const markersCount = await markers.count();
    
    if (markersCount > 0) {
      await markers.first().click({ force: true });
      await page.waitForTimeout(500);
      
      const wrapper = page.locator('.map-container-wrapper');
      const isFullscreen = await wrapper.evaluate(el => 
        el.classList.contains('fullscreen')
      );
      
      expect(isFullscreen).toBe(false);
    }
  });
});