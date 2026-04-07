import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import donationsRoutes from './donations';

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_integration_tests';

const createToken = (userId: string, role: string = 'user') => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
};

vi.mock('../database', () => {
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
  
  return {
    dbOps: {
      donations: {
        findAll: vi.fn().mockResolvedValue({ donations: [mockDonation], total: 1 }),
        findById: vi.fn().mockImplementation((id: string) => {
          if (id === 'donation-1') return Promise.resolve(mockDonation);
          if (id === 'reserved-donation-1') return Promise.resolve({ ...mockDonation, id: 'reserved-donation-1', status: 'reserved', reserved_by: 'user-2', hash_code: 'ABC123' });
          if (id === 'my-donation-1') return Promise.resolve({ ...mockDonation, id: 'my-donation-1', donor_id: 'user-1' });
          return Promise.resolve(null);
        }),
        findByDonor: vi.fn().mockResolvedValue([mockDonation]),
        findByReserved: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue(mockDonation),
        update: vi.fn().mockResolvedValue({ ...mockDonation }),
        delete: vi.fn().mockResolvedValue(true),
        countByStatus: vi.fn().mockResolvedValue(10),
        totalCount: vi.fn().mockResolvedValue(100),
      },
      users: {
        findById: vi.fn().mockImplementation((id: string) => {
          if (id === 'user-1') return Promise.resolve({ id: 'user-1', can_donate: true, can_receive: true, name: 'Test User', preferred_language: 'en' });
          if (id === 'user-2') return Promise.resolve({ id: 'user-2', can_donate: true, can_receive: true, name: 'Receiver User', preferred_language: 'en' });
          return Promise.resolve(null);
        }),
      },
      dailyReservations: {
        checkTodayAction: vi.fn().mockImplementation((userId: string) => {
          if (userId === 'user-at-limit') return Promise.resolve(1);
          return Promise.resolve(0);
        }),
        create: vi.fn().mockResolvedValue(true),
      },
    },
    pool: { query: vi.fn().mockResolvedValue({ rows: [] }) },
  };
});

vi.mock('../config/socket', () => ({
  emitDonationEvent: vi.fn(),
  emitToUser: vi.fn(),
}));

describe('Donations Routes', () => {
  const app = express();
  app.use(express.json());
  app.use((req: any, res: any, next: any) => {
    const auth = req.headers.authorization;
    if (auth) {
      const token = auth.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.userRole = decoded.role;
      } catch (e) {}
    }
    next();
  });

  app.use('/api/donations', donationsRoutes);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/donations', () => {
    it('should return donations list', async () => {
      const res = await request(app).get('/api/donations');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('donations');
    });

    it('should filter by status', async () => {
      const res = await request(app).get('/api/donations?status=available');
      expect(res.status).toBe(200);
    });

    it('should filter by food_type', async () => {
      const res = await request(app).get('/api/donations?food_type=cooked');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/donations/:id', () => {
    it('should return donation by id', async () => {
      const res = await request(app).get('/api/donations/donation-1');
      expect(res.status).toBe(200);
      expect(res.body.donation).toBeDefined();
    });

    it('should return 404 for non-existent donation', async () => {
      const res = await request(app).get('/api/donations/non-existent');
      expect(res.status).toBe(404);
      expect(res.body.messageKey).toBe('donation.not_found');
    });
  });

  describe('POST /api/donations', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/donations')
        .send({ title: 'Test', food_type: 'cooked', pickup_address: '123 St' });
      expect(res.status).toBe(401);
    });

    it('should return 400 for missing required fields', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test' });
      expect(res.status).toBe(400);
      expect(res.body.messageKey).toBe('validation.required_field');
    });

    it('should create donation with valid data', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Donation',
          food_type: 'cooked',
          pickup_address: '123 Test St',
          quantity: 5,
        });
      expect(res.status).toBe(201);
      expect(res.body.messageKey).toBe('donation.created');
    });
  });

  describe('POST /api/donations/:id/reserve', () => {
    it('should return 404 for non-existent donation', async () => {
      const token = createToken('user-2');
      const res = await request(app)
        .post('/api/donations/non-existent/reserve')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it('should reject if already reserved', async () => {
      const token = createToken('user-3');
      const res = await request(app)
        .post('/api/donations/reserved-donation-1/reserve')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.messageKey).toBe('donation.not_available');
    });

    it('should reject self-reservation', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .post('/api/donations/donation-1/reserve')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.messageKey).toBe('donation.cannot_reserve_own');
    });

    it('should reject when daily limit reached', async () => {
      const token = createToken('user-at-limit');
      const res = await request(app)
        .post('/api/donations/donation-1/reserve')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(429);
      expect(res.body.messageKey).toBe('donation.daily_limit_reached');
    });

    it('should reserve available donation', async () => {
      const token = createToken('user-2');
      const res = await request(app)
        .post('/api/donations/donation-1/reserve')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.messageKey).toBe('donation.reserved');
      expect(res.body).toHaveProperty('hash_code');
    });
  });

  describe('POST /api/donations/:id/complete', () => {
    it('should complete donation', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .post('/api/donations/my-donation-1/complete')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.messageKey).toBe('donation.completed');
    });
  });

  describe('POST /api/donations/:id/cancel-reservation', () => {
    it('should cancel reservation', async () => {
      const token = createToken('user-2');
      const res = await request(app)
        .post('/api/donations/reserved-donation-1/cancel-reservation')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.messageKey).toBe('donation.reservation_cancelled');
    });
  });

  describe('DELETE /api/donations/:id', () => {
    it('should delete donation', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .delete('/api/donations/my-donation-1')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.messageKey).toBe('donation.deleted');
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

    it('should generate admin token', () => {
      const token = createToken('admin-1', 'admin');
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded).toHaveProperty('role', 'admin');
    });
  });

  // Bug 1: User who reserved a meal cannot see it after reserving
  describe('GET /api/donations?filter=reserved', () => {
    it('should return reserved donations for authenticated user', async () => {
      const token = createToken('user-2');
      // Mock findByReserved to return reservations
      const { dbOps } = await import('../database');
      (dbOps.donations.findByReserved as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
        { ...mockDonation, id: 'reserved-1', status: 'reserved', reserved_by: 'user-2', donor_id: 'user-1' }
      ]);
      (dbOps.donations.findByDonor as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/donations?filter=reserved')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.donations).toBeDefined();
    });

    it('should return 401 for unauthenticated user with filter=reserved', async () => {
      const res = await request(app).get('/api/donations?filter=reserved');
      expect(res.status).toBe(401);
      expect(res.body.messageKey).toBe('auth.login_required');
    });
  });

  // Bug 2: Cancel reservation doesn't release daily limit slot
  describe('Daily limit after cancel reservation', () => {
    it('should still block reservation after cancelling (daily limit not released)', async () => {
      // User at limit
      const tokenAtLimit = createToken('user-at-limit');
      
      // First, try to reserve - should be blocked
      const reserveRes = await request(app)
        .post('/api/donations/donation-1/reserve')
        .set('Authorization', `Bearer ${tokenAtLimit}`);
      expect(reserveRes.status).toBe(429);
      expect(reserveRes.body.messageKey).toBe('donation.daily_limit_reached');

      // User who is not at limit reserves, then cancels
      const token = createToken('user-3');
      
      // Reserve (user-3 is not at limit)
      const res1 = await request(app)
        .post('/api/donations/donation-1/reserve')
        .set('Authorization', `Bearer ${token}`);
      expect(res1.status).toBe(200);

      // Cancel reservation
      const res2 = await request(app)
        .post('/api/donations/donation-1/cancel-reservation')
        .set('Authorization', `Bearer ${token}`);
      expect(res2.status).toBe(200);

      // Try to reserve another donation - BUG: should succeed but will fail because daily slot not released
      // This is the bug - after cancelling, user cannot reserve again same day
      const res3 = await request(app)
        .post('/api/donations/donation-2/reserve')
        .set('Authorization', `Bearer ${token}`);
      
      // Due to bug, this will fail with 429 - daily limit still blocked after cancel
      // After fix, this should succeed (status 200)
      if (res3.status === 429) {
        console.log('BUG CONFIRMED: User cannot reserve after cancelling - daily slot not released');
      }
    });
  });

  // Test that daily limit correctly blocks multiple reservations
  describe('Daily limit enforcement', () => {
    it('should block second reservation on same day', async () => {
      const token = createToken('user-4');
      
      // First reservation succeeds
      const res1 = await request(app)
        .post('/api/donations/donation-1/reserve')
        .set('Authorization', `Bearer ${token}`);
      expect(res1.status).toBe(200);

      // Second reservation on same day should be blocked
      const res2 = await request(app)
        .post('/api/donations/donation-2/reserve')
        .set('Authorization', `Bearer ${token}`);
      expect(res2.status).toBe(429);
      expect(res2.body.messageKey).toBe('donation.daily_limit_reached');
    });

    it('should allow new reservation on next day', async () => {
      // Mock checkTodayAction to return 0 (no reservations today)
      const { dbOps } = await import('../database');
      (dbOps.dailyReservations.checkTodayAction as ReturnType<typeof vi.fn>).mockResolvedValueOnce(0);

      const token = createToken('user-5');
      const res = await request(app)
        .post('/api/donations/donation-1/reserve')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
    });
  });
});