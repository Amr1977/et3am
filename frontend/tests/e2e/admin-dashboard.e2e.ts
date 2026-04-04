import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('should show 403 for non-admin', async ({ page }) => {
    await expect(page.locator('text=Admin access required')).toBeVisible();
  });

  test('should display admin stats page', async ({ page }) => {
    await expect(page.locator('text=Statistics')).toBeVisible();
  });

  test('should display users chart', async ({ page }) => {
    await expect(page.locator('canvas'), '[class*="chart"]').toBeVisible();
  });

  test('should display donations chart', async ({ page }) => {
    await expect(page.locator('canvas'), '[class*="chart"]').toBeVisible();
  });

  test('should display status distribution', async ({ page }) => {
    await expect(page.locator('[class*="distribution"], [class*="status"]')).toBeVisible();
  });

  test('should show total users count', async ({ page }) => {
    await expect(page.locator('text=Total Users')).toBeVisible();
  });

  test('should show total donations count', async ({ page }) => {
    await expect(page.locator('text=Total Donations')).toBeVisible();
  });

  test('should navigate to admin users', async ({ page }) => {
    await page.click('text=Users');
    await expect(page.locator('text=Users')).toBeVisible();
  });

  test('should navigate to admin donations', async ({ page }) => {
    await page.click('text=Donations');
    await expect(page.locator('text=Donations')).toBeVisible();
  });

  test('should navigate to support tickets', async ({ page }) => {
    await page.click('text=Tickets');
    await expect(page.locator('text=Support Tickets')).toBeVisible();
  });

  test('should show audit log', async ({ page }) => {
    await page.click('text=Audit Log');
    await expect(page.locator('text=Audit Log')).toBeVisible();
  });

  test('should show top areas', async ({ page }) => {
    await expect(page.locator('text=Top Areas')).toBeVisible();
  });

  test('should display new users in last 30 days', async ({ page }) => {
    await expect(page.locator('text=New Users (30d)')).toBeVisible();
  });

  test('should display new donations in last 7 days', async ({ page }) => {
    await expect(page.locator('text=New Donations (7d)')).toBeVisible();
  });
});