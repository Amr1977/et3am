import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import supportRoutes from './support';

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_integration_tests';

const mockTicket = {
  id: 'ticket-1',
  user_id: 'user-1',
  type: 'bug',
  title: 'Test Ticket',
  description: 'Test description',
  status: 'open',
  priority: 'high',
  created_at: new Date(),
};

const mockTickets = [mockTicket];

const createToken = (userId: string, role: string = 'user') => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
};

vi.mock('../database', () => ({
  dbOps: {
    support: {
      createTicket: vi.fn().mockImplementation((userId, type, title, description) => {
        return Promise.resolve({ id: 'new-ticket', user_id: userId, type, title, description, status: 'open', priority: 'medium' });
      }),
      findByUser: vi.fn().mockImplementation((userId: string) => {
        if (userId === 'user-1') return Promise.resolve(mockTickets);
        return Promise.resolve([]);
      }),
      findById: vi.fn().mockImplementation((id: string) => {
        if (id === 'ticket-1') return Promise.resolve(mockTicket);
        if (id === 'other-ticket-1') return Promise.resolve({ ...mockTicket, id: 'other-ticket-1', user_id: 'other-user' });
        return Promise.resolve(null);
      }),
      findAll: vi.fn().mockImplementation((filters?: any, page?: number, limit?: number) => {
        return Promise.resolve({ tickets: [mockTicket], total: 1 });
      }),
      updateTicket: vi.fn().mockImplementation((ticketId, updates) => {
        return Promise.resolve({ ...mockTicket, ...updates });
      }),
    },
  },
}));

describe('Support Routes', () => {
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

  app.use('/api/support', supportRoutes);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/support', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/support')
        .send({ type: 'bug', title: 'Test', description: 'Test' });
      expect(res.status).toBe(401);
    });

    it('should return 400 for missing fields', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .post('/api/support')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test' });
      expect(res.status).toBe(400);
      expect(res.body.messageKey).toBe('validation.required_field');
    });

    it('should return 400 for invalid type', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .post('/api/support')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'invalid', title: 'Test', description: 'Test' });
      expect(res.status).toBe(400);
      expect(res.body.messageKey).toBe('validation.invalid_field');
    });

    it('should create ticket', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .post('/api/support')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'bug', title: 'Test', description: 'Test' });
      expect(res.status).toBe(201);
      expect(res.body.messageKey).toBe('support.ticket_created');
    });
  });

  describe('GET /api/support', () => {
    it('should return user tickets', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .get('/api/support')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('tickets');
    });
  });

  describe('GET /api/support/:id', () => {
    it('should return 404 for non-existent ticket', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .get('/api/support/non-existent')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
      expect(res.body.messageKey).toBe('support.ticket_not_found');
    });

    it('should return 403 for other user ticket', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .get('/api/support/other-ticket-1')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('should return ticket', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .get('/api/support/ticket-1')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ticket');
    });
  });
});