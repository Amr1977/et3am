import 'dotenv/config';
import { Pool, QueryResult } from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({ connectionString: connectionString });

export interface User {
  id: string;
  name: string;
  email: string;
  password: string | null;
  role: 'user' | 'donor' | 'recipient' | 'admin';
  can_donate: boolean;
  can_receive: boolean;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  location_city: string | null;
  location_area: string | null;
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
  hash_code: string | null;
  created_at: string;
  updated_at: string;
}

export async function initDb(): Promise<void> {
  console.log('Database initialized via migrations');
}

export async function warmupDatabase(): Promise<void> {
  try {
    await pool.query('SELECT 1');
    const result = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`Database warmup: ${result.rows[0].count} users`);
  } catch (err) {
    console.warn('Database warmup failed:', err);
  }
}

export { pool };

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
        `INSERT INTO users (id, name, email, password, role, phone, address, latitude, longitude, location_city, location_area, preferred_language, google_id, avatar_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
        [user.id, user.name, user.email, user.password, user.role, user.phone, user.address, user.latitude, user.longitude, user.location_city, user.location_area, user.preferred_language, user.google_id, user.avatar_url]
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
        `INSERT INTO donations (id, donor_id, title, description, food_type, quantity, unit, expiry_date, pickup_address, latitude, longitude, pickup_date, status, reserved_by, hash_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
        [d.id, d.donor_id, d.title, d.description, d.food_type, d.quantity, d.unit, d.expiry_date, d.pickup_address, d.latitude, d.longitude, d.pickup_date, d.status, d.reserved_by, d.hash_code]
      );
      return rows[0];
    },
    async findByDonor(donorId: string): Promise<Donation[]> {
      const { rows } = await pool.query('SELECT * FROM donations WHERE donor_id = $1 ORDER BY created_at DESC', [donorId]);
      return rows;
    },
    async findByReserved(userId: string): Promise<Donation[]> {
      const { rows } = await pool.query('SELECT * FROM donations WHERE reserved_by = $1 ORDER BY created_at DESC', [userId]);
      return rows;
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

export async function runMigrations(): Promise<void> {
  const migrationsDir = join(__dirname, '..', 'migrations');
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const result = await pool.query("SELECT migration_name FROM migrations ORDER BY applied_at ASC");
    const applied = result.rows.map((row: { migration_name: string }) => row.migration_name);

    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const name = file.replace('.sql', '');
      if (!applied.includes(name)) {
        console.log(`Running migration: ${name}`);
        const sql = readFileSync(join(migrationsDir, file), 'utf8');
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(sql);
          await client.query('INSERT INTO migrations (migration_name, applied_at) VALUES ($1, NOW())', [name]);
          await client.query('COMMIT');
          console.log(`✓ Applied: ${name}`);
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      }
    }
  } catch (err) {
    console.error('Migration error:', err);
    throw err;
  }
}
