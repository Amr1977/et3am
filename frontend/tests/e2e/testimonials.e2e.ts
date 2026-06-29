import { test, expect, Page } from '@playwright/test';

const API_URL = 'http://localhost:3002';
const BASE_URL = 'http://localhost:5173';
const PASSWORD = 'Test123456!';
const prefix = `tm${Date.now()}`;

interface TestUser {
  email: string;
  name: string;
  token: string;
  id?: string;
}

async function api(method: string, path: string, token: string | null, body?: any) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${JSON.stringify(data)}`);
  return data;
}

async function registerUser(email: string, name: string): Promise<TestUser> {
  await api('POST', '/api/auth/register', null, { email, password: PASSWORD, name }).catch(() => {});
  const loginData = await api('POST', '/api/auth/login', null, { email, password: PASSWORD });
  return { email, name, token: loginData.token, id: loginData.user?.id };
}

function setupMockApiRoutes(page: Page) {
  page.route('**/api/**', async (route) => {
    const url = route.request().url();
    const parsed = new URL(url);
    const apiPath = parsed.pathname + parsed.search;
    const target = `${API_URL}${apiPath}`;
    const headers = route.request().headers();
    delete headers['origin'];
    delete headers['Origin'];
    const body = route.request().postData();
    const method = route.request().method();

    const res = await fetch(target, {
      method,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: body || undefined,
    });
    const resBody = await res.text();
    const resHeaders = Object.fromEntries(res.headers.entries());
    await route.fulfill({
      status: res.status,
      headers: resHeaders,
      body: resBody,
    });
  });
}

async function setupAuth(page: Page, targetUrl: string, token: string) {
  setupMockApiRoutes(page);
  await page.addInitScript((args) => {
    localStorage.setItem('token', args.t);
    localStorage.setItem('user', '{}');
    localStorage.setItem('et3am_api_url', args.apiUrl);
  }, { t: token, apiUrl: API_URL });
  await page.goto(targetUrl);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

test.describe('Testimonials Flow', () => {
  let user: TestUser;

  test.beforeAll(async () => {
    user = await registerUser(`${prefix}-user@test.com`, 'Testimonial User');
  });

  test('1. API: GET /api/testimonials returns public testimonials', async () => {
    const data = await api('GET', '/api/testimonials', null);
    expect(data).toHaveProperty('testimonials');
    expect(Array.isArray(data.testimonials)).toBe(true);
  });

  test('2. API: POST /api/testimonials creates pending testimonial', async () => {
    const data = await api('POST', '/api/testimonials', user.token, {
      content: 'ET3AM is an amazing platform for food donation! Highly recommend.',
      rating: 5,
    });
    expect(data).toHaveProperty('testimonial');
    expect(data.testimonial.content).toContain('ET3AM');
    expect(data.testimonial.is_approved).toBe(false);
  });

  test('3. UI: Testimonials page loads and shows form for authenticated user', async ({ page }) => {
    await setupAuth(page, `${BASE_URL}/testimonials`, user.token);

    const pageTitle = page.locator('h1').first();
    await expect(pageTitle).toBeVisible({ timeout: 15000 });

    const form = page.locator('form');
    await expect(form).toBeVisible({ timeout: 10000 });
  });

  test('4. UI: Testimonials page is accessible without auth', async ({ page }) => {
    setupMockApiRoutes(page);
    await page.goto(`${BASE_URL}/testimonials`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const pageTitle = page.locator('h1').first();
    await expect(pageTitle).toBeVisible({ timeout: 15000 });
  });

  test('5. UI: Submit a testimonial via the form', async ({ page }) => {
    await setupAuth(page, `${BASE_URL}/testimonials`, user.token);

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10000 });
    await textarea.fill('ET3AM helped me donate food to those in need. Great experience!');

    const submitBtn = page.locator('button[type="submit"]').first();
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    await page.waitForTimeout(2000);

    const successMessage = page.locator('.alert-success, .alert').first();
    await expect(successMessage).toBeVisible({ timeout: 10000 });
  });
});
