import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../database.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
  phone: z.string().optional(),
  role: z.enum(['donor', 'recipient']).default('recipient'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'auth.rate_limit_exceeded', retryAfter: 15 },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { message: 'api.rate_limit_exceeded', retryAfter: 1 },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(apiLimiter);

router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'completed') as completed_donations,
        COUNT(*) FILTER (WHERE status = 'available') as available_donations,
        COUNT(DISTINCT id) as total_users,
        COUNT(DISTINCT CASE WHEN role = 'donor' THEN id END) as total_donors,
        COUNT(DISTINCT CASE WHEN role = 'recipient' THEN id END) as total_recipients
      FROM users
    `);
    
    const stats = result.rows[0];
    res.json({
      completedDonations: parseInt(stats.completed_donations) || 0,
      availableDonations: parseInt(stats.available_donations) || 0,
      totalUsers: parseInt(stats.total_users) || 0,
      totalDonors: parseInt(stats.total_donors) || 0,
      totalReceivers: parseInt(stats.total_recipients) || 0,
    });
  } catch (error) {
    console.error('Public stats error:', error);
    res.status(500).json({ message: 'server.error' });
  }
});

router.get('/donations', async (req, res) => {
  try {
    const { limit = 50, offset = 0, food_type, status = 'available' } = req.query;
    
    let query = `
      SELECT id, title, description, food_type, quantity, status, 
             pickup_address, latitude, longitude, created_at, start_time, end_time
      FROM donations
      WHERE status = $1
    `;
    const params: any[] = [status];
    
    if (food_type) {
      query += ` AND food_type = $2`;
      params.push(food_type);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), Number(offset));
    
    const result = await pool.query(query, params);
    
    res.json({
      donations: result.rows.map(d => ({
        ...d,
        pickup_address: d.pickup_address ? 'Location shared on reservation' : null,
        latitude: d.latitude ? Number(d.latitude) : null,
        longitude: d.longitude ? Number(d.longitude) : null,
      })),
      total: result.rows.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('Public donations error:', error);
    res.status(500).json({ message: 'server.error' });
  }
});

router.get('/donations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT id, title, description, food_type, quantity, status, 
             pickup_address, latitude, longitude, created_at, start_time, end_time,
             (SELECT name FROM users WHERE id = donations.user_id) as donor_name
      FROM donations
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'donation.not_found' });
    }
    
    const donation = result.rows[0];
    
    res.json({
      ...donation,
      pickup_address: donation.status === 'available' ? null : donation.pickup_address,
      latitude: donation.latitude ? Number(donation.latitude) : null,
      longitude: donation.longitude ? Number(donation.longitude) : null,
    });
  } catch (error) {
    console.error('Public donation detail error:', error);
    res.status(500).json({ message: 'server.error' });
  }
});

router.post('/auth/register', authLimiter, async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [data.email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'auth.email_exists' });
    }
    
    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    const result = await pool.query(`
      INSERT INTO users (email, password, name, phone, role, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, email, name, role, created_at
    `, [data.email, hashedPassword, data.name, data.phone || null, data.role]);
    
    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'validation.error', errors: error.errors });
    }
    console.error('Public register error:', error);
    res.status(500).json({ message: 'server.error' });
  }
});

router.post('/auth/login', authLimiter, async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    
    const result = await pool.query(`
      SELECT id, email, password, name, role, phone
      FROM users
      WHERE email = $1
    `, [data.email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'auth.invalid_credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(data.password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ message: 'auth.invalid_credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'validation.error', errors: error.errors });
    }
    console.error('Public login error:', error);
    res.status(500).json({ message: 'server.error' });
  }
});

export default router;