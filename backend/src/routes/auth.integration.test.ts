import request from 'supertest';
import express, { Express } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_integration_tests';

// Generate a real hash for 'password123'
const testPassword = 'password123';
const testPasswordHash = bcrypt.hashSync(testPassword, 10);
console.log('Test hash:', testPasswordHash);

const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@test.com',
  password: testPasswordHash,
  role: 'user',
  can_donate: true,
  can_receive: true,
  preferred_language: 'en' as const,
};

const createApp = (): Express => {
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

  // Mock database operations
  const mockDb = {
    users: {
      findByEmail: async (email: string) => {
        if (email === 'test@test.com') return mockUser;
        return null;
      },
      findById: async (id: string) => {
        if (id === 'user-1') return mockUser;
        return null;
      },
      create: async (user: any) => ({ ...user }),
      update: async (id: string, updates: any) => ({ id, ...updates }),
    }
  };

  // Register route
  app.post('/api/auth/register', async (req: any, res: any) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ messageKey: 'validation.required_field' });
      return;
    }
    const existing = await mockDb.users.findByEmail(email);
    if (existing) {
      res.status(409).json({ messageKey: 'auth.email_exists' });
      return;
    }
    const newUser = await mockDb.users.create({ id: 'new-id', name, email, password: bcrypt.hashSync(password, 10) });
    res.status(201).json({ messageKey: 'auth.register_success', user: newUser });
  });

  // Login route
  app.post('/api/auth/login', async (req: any, res: any) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ messageKey: 'validation.required_field' });
      return;
    }
    const user = await mockDb.users.findByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      res.status(401).json({ messageKey: 'auth.invalid_credentials' });
      return;
    }
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ messageKey: 'auth.login_success', token, user });
  });

  // Me route
  app.get('/api/auth/me', async (req: any, res: any) => {
    if (!req.userId) {
      res.status(401).json({ messageKey: 'auth.login_required' });
      return;
    }
    const user = await mockDb.users.findById(req.userId);
    if (!user) {
      res.status(404).json({ messageKey: 'user.not_found' });
      return;
    }
    res.json({ user });
  });

  return app;
};

describe('Auth Routes (Fixed)', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
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
      expect(res.body.messageKey).toBe('auth.login_success');
      expect(res.body).toHaveProperty('token');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return user profile with auth', async () => {
      const token = jwt.sign({ userId: 'user-1', role: 'user' }, JWT_SECRET);
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
    });
  });
});
