# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user-authentication.e2e.ts >> User Authentication >> should display reset password page with invalid token
- Location: tests\e2e\user-authentication.e2e.ts:103:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('text=English')

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
        - generic [ref=e11]:
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
            - link "📊 لوحة التحكم" [ref=e20] [cursor=pointer]:
              - /url: /dashboard
              - generic [ref=e21]: 📊
              - generic [ref=e22]: لوحة التحكم
            - link "🤝 تبرعاتي" [ref=e23] [cursor=pointer]:
              - /url: /my-donations
              - generic [ref=e24]: 🤝
              - generic [ref=e25]: تبرعاتي
            - link "📋 حجوزاتي" [ref=e26] [cursor=pointer]:
              - /url: /my-reservations
              - generic [ref=e27]: 📋
              - generic [ref=e28]: حجوزاتي
            - link "💬 الدعم" [ref=e29] [cursor=pointer]:
              - /url: /support
              - generic [ref=e30]: 💬
              - generic [ref=e31]: الدعم
            - link "⚙️ الإعدادات" [ref=e32] [cursor=pointer]:
              - /url: /settings
              - generic [ref=e33]: ⚙️
              - generic [ref=e34]: الإعدادات
        - generic [ref=e35]:
          - button "theme.light" [ref=e36] [cursor=pointer]:
            - img [ref=e37]
          - button "EN" [ref=e39] [cursor=pointer]:
            - img [ref=e40]
            - generic [ref=e43]: EN
          - button "sound.on" [ref=e44] [cursor=pointer]:
            - img [ref=e45]
          - button "👤" [ref=e50] [cursor=pointer]:
            - generic [ref=e51]: 👤
            - img [ref=e52]
    - main [ref=e54]:
      - paragraph [ref=e57]: جاري التحميل...
    - contentinfo [ref=e58]:
      - generic [ref=e59]:
        - generic [ref=e60]:
          - generic [ref=e61]: 🤲
          - generic [ref=e62]: إطعام
          - paragraph [ref=e63]: منصة خيرية لتوصيل الطعام الفائض للمحتاجين
        - link "🌐 et3am.com" [ref=e65] [cursor=pointer]:
          - /url: https://et3am.com
        - paragraph [ref=e67]: © 2025 إطعام. All rights reserved.
    - generic [ref=e68]: Signing in...
  - paragraph [ref=e69]: Running in emulator mode. Do not use with production credentials.
```

# Test source

```ts
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
  56  |     await expect(page.locator('text=Email already exists')).toBeVisible();
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
  84  |     await page.click('text=English'); // Ensure English is selected
  85  |     await expect(page.locator('h1:has-text("Forgot Password?")')).toBeVisible();
  86  |     await expect(page.locator('input[type="email"]')).toBeVisible();
  87  |   });
  88  | 
  89  |   test('should show error for invalid email on forgot password', async ({ page }) => {
  90  |     await page.goto('/forgot-password');
  91  |     await page.click('text=English');
  92  |     await page.fill('input[type="email"]', 'invalid-email');
  93  |     await page.click('button[type="submit"]');
  94  |     await expect(page.locator('.alert')).toBeVisible();
  95  |   });
  96  | 
  97  |   test('should display reset password page without token', async ({ page }) => {
  98  |     await page.goto('/reset-password');
  99  |     await page.click('text=English');
  100 |     await expect(page.locator('h1:has-text("Invalid or Expired Link")')).toBeVisible();
  101 |   });
  102 | 
  103 |   test('should display reset password page with invalid token', async ({ page }) => {
  104 |     await page.goto('/reset-password?token=invalid-token');
> 105 |     await page.click('text=English');
      |                ^ Error: page.click: Test timeout of 60000ms exceeded.
  106 |     await expect(page.locator('h1:has-text("Invalid or Expired Link")')).toBeVisible();
  107 |   });
  108 | 
  109 |   test('should show password mismatch error on reset password', async ({ page }) => {
  110 |     await page.goto('/reset-password?token=invalid-token');
  111 |     await page.click('text=English');
  112 |     await expect(page.locator('input[id="password"]')).toBeVisible();
  113 |     await page.fill('input[id="password"]', 'password123');
  114 |     await page.fill('input[id="confirmPassword"]', 'differentpassword');
  115 |     await page.click('button[type="submit"]');
  116 |     await expect(page.locator('.alert')).toBeVisible();
  117 |   });
  118 | 
  119 |   test('should show password too short error on reset password', async ({ page }) => {
  120 |     await page.goto('/reset-password?token=invalid-token');
  121 |     await page.click('text=English');
  122 |     await expect(page.locator('input[id="password"]')).toBeVisible();
  123 |     await page.fill('input[id="password"]', '123');
  124 |     await page.fill('input[id="confirmPassword"]', '123');
  125 |     await page.click('button[type="submit"]');
  126 |     await expect(page.locator('.alert')).toBeVisible();
  127 |   });
  128 | 
  129 |   test('should navigate to login from forgot password', async ({ page }) => {
  130 |     await page.goto('/forgot-password');
  131 |     await page.click('text=Back to Login');
  132 |     await expect(page).toHaveURL('/login');
  133 |   });
  134 | 
  135 |   test('should navigate to forgot password from login', async ({ page }) => {
  136 |     await page.goto('/login');
  137 |     await page.click('text=Forgot Password?');
  138 |     await expect(page).toHaveURL('/forgot-password');
  139 |   });
  140 | });
```