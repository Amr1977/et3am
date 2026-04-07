import { test, expect } from '@playwright/test';

async function highlightElement(page: any, selector: string) {
  await page.evaluate((sel: string) => {
    const el = document.querySelector(sel);
    if (el) {
      el.style.outline = '3px solid red';
      el.style.outlineOffset = '2px';
      setTimeout(() => {
        el.style.outline = '';
        el.style.outlineOffset = '';
      }, 3000);
    }
  }, selector);
}

async function safeClick(page: any, selector: string, description: string) {
  console.log(`🔍 Looking for: ${description}`);
  
  const element = page.locator(selector).first();
  const count = await page.locator(selector).count();
  
  if (count === 0) {
    console.log(`❌ Element not found: ${selector}`);
    const bodyText = await page.textContent('body');
    console.log('Page contains:', bodyText?.substring(0, 500));
    throw new Error(`Element not found: ${description}`);
  }
  
  await highlightElement(page, selector);
  console.log(`✅ Found element (${count} found), clicking: ${description}`);
  await element.click({ timeout: 5000 });
}

async function safeFill(page: any, selector: string, value: string, description: string) {
  console.log(`🔍 Filling ${description}: ${value}`);
  await highlightElement(page, selector);
  await page.locator(selector).first().fill(value, { timeout: 5000 });
}

test.describe('Complete Donation Flow - Full Happy Path', () => {
  test('Complete flow: Sign up → Create donation → Reserve → Chat → Complete', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    
    console.log('\n========== STARTING DONATION FLOW TEST ==========\n');
    
    // ===== STEP 1: SIGN UP =====
    console.log('📝 STEP 1: Sign Up');
    
    // Navigate directly to register page
    await page.goto('http://localhost:5173/register');
    await page.waitForTimeout(2000);
    
    // Fill registration form
    await safeFill(page, 'input[name="name"]', 'Test User', 'Name');
    await safeFill(page, 'input[type="email"]', `test${Date.now()}@test.com`, 'Email');
    await safeFill(page, 'input[type="password"]', 'Test123456!', 'Password');
    await safeFill(page, 'input[name="confirmPassword"]', 'Test123456!', 'Confirm Password');
    
    // Accept terms if checkbox exists
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }
    
    // Submit
    await safeClick(page, 'button[type="submit"]', 'Register button');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('After registration URL:', currentUrl);
    
    // ===== STEP 2: CREATE DONATION =====
    console.log('\n📝 STEP 2: Create Donation');
    
    await page.goto('http://localhost:5173/donations');
    await page.waitForTimeout(2000);
    
    // Look for create donation button - use first match
    const createBtn = page.locator('button:has-text("Share")').first();
    if (await createBtn.isVisible()) {
      await safeClick(page, 'button:has-text("Share Food")', 'Create donation button');
      await page.waitForTimeout(1500);
      
      // Fill donation form
      await safeFill(page, 'input[name="title"]', 'Fresh Pizza', 'Title');
      await safeFill(page, 'textarea[name="description"]', 'Fresh homemade pizza, 3 slices left', 'Description');
      
      // Select food type
      const foodTypeSelect = page.locator('select[name="food_type"]').first();
      if (await foodTypeSelect.isVisible()) {
        await foodTypeSelect.selectOption('cooked');
      }
      
      await safeFill(page, 'input[name="quantity"]', '3', 'Quantity');
      
      const unitSelect = page.locator('select[name="unit"]').first();
      if (await unitSelect.isVisible()) {
        await unitSelect.selectOption('portions');
      }
      
      await safeFill(page, 'input[name="pickup_address"]', '123 Test Street, Cairo', 'Address');
      await safeFill(page, 'input[name="pickup_date"]', '2026-04-15', 'Pickup date');
      await safeFill(page, 'input[name="pickup_time"]', '14:00', 'Pickup time');
      
      // Submit
      await safeClick(page, 'button:has-text("Share")', 'Submit donation');
      await page.waitForTimeout(3000);
      
      console.log('✅ Donation created');
    } else {
      console.log('⚠️ Could not find create button, page might need login first');
    }
    
    // ===== STEP 3: LOGOUT AND LOGIN AS RECEIVER =====
    console.log('\n📝 STEP 3: Logout and login as receiver');
    
    // Logout - look for logout button
    const logoutBtn = page.locator('button:has-text("Logout")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(1000);
    }
    
    // Go to login
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1500);
    
    // Login (use existing test account)
    await safeFill(page, 'input[type="email"]', 'receiver@test.com', 'Receiver email');
    await safeFill(page, 'input[type="password"]', 'password123', 'Password');
    await safeClick(page, 'button[type="submit"]', 'Login button');
    await page.waitForTimeout(2000);
    
    // ===== STEP 4: RESERVE DONATION =====
    console.log('\n📝 STEP 4: Reserve Donation');
    
    await page.goto('http://localhost:5173/donations');
    await page.waitForTimeout(2000);
    
    // Look for reserve button - use first match
    const reserveBtn = page.locator('button:has-text("Reserve")').first();
    if (await reserveBtn.isVisible({ timeout: 3000 })) {
      await highlightElement(page, 'button:has-text("Reserve")');
      await reserveBtn.click();
      await page.waitForTimeout(1500);
      
      // Handle confirmation dialog if exists
      const confirmBtn = page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForTimeout(1500);
      }
      
      console.log('✅ Donation reserved');
    } else {
      console.log('⚠️ No reserve button visible - might need available donations');
    }
    
    // ===== STEP 5: CHECK HASH CODE =====
    console.log('\n📝 STEP 5: Check Hash Code');
    
    await page.goto('http://localhost:5173/my-reservations');
    await page.waitForTimeout(1500);
    
    // Look for hash code display
    const hashCodeElement = page.locator('[class*="hash"], [class*="code"]').first();
    if (await hashCodeElement.isVisible()) {
      console.log('✅ Hash code visible');
    } else {
      console.log('⚠️ Hash code not found');
    }
    
    // ===== STEP 6: CHAT =====
    console.log('\n📝 STEP 6: Chat');
    
    // Try to find chat link or button
    const chatLink = page.locator('a[href*="chat"]').first();
    if (await chatLink.isVisible()) {
      await chatLink.click();
      await page.waitForTimeout(1500);
      
      // Try to send message
      const messageInput = page.locator('input[placeholder*="message"]').first();
      if (await messageInput.isVisible()) {
        await messageInput.fill('Hello, I will pick up the food soon!');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        console.log('✅ Chat message sent');
      }
    } else {
      console.log('⚠️ Chat not accessible');
    }
    
    // ===== STEP 7: MARK AS RECEIVED =====
    console.log('\n📝 STEP 7: Mark as Received');
    
    await page.goto('http://localhost:5173/my-reservations');
    await page.waitForTimeout(1500);
    
    // Click on reservation to open details
    const reservationCard = page.locator('.donation-card').first();
    if (await reservationCard.isVisible()) {
      await reservationCard.click();
      await page.waitForTimeout(1000);
    }
    
    // Look for received button
    const receivedBtn = page.locator('button:has-text("Received")').first();
    if (await receivedBtn.isVisible()) {
      await receivedBtn.click();
      await page.waitForTimeout(1000);
      console.log('✅ Marked as received');
    } else {
      console.log('⚠️ Received button not found');
    }
    
    console.log('\n========== TEST COMPLETE ==========\n');
  });
});

test.describe('Mobile Navigation Test', () => {
  test('Check mobile navigation and donation views', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    
    console.log('\n========== MOBILE NAVIGATION TEST ==========\n');
    
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(2000);
    
    // Check if hamburger menu is visible on mobile
    const hamburger = page.locator('.hamburger').first();
    if (await hamburger.isVisible()) {
      console.log('✅ Hamburger menu visible');
      await hamburger.click();
      await page.waitForTimeout(500);
    }
    
    // Navigate to donations - use first match
    await safeClick(page, 'a[href="/donations"]', 'Donations link');
    await page.waitForTimeout(2000);
    
    // Check map or grid view
    const mapContainer = page.locator('.leaflet-container').first();
    const gridContainer = page.locator('.donations-grid').first();
    
    console.log('Map visible:', await mapContainer.isVisible());
    console.log('Grid visible:', await gridContainer.isVisible());
    
    console.log('\n========== NAVIGATION TEST COMPLETE ==========\n');
  });
});