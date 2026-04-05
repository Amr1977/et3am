import { test, expect, APIRequestContext } from '@playwright/test';
import { BASE_URL, API_URL } from './fixtures';

interface TestUser {
  id: string;
  email: string;
  password: string;
  name: string;
}

async function createTestUser(request: APIRequestContext, role: 'donor' | 'receiver' = 'donor'): Promise<{ user: TestUser; token: string }> {
  const email = `test_${role}_${Date.now()}@example.com`;
  const password = 'Test123456!';
  const name = `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`;

  await request.post(`${API_URL}/api/auth/register`, {
    data: { email, password, name, role }
  }).catch(() => {});

  const login = await request.post(`${API_URL}/api/auth/login`, {
    data: { email, password }
  });
  const data = await login.json();

  return {
    user: { id: data.userId, email, password, name },
    token: data.token
  };
}

test.describe('Donation Flow', () => {
  test('donor can create a donation', async ({ request }) => {
    const { user, token } = await createTestUser(request, 'donor');

    const donation = await request.post(`${API_URL}/api/donations`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        food_type: 'cooked',
        quantity: 5,
        unit: 'portions',
        description: 'Test donation for e2e',
        pickup_address: '123 Test St, Cairo',
        pickup_date: new Date(Date.now() + 3600000).toISOString(),
        expiry_date: new Date(Date.now() + 86400000).toISOString()
      }
    });

    expect(donation.status()).toBe(201);
    const data = await donation.json();
    expect(data.donation_id).toBeDefined();
  });

  test('receiver can reserve a donation', async ({ request }) => {
    const donor = await createTestUser(request, 'donor');
    const receiver = await createTestUser(request, 'receiver');

    const donation = await request.post(`${API_URL}/api/donations`, {
      headers: { Authorization: `Bearer ${donor.token}` },
      data: {
        food_type: 'cooked',
        quantity: 3,
        unit: 'portions',
        description: 'Food for reserve test',
        pickup_address: '456 Test Ave, Cairo',
        pickup_date: new Date(Date.now() + 3600000).toISOString(),
        expiry_date: new Date(Date.now() + 86400000).toISOString()
      }
    });

    const donationData = await donation.json();
    const donationId = donationData.donation_id;

    const reserve = await request.post(`${API_URL}/api/donations/${donationId}/reserve`, {
      headers: { Authorization: `Bearer ${receiver.token}` }
    });

    expect(reserve.status()).toBe(200);
  });

  test('donor can mark donation as completed', async ({ request }) => {
    const { user, token } = await createTestUser(request, 'donor');

    const donation = await request.post(`${API_URL}/api/donations`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        food_type: 'cooked',
        quantity: 2,
        unit: 'portions',
        description: 'Completion test',
        pickup_address: '789 Test Rd, Cairo',
        pickup_date: new Date(Date.now() + 3600000).toISOString(),
        expiry_date: new Date(Date.now() + 86400000).toISOString()
      }
    });

    const donationData = await donation.json();
    const donationId = donationData.donation_id;

    const complete = await request.put(`${API_URL}/api/donations/${donationId}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'completed' }
    });

    expect(complete.status()).toBe(200);
  });
});