import { test, expect } from '@playwright/test';

test.describe('Donations Map Popup Stability', () => {
  test.beforeEach(async ({ page }) => {
    // Mock donations API
    await page.route('**/api/donations*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          donations: [
            {
              id: 'test-donation-1',
              title: 'Test Meal',
              food_type: 'meat',
              quantity: 5,
              unit: 'portions',
              pickup_address: '123 Test St',
              latitude: 30.0444,
              longitude: 31.2357,
              status: 'available',
              donor_id: 'donor-1',
              created_at: new Date().toISOString()
            }
          ]
        })
      });
    });

    // Navigate to the donations page
    await page.goto('http://localhost:5173/donations');
    
    // Ensure we are in map view
    const mapButton = page.locator('button:has-text("Map")');
    if (await mapButton.isVisible()) {
      await mapButton.click();
    }
    
    // Wait for map to load
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('should open popup when clicking a marker on desktop', async ({ page }) => {
    // Wait for at least one marker to appear
    const marker = page.locator('.leaflet-marker-icon:not(.user-marker-container)').first();
    await expect(marker).toBeVisible({ timeout: 10000 });
    
    // Click the marker
    await marker.click({ force: true });
    
    // Verify popup is visible
    const popup = page.locator('.leaflet-popup-content');
    await expect(popup).toBeVisible();
    
    // Verify popup contains donation info (View Details link or Reserve button)
    await expect(popup.locator('text=View Details')).toBeVisible();
  });

  test('should keep popup open when clicking inside the popup', async ({ page }) => {
    const marker = page.locator('.leaflet-marker-icon:not(.user-marker-container)').first();
    await marker.click({ force: true });
    
    const popup = page.locator('.leaflet-popup-content');
    await expect(popup).toBeVisible();
    
    // Click inside the popup
    await popup.click();
    
    // Verify popup is STILL visible
    await expect(popup).toBeVisible();
  });

  test('should not trigger fullscreen when clicking a marker', async ({ page }) => {
    const marker = page.locator('.leaflet-marker-icon:not(.user-marker-container)').first();
    await marker.click({ force: true });
    
    // The map-container-wrapper should NOT have the 'fullscreen' class
    const wrapper = page.locator('.map-container-wrapper');
    await expect(wrapper).not.toHaveClass(/fullscreen/);
  });

  test('mobile: should open popup without flickering', async ({ page, isMobile }) => {
    // This test is more relevant for mobile viewport
    const marker = page.locator('.leaflet-marker-icon:not(.user-marker-container)').first();
    await expect(marker).toBeVisible({ timeout: 10000 });
    
    // Click/Tap the marker
    await marker.tap().catch(() => marker.click({ force: true }));
    
    // Verify popup is visible and STAYS visible for at least 2 seconds (checking for flicker/auto-close)
    const popup = page.locator('.leaflet-popup-content');
    await expect(popup).toBeVisible();
    
    await page.waitForTimeout(2000);
    await expect(popup).toBeVisible();
  });
});
