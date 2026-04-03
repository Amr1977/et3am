import request from 'supertest';
import express from 'express';
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

const createToken = (userId: string, role: string = 'user') => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
};

vi.mock('../database', () => ({
  dbOps: {
    donations: {
      findAll: vi.fn().mockResolvedValue({ donations: [mockDonation], total: 1 }),
      findById: vi.fn().mockImplementation((id: string) => {
        if (id === 'donation-1') return Promise.resolve(mockDonation);
        return Promise.resolve(null);
      }),
      findByDonor: vi.fn().mockResolvedValue([mockDonation]),
      findByReserved: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue(mockDonation),
      update: vi.fn().mockResolvedValue({ ...mockDonation }),
      delete: vi.fn().mockResolvedValue(true),
    },
    users: {
      findById: vi.fn().mockResolvedValue({ id: 'user-1', preferred_language: 'en' }),
    },
  },
}));

describe('Donations Routes', () => {
  const app = express();
  app.use(express.json());
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET donations list', () => {
    it('should return donations array', async () => {
      const res = await request(app).get('/api/donations');
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/donations', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/donations')
        .send({ title: 'Test', food_type: 'cooked', pickup_address: '123 St' });
      expect(res.status).toBe(401);
    });
  });

  describe('JWT token', () => {
    it('should generate valid token', () => {
      const token = createToken('user-1');
      expect(token).toBeDefined();
    });

    it('should verify valid token', () => {
      const token = createToken('user-1');
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded).toHaveProperty('userId', 'user-1');
    });

    it('should reject invalid token', () => {
      expect(() => {
        jwt.verify('invalid-token', JWT_SECRET);
      }).toThrow();
    });
  });
});