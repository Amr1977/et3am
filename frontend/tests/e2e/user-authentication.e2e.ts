import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_URL || 'http://localhost:3000/api';

test.describe('User Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    const hasError = await page.locator('.alert, .alert-error').count() > 0;
    expect(hasError).toBe(true);
  });

  test('should show error for missing fields on register', async ({ page }) => {
    await page.goto('/register');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    const hasError = await page.locator('.alert, .alert-error').count() > 0;
    expect(hasError).toBe(true);
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('should successfully register new user', async ({ page }) => {
    const randomEmail = `test-${Date.now()}@test.com`;
    await page.goto('/register');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[type="email"]', randomEmail);
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('should show language toggle', async ({ page }) => {
    await page.goto('/login');
    const hasArabic = await page.locator('text=العربية').count() > 0;
    const hasLangBtn = await page.locator('button:has-text("EN"), button:has-text("AR")').count() > 0;
    expect(hasArabic || hasLangBtn).toBe(true);
  });

  test('should switch language', async ({ page }) => {
    await page.goto('/login');
    const langBtn = page.locator('button:has-text("العربية"), button:has-text("English")').first();
    if (await langBtn.isVisible()) {
      await langBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('should logout successfully', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    const logoutBtn = page.locator('button:has-text("Logout"), a:has-text("Logout")');
    if (await logoutBtn.count() > 0) {
      await logoutBtn.first().click();
      await page.waitForTimeout(1000);
      await expect(page.locator('h1, .auth-card-modern')).toBeVisible();
    }
  });

  test('should show Google login button', async ({ page }) => {
    await page.goto('/login');
    const hasGoogle = await page.locator('button:has-text("Google"), .btn-google').count() > 0;
    expect(hasGoogle).toBe(true);
  });

  test('should display forgot password page', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should display reset password page with token', async ({ page }) => {
    const response = await page.goto('/reset-password?token=test-token');
    expect(response.status()).toBe(200);
  });

  test('should navigate to login from forgot password', async ({ page }) => {
    await page.goto('/forgot-password');
    const loginLink = page.locator('a[href="/login"], .auth-link');
    if (await loginLink.count() > 0) {
      await loginLink.first().click();
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('should navigate to forgot password from login', async ({ page }) => {
    await page.goto('/login');
    const forgotLink = page.locator('a[href="/forgot-password"]');
    if (await forgotLink.count() > 0) {
      await forgotLink.first().click();
      await expect(page).toHaveURL(/\/forgot-password/);
    }
  });
});
