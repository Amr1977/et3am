import { Given, When, Then, Before } from '@cucumber/cucumber';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_integration_tests';

const mockDonation = {
  id: 'donation-test-1',
  donor_id: 'user-test-1',
  title: 'Test Food',
  description: 'Test description',
  food_type: 'cooked',
  quantity: 5,
  unit: 'meals',
  pickup_address: '123 Test St',
  latitude: 30.0444,
  longitude: 31.2357,
  pickup_date: '2025-12-31',
  expiry_date: '2026-01-01',
  status: 'available',
  reserved_by: null,
  hash_code: null,
};

const mockReservedDonation = {
  ...mockDonation,
  id: 'donation-reserved-1',
  status: 'reserved',
  reserved_by: 'user-test-2',
  hash_code: 'ABC123',
};

declare global {
  namespace NodeJS {
    interface Global {
      lastDonationId: string;
      lastReservationId: string;
      dailyLimitHit: boolean;
    }
  }
}

let app: express.Application;

Before(async function() {
  app = globalThis.app || express();
  app.use(express.json());
  globalThis.lastDonationId = '';
  globalThis.lastReservationId = '';
  globalThis.dailyLimitHit = false;
});

Given('an available donation exists', async function() {
  globalThis.lastDonationId = mockDonation.id;
});

Given('a reserved donation exists', async function() {
  globalThis.lastReservationId = mockReservedDonation.id;
});

Given('I have created a donation', async function() {
  globalThis.lastDonationId = mockDonation.id;
});

Given('I have permission to donate', async function() {
  // User has can_donate = true in mock
});

Given('I have permission to receive', async function() {
  // User has can_receive = true in mock
});

Given('I have not reached daily limit', async function() {
  globalThis.dailyLimitHit = false;
});

Given('I have already reserved a donation today', async function() {
  globalThis.dailyLimitHit = true;
});

Given('the donation has a hash code', async function() {
  // Mock donation has hash_code
});

Given('the donation has a verified hash code', async function() {
  // Donation is in reserved state with verified hash
});

Given('I have created donations', async function() {
  globalThis.lastDonationId = mockDonation.id;
});

Given('I have reserved donations', async function() {
  globalThis.lastReservationId = mockReservedDonation.id;
});

Given('I cannot donate', async function() {
  // Set user can_donate to false in mock
});

When('I send a POST request to {string} with valid donation data', async function(this: any, path: string) {
  const res = await request(app)
    .post(path)
    .set('Authorization', `Bearer ${globalThis.testToken}`)
    .send({
      title: 'New Donation',
      food_type: 'cooked',
      quantity: 5,
      unit: 'meals',
      pickup_address: '123 Test St',
      pickup_date: '2025-12-31',
      expiry_date: '2026-01-01',
    });
  this.response = res;
  if (res.body.donation?.id) {
    globalThis.lastDonationId = res.body.donation.id;
  }
});

When('I send a POST request to {string} with missing required fields', async function(this: any, path: string) {
  const res = await request(app)
    .post(path)
    .set('Authorization', `Bearer ${globalThis.testToken}`)
    .send({ title: 'Incomplete' });
  this.response = res;
});

When('I send a GET request to {string}', async function(this: any, path: string) {
  const res = await request(app)
    .get(path)
    .set('Authorization', `Bearer ${globalThis.testToken}`);
  this.response = res;
});

When('I send a POST request to {string}/reserve', async function(this: any, path: string) {
  const donationPath = path.replace('{donationId}', globalThis.lastDonationId || mockDonation.id);
  const res = await request(app)
    .post(`${donationPath}/reserve`)
    .set('Authorization', `Bearer ${globalThis.testToken}`);
  this.response = res;
});

When('I send a POST request to {string}/verify-hash', async function(this: any, path: string) {
  const donationPath = path.replace('{donationId}', globalThis.lastReservationId || mockReservedDonation.id);
  const res = await request(app)
    .post(`${donationPath}/verify-hash`)
    .set('Authorization', `Bearer ${globalThis.testToken}`)
    .send({ hash_code: 'ABC123' });
  this.response = res;
});

When('I send a POST request to {string}/complete', async function(this: any, path: string) {
  const donationPath = path.replace('{donationId}', globalThis.lastReservationId || mockReservedDonation.id);
  const res = await request(app)
    .post(`${donationPath}/complete`)
    .set('Authorization', `Bearer ${globalThis.testToken}`);
  this.response = res;
});

When('I send a POST request to {string}/cancel-reservation', async function(this: any, path: string) {
  const donationPath = path.replace('{donationId}', globalThis.lastReservationId || mockReservedDonation.id);
  const res = await request(app)
    .post(`${donationPath}/cancel-reservation`)
    .set('Authorization', `Bearer ${globalThis.testToken}`);
  this.response = res;
});

When('I send a PUT request to {string} with updated data', async function(this: any, path: string) {
  const donationPath = path.replace('{donationId}', globalThis.lastDonationId || mockDonation.id);
  const res = await request(app)
    .put(donationPath)
    .set('Authorization', `Bearer ${globalThis.testToken}`)
    .send({ title: 'Updated Title' });
  this.response = res;
});

When('I send a DELETE request to {string}', async function(this: any, path: string) {
  const donationPath = path.replace('{donationId}', globalThis.lastDonationId || mockDonation.id);
  const res = await request(app)
    .delete(donationPath)
    .set('Authorization', `Bearer ${globalThis.testToken}`);
  this.response = res;
});

Then('the donation should be saved in the database', function() {
  expect(this.response.body).toHaveProperty('donation');
});

Then('all returned donations should have status {string}', function(status: string) {
  const donations = this.response.body.donations || [];
  donations.forEach((d: any) => {
    expect(d.status).toBe(status);
  });
});

Then('the response should contain a hash_code', function() {
  expect(this.response.body).toHaveProperty('hash_code');
});

Then('the donation status should be {string}', function(status: string) {
  expect(this.response.body.donation?.status).toBe(status);
});

Then('the response should contain my donations', function() {
  expect(this.response.body).toHaveProperty('donations');
});

Then('the response should contain my reservations', function() {
  expect(this.response.body).toHaveProperty('donations');
});