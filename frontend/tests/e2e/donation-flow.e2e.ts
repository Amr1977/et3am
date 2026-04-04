import { test, expect } from '@playwright/test';

test.describe('Donation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/donations');
  });

  test('should display donate button', async ({ page }) => {
    await expect(page.locator('text=Donate')).toBeVisible();
  });

  test('should display available donations', async ({ page }) => {
    await expect(page.locator('.donation-card, [class*="donation"], article')).toBeVisible();
  });

  test('should filter donations by status', async ({ page }) => {
    await page.click('text=Available');
    await page.waitForTimeout(500);
  });

  test('should filter donations by food type', async ({ page }) => {
    await page.click('text=Cooked');
    await page.waitForTimeout(500);
  });

  test('should open donation details modal', async ({ page }) => {
    const firstDonation = page.locator('[class*="donation-card"], article').first();
    await firstDonation.click();
    await expect(page.locator('text=Pickup Address')).toBeVisible();
  });

  test('should display map with donations', async ({ page }) => {
    await expect(page.locator('.leaflet-container, [class*="map"]')).toBeVisible();
  });

  test('should show donation count', async ({ page }) => {
    await expect(page.locator('text=donations available, [class*="count"]')).toBeVisible();
  });

  test('should create new donation', async ({ page }) => {
    await page.click('text=Donate');
    await page.fill('input[name="title"]', 'Test Donation');
    await page.fill('textarea[name="description"]', 'Test description');
    await page.selectOption('select[name="food_type"]', 'cooked');
    await page.fill('input[name="quantity"]', '5');
    await page.fill('input[name="pickup_address"]', '123 Test St');
    await page.click('text=Submit');
    await expect(page.locator('text=Donation created')).toBeVisible();
  });

  test('should show my donations page', async ({ page }) => {
    await page.goto('/my-donations');
    await expect(page.locator('text=My Donations')).toBeVisible();
  });

  test('should show my reservations page', async ({ page }) => {
    await page.goto('/my-reservations');
    await expect(page.locator('text=My Reservations')).toBeVisible();
  });

  test('should reserve a donation', async ({ page }) => {
    await page.locator('[class*="donation-card"]').first().click();
    await page.click('text=Reserve');
    await expect(page.locator('text=Reserved')).toBeVisible();
  });

  test('should show hash code after reservation', async ({ page }) => {
    await page.goto('/my-reservations');
    await expect(page.locator('[class*="hash-code"], code')).toBeVisible();
  });

  test('should cancel reservation', async ({ page }) => {
    await page.goto('/my-reservations');
    await page.locator('[class*="reservation"]').first().click();
    await page.click('text=Cancel');
    await expect(page.locator('text=Cancelled')).toBeVisible();
  });

  test('should delete own donation', async ({ page }) => {
    await page.goto('/my-donations');
    await page.locator('[class*="donation"]').first().click();
    await page.click('text=Delete');
    await expect(page.locator('text=Deleted')).toBeVisible();
  });
});