import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'et3am-secret-key-2024';

const hashedPassword = bcrypt.hashSync('password123', 10);

const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@test.com',
  password: hashedPassword,
  role: 'user',
  can_donate: true,
  can_receive: true,
  preferred_language: 'en',
  phone: null,
  address: null,
  latitude: null,
  longitude: null,
  location_city: null,
  location_area: null,
  avatar_url: null,
  created_at: new Date(),
};

const createToken = (userId: string, role: string = 'user') => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
};

vi.mock('../database', () => ({
  dbOps: {
    users: {
      findByEmail: vi.fn().mockImplementation((email: string) => {
        if (email === 'test@test.com') return Promise.resolve(mockUser);
        return Promise.resolve(null);
      }),
      findById: vi.fn().mockImplementation((id: string) => {
        if (id === 'user-1') return Promise.resolve(mockUser);
        if (id === 'google-user-1') return Promise.resolve({ ...mockUser, id: 'google-user-1', google_id: 'google-123' });
        return Promise.resolve(null);
      }),
      findByGoogleId: vi.fn().mockImplementation((googleId: string) => {
        if (googleId === 'google-123') return Promise.resolve({ ...mockUser, id: 'google-user-1', google_id: 'google-123' });
        return Promise.resolve(null);
      }),
      create: vi.fn().mockImplementation((user) => {
        return Promise.resolve({ ...user, id: user.id });
      }),
      update: vi.fn().mockImplementation((id, updates) => {
        return Promise.resolve({ ...mockUser, id, ...updates });
      }),
    },
  },
}));

import { generateToken } from '../middleware/auth';

describe('Auth Routes', () => {
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

  describe('POST /api/auth/register', () => {
    it('should return 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test' });
      expect(res.status).toBe(400);
      expect(res.body.messageKey).toBe('validation.required_field');
    });

    it('should return 409 for existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test@test.com', password: 'password123' });
      expect(res.status).toBe(409);
      expect(res.body.messageKey).toBe('auth.email_exists');
    });

    it('should register new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'New User', email: 'new@test.com', password: 'password123' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.messageKey).toBe('auth.register_success');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com' });
      expect(res.status).toBe(400);
      expect(res.body.messageKey).toBe('validation.required_field');
    });

    it('should return 401 for non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'notexist@test.com', password: 'password123' });
      expect(res.status).toBe(401);
      expect(res.body.messageKey).toBe('auth.invalid_credentials');
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body.messageKey).toBe('auth.invalid_credentials');
    });

    it('should login successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.messageKey).toBe('auth.login_success');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return user profile', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
    });
  });

  describe('PUT /api/auth/language', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app)
        .put('/api/auth/language')
        .send({ preferred_language: 'ar' });
      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid language', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .put('/api/auth/language')
        .set('Authorization', `Bearer ${token}`)
        .send({ preferred_language: 'invalid' });
      expect(res.status).toBe(400);
      expect(res.body.messageKey).toBe('validation.invalid_language');
    });

    it('should update language', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .put('/api/auth/language')
        .set('Authorization', `Bearer ${token}`)
        .send({ preferred_language: 'ar' });
      expect(res.status).toBe(200);
      expect(res.body.messageKey).toBe('user.language_updated');
    });
  });

  describe('POST /api/auth/google', () => {
    it('should return 400 for missing token', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const token = generateToken('user-1', 'user');
      expect(token).toBeDefined();
      
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded).toHaveProperty('userId', 'user-1');
      expect(decoded).toHaveProperty('role', 'user');
    });

    it('should generate admin token', () => {
      const token = generateToken('admin-1', 'admin');
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded).toHaveProperty('role', 'admin');
    });

    it('should generate donor token', () => {
      const token = generateToken('donor-1', 'donor');
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded).toHaveProperty('role', 'donor');
    });
  });
});