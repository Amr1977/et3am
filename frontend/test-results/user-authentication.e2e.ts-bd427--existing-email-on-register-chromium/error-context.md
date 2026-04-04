# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user-authentication.e2e.ts >> User Authentication >> should show error for existing email on register
- Location: tests\e2e\user-authentication.e2e.ts:49:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Email already exists')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Email already exists')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - navigation [ref=e4]:
      - generic [ref=e5]:
        - link "إطعام" [ref=e6] [cursor=pointer]:
          - /url: /
          - img [ref=e8]
          - generic [ref=e10]: إطعام
        - generic [ref=e12]:
          - link "🏠 الرئيسية" [ref=e13] [cursor=pointer]:
            - /url: /
            - generic [ref=e14]: 🏠
            - generic [ref=e15]: الرئيسية
          - link "🎁 التبرعات" [ref=e16] [cursor=pointer]:
            - /url: /donations
            - generic [ref=e17]: 🎁
            - generic [ref=e18]: التبرعات
        - generic [ref=e19]:
          - button "theme.light" [ref=e20] [cursor=pointer]:
            - img [ref=e21]
          - button "EN" [ref=e23] [cursor=pointer]:
            - img [ref=e24]
            - generic [ref=e27]: EN
          - generic [ref=e28]:
            - link "دخول" [ref=e29] [cursor=pointer]:
              - /url: /login
            - link "تسجيل" [ref=e30] [cursor=pointer]:
              - /url: /register
    - main [ref=e31]:
      - generic [ref=e34]:
        - generic [ref=e35]:
          - generic [ref=e36]: 🤲
          - heading "انضم إلينا" [level=1] [ref=e37]
          - paragraph [ref=e38]: كن جزءاً من رحمة إطعام الجائع
        - button "auth.signup_with_google" [disabled] [ref=e39]:
          - img [ref=e40]
          - text: auth.signup_with_google
        - generic [ref=e46]: auth.or
        - generic [ref=e47]:
          - generic [ref=e48]:
            - generic [ref=e49]: الاسم الكامل
            - textbox "الاسم الكامل" [ref=e50]:
              - /placeholder: Your full name
              - text: Test User
          - generic [ref=e51]:
            - generic [ref=e52]: البريد الإلكتروني
            - textbox "البريد الإلكتروني" [ref=e53]:
              - /placeholder: email@example.com
              - text: test@test.com
          - generic [ref=e54]:
            - generic [ref=e55]:
              - generic [ref=e56]: كلمة المرور
              - textbox "كلمة المرور" [ref=e57]:
                - /placeholder: ••••••••
                - text: password123
            - generic [ref=e58]:
              - generic [ref=e59]: تأكيد كلمة المرور
              - textbox "تأكيد كلمة المرور" [ref=e60]:
                - /placeholder: ••••••••
                - text: password123
          - button "..." [disabled] [ref=e61]:
            - generic [ref=e62]: ...
        - paragraph [ref=e63]:
          - text: لديك حساب؟
          - link "دخول" [ref=e64] [cursor=pointer]:
            - /url: /login
    - contentinfo [ref=e65]:
      - generic [ref=e66]:
        - generic [ref=e67]:
          - generic [ref=e68]: 🤲
          - generic [ref=e69]: إطعام
          - paragraph [ref=e70]: منصة خيرية لتوصيل الطعام الفائض للمحتاجين
        - link "🌐 et3am.com" [ref=e72] [cursor=pointer]:
          - /url: https://et3am.com
        - paragraph [ref=e74]: © 2025 إطعام. All rights reserved.
    - generic [ref=e75]: Signing in...
  - paragraph [ref=e76]: Running in emulator mode. Do not use with production credentials.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const API_BASE = process.env.API_URL || 'http://localhost:3000/api';
  4   | 
  5   | test.describe('User Authentication', () => {
  6   |   test('should display login page', async ({ page }) => {
  7   |     await page.goto('/login');
  8   |     await expect(page.locator('text=Sign In')).toBeVisible();
  9   |   });
  10  | 
  11  |   test('should display register page', async ({ page }) => {
  12  |     await page.goto('/register');
  13  |     await expect(page.locator('text=Sign Up')).toBeVisible();
  14  |   });
  15  | 
  16  |   test('should show error for invalid credentials', async ({ page }) => {
  17  |     await page.goto('/login');
  18  |     await page.fill('input[type="email"]', 'invalid@test.com');
  19  |     await page.fill('input[type="password"]', 'wrongpassword');
  20  |     await page.click('button[type="submit"]');
  21  |     await expect(page.locator('text=Invalid credentials')).toBeVisible();
  22  |   });
  23  | 
  24  |   test('should show error for missing fields on register', async ({ page }) => {
  25  |     await page.goto('/register');
  26  |     await page.click('button[type="submit"]');
  27  |     await expect(page.locator('text=Required field')).toBeVisible();
  28  |   });
  29  | 
  30  |   test('should successfully login with valid credentials', async ({ page }) => {
  31  |     await page.goto('/login');
  32  |     await page.fill('input[type="email"]', 'test@test.com');
  33  |     await page.fill('input[type="password"]', 'password123');
  34  |     await page.click('button[type="submit"]');
  35  |     await page.waitForURL('/');
  36  |   });
  37  | 
  38  |   test('should successfully register new user', async ({ page }) => {
  39  |     const randomEmail = `test-${Date.now()}@test.com`;
  40  |     await page.goto('/register');
  41  |     await page.fill('input[name="name"]', 'Test User');
  42  |     await page.fill('input[type="email"]', randomEmail);
  43  |     await page.fill('input[type="password"]', 'password123');
  44  |     await page.fill('input[name="confirmPassword"]', 'password123');
  45  |     await page.click('button[type="submit"]');
  46  |     await page.waitForURL('/');
  47  |   });
  48  | 
  49  |   test('should show error for existing email on register', async ({ page }) => {
  50  |     await page.goto('/register');
  51  |     await page.fill('input[name="name"]', 'Test User');
  52  |     await page.fill('input[type="email"]', 'test@test.com');
  53  |     await page.fill('input[type="password"]', 'password123');
  54  |     await page.fill('input[name="confirmPassword"]', 'password123');
  55  |     await page.click('button[type="submit"]');
> 56  |     await expect(page.locator('text=Email already exists')).toBeVisible();
      |                                                             ^ Error: expect(locator).toBeVisible() failed
  57  |   });
  58  | 
  59  |   test('should show language toggle', async ({ page }) => {
  60  |     await page.goto('/login');
  61  |     await expect(page.locator('text=العربية')).toBeVisible();
  62  |     await expect(page.locator('text=English')).toBeVisible();
  63  |   });
  64  | 
  65  |   test('should switch language', async ({ page }) => {
  66  |     await page.goto('/login');
  67  |     await page.click('text=العربية');
  68  |     await expect(page.locator('text=تسجيل الدخول')).toBeVisible();
  69  |   });
  70  | 
  71  |   test('should logout successfully', async ({ page }) => {
  72  |     await page.goto('/');
  73  |     await page.click('text=Logout');
  74  |     await expect(page.locator('text=Sign In')).toBeVisible();
  75  |   });
  76  | 
  77  |   test('should show Google login button', async ({ page }) => {
  78  |     await page.goto('/login');
  79  |     await expect(page.locator('text=Sign in with Google')).toBeVisible();
  80  |   });
  81  | 
  82  |   test('should display forgot password page', async ({ page }) => {
  83  |     await page.goto('/forgot-password');
  84  |     await expect(page.locator('h1')).toBeVisible();
  85  |     await expect(page.locator('input[type="email"]')).toBeVisible();
  86  |   });
  87  | 
  88  |   test('should show error for invalid email on forgot password', async ({ page }) => {
  89  |     await page.goto('/forgot-password');
  90  |     await page.fill('input[type="email"]', 'invalid-email');
  91  |     await page.click('button[type="submit"]');
  92  |     await page.waitForTimeout(2000);
  93  |     const hasAlert = await page.locator('.alert').isVisible().catch(() => false);
  94  |     const hasSuccess = await page.locator('.auth-header-modern').isVisible().catch(() => false);
  95  |     expect(hasAlert || hasSuccess).toBe(true);
  96  |   });
  97  | 
  98  |   test('should display reset password page with invalid token', async ({ page }) => {
  99  |     const response = await page.goto('/reset-password?token=invalid-token');
  100 |     expect(response.status()).toBe(200);
  101 |   });
  102 | 
  103 |   test('should show password mismatch error on reset password', async ({ page }) => {
  104 |     const response = await page.goto('/reset-password?token=invalid-token');
  105 |     expect(response.status()).toBe(200);
  106 |   });
  107 | 
  108 |   test('should show password too short error on reset password', async ({ page }) => {
  109 |     const response = await page.goto('/reset-password?token=invalid-token');
  110 |     expect(response.status()).toBe(200);
  111 |   });
  112 | 
  113 |   test('should navigate to login from forgot password', async ({ page }) => {
  114 |     await page.goto('/forgot-password');
  115 |     await page.click('.auth-link');
  116 |     await expect(page).toHaveURL(/\/login/);
  117 |   });
  118 | 
  119 |   test('should navigate to forgot password from login', async ({ page }) => {
  120 |     await page.goto('/login');
  121 |     await page.click('a[href="/forgot-password"]');
  122 |     await expect(page).toHaveURL(/\/forgot-password/);
  123 |   });
  124 | });
```