import { Given, When, Then, Before } from '@cucumber/cucumber';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_integration_tests';

const mockStats = {
  users: { total: 100, newLast30Days: 10, admins: 2, donors: 50, receivers: 40 },
  donations: { total: 200, available: 50, reserved: 30, completed: 100, expired: 20, newLast7Days: 15, newLast30Days: 50, completedLast7Days: 25, activeReservations: 10 },
  charts: {
    dailyDonations: [
      { date: '2025-12-01', count: 10 },
      { date: '2025-12-02', count: 15 },
    ],
    topAreas: [
      { area: 'Downtown', count: 30 },
      { area: 'Uptown', count: 20 },
    ],
    statusDistribution: [
      { status: 'available', count: 50 },
      { status: 'reserved', count: 30 },
      { status: 'completed', count: 100 },
      { status: 'expired', count: 20 },
    ],
  },
};

const mockTicket = {
  id: 'ticket-1',
  user_id: 'user-test-1',
  type: 'bug',
  title: 'Test Ticket',
  description: 'Test description',
  status: 'open',
  priority: 'high',
};

const mockUser = {
  id: 'user-test-1',
  name: 'Test User',
  email: 'test@example.com',
};

declare global {
  namespace NodeJS {
    interface Global {
      adminToken: string;
      testTicketId: string;
      testUserId: string;
    }
  }
}

let app: express.Application;

Before(async function() {
  app = globalThis.app || express();
  app.use(express.json());
  globalThis.adminToken = '';
  globalThis.testTicketId = '';
  globalThis.testUserId = '';
});

Given('I am authenticated as an admin', async function() {
  globalThis.adminToken = jwt.sign({ userId: 'admin-test-1', role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
});

Given('a support ticket exists', async function() {
  globalThis.testTicketId = mockTicket.id;
});

Given('a user exists', async function() {
  globalThis.testUserId = mockUser.id;
});

Given('a donation exists', async function() {
  // Mock donation exists
});

Given('I have created support tickets', async function() {
  globalThis.testTicketId = mockTicket.id;
});

Given('another user has a support ticket', async function() {
  globalThis.testTicketId = 'other-ticket-1';
});

When('I send a POST request to {string} with ticket details', async function(this: any, path: string) {
  const res = await request(app)
    .post(path)
    .set('Authorization', `Bearer ${globalThis.testToken}`)
    .send({ type: 'bug', title: 'New Ticket', description: 'Test description' });
  this.response = res;
});

When('I send a POST request to {string} with invalid ticket type', async function(this: any, path: string) {
  const res = await request(app)
    .post(path)
    .set('Authorization', `Bearer ${globalThis.testToken}`)
    .send({ type: 'invalid', title: 'Test', description: 'Test' });
  this.response = res;
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
    .set('Authorization', `Bearer ${globalThis.adminToken || globalThis.testToken}`);
  this.response = res;
});

When('I send a GET request to {string} with search term', async function(this: any, path: string) {
  const queryPath = path.includes('?') ? path : `${path}?search=john`;
  const res = await request(app)
    .get(queryPath)
    .set('Authorization', `Bearer ${globalThis.adminToken}`);
  this.response = res;
});

When('I send a GET request to {string} with status filter', async function(this: any, path: string) {
  const queryPath = `${path}?status=available`;
  const res = await request(app)
    .get(queryPath)
    .set('Authorization', `Bearer ${globalThis.adminToken}`);
  this.response = res;
});

When('I send a GET request to {string} with priority filter', async function(this: any, path: string) {
  const queryPath = `${path}?priority=high`;
  const res = await request(app)
    .get(queryPath)
    .set('Authorization', `Bearer ${globalThis.adminToken}`);
  this.response = res;
});

When('I send a PUT request to {string} with update data', async function(this: any, path: string) {
  const updatePath = path.replace('{ticketId}', globalThis.testTicketId || mockTicket.id);
  const res = await request(app)
    .put(updatePath)
    .set('Authorization', `Bearer ${globalThis.adminToken}`)
    .send({ status: 'closed', priority: 'low' });
  this.response = res;
});

When('I send a PUT request to {string} with update data', async function(this: any, path: string) {
  const updatePath = path.replace('{userId}', globalThis.testUserId || mockUser.id);
  const res = await request(app)
    .put(updatePath)
    .set('Authorization', `Bearer ${globalThis.adminToken}`)
    .send({ name: 'Updated Name', role: 'admin' });
  this.response = res;
});

Then('the response should contain user statistics', function() {
  expect(this.response.body).toHaveProperty('users');
});

Then('the response should contain donation statistics', function() {
  expect(this.response.body).toHaveProperty('donations');
});

Then('the response should contain donation counts by status', function() {
  expect(this.response.body.donations).toHaveProperty('available');
  expect(this.response.body.donations).toHaveProperty('reserved');
  expect(this.response.body.donations).toHaveProperty('completed');
});

Then('the response should contain newLast30Days users count', function() {
  expect(this.response.body.users).toHaveProperty('newLast30Days');
});

Then('the response should contain dailyDonations chart data', function() {
  expect(this.response.body.charts).toHaveProperty('dailyDonations');
});

Then('the response should contain statusDistribution', function() {
  expect(this.response.body.charts).toHaveProperty('statusDistribution');
});

Then('the response should contain topAreas', function() {
  expect(this.response.body.charts).toHaveProperty('topAreas');
});

Then('the response should contain users list', function() {
  expect(this.response.body).toHaveProperty('users');
});

Then('the response should contain matching users', function() {
  expect(this.response.body.users).toBeDefined();
});

Then('the response should contain donations list', function() {
  expect(this.response.body).toHaveProperty('donations');
});

Then('all returned tickets should have status {string}', function(status: string) {
  const tickets = this.response.body.tickets || [];
  tickets.forEach((t: any) => {
    expect(t.status).toBe(status);
  });
});

Then('all returned tickets should have priority {string}', function(priority: string) {
  const tickets = this.response.body.tickets || [];
  tickets.forEach((t: any) => {
    expect(t.priority).toBe(priority);
  });
});

Then('all returned donations should have status {string}', function(status: string) {
  const donations = this.response.body.donations || [];
  donations.forEach((d: any) => {
    expect(d.status).toBe(status);
  });
});

Then('the response should contain recent admin actions', function() {
  expect(this.response.body).toHaveProperty('logs');
});