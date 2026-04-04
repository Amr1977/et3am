import { test } from '@playwright/test';

test('E2E donation flow', async ({ page }) => {
  const BASE_URL = 'https://et3am.com';
  const timestamp = Date.now();
  const donorEmail = `donor_${timestamp}@test.com`;
  const password = 'Test123456!';

  test.setTimeout(60000);

  console.log('1. Navigating to register...');
  await page.goto(`${BASE_URL}/register`);
  await page.waitForLoadState('networkidle');
  
  const registerForm = await page.locator('form').first();
  const isVisible = await registerForm.isVisible();
  console.log('Register form visible:', isVisible);
  
  if (isVisible) {
    console.log('2. Filling registration form...');
    await page.fill('input[name="name"]', 'Test Donor');
    await page.fill('input[name="email"]', donorEmail);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirm_password"]', password);
    
    await page.screenshot({ path: 'register-form.png', fullPage: true });
    
    console.log('3. Submitting registration...');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'after-register.png', fullPage: true });
    
    const url = page.url();
    console.log('Current URL after register:', url);
  } else {
    console.log('No register form found, checking page content...');
    const content = await page.content();
    await page.screenshot({ path: 'no-form.png', fullPage: true });
    console.log('Page contains form:', content.includes('register'));
  }
});
