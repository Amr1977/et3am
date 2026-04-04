import { test, expect } from '@playwright/test';

const BASE_URL = 'https://et3am.com';
const API_URL = 'https://api.et3am.com';

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
}

async function createTestUser(api: any, suffix: number): Promise<User> {
  const email = `testuser${suffix}_${Date.now()}@example.com`;
  const password = 'Test123456!';
  const name = `Test User ${suffix}`;

  const res = await api.post('/api/auth/register', {
    data: { email, password, name, role: 'donor' }
  });
  
  if (res.status() === 201) {
    const data = await res.json();
    return { id: data.userId, email, password, name };
  }
  
  // If already exists, try login
  const loginRes = await api.post('/api/auth/login', {
    data: { email, password }
  });
  const loginData = await loginRes.json();
  return { id: loginData.userId, email, password, name };
}

async function loginUser(api: any, email: string, password: string): Promise<{ token: string; userId: string }> {
  const res = await api.post('/api/auth/login', {
    data: { email, password }
  });
  const data = await res.json();
  return { token: data.token, userId: data.userId };
}

test.describe('Full Donation Flow', () => {
  let userA: User;
  let userB: User;
  let tokenA: string;
  let tokenB: string;
  let donationId: string;

  test('1. User A creates a donation', async ({ request }) => {
    // Create or login user A
    const emailA = `donor_${Date.now()}@example.com`;
    const password = 'Test123456!';
    
    await request.post(`${API_URL}/api/auth/register`, {
      data: { email: emailA, password, name: 'Donor User', role: 'donor' }
    }).catch(() => {}); // Ignore if exists

    const loginA = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: emailA, password }
    });
    const dataA = await loginA.json();
    tokenA = dataA.token;
    userA = { id: dataA.userId, email: emailA, password, name: 'Donor User' };

    console.log('User A (Donor):', userA.email, 'Token:', tokenA?.slice(0, 20) + '...');

    // Create donation
    const donation = await request.post(`${API_URL}/api/donations`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      data: {
        food_type: 'cooked',
        quantity: 5,
        unit: 'portions',
        description: 'Test cooked meal donation',
        pickup_address: '123 Test Street, Cairo',
        pickup_date: new Date(Date.now() + 3600000).toISOString(),
        expiry_date: new Date(Date.now() + 86400000).toISOString()
      }
    });

    const donationData = await donation.json();
    donationId = donationData.donation?.id;
    
    console.log('Donation created:', donationId);
    expect(donation.status()).toBe(201);
  });

  test('2. User B reserves the donation', async ({ request }) => {
    // Create or login user B
    const emailB = `receiver_${Date.now()}@example.com`;
    const password = 'Test123456!';
    
    await request.post(`${API_URL}/api/auth/register`, {
      data: { email: emailB, password, name: 'Receiver User', role: 'recipient' }
    }).catch(() => {});

    const loginB = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: emailB, password }
    });
    const dataB = await loginB.json();
    tokenB = dataB.token;
    userB = { id: dataB.userId, email: emailB, password, name: 'Receiver User' };

    console.log('User B (Receiver):', userB.email);

    // Reserve donation
    const reserve = await request.post(`${API_URL}/api/donations/${donationId}/reserve`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });

    const reserveData = await reserve.json();
    console.log('Reservation response:', reserveData.messageKey);
    expect(reserve.status()).toBe(200);
    expect(reserveData.messageKey).toBe('donation.reserved');
  });

  test('3. User B marks donation as received', async ({ request }) => {
    // Mark as complete
    const complete = await request.post(`${API_URL}/api/donations/${donationId}/complete`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });

    const completeData = await complete.json();
    console.log('Complete response:', completeData.messageKey);
    expect(complete.status()).toBe(200);
  });

  test('4. User A reviews User B (donor -> receiver)', async ({ request }) => {
    const review = await request.post(`${API_URL}/api/reviews`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      data: {
        reviewed_id: userB.id,
        donation_id: donationId,
        rating: 5,
        comment: 'Great receiver, picked up on time!',
        review_type: 'donor_to_receiver'
      }
    });

    const reviewData = await review.json();
    console.log('Review from Donor to Receiver:', reviewData.messageKey);
    expect(review.status()).toBe(201);
  });

  test('5. User B reviews User A (receiver -> donor)', async ({ request }) => {
    const review = await request.post(`${API_URL}/api/reviews`, {
      headers: { Authorization: `Bearer ${tokenB}` },
      data: {
        reviewed_id: userA.id,
        donation_id: donationId,
        rating: 5,
        comment: 'Excellent food, thank you!',
        review_type: 'receiver_to_donor'
      }
    });

    const reviewData = await review.json();
    console.log('Review from Receiver to Donor:', reviewData.messageKey);
    expect(review.status()).toBe(201);
  });

  test('6. Verify reviews are visible', async ({ request }) => {
    // Get User A's reviews
    const reviewsA = await request.get(`${API_URL}/api/reviews/user/${userA.id}`);
    const reviewsDataA = await reviewsA.json();
    console.log('User A reviews:', reviewsDataA.reviews?.length);
    expect(reviewsDataA.reviews?.length).toBeGreaterThan(0);

    // Get User B's reviews  
    const reviewsB = await request.get(`${API_URL}/api/reviews/user/${userB.id}`);
    const reviewsDataB = await reviewsB.json();
    console.log('User B reviews:', reviewsDataB.reviews?.length);
    expect(reviewsDataB.reviews?.length).toBeGreaterThan(0);
  });
});
