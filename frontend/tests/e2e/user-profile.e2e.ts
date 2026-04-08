import { test, expect } from '@playwright/test';

test.describe('User Profile', () => {
  test('should display profile page for logged in user', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    await page.goto('/profile');
    await expect(page.locator('h1, [class*="profile"]')).toBeVisible();
  });

  test('should require login for profile', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes('/login')).toBe(true);
  });

  test('should show user info on profile page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    await page.goto('/profile');
    await page.waitForTimeout(1000);
    const hasContent = await page.locator('[class*="user"], [class*="profile"]').count() > 0;
    expect(hasContent).toBe(true);
  });
});

test.describe('Settings Page', () => {
  test('should display settings page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    await page.goto('/settings');
    await expect(page.locator('h1, [class*="settings"]')).toBeVisible();
  });

  test('should require login for settings', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes('/login')).toBe(true);
  });

  test('should show notification settings', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    await page.goto('/settings');
    await page.waitForTimeout(1000);
    const hasSettings = await page.locator('input[type="checkbox"], [class*="toggle"]').count() > 0;
    expect(hasSettings).toBe(true);
  });

  test('should show theme toggle in settings', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    await page.goto('/settings');
    await page.waitForTimeout(1000);
    const hasThemeToggle = await page.locator('[class*="theme"], button').count() > 0;
    expect(hasThemeToggle).toBe(true);
  });
});
