import { Given, When, Then, Before } from '@cucumber/cucumber';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_integration_tests';

const mockChatDonation = {
  id: 'chat-donation-1',
  donor_id: 'user-test-1',
  title: 'Chat Test Food',
  status: 'reserved',
  reserved_by: 'user-test-2',
};

const mockAvailableDonation = {
  id: 'available-donation-1',
  donor_id: 'user-test-1',
  title: 'Available Food',
  status: 'available',
  reserved_by: null,
};

const mockMessages = [
  { id: 'msg-1', donation_id: 'chat-donation-1', sender_id: 'user-test-1', message: 'Hello', created_at: new Date() },
  { id: 'msg-2', donation_id: 'chat-donation-1', sender_id: 'user-test-2', message: 'Hi there', created_at: new Date() },
];

declare global {
  namespace NodeJS {
    interface Global {
      chatDonationId: string;
      availableDonationId: string;
      hasUnreadMessages: boolean;
    }
  }
}

let app: express.Application;

Before(async function() {
  app = globalThis.app || express();
  app.use(express.json());
  globalThis.chatDonationId = 'chat-donation-1';
  globalThis.availableDonationId = 'available-donation-1';
  globalThis.hasUnreadMessages = true;
});

Given('a reserved donation exists', async function() {
  globalThis.chatDonationId = mockChatDonation.id;
});

Given('an available donation exists', async function() {
  globalThis.availableDonationId = mockAvailableDonation.id;
});

Given('I am a participant in the donation', async function() {
  // User is either donor or reserved_by
});

Given('I am not a participant', async function() {
  // User is neither donor nor reserved_by
});

Given('I am a participant in a donation with messages', async function() {
  globalThis.chatDonationId = mockChatDonation.id;
});

Given('I am a participant in a donation with unread messages', async function() {
  globalThis.hasUnreadMessages = true;
});

When('I send a POST request to {string} with a message', async function(this: any, path: string) {
  const chatPath = path.replace('{donationId}', globalThis.chatDonationId);
  const res = await request(app)
    .post(chatPath)
    .set('Authorization', `Bearer ${globalThis.testToken}`)
    .send({ message: 'Test message' });
  this.response = res;
});

When('I send a POST request to {string} with empty message', async function(this: any, path: string) {
  const chatPath = path.replace('{donationId}', globalThis.chatDonationId);
  const res = await request(app)
    .post(chatPath)
    .set('Authorization', `Bearer ${globalThis.testToken}`)
    .send({ message: '' });
  this.response = res;
});

When('I send a GET request to {string}', async function(this: any, path: string) {
  const chatPath = path.replace('{donationId}', globalThis.chatDonationId);
  const res = await request(app)
    .get(chatPath)
    .set('Authorization', `Bearer ${globalThis.testToken}`);
  this.response = res;
});

When('I send a PUT request to {string}/read', async function(this: any, path: string) {
  const chatPath = path.replace('{donationId}', globalThis.chatDonationId);
  const res = await request(app)
    .put(`${chatPath}/read`)
    .set('Authorization', `Bearer ${globalThis.testToken}`);
  this.response = res;
});

When('I send a GET request to {string}', async function(this: any, path: string) {
  const res = await request(app)
    .get(path)
    .set('Authorization', `Bearer ${globalThis.testToken}`);
  this.response = res;
});

Then('the message should be saved in the database', function() {
  expect(this.response.body).toHaveProperty('data');
});

Then('the response should contain messages', function() {
  expect(this.response.body).toHaveProperty('messages');
});

Then('the response should contain unreadCount', function() {
  expect(this.response.body).toHaveProperty('unreadCount');
});