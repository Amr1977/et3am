import { test, expect } from '@playwright/test';

test.describe('Support Ticket Flow', () => {
  test('should display support page', async ({ page }) => {
    await page.goto('/support');
    await expect(page.locator('h1, [class*="title"]')).toBeVisible();
  });

  test('should show support form for logged in user', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    await page.goto('/support');
    await page.waitForTimeout(1000);
    const hasForm = await page.locator('form, input, textarea').count() > 0;
    expect(hasForm).toBe(true);
  });

  test('should require login for support', async ({ page }) => {
    await page.goto('/support');
    await page.waitForTimeout(1000);
    const url = page.url();
    const requiresLogin = url.includes('/login') || await page.locator('text=Login').count() > 0;
    expect(requiresLogin).toBe(true);
  });

  test('should show ticket types', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    await page.goto('/support');
    await page.waitForTimeout(1000);
    const hasTypeSelect = await page.locator('select, [class*="type"]').count() > 0;
    expect(hasTypeSelect).toBe(true);
  });
});
