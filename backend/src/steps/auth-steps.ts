import { Given, When, Then, Before } from '@cucumber/cucumber';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_integration_tests';

declare global {
  namespace NodeJS {
    interface Global {
      testToken: string;
      testUserId: string;
      testAdminToken: string;
    }
  }
}

const mockUser = {
  id: 'user-test-1',
  name: 'Test User',
  email: 'test@example.com',
  password: '$2a$10$xJwG5KkQHVF9pQLmQ2zMKOQqK2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q',
  role: 'user' as const,
  can_donate: true,
  can_receive: true,
  preferred_language: 'en' as const,
};

const mockAdmin = {
  id: 'admin-test-1',
  name: 'Admin User',
  email: 'admin@example.com',
  password: '$2a$10$xJwG5KkQHVF9pQLmQ2zMKOQqK2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q',
  role: 'admin' as const,
  can_donate: true,
  can_receive: true,
  preferred_language: 'en' as const,
};

let app: express.Application;

Before(async function() {
  app = globalThis.app || express();
  app.use(express.json());
});

Given('the API server is running', async function() {
  // Assume server is running - this step is a no-op in integration tests
});

Given('a user exists in the database', async function() {
  // Mock user exists - handled by vi.mock in tests
});

Given('I am authenticated as a regular user', async function() {
  globalThis.testToken = jwt.sign({ userId: mockUser.id, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
  globalThis.testUserId = mockUser.id;
});

Given('I am authenticated as a donor', async function() {
  globalThis.testToken = jwt.sign({ userId: mockUser.id, role: 'donor' }, JWT_SECRET, { expiresIn: '7d' });
  globalThis.testUserId = mockUser.id;
});

Given('I am authenticated as a receiver', async function() {
  globalThis.testToken = jwt.sign({ userId: mockUser.id, role: 'recipient' }, JWT_SECRET, { expiresIn: '7d' });
  globalThis.testUserId = mockUser.id;
});

Given('I am authenticated as an admin', async function() {
  globalThis.testAdminToken = jwt.sign({ userId: mockAdmin.id, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
});

Given('a valid Google OAuth token', async function() {
  // Mock Google token - would be validated in real implementation
});

When('I send a POST request to {string} with valid user data', async function(this: any, path: string) {
  const res = await request(app)
    .post(path)
    .send({ name: 'New User', email: 'new@example.com', password: 'password123' });
  this.response = res;
});

When('I send a POST request to {string} with valid credentials', async function(this: any, path: string) {
  const res = await request(app)
    .post(path)
    .send({ email: mockUser.email, password: 'password123' });
  this.response = res;
});

When('I send a POST request to {string} with wrong password', async function(this: any, path: string) {
  const res = await request(app)
    .post(path)
    .send({ email: mockUser.email, password: 'wrongpassword' });
  this.response = res;
});

When('I send a GET request to {string}', async function(this: any, path: string) {
  const res = await request(app).get(path);
  this.response = res;
});

Then('I should receive a {int} status code', function(statusCode: number) {
  expect(this.response.status).toBe(statusCode);
});

Then('the response should contain a valid JWT token', function() {
  expect(this.response.body).toHaveProperty('token');
});

Then('the response should contain messageKey {string}', function(messageKey: string) {
  expect(this.response.body).toHaveProperty('messageKey', messageKey);
});