import { test, expect } from '@playwright/test';
import { BASE_URL } from './fixtures';

test.describe('User Registration Flow', () => {
  test('new user can register', async ({ page }) => {
    const timestamp = Date.now();
    const email = `newuser_${timestamp}@test.com`;
    const password = 'Test123456!';

    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="name"]', 'New Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirm_password"]', password);

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('dashboard');
  });
});

test.describe('Donation Listing Flow', () => {
  test('user can view donations list', async ({ page }) => {
    await page.goto(`${BASE_URL}/donations`);
    await page.waitForLoadState('networkidle');

    const hasContent = await page.locator('body').textContent();
    expect(hasContent?.length).toBeGreaterThan(0);
  });
});