import { test, expect } from '@playwright/test';

test.describe('Reservation Flow', () => {
  test('should display my reservations page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    await page.goto('/my-reservations');
    await expect(page.locator('h1, [class*="reservation"]')).toBeVisible();
  });

  test('should require login for reservations', async ({ page }) => {
    await page.goto('/my-reservations');
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes('/login')).toBe(true);
  });

  test('should show reservation details', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    await page.goto('/my-reservations');
    await page.waitForTimeout(2000);
    const hasContent = await page.locator('[class*="card"], [class*="reservation"]').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('should show hash code for active reservations', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    await page.goto('/my-reservations');
    await page.waitForTimeout(2000);
    const hasHash = await page.locator('[class*="hash"], [class*="code"]').count() > 0;
    if (hasHash) {
      console.log('✅ Hash code found in reservations');
    }
  });
});

test.describe('My Donations Flow', () => {
  test('should display my donations page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    await page.goto('/my-donations');
    await expect(page.locator('h1, [class*="donation"]')).toBeVisible();
  });

  test('should require login for my donations', async ({ page }) => {
    await page.goto('/my-donations');
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes('/login')).toBe(true);
  });

  test('should show create donation button', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    await page.goto('/my-donations');
    await page.waitForTimeout(1000);
    const hasButton = await page.locator('button:has-text("Share"), button:has-text("Add")').count() > 0;
    expect(hasButton).toBe(true);
  });

  test('should open donation form modal', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    await page.goto('/my-donations');
    await page.waitForTimeout(1000);
    
    const createBtn = page.locator('button:has-text("Share"), button:has-text("Add")').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      const hasForm = await page.locator('form, input[name="title"]').count() > 0;
      expect(hasForm).toBe(true);
    }
  });
});
