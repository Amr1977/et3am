import { test, expect } from '@playwright/test';

test.describe('BUG: Marker popup flickers when clicked on donations map', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/donations');
    await page.waitForTimeout(3000);
  });

  test('popup should stay visible after clicking a marker (no flicker)', async ({ page }) => {
    const donationsMap = page.locator('.donations-map');
    await expect(donationsMap).toBeVisible({ timeout: 5000 });

    const markers = page.locator('.donations-map .leaflet-marker-icon');
    const clusters = page.locator('.donations-map .marker-cluster-custom');

    const markersCount = await markers.count();
    const clustersCount = await clusters.count();

    expect(markersCount + clustersCount).toBeGreaterThanOrEqual(1);

    const target = markersCount > 0 ? markers.first() : clusters.first();
    const box = await target.boundingBox();
    if (!box) return;

    await target.click({ force: true });
    await page.waitForTimeout(300);

    const popup = page.locator('.donations-map .leaflet-popup');

    const stableChecks = [];
    for (let i = 0; i < 5; i++) {
      const visible = await popup.isVisible().catch(() => false);
      stableChecks.push(visible);
      if (!visible && markersCount > 0) {
        await markers.first().click({ force: true });
        await page.waitForTimeout(200);
        break;
      }
      await page.waitForTimeout(300);
    }

    expect(stableChecks.some(v => v)).toBe(true);
    const firstVisibleAt = stableChecks.indexOf(true);
    if (firstVisibleAt !== -1) {
      const remaining = stableChecks.slice(firstVisibleAt);
      const allStableAfter = remaining.every(v => v === true);
      expect(allStableAfter).toBe(true);
    }
  });

  test('popup should remain visible after repeated rapid marker clicks', async ({ page }) => {
    const markers = page.locator('.donations-map .leaflet-marker-icon');
    const markersCount = await markers.count();

    if (markersCount === 0) return;

    for (let i = 0; i < 3; i++) {
      await markers.first().click({ force: true });
      await page.waitForTimeout(100);
    }

    await page.waitForTimeout(500);

    const popup = page.locator('.donations-map .leaflet-popup:visible');
    const popupCount = await popup.count();

    expect(popupCount).toBe(1);
  });

  test('popup content should not disappear after map idle time', async ({ page }) => {
    const markers = page.locator('.donations-map .leaflet-marker-icon');
    const markersCount = await markers.count();

    if (markersCount === 0) return;

    await markers.first().click({ force: true });
    await page.waitForTimeout(300);

    const popup = page.locator('.donations-map .leaflet-popup');
    await expect(popup).toBeVisible({ timeout: 2000 });

    const contentBefore = await popup.textContent();

    await page.waitForTimeout(2000);

    const popupStillVisible = await popup.isVisible().catch(() => false);
    expect(popupStillVisible).toBe(true);

    if (popupStillVisible) {
      const contentAfter = await popup.textContent();
      expect(contentAfter?.length).toBe(contentBefore?.length);
    }
  });
});
