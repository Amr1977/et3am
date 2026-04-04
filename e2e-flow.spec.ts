import { test, expect } from '@playwright/test';

const BASE_URL = 'https://et3am.com';
const API_URL = 'https://api.et3am.com';

test.describe('Full E2E Donation Flow', () => {
  let donorEmail: string;
  let receiverEmail: string;
  const timestamp = Date.now();
  donorEmail = `donor_e2e_${timestamp}@example.com`;
  receiverEmail = `receiver_e2e_${timestamp}@example.com`;
  const password = 'Test123456!';

  test('1. User A (Donor) registers via UI', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    
    await page.fill('input[name="name"]', 'Test Donor');
    await page.fill('input[name="email"]', donorEmail);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirm_password"]', password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
    console.log('✓ Donor registered and logged in');
  });

  test('2. User A creates a donation', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    
    await page.click('text=Add Donation');
    await page.waitForSelector('input[name="title"]');
    
    await page.fill('input[name="title"]', 'Test Meal Donation');
    await page.fill('textarea[name="description"]', 'Fresh cooked meals for those in need');
    await page.fill('input[name="quantity"]', '5');
    await page.selectOption('select[name="unit"]', 'portions');
    await page.selectOption('select[name="food_type"]', 'cooked');
    await page.fill('input[name="pickup_address"]', '123 Test Street, Cairo');
    
    await page.click('button:has-text("Save")');
    
    await page.waitForSelector('text=Test Meal Donation', { timeout: 5000 });
    console.log('✓ Donation created');
  });

  test('3. User B (Receiver) registers via UI', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    
    await page.fill('input[name="name"]', 'Test Receiver');
    await page.fill('input[name="email"]', receiverEmail);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirm_password"]', password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
    console.log('✓ Receiver registered and logged in');
  });

  test('4. User B views and reserves donation', async ({ page }) => {
    await page.goto(`${BASE_URL}/donations`);
    
    await page.waitForSelector('.donation-card, .donation-item, [class*="donation"]', { timeout: 10000 });
    
    const reserveButtons = page.locator('button:has-text("Reserve"), button:has-text("حجز")');
    if (await reserveButtons.first().isVisible()) {
      await reserveButtons.first().click();
      await page.waitForSelector('text=Reserved,تم الحجز', { timeout: 5000 });
      console.log('✓ Donation reserved');
    }
  });

  test('5. Verify donation status', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.click('text=My Reservations');
    
    await page.waitForSelector('text=Test Meal Donation', { timeout: 5000 });
    console.log('✓ Reservation visible in dashboard');
  });
});
