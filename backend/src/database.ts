import { Pool, QueryResult } from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const DEV_URL = 'postgresql://neondb_owner:npg_XveTDxw5HRJ7@ep-flat-mountain-an8hva6r-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const PROD_URL = 'postgresql://neondb_owner:npg_XveTDxw5HRJ7@ep-nameless-scene-anwafvan-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL || (isProduction ? PROD_URL : DEV_URL);

const pool = new Pool({ connectionString });

export interface User {
  id: string;
  name: string;
  email: string;
  password: string | null;
  role: 'donor' | 'recipient' | 'admin';
  phone: string | null;
  address: string | null;
  preferred_language: 'en' | 'ar';
  google_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Donation {
  id: string;
  donor_id: string;
  title: string;
  description: string | null;
  food_type: string;
  quantity: number;
  unit: string;
  expiry_date: string | null;
  pickup_address: string;
  latitude: number | null;
  longitude: number | null;
  pickup_date: string | null;
  status: 'available' | 'reserved' | 'completed' | 'expired';
  reserved_by: string | null;
  created_at: string;
  updated_at: string;
}

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      role TEXT NOT NULL DEFAULT 'donor' CHECK(role IN ('donor', 'recipient', 'admin')),
      phone TEXT,
      address TEXT,
      preferred_language TEXT NOT NULL DEFAULT 'en' CHECK(preferred_language IN ('en', 'ar')),
      google_id TEXT UNIQUE,
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS donations (
      id TEXT PRIMARY KEY,
      donor_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT,
      food_type TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit TEXT NOT NULL DEFAULT 'portion',
      expiry_date TIMESTAMPTZ,
      pickup_address TEXT NOT NULL,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      pickup_date TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'reserved', 'completed', 'expired')),
      reserved_by TEXT REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@et3am.com']);
  if (rows.length === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    await pool.query(
      `INSERT INTO users (id, name, email, password, role, preferred_language) VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), 'Admin', 'admin@et3am.com', hashedPassword, 'admin', 'en']
    );
  }
}

export const dbOps = {
  users: {
    async findByEmail(email: string): Promise<User | null> {
      const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      return rows[0] || null;
    },
    async findById(id: string): Promise<User | null> {
      const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return rows[0] || null;
    },
    async findByGoogleId(googleId: string): Promise<User | null> {
      const { rows } = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
      return rows[0] || null;
    },
    async create(user: Omit<User, 'created_at' | 'updated_at'>): Promise<User> {
      const { rows } = await pool.query(
        `INSERT INTO users (id, name, email, password, role, phone, address, preferred_language, google_id, avatar_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [user.id, user.name, user.email, user.password, user.role, user.phone, user.address, user.preferred_language, user.google_id, user.avatar_url]
      );
      return rows[0];
    },
    async update(id: string, updates: Partial<User>): Promise<User | null> {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;
      for (const [key, value] of Object.entries(updates)) {
        if (key === 'id' || key === 'created_at') continue;
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
      fields.push(`updated_at = NOW()`);
      values.push(id);
      const { rows } = await pool.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
      );
      return rows[0] || null;
    },
  },
  donations: {
    async findAll(filters?: { status?: string; food_type?: string }, page = 1, limit = 10): Promise<{ donations: Donation[]; total: number }> {
      let where = 'WHERE 1=1';
      const params: any[] = [];
      let idx = 1;

      if (filters?.status) {
        where += ` AND status = $${idx++}`;
        params.push(filters.status);
      }
      if (filters?.food_type) {
        where += ` AND food_type = $${idx++}`;
        params.push(filters.food_type);
      }

      const countResult = await pool.query(`SELECT COUNT(*) as total FROM donations ${where}`, params);
      const total = parseInt(countResult.rows[0].total);

      params.push(limit);
      params.push((page - 1) * limit);
      const { rows } = await pool.query(
        `SELECT * FROM donations ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
        params
      );
      return { donations: rows, total };
    },
    async findById(id: string): Promise<Donation | null> {
      const { rows } = await pool.query('SELECT * FROM donations WHERE id = $1', [id]);
      return rows[0] || null;
    },
    async create(d: Omit<Donation, 'created_at' | 'updated_at'>): Promise<Donation> {
      const { rows } = await pool.query(
        `INSERT INTO donations (id, donor_id, title, description, food_type, quantity, unit, expiry_date, pickup_address, latitude, longitude, pickup_date, status, reserved_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
        [d.id, d.donor_id, d.title, d.description, d.food_type, d.quantity, d.unit, d.expiry_date, d.pickup_address, d.latitude, d.longitude, d.pickup_date, d.status, d.reserved_by]
      );
      return rows[0];
    },
    async update(id: string, updates: Partial<Donation>): Promise<Donation | null> {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;
      for (const [key, value] of Object.entries(updates)) {
        if (key === 'id' || key === 'created_at') continue;
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
      fields.push(`updated_at = NOW()`);
      values.push(id);
      const { rows } = await pool.query(
        `UPDATE donations SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
      );
      return rows[0] || null;
    },
    async delete(id: string): Promise<boolean> {
      const result = await pool.query('DELETE FROM donations WHERE id = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    },
    async countByStatus(status: string): Promise<number> {
      const { rows } = await pool.query('SELECT COUNT(*) as count FROM donations WHERE status = $1', [status]);
      return parseInt(rows[0].count);
    },
    async countByDonor(donorId: string): Promise<number> {
      const { rows } = await pool.query('SELECT COUNT(*) as count FROM donations WHERE donor_id = $1', [donorId]);
      return parseInt(rows[0].count);
    },
    async countByReserved(userId: string): Promise<number> {
      const { rows } = await pool.query('SELECT COUNT(*) as count FROM donations WHERE reserved_by = $1', [userId]);
      return parseInt(rows[0].count);
    },
    async totalCount(): Promise<number> {
      const { rows } = await pool.query('SELECT COUNT(*) as count FROM donations');
      return parseInt(rows[0].count);
    },
  },
  async userCount(): Promise<number> {
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM users');
    return parseInt(rows[0].count);
  },
};
