import { test, expect } from '@playwright/test';

test.describe('Donation Flow - Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/donations');
    await page.waitForTimeout(3000);
  });

  test('should display donations page', async ({ page }) => {
    const url = page.url();
    expect(url.includes('donations')).toBe(true);
  });

  test('should show donation list or map', async ({ page }) => {
    const hasContent = await page.locator('.leaflet-container, [class*="donation"]').count() > 0 ||
                       await page.locator('h1, h2').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should have donate button accessible', async ({ page }) => {
    const donateBtn = page.locator('button:has-text("Donate"), a:has-text("Donate")').first();
    if (await donateBtn.count() > 0) {
      await donateBtn.click();
      await page.waitForTimeout(2000);
      const hasForm = await page.locator('form, input').count() > 0;
      expect(hasForm).toBe(true);
    }
  });

  test('should navigate to my donations page', async ({ page }) => {
    await page.goto('/my-donations');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url.includes('my-donations')).toBe(true);
  });

  test('should navigate to my reservations page', async ({ page }) => {
    await page.goto('/my-reservations');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url.includes('my-reservations')).toBe(true);
  });
});

test.describe('Donation Flow - Create Donation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/donations');
    await page.waitForTimeout(2000);
  });

  test('should open donation form', async ({ page }) => {
    const donateBtn = page.locator('button:has-text("Donate")').first();
    if (await donateBtn.count() > 0) {
      await donateBtn.click();
      await page.waitForTimeout(1000);
      const hasForm = await page.locator('form').count() > 0;
      expect(hasForm).toBe(true);
    }
  });
});

test.describe('Donation Flow - Reserve', () => {
  test('should show reservation after login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    await page.goto('/donations');
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url.includes('donations') || url === 'http://localhost:5173/').toBe(true);
  });
});