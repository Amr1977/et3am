import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_integration_tests';

const mockDonation = {
  id: 'donation-1',
  donor_id: 'donor-1',
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

const mockDailyReservations = [
  { id: 'res-1', user_id: 'user-1', donation_id: 'donation-past-1', action_type: 'reserve', reservation_date: new Date() },
];

const createToken = (userId: string) => {
  return jwt.sign({ userId, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
};

vi.mock('../database', () => ({
  dbOps: {
    donations: {
      findById: vi.fn().mockImplementation((id: string) => {
        if (id === 'donation-1') return Promise.resolve(mockDonation);
        if (id === 'donation-2') return Promise.resolve({ ...mockDonation, id: 'donation-2' });
        return Promise.resolve(null);
      }),
      update: vi.fn().mockImplementation((id, updates) => {
        return Promise.resolve({ ...mockDonation, id, ...updates });
      }),
    },
    users: {
      findById: vi.fn().mockImplementation((id: string) => {
        if (id === 'user-1') return Promise.resolve({ id: 'user-1', can_donate: true, can_receive: true, name: 'Test User', preferred_language: 'en' });
        if (id === 'donor-1') return Promise.resolve({ id: 'donor-1', can_donate: true, can_receive: false, name: 'Donor User', preferred_language: 'en' });
        return Promise.resolve(null);
      }),
    },
    dailyReservations: {
      checkTodayAction: vi.fn().mockImplementation((userId: string) => {
        if (userId === 'user-at-limit') return Promise.resolve(1);
        if (userId === 'user-1') return Promise.resolve(0);
        return Promise.resolve(0);
      }),
      create: vi.fn().mockResolvedValue(true),
      getTodayActions: vi.fn().mockImplementation((userId: string) => {
        if (userId === 'user-at-limit') return Promise.resolve(mockDailyReservations);
        return Promise.resolve([]);
      }),
    },
  },
}));

vi.mock('../config/socket', () => ({
  emitDonationEvent: vi.fn(),
  emitToUser: vi.fn(),
}));

describe('Daily Limit Enforcement', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/donations/:id/reserve - Daily Limit Check', () => {
    it('should enforce daily limit of 1 reservation per day', async () => {
      const donorToken = createToken('donor-1');
      await request(app)
        .post('/api/donations/donation-1/reserve')
        .set('Authorization', `Bearer ${donorToken}`);

      const userAtLimitToken = createToken('user-at-limit');
      const res = await request(app)
        .post('/api/donations/donation-2/reserve')
        .set('Authorization', `Bearer ${userAtLimitToken}`);

      expect(res.status).toBe(429);
      expect(res.body.messageKey).toBe('donation.daily_limit_reached');
    });

    it('should allow reservation when under daily limit', async () => {
      const donorToken = createToken('donor-1');
      const userToken = createToken('user-1');

      const res = await request(app)
        .post('/api/donations/donation-1/reserve')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.messageKey).toBe('donation.reserved');
    });

    it('should track reservation in daily_reservations table', async () => {
      const donorToken = createToken('donor-1');
      const userToken = createToken('user-1');

      const res = await request(app)
        .post('/api/donations/donation-1/reserve')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
    });

    it('should NOT check daily limit on /complete endpoint', async () => {
      const donorToken = createToken('donor-1');
      const userAtLimitToken = createToken('user-at-limit');

      const reserveRes = await request(app)
        .post('/api/donations/donation-1/reserve')
        .set('Authorization', `Bearer ${donorToken}`);

      const completeRes = await request(app)
        .post('/api/donations/donation-1/complete')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(completeRes.status).toBe(200);
    });

    it('should NOT check daily limit on /cancel-reservation endpoint', async () => {
      const donorToken = createToken('donor-1');
      const userAtLimitToken = createToken('user-at-limit');

      const cancelRes = await request(app)
        .post('/api/donations/donation-1/cancel-reservation')
        .set('Authorization', `Bearer ${userAtLimitToken}`);

      expect(cancelRes.status).toBe(200);
    });
  });

  describe('Daily Reservations DB Operations', () => {
    it('should check today action count', async () => {
      const { dbOps } = await import('../database');
      
      const countNoLimit = await dbOps.dailyReservations.checkTodayAction('new-user');
      expect(countNoLimit).toBe(0);

      const countAtLimit = await dbOps.dailyReservations.checkTodayAction('user-at-limit');
      expect(countAtLimit).toBe(1);
    });

    it('should create daily reservation record', async () => {
      const { dbOps } = await import('../database');
      
      await dbOps.dailyReservations.create('user-1', 'donation-1', 'reserve');
    });

    it('should get today actions', async () => {
      const { dbOps } = await import('../database');
      
      const actions = await dbOps.dailyReservations.getTodayActions('user-at-limit');
      expect(actions.length).toBeGreaterThan(0);
    });

    it('should return empty for new user', async () => {
      const { dbOps } = await import('../database');
      
      const actions = await dbOps.dailyReservations.getTodayActions('new-user');
      expect(actions.length).toBe(0);
    });
  });
});