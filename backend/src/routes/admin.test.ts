import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import adminRoutes from './admin';

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_integration_tests';

const mockStats = {
  users: { total: 100, newLast30Days: 10, admins: 2, donors: 50, receivers: 40 },
  donations: { total: 200, available: 50, reserved: 30, completed: 100, expired: 20, newLast7Days: 15, newLast30Days: 50, completedLast7Days: 25, activeReservations: 10 },
};

const mockDonations = [
  { id: 'donation-1', title: 'Food 1', status: 'available' },
  { id: 'donation-2', title: 'Food 2', status: 'reserved' },
];

const mockUsers = [
  { id: 'user-1', name: 'User 1', email: 'user1@test.com', role: 'user' },
  { id: 'user-2', name: 'User 2', email: 'user2@test.com', role: 'admin' },
];

const createToken = (userId: string, role: string = 'user') => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
};

vi.mock('../database', () => ({
  dbOps: {
    userCount: vi.fn().mockResolvedValue(100),
    donations: {
      totalCount: vi.fn().mockResolvedValue(200),
      countByStatus: vi.fn().mockImplementation((status: string) => {
        const counts: Record<string, number> = { available: 50, reserved: 30, completed: 100, expired: 20 };
        return Promise.resolve(counts[status] || 0);
      }),
      findAll: vi.fn().mockImplementation(() => {
        return Promise.resolve({ donations: mockDonations, total: 2 });
      }),
      findById: vi.fn().mockImplementation((id: string) => {
        if (id === 'donation-1') return Promise.resolve(mockDonations[0]);
        return Promise.resolve(null);
      }),
      update: vi.fn().mockImplementation((id, updates) => {
        return Promise.resolve({ ...mockDonations[0], ...updates });
      }),
    },
    users: {
      findById: vi.fn().mockImplementation((id: string) => {
        if (id === 'user-1') return Promise.resolve({ id: 'user-1', name: 'User 1', role: 'user' });
        return Promise.resolve(null);
      }),
      update: vi.fn().mockImplementation((id, updates) => {
        return Promise.resolve({ id, ...updates });
      }),
    },
    support: {
      findAll: vi.fn().mockImplementation(() => {
        const tickets = [{ id: 'ticket-1', title: 'Ticket 1', status: 'open', priority: 'high' }];
        return Promise.resolve({ tickets, total: 1 });
      }),
      updateTicket: vi.fn().mockImplementation((id, updates) => {
        return Promise.resolve({ id, ...updates });
      }),
    },
    adminAudit: {
      log: vi.fn().mockResolvedValue(true),
      getRecent: vi.fn().mockImplementation(() => {
        return Promise.resolve([{ id: 'log-1', action: 'update_user', created_at: new Date() }]);
      }),
    },
    pool: {
      query: vi.fn().mockImplementation((sql: string) => {
        if (sql.includes('COUNT(*) FILTER')) {
          return Promise.resolve({ rows: [{ new_users_30d: '10', admin_count: '2', donors_count: '50', receivers_count: '40' }] });
        }
        if (sql.includes('DATE(created_at)')) {
          return Promise.resolve({ rows: [{ date: '2025-12-01', count: '10' }] });
        }
        if (sql.includes('location_area')) {
          return Promise.resolve({ rows: [{ location_area: 'Downtown', count: '30' }] });
        }
        return Promise.resolve({ rows: [] });
      }),
    },
  },
}));

describe('Admin Routes', () => {
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

  app.use('/api/admin', adminRoutes);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.userId || req.userRole !== 'admin') {
      res.status(403).json({ messageKey: 'auth.admin_required' });
      return;
    }
    next();
  };

  describe('GET /api/admin/stats', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin', async () => {
      const token = createToken('user-1', 'user');
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('should return admin stats', async () => {
      const token = createToken('admin-1', 'admin');
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(res.body).toHaveProperty('donations');
      expect(res.body).toHaveProperty('charts');
    });
  });

  describe('GET /api/admin/users', () => {
    it('should return users list', async () => {
      const token = createToken('admin-1', 'admin');
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('should filter by search', async () => {
      const token = createToken('admin-1', 'admin');
      const res = await request(app)
        .get('/api/admin/users?search=john')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user', async () => {
      const token = createToken('admin-1', 'admin');
      const res = await request(app)
        .put('/api/admin/users/user-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name', role: 'admin' });
      expect(res.status).toBe(200);
      expect(res.body.messageKey).toBe('user.updated');
    });
  });

  describe('GET /api/admin/donations', () => {
    it('should return donations list', async () => {
      const token = createToken('admin-1', 'admin');
      const res = await request(app)
        .get('/api/admin/donations')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('donations');
    });

    it('should filter by status', async () => {
      const token = createToken('admin-1', 'admin');
      const res = await request(app)
        .get('/api/admin/donations?status=available')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe('PUT /api/admin/donations/:id', () => {
    it('should update donation', async () => {
      const token = createToken('admin-1', 'admin');
      const res = await request(app)
        .put('/api/admin/donations/donation-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'completed' });
      expect(res.status).toBe(200);
      expect(res.body.messageKey).toBe('donation.updated');
    });
  });

  describe('GET /api/admin/tickets', () => {
    it('should return tickets list', async () => {
      const token = createToken('admin-1', 'admin');
      const res = await request(app)
        .get('/api/admin/tickets')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('should filter by status', async () => {
      const token = createToken('admin-1', 'admin');
      const res = await request(app)
        .get('/api/admin/tickets?status=open')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe('PUT /api/admin/tickets/:id', () => {
    it('should update ticket', async () => {
      const token = createToken('admin-1', 'admin');
      const res = await request(app)
        .put('/api/admin/tickets/ticket-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'closed', priority: 'low' });
      expect(res.status).toBe(200);
      expect(res.body.messageKey).toBe('support.ticket_updated');
    });
  });

  describe('GET /api/admin/audit-log', () => {
    it('should return audit log', async () => {
      const token = createToken('admin-1', 'admin');
      const res = await request(app)
        .get('/api/admin/audit-log')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('logs');
    });
  });
});