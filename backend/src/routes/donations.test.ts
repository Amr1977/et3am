import { describe, it, expect, vi, beforeEach } from 'viest';
import request from 'supertest';
import express from 'express';
import donationsRouter from './donations';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'et3am-secret-key-2024';

const mockDonation = {
  id: 'donation-1',
  donor_id: 'user-1',
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
  created_at: new Date(),
};

vi.mock('../database', () => ({
  dbOps: {
    donations: {
      findAll: vi.fn().mockResolvedValue({ donations: [mockDonation], total: 1 }),
      findById: vi.fn().mockResolvedValue(mockDonation),
      findByDonor: vi.fn().mockResolvedValue([mockDonation]),
      findByReserved: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue(mockDonation),
      update: vi.fn().mockResolvedValue({ ...mockDonation, ...updates }),
      delete: vi.fn().mockResolvedValue(true),
    },
  },
}));

let updates = {};

const createToken = (userId: string, role: string = 'user') => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
};

const app = express();
app.use(express.json());
app.use('/api/donations', donationsRouter);

describe('Donations Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updates = {};
  });

  describe('GET /api/donations', () => {
    it('returns list of donations', async () => {
      const res = await request(app).get('/api/donations');
      expect(res.status).toBe(200);
      expect(res.body.donations).toBeDefined();
      expect(Array.isArray(res.body.donations)).toBe(true);
    });

    it('returns pagination info', async () => {
      const res = await request(app).get('/api/donations');
      expect(res.status).toBe(200);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(1);
    });

    it('filters donations by status', async () => {
      const res = await request(app).get('/api/donations?status=available');
      expect(res.status).toBe(200);
    });

    it('filters donations by food_type', async () => {
      const res = await request(app).get('/api/donations?food_type=cooked');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/donations/:id', () => {
    it('returns a specific donation', async () => {
      const res = await request(app).get('/api/donations/donation-1');
      expect(res.status).toBe(200);
      expect(res.body.donation).toBeDefined();
    });

    it('returns 404 for non-existent donation', async () => {
      const res = await request(app).get('/api/donations/non-existent');
      expect(res.status).toBe(404);
    });
  });

  describe('.POST /api/donations', () => {
    it('returns 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/donations')
        .send({ title: 'Test', food_type: 'cooked', pickup_address: '123 St' });
      expect(res.status).toBe(401);
    });

    it('creates donation with valid data', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test', food_type: 'cooked', pickup_address: '123 St' });
      expect(res.status).toBe(201);
    });

    it('returns 400 when title missing', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${token}`)
        .send({ food_type: 'cooked', pickup_address: '123 St' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when food_type missing', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test', pickup_address: '123 St' });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/donations/:id', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app)
        .put('/api/donations/donation-1')
        .send({ title: 'Updated' });
      expect(res.status).toBe(401);
    });

    it('updates donation when owner', async () => {
      const token = createToken('user-1');
      updates = { title: 'Updated Title' };
      const res = await request(app)
        .put('/api/donations/donation-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/donations/:id/reserve', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/donations/donation-1/reserve');
      expect(res.status).toBe(401);
    });

    it('returns 404 for non-existent donation', async () => {
      const token = createToken('user-2');
      const res = await request(app)
        .post('/api/donations/non-existent/reserve')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/donations/:id', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app)
        .delete('/api/donations/donation-1');
      expect(res.status).toBe(401);
    });

    it('deletes when owner', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .delete('/api/donations/donation-1')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('returns 403 when not owner', async () => {
      const token = createToken('user-2');
      const res = await request(app)
        .delete('/api/donations/donation-1')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });
});