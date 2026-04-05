import { test, expect } from '@playwright/test';
import { BASE_URL } from '../scenarios/fixtures';

test.describe('Geolocation Modal Bug Tests', () => {
  test('should dismiss modal on enable location and process async', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (success: any) => {
            success({ coords: { latitude: 30.04, longitude: 31.24 } });
          }
        },
        writable: true
      });
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.location-prompt-card')).toBeVisible({ timeout: 10000 });

    await page.locator('button:has-text("Enable Location")').click();

    await expect(page.locator('.location-prompt-card')).not.toBeVisible();
  });

  test('should dismiss modal on cancel', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.location-prompt-card')).toBeVisible({ timeout: 10000 });

    await page.locator('button:has-text("Cancel")').click();

    await expect(page.locator('.location-prompt-card')).not.toBeVisible();
  });

  test('should dismiss modal on overlay click', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.location-prompt-card')).toBeVisible({ timeout: 10000 });

    await page.locator('.location-prompt-overlay').click();

    await expect(page.locator('.location-prompt-card')).not.toBeVisible();
  });
});