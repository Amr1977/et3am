import { test, expect } from '@playwright/test';

test.describe('Chat System', () => {
  test('should display chat page', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.locator('text=Chat')).toBeVisible();
  });

  test('should show no chat for available donation', async ({ page }) => {
    await page.goto('/donations');
    await page.locator('[class*="donation-card"]').first().click();
    await expect(page.locator('text=Chat not available')).toBeVisible();
  });

  test('should show chat for reserved donation', async ({ page }) => {
    await page.goto('/my-reservations');
    await page.locator('[class*="reservation"]').first().click();
    await expect(page.locator('text=Send Message')).toBeVisible();
  });

  test('should send message', async ({ page }) => {
    await page.goto('/chat');
    await page.fill('textarea[name="message"]', 'Test message');
    await page.click('text=Send');
    await expect(page.locator('text=Message sent')).toBeVisible();
  });

  test('should display messages', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.locator('[class*="message"]')).toBeVisible();
  });

  test('should show unread count badge', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[class*="badge"], [class*="unread"]')).toBeVisible();
  });

  test('should navigate to chat from menu', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Chat');
    await expect(page.locator('text=Chat')).toBeVisible();
  });

  test('should show empty chat state', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.locator('text=No messages yet')).toBeVisible();
  });

  test('should show error for empty message', async ({ page }) => {
    await page.goto('/chat');
    await page.click('text=Send');
    await expect(page.locator('text=Message required')).toBeVisible();
  });

  test('should show chat notification', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=New message')).toBeVisible();
  });
});