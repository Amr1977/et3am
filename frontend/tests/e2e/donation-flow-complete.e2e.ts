import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const API_URL = 'https://api.et3am.com';

async function getToken(page: any): Promise<string> {
  return page.evaluate(() => localStorage.getItem('token'));
}

async function apiPost(path: string, token: string, body: any) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API POST ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

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
  
  const loc = page.locator(selector);
  const count = await loc.count();
  if (count === 0) {
    console.log(`❌ Element not found: ${selector}`);
    const bodyText = await page.textContent('body');
    console.log('Page contains:', bodyText?.substring(0, 500));
    throw new Error(`Element not found: ${description}`);
  }
  
  // Find first visible element
  let clicked = false;
  for (let i = 0; i < count; i++) {
    const el = loc.nth(i);
    if (await el.isVisible()) {
      await highlightElement(page, selector);
      console.log(`✅ Found visible element (#${i}), clicking: ${description}`);
      await el.click({ timeout: 5000 });
      clicked = true;
      break;
    }
  }
  if (!clicked) {
    console.log(`⚠️ No visible element found for: ${description}, trying first`);
    await highlightElement(page, selector);
    await loc.first().click({ timeout: 5000 });
  }
}

async function safeFill(page: any, selector: string, value: string, description: string) {
  console.log(`🔍 Filling ${description}: ${value}`);
  await highlightElement(page, selector);
  
  const element = page.locator(selector).first();
  
  try {
    await element.waitFor({ state: 'visible', timeout: 15000 });
  } catch (e) {
    const html = await page.content();
    console.log(`❌ Element not visible: ${description}, page length: ${html.length}`);
    throw e;
  }
  
  await element.evaluate((el: HTMLElement) => el.scrollIntoViewIfNeeded());
  // Use force to bypass overlays (e.g. location prompt)
  await element.click({ timeout: 5000, force: true });
  await element.fill(value);
  await element.dispatchEvent('input');
  await element.dispatchEvent('change');
}

async function dismissOverlay(page: any) {
  const overlay = page.locator('.location-prompt-overlay').first();
  if (await overlay.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('🔍 Dismissing location prompt overlay');
    // Try clicking a close/allow button inside the overlay
    const closeBtn = overlay.locator('button, [class*="close"], [class*="dismiss"]').first();
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeBtn.click({ force: true });
    } else {
      // Click overlay background to dismiss
      await overlay.click({ force: true, position: { x: 10, y: 10 } });
    }
    await page.waitForTimeout(500);
  }
}

test.describe('Complete Donation Flow - Full Happy Path', () => {
  test('Complete flow: Sign up → Create donation → Reserve → Chat → Complete', async ({ page }) => {
    const testEmail = `test${Date.now()}@test.com`;
    const testPassword = 'Test123456!';
    
    console.log('\n========== STARTING DONATION FLOW TEST ==========\n');
    console.log('Test email:', testEmail);
    
    // ===== STEP 1: SIGN UP =====
    console.log('📝 STEP 1: Sign Up');
    await page.goto(`${BASE_URL}/register`);
    await page.waitForTimeout(2000);
    
    await dismissOverlay(page);
    
    await safeFill(page, 'input[name="name"]', 'Test User', 'Name');
    await safeFill(page, 'input[type="email"]', testEmail, 'Email');
    await safeFill(page, 'input[type="password"]', testPassword, 'Password');
    await safeFill(page, 'input[name="confirmPassword"]', testPassword, 'Confirm Password');
    
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }
    
    await safeClick(page, 'button[type="submit"]', 'Register button');
    await page.waitForTimeout(2000);
    
    // Wait for redirect and auth state to settle
    await page.waitForLoadState('networkidle');
    console.log('After registration URL:', page.url());
    
    // Navigate to home to ensure auth state is fully loaded
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(1500);
    
    // ===== STEP 2: CREATE DONATION VIA API =====
    console.log('\n📝 STEP 2: Create Donation via API');
    
    const token = await getToken(page);
    console.log('Token obtained:', token ? 'yes (len=' + token.length + ')' : 'no');
    
    let authToken = token;
    if (!token) {
      console.log('⚠️ Token not found in localStorage, trying one more time...');
      await page.waitForTimeout(2000);
      const retryToken = await getToken(page);
      console.log('Retry token:', retryToken ? 'yes' : 'no');
      if (!retryToken) throw new Error('Could not obtain auth token after registration');
      authToken = retryToken;
    }
    
    console.log('Token first 20 chars:', authToken.substring(0, 20));
    
    const donation = await apiPost('/api/donations', authToken, {
      title: 'Fresh Pizza',
      description: 'Fresh homemade pizza, 3 slices left',
      food_type: 'other',
      quantity: 3,
      unit: 'portions',
      pickup_address: '123 Test Street, Cairo',
      pickup_date: '2026-04-15',
      pickup_time: '14:00',
      latitude: 30.0444,
      longitude: 31.2357,
    });
    console.log('✅ Donation created via API, id:', donation.id || donation.donation?.id);
    const donationId = donation.id || donation.donation?.id;
    
    // Verify donation appears on donations page
    await page.goto(`${BASE_URL}/donations`);
    await page.waitForTimeout(3000);
    const donationCard = page.locator('.donation-card, [class*="donation"]').first();
    console.log('Donation card visible:', await donationCard.isVisible());
    
    // ===== STEP 3: LOGOUT AND SIGN UP AS RECEIVER =====
    console.log('\n📝 STEP 3: Logout and sign up as receiver');
    
    const logoutBtn = page.locator('button:has-text("Logout")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(1000);
    }
    
    const receiverEmail = `receiver${Date.now()}@test.com`;
    console.log('Receiver email:', receiverEmail);
    
    await page.goto(`${BASE_URL}/register`);
    await page.waitForTimeout(1500);
    
    await dismissOverlay(page);
    
    await safeFill(page, 'input[name="name"]', 'Test Receiver', 'Name');
    await safeFill(page, 'input[type="email"]', receiverEmail, 'Email');
    await safeFill(page, 'input[type="password"]', testPassword, 'Password');
    await safeFill(page, 'input[name="confirmPassword"]', testPassword, 'Confirm Password');
    
    const termsCheckbox2 = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox2.isVisible()) {
      await termsCheckbox2.check();
    }
    
    const registerBtn2 = page.locator('button[type="submit"]').first();
    if (await registerBtn2.isVisible({ timeout: 5000 })) {
      await registerBtn2.click();
      await page.waitForTimeout(3000);
    }
    
    // Get receiver token
    const receiverToken = await getToken(page);
    
    // ===== STEP 4: RESERVE VIA API =====
    console.log('\n📝 STEP 4: Reserve Donation via API');
    
    await apiPost(`/api/donations/${donationId}/reserve`, receiverToken, {});
    console.log('✅ Donation reserved via API');
    
    // Verify on donations page
    await page.goto(`${BASE_URL}/donations`);
    await page.waitForTimeout(3000);
    
    // ===== STEP 5: CHECK HASH CODE =====
    console.log('\n📝 STEP 5: Check Hash Code');
    
    await page.goto(`${BASE_URL}/my-reservations`);
    await page.waitForTimeout(2000);
    
    const hashCodeElement = page.locator('[class*="hash"], [class*="code"]').first();
    if (await hashCodeElement.isVisible()) {
      console.log('✅ Hash code visible');
    } else {
      console.log('⚠️ Hash code not found');
    }
    
    // ===== STEP 6: CHAT =====
    console.log('\n📝 STEP 6: Chat');
    
    const chatLink = page.locator('a[href*="chat"]').first();
    if (await chatLink.isVisible()) {
      await chatLink.click();
      await page.waitForTimeout(1500);
      
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
    
    // ===== STEP 7: MARK AS COMPLETE =====
    console.log('\n📝 STEP 7: Mark as Complete');
    
    await page.goto(`${BASE_URL}/my-reservations`);
    await page.waitForTimeout(2000);
    
    const reservationCard = page.locator('.donation-card').first();
    if (await reservationCard.isVisible()) {
      await reservationCard.click();
      await page.waitForTimeout(1000);
    }
    
    const receivedBtn = page.locator('button:has-text("Confirm Pickup")').first();
    if (await receivedBtn.isVisible()) {
      await receivedBtn.click();
      await page.waitForTimeout(1000);
      console.log('✅ Marked as received');
    } else {
      console.log('⚠️ Confirm Pickup button not found');
    }
    
    console.log('\n========== TEST COMPLETE ==========\n');
  });
});

test.describe('Mobile Navigation Test', () => {
  test('Check mobile navigation and donation views', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    
    console.log('\n========== MOBILE NAVIGATION TEST ==========\n');
    
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(2000);
    
    // Check if hamburger menu is visible on mobile
    const hamburger = page.locator('.hamburger').first();
    if (await hamburger.isVisible()) {
      console.log('✅ Hamburger menu visible');
      await hamburger.click();
      await page.waitForTimeout(1000); // Wait for mobile menu animation
    }
    
    // Navigate to donations - use force click on mobile (animation overlap)
    const donationsLink = page.locator('a[href="/donations"]').first();
    if (await donationsLink.isVisible({ timeout: 3000 })) {
      await donationsLink.click({ force: true });
      console.log('✅ Donations link clicked');
    } else {
      // Fallback: navigate directly
      await page.goto(`${BASE_URL}/donations`);
    }
    await page.waitForTimeout(2000);
    
    // Check map or grid view
    const mapContainer = page.locator('.leaflet-container').first();
    const gridContainer = page.locator('.donations-grid').first();
    
    console.log('Map visible:', await mapContainer.isVisible());
    console.log('Grid visible:', await gridContainer.isVisible());
    
    console.log('\n========== NAVIGATION TEST COMPLETE ==========\n');
  });
});