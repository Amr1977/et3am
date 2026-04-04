# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-simple.spec.ts >> E2E donation flow
- Location: e2e-simple.spec.ts:3:5

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.fill: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('input[name="confirm_password"]')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - generic [ref=e5]:
      - link "🤲 إطعام" [ref=e6] [cursor=pointer]:
        - /url: /
        - generic [ref=e7]: 🤲
        - generic [ref=e8]: إطعام
      - generic [ref=e9]:
        - link "الرئيسية" [ref=e10] [cursor=pointer]:
          - /url: /
        - link "التبرعات" [ref=e11] [cursor=pointer]:
          - /url: /donations
      - generic [ref=e12]:
        - button "☀️" [ref=e13] [cursor=pointer]
        - button "🌐 EN" [ref=e14] [cursor=pointer]:
          - generic [ref=e15]: 🌐
          - generic [ref=e16]: EN
        - generic [ref=e17]:
          - link "دخول" [ref=e18] [cursor=pointer]:
            - /url: /login
          - link "تسجيل" [ref=e19] [cursor=pointer]:
            - /url: /register
  - main [ref=e20]:
    - generic [ref=e23]:
      - generic [ref=e24]:
        - generic [ref=e25]: 🤲
        - heading "انضم إلينا" [level=1] [ref=e26]
        - paragraph [ref=e27]: كن جزءاً من رحمة إطعام الجائع
      - button "auth.signup_with_google" [ref=e28] [cursor=pointer]:
        - img [ref=e29]
        - text: auth.signup_with_google
      - generic [ref=e35]: auth.or
      - generic [ref=e36]:
        - generic [ref=e37]:
          - generic [ref=e38]: الاسم الكامل
          - textbox "الاسم الكامل" [ref=e39]:
            - /placeholder: Your full name
            - text: Test Donor
        - generic [ref=e40]:
          - generic [ref=e41]: البريد الإلكتروني
          - textbox "البريد الإلكتروني" [ref=e42]:
            - /placeholder: email@example.com
            - text: donor_1775304241511@test.com
        - generic [ref=e43]:
          - generic [ref=e44]:
            - generic [ref=e45]: كلمة المرور
            - textbox "كلمة المرور" [active] [ref=e46]:
              - /placeholder: ••••••••
              - text: Test123456!
          - generic [ref=e47]:
            - generic [ref=e48]: تأكيد كلمة المرور
            - textbox "تأكيد كلمة المرور" [ref=e49]:
              - /placeholder: ••••••••
        - button "✨ تسجيل" [ref=e50] [cursor=pointer]
      - paragraph [ref=e51]:
        - text: لديك حساب؟
        - link "دخول" [ref=e52] [cursor=pointer]:
          - /url: /login
  - contentinfo [ref=e53]:
    - generic [ref=e54]:
      - generic [ref=e55]:
        - generic [ref=e56]: 🤲
        - generic [ref=e57]: إطعام
        - paragraph [ref=e58]: منصة خيرية لتوصيل الطعام الفائض للمحتاجين
      - link "🌐 et3am.com" [ref=e60] [cursor=pointer]:
        - /url: https://et3am.com
      - paragraph [ref=e62]: © 2025 إطعام. All rights reserved.
  - generic [ref=e63]: Signing in...
```

# Test source

```ts
  1  | import { test } from '@playwright/test';
  2  | 
  3  | test('E2E donation flow', async ({ page }) => {
  4  |   const BASE_URL = 'https://et3am.com';
  5  |   const timestamp = Date.now();
  6  |   const donorEmail = `donor_${timestamp}@test.com`;
  7  |   const password = 'Test123456!';
  8  | 
  9  |   test.setTimeout(60000);
  10 | 
  11 |   console.log('1. Navigating to register...');
  12 |   await page.goto(`${BASE_URL}/register`);
  13 |   await page.waitForLoadState('networkidle');
  14 |   
  15 |   const registerForm = await page.locator('form').first();
  16 |   const isVisible = await registerForm.isVisible();
  17 |   console.log('Register form visible:', isVisible);
  18 |   
  19 |   if (isVisible) {
  20 |     console.log('2. Filling registration form...');
  21 |     await page.fill('input[name="name"]', 'Test Donor');
  22 |     await page.fill('input[name="email"]', donorEmail);
  23 |     await page.fill('input[name="password"]', password);
> 24 |     await page.fill('input[name="confirm_password"]', password);
     |                ^ Error: page.fill: Test timeout of 60000ms exceeded.
  25 |     
  26 |     await page.screenshot({ path: 'register-form.png', fullPage: true });
  27 |     
  28 |     console.log('3. Submitting registration...');
  29 |     await page.click('button[type="submit"]');
  30 |     
  31 |     await page.waitForTimeout(3000);
  32 |     await page.screenshot({ path: 'after-register.png', fullPage: true });
  33 |     
  34 |     const url = page.url();
  35 |     console.log('Current URL after register:', url);
  36 |   } else {
  37 |     console.log('No register form found, checking page content...');
  38 |     const content = await page.content();
  39 |     await page.screenshot({ path: 'no-form.png', fullPage: true });
  40 |     console.log('Page contains form:', content.includes('register'));
  41 |   }
  42 | });
  43 | 
```