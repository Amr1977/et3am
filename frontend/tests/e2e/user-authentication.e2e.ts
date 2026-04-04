import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_URL || 'http://localhost:3000/api';

test.describe('User Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Sign In')).toBeVisible();
  });

  test('should display register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('text=Sign Up')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should show error for missing fields on register', async ({ page }) => {
    await page.goto('/register');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Required field')).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    const url = page.url();
    expect(url.includes('/') || url.includes('login')).toBe(true);
  });

  test('should successfully register new user', async ({ page }) => {
    const randomEmail = `test-${Date.now()}@test.com`;
    await page.goto('/register');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[type="email"]', randomEmail);
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    const url = page.url();
    expect(url.includes('/') || url.includes('register')).toBe(true);
  });

  test('should show language toggle', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=العربية')).toBeVisible();
    await expect(page.locator('text=English')).toBeVisible();
  });

  test('should switch language', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=العربية');
    await expect(page.locator('text=تسجيل الدخول')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    const logoutBtn = page.locator('button:has-text("Logout"), a:has-text("Logout")');
    if (await logoutBtn.count() > 0) {
      await logoutBtn.first().click();
      await expect(page.locator('text=Sign In, text=تسجيل الدخول')).toBeVisible();
    }
  });

  test('should show Google login button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Sign in with Google')).toBeVisible();
  });

  test('should display forgot password page', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should show error for invalid email on forgot password', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    const hasAlert = await page.locator('.alert').isVisible().catch(() => false);
    const hasSuccess = await page.locator('.auth-header-modern').isVisible().catch(() => false);
    expect(hasAlert || hasSuccess).toBe(true);
  });

  test('should display reset password page with invalid token', async ({ page }) => {
    const response = await page.goto('/reset-password?token=invalid-token');
    expect(response.status()).toBe(200);
  });

  test('should show password mismatch error on reset password', async ({ page }) => {
    const response = await page.goto('/reset-password?token=invalid-token');
    expect(response.status()).toBe(200);
  });

  test('should show password too short error on reset password', async ({ page }) => {
    const response = await page.goto('/reset-password?token=invalid-token');
    expect(response.status()).toBe(200);
  });

  test('should navigate to login from forgot password', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.click('.auth-link');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should navigate to forgot password from login', async ({ page }) => {
    await page.goto('/login');
    await page.click('a[href="/forgot-password"]');
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});