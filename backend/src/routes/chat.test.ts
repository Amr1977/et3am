import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'et3am-secret-key-2024';

const mockDonation = {
  id: 'chat-donation-1',
  donor_id: 'user-1',
  title: 'Test Food',
  status: 'reserved',
  reserved_by: 'user-2',
};

const mockAvailableDonation = {
  id: 'available-1',
  donor_id: 'user-1',
  title: 'Available Food',
  status: 'available',
  reserved_by: null,
};

const mockMessages = [
  { id: 'msg-1', donation_id: 'chat-donation-1', sender_id: 'user-1', receiver_id: 'user-2', message: 'Hello', is_read: false, created_at: new Date() },
  { id: 'msg-2', donation_id: 'chat-donation-1', sender_id: 'user-2', receiver_id: 'user-1', message: 'Hi', is_read: true, created_at: new Date() },
];

const createToken = (userId: string) => {
  return jwt.sign({ userId, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
};

vi.mock('../database', () => ({
  dbOps: {
    donations: {
      findById: vi.fn().mockImplementation((id: string) => {
        if (id === 'chat-donation-1') return Promise.resolve(mockDonation);
        if (id === 'available-1') return Promise.resolve(mockAvailableDonation);
        return Promise.resolve(null);
      }),
    },
    users: {
      findById: vi.fn().mockImplementation((id: string) => {
        if (id === 'user-1') return Promise.resolve({ id: 'user-1', name: 'Donor', preferred_language: 'en' });
        if (id === 'user-2') return Promise.resolve({ id: 'user-2', name: 'Receiver', preferred_language: 'en' });
        return Promise.resolve(null);
      }),
    },
    chat: {
      findByDonation: vi.fn().mockImplementation((id: string) => {
        if (id === 'chat-donation-1') return Promise.resolve(mockMessages);
        return Promise.resolve([]);
      }),
      create: vi.fn().mockImplementation((donationId, senderId, receiverId, message) => {
        return Promise.resolve({ id: 'new-msg', donation_id: donationId, sender_id: senderId, receiver_id: receiverId, message, is_read: false });
      }),
      markAsRead: vi.fn().mockResolvedValue(true),
      getUnreadCount: vi.fn().mockImplementation((userId: string) => {
        if (userId === 'user-1') return Promise.resolve(1);
        return Promise.resolve(0);
      }),
    },
  },
}));

describe('Chat Routes', () => {
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

  describe('GET /api/chat/:donationId', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/chat/chat-donation-1');
      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent donation', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .get('/api/chat/non-existent')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it('should return 403 for non-participant', async () => {
      const token = createToken('user-3');
      const res = await request(app)
        .get('/api/chat/chat-donation-1')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('should return chat messages for participant', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .get('/api/chat/chat-donation-1')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('messages');
    });
  });

  describe('POST /api/chat/:donationId', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/chat/chat-donation-1')
        .send({ message: 'Test' });
      expect(res.status).toBe(401);
    });

    it('should return 400 for empty message', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .post('/api/chat/chat-donation-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: '' });
      expect(res.status).toBe(400);
      expect(res.body.messageKey).toBe('validation.required_field');
    });

    it('should return 400 for non-reserved donation', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .post('/api/chat/available-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Test' });
      expect(res.status).toBe(400);
      expect(res.body.messageKey).toBe('donation.not_available');
    });

    it('should send message successfully', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .post('/api/chat/chat-donation-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Hello' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
    });
  });

  describe('PUT /api/chat/:donationId/read', () => {
    it('should mark messages as read', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .put('/api/chat/chat-donation-1/read')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/chat/unread/count', () => {
    it('should return unread count', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .get('/api/chat/unread/count')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('unreadCount');
    });
  });
});