import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import testimonialsRoutes from './testimonials';

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_integration_tests';

const createToken = (userId: string, role: string = 'user') => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
};

const mockTestimonial = {
  id: 'testimonial-1',
  user_id: 'user-1',
  name: 'Test User',
  role: 'donor',
  content: 'Great platform for food donation!',
  rating: 5,
  is_approved: true,
  is_featured: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  avatar_url: null,
};

const mockAdminToken = createToken('admin-1', 'admin');

vi.mock('../database', () => {
  const mockTestimonial = {
    id: 'testimonial-1',
    user_id: 'user-1',
    name: 'Test User',
    role: 'donor',
    content: 'Great platform for food donation!',
    rating: 5,
    is_approved: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    avatar_url: null,
  };

  return {
    dbOps: {
      testimonials: {
        getApproved: vi.fn().mockResolvedValue([mockTestimonial]),
        create: vi.fn().mockResolvedValue(mockTestimonial),
        findById: vi.fn().mockImplementation((id: string) => {
          if (id === 'testimonial-1') return Promise.resolve(mockTestimonial);
          return Promise.resolve(null);
        }),
        findAll: vi.fn().mockResolvedValue({ testimonials: [mockTestimonial], total: 1 }),
        update: vi.fn().mockResolvedValue({ ...mockTestimonial, is_approved: true }),
        delete: vi.fn().mockResolvedValue(true),
      },
      users: {
        findById: vi.fn().mockImplementation((id: string) => {
          if (id === 'user-1') return Promise.resolve({ id: 'user-1', name: 'Test User', role: 'donor', preferred_language: 'en' });
          if (id === 'admin-1') return Promise.resolve({ id: 'admin-1', name: 'Admin', role: 'admin', preferred_language: 'en' });
          return Promise.resolve(null);
        }),
      },
    },
    pool: { query: vi.fn().mockResolvedValue({ rows: [] }) },
  };
});

vi.mock('../config/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Testimonials Routes', () => {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res: any, next: any) => {
    const auth = req.headers.authorization;
    if (auth) {
      const token = auth.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.userRole = decoded.role;
      } catch (_e) { /* ignore */ }
    }
    next();
  });

  app.use('/api/testimonials', testimonialsRoutes);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/testimonials', () => {
    it('should return approved testimonials (public)', async () => {
      const res = await request(app).get('/api/testimonials');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('testimonials');
      expect(Array.isArray(res.body.testimonials)).toBe(true);
    });

    it('should work without authentication', async () => {
      const res = await request(app).get('/api/testimonials');
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/testimonials', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/testimonials')
        .send({ content: 'Great!', rating: 5 });
      expect(res.status).toBe(401);
    });

    it('should return 400 for missing content', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .post('/api/testimonials')
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 5 });
      expect(res.status).toBe(400);
      expect(res.body.messageKey).toBe('validation.required_field');
    });

    it('should return 400 for missing rating', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .post('/api/testimonials')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Great!' });
      expect(res.status).toBe(400);
      expect(res.body.messageKey).toBe('validation.required_field');
    });

    it('should return 400 for invalid rating', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .post('/api/testimonials')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Great!', rating: 10 });
      expect(res.status).toBe(400);
      expect(res.body.messageKey).toBe('validation.invalid_field');
    });

    it('should return 201 with valid data', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .post('/api/testimonials')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Great platform!', rating: 5 });
      expect(res.status).toBe(201);
      expect(res.body.messageKey).toBe('testimonial.created');
      expect(res.body).toHaveProperty('testimonial');
    });
  });

  describe('GET /api/testimonials/all (admin)', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/testimonials/all');
      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .get('/api/testimonials/all')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('should return testimonials for admin', async () => {
      const res = await request(app)
        .get('/api/testimonials/all')
        .set('Authorization', `Bearer ${mockAdminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('testimonials');
      expect(res.body).toHaveProperty('total');
    });

    it('should filter by is_approved', async () => {
      const res = await request(app)
        .get('/api/testimonials/all?is_approved=true')
        .set('Authorization', `Bearer ${mockAdminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('PUT /api/testimonials/:id (admin)', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app)
        .put('/api/testimonials/testimonial-1')
        .send({ is_approved: true });
      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .put('/api/testimonials/testimonial-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ is_approved: true });
      expect(res.status).toBe(403);
    });

    it('should update testimonial for admin', async () => {
      const res = await request(app)
        .put('/api/testimonials/testimonial-1')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ is_approved: true, is_featured: true });
      expect(res.status).toBe(200);
      expect(res.body.messageKey).toBe('testimonial.updated');
    });

    it('should return 404 for non-existent testimonial', async () => {
      const { dbOps } = await import('../database');
      (dbOps.testimonials.update as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/api/testimonials/non-existent')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ is_approved: true });
      expect(res.status).toBe(404);
      expect(res.body.messageKey).toBe('testimonial.not_found');
    });
  });

  describe('DELETE /api/testimonials/:id (admin)', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).delete('/api/testimonials/testimonial-1');
      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin', async () => {
      const token = createToken('user-1');
      const res = await request(app)
        .delete('/api/testimonials/testimonial-1')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('should delete testimonial for admin', async () => {
      const res = await request(app)
        .delete('/api/testimonials/testimonial-1')
        .set('Authorization', `Bearer ${mockAdminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.messageKey).toBe('testimonial.deleted');
    });

    it('should return 404 for non-existent testimonial', async () => {
      const { dbOps } = await import('../database');
      (dbOps.testimonials.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

      const res = await request(app)
        .delete('/api/testimonials/non-existent')
        .set('Authorization', `Bearer ${mockAdminToken}`);
      expect(res.status).toBe(404);
      expect(res.body.messageKey).toBe('testimonial.not_found');
    });
  });
});
