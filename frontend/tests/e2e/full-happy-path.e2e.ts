import { test, expect, Page } from '@playwright/test';

const API_URL = 'http://localhost:3002';
const BASE_URL = 'http://localhost:5173';
const PASSWORD = 'Test123456!';
const prefix = `hp${Date.now()}`;

interface TestUser {
  email: string;
  name: string;
  token: string;
  id?: string;
}

// ─── API Helpers ───────────────────────────────────────────────
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

async function createDonation(token: string, title: string) {
  return api('POST', '/api/donations', token, {
    title, description: 'E2E test donation - please delete',
    food_type: 'other', quantity: 2, unit: 'portions',
    pickup_address: '1 Test Street, Cairo',
    pickup_date: '2026-07-01', pickup_time: '12:00',
    latitude: 30.0444, longitude: 31.2357,
  });
}

async function reserveDonation(token: string, donationId: string) {
  return api('POST', `/api/donations/${donationId}/reserve`, token, {});
}

async function sendChatMessage(token: string, donationId: string, message: string) {
  return api('POST', `/api/chat/${donationId}`, token, { message });
}

async function getChatMessages(token: string, donationId: string) {
  return api('GET', `/api/chat/${donationId}`, token);
}

async function completeDonation(token: string, donationId: string) {
  return api('PUT', `/api/donations/${donationId}`, token, { status: 'completed' });
}

async function getMyDonations(token: string) {
  const res = await api('GET', '/api/donations/my-donations', token);
  return res.donations || [];
}

async function getMyReservations(token: string) {
  const res = await api('GET', '/api/donations/my-reservations', token);
  return res.donations || [];
}

// ─── UI Helper ─────────────────────────────────────────────────
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

// ─── Mock API Route Helper ─────────────────────────────────────
function setupMockApiRoutes(page: Page) {
  // Intercept all /api/ requests and route to the real backend
  page.route('**/api/**', async (route) => {
    const url = route.request().url();
    const parsed = new URL(url);
    const apiPath = parsed.pathname + parsed.search;
    const target = `${API_URL}${apiPath}`;
    const headers = route.request().headers();
    // Remove origin to avoid CORS issues
    delete headers['origin'];
    delete headers['Origin'];
    const body = route.request().postData();
    const method = route.request().method();

    // Use Node.js fetch to make the request from the test process (no CORS)
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

// ─── Test ──────────────────────────────────────────────────────
test.describe('Full Happy Path - 2 Users', () => {
  let donor: TestUser;
  let receiver: TestUser;
  let donationId: string;

  test.beforeAll(async () => {
    donor = await registerUser(`${prefix}-donor@test.com`, 'Donor User');
    receiver = await registerUser(`${prefix}-receiver@test.com`, 'Receiver User');

    const donationData = await createDonation(donor.token, 'E2E Test Pizza');
    donationId = donationData.id || donationData.donation?.id;

    await reserveDonation(receiver.token, donationId);
    await sendChatMessage(receiver.token, donationId, 'Hi! I can pick up the food.');
    await sendChatMessage(donor.token, donationId, 'Great! See you at 12.');
  });

  test('1. API: Donor can fetch their donation', async () => {
    const donations = await getMyDonations(donor.token);
    const match = donations.find((d: any) => d.id === donationId);
    expect(match).toBeDefined();
    expect(match.title).toBe('E2E Test Pizza');
  });

  test('2. API: Receiver can fetch their reservation', async () => {
    const reservations = await getMyReservations(receiver.token);
    const match = reservations.find((d: any) => d.id === donationId);
    expect(match).toBeDefined();
    expect(match.status).toBe('reserved');
  });

  test('3. API: Hash code is visible on donation', async () => {
    const donation = await api('GET', `/api/donations/${donationId}`, donor.token);
    const hash = donation.hash_code || donation.donation?.hash_code;
    expect(hash).toBeDefined();
    expect(hash!.length).toBe(6);
    expect(/^[A-Z0-9]{6}$/.test(hash!)).toBe(true);
  });

  test('4. API: Chat messages persisted', async () => {
    const messages = await getChatMessages(donor.token, donationId);
    expect(messages.messages).toBeDefined();
    expect(messages.messages.length).toBeGreaterThanOrEqual(2);
    const texts = messages.messages.map((m: any) => m.message);
    expect(texts).toContain('Hi! I can pick up the food.');
    expect(texts).toContain('Great! See you at 12.');
  });

  test('5. UI: My Donations page shows donor their donation', async ({ page }) => {
    await setupAuth(page, `${BASE_URL}/my-donations`, donor.token);

    const donationTitle = page.locator('text=E2E Test Pizza').first();
    await expect(donationTitle).toBeVisible({ timeout: 15000 });
  });

  test('6. UI: My Reservations page shows reservation to receiver', async ({ page }) => {
    await setupAuth(page, `${BASE_URL}/my-reservations`, receiver.token);

    const donationTitle = page.locator('text=E2E Test Pizza').first();
    await expect(donationTitle).toBeVisible({ timeout: 15000 });
  });

  test('7. API: Complete donation', async () => {
    await completeDonation(donor.token, donationId);
    const donation = await api('GET', `/api/donations/${donationId}`, donor.token);
    const status = donation.status || donation.donation?.status;
    expect(status).toBe('completed');
  });
});
