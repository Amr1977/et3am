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
  reputation_score: number;
  total_donations: number;
  total_received: number;
  sound_enabled: boolean;
  notifications_enabled: boolean;
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
  pool,
  dailyReservations: {
    async checkTodayAction(userId: string): Promise<number> {
      const { rows } = await pool.query(
        'SELECT COUNT(*) as count FROM daily_reservations WHERE user_id = $1 AND reservation_date = CURRENT_DATE',
        [userId]
      );
      return parseInt(rows[0].count);
    },
    async create(userId: string, donationId: string | null, actionType: 'reserve' | 'receive'): Promise<void> {
      await pool.query(
        'INSERT INTO daily_reservations (user_id, donation_id, action_type, reservation_date) VALUES ($1, $2, $3, CURRENT_DATE)',
        [userId, donationId, actionType]
      );
    },
    async getTodayActions(userId: string): Promise<{ id: string; action_type: string; donation_id: string | null }[]> {
      const { rows } = await pool.query(
        'SELECT id, action_type, donation_id FROM daily_reservations WHERE user_id = $1 AND reservation_date = CURRENT_DATE',
        [userId]
      );
      return rows;
    },
  },
  chat: {
    async findByDonation(donationId: string): Promise<any[]> {
      const { rows } = await pool.query(
        `SELECT cm.*, u.name as sender_name, u.avatar_url as sender_avatar
         FROM chat_messages cm
         JOIN users u ON cm.sender_id = u.id
         WHERE cm.donation_id = $1
         ORDER BY cm.created_at ASC`,
        [donationId]
      );
      return rows;
    },
    async create(donationId: string, senderId: string, receiverId: string, message: string): Promise<any> {
      const { rows } = await pool.query(
        `INSERT INTO chat_messages (donation_id, sender_id, receiver_id, message)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [donationId, senderId, receiverId, message]
      );
      return rows[0];
    },
    async markAsRead(donationId: string, receiverId: string): Promise<void> {
      await pool.query(
        'UPDATE chat_messages SET is_read = TRUE WHERE donation_id = $1 AND receiver_id = $2 AND is_read = FALSE',
        [donationId, receiverId]
      );
    },
    async getUnreadCount(userId: string): Promise<number> {
      const { rows } = await pool.query(
        'SELECT COUNT(*) as count FROM chat_messages WHERE receiver_id = $1 AND is_read = FALSE',
        [userId]
      );
      return parseInt(rows[0].count);
    },
  },
  reviews: {
    async create(reviewerId: string, reviewedId: string, donationId: string | null, rating: number, comment: string | null, reviewType: string): Promise<any> {
      const { rows } = await pool.query(
        `INSERT INTO user_reviews (reviewer_id, reviewed_id, donation_id, rating, comment, review_type)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [reviewerId, reviewedId, donationId, rating, comment, reviewType]
      );
      return rows[0];
    },
    async findByUser(userId: string): Promise<any[]> {
      const { rows } = await pool.query(
        `SELECT ur.*, u.name as reviewer_name, d.title as donation_title
         FROM user_reviews ur
         JOIN users u ON ur.reviewer_id = u.id
         LEFT JOIN donations d ON ur.donation_id = d.id
         WHERE ur.reviewed_id = $1
         ORDER BY ur.created_at DESC`,
        [userId]
      );
      return rows;
    },
    async findByDonation(donationId: string): Promise<any[]> {
      const { rows } = await pool.query(
        `SELECT ur.*, u.name as reviewer_name
         FROM user_reviews ur
         JOIN users u ON ur.reviewer_id = u.id
         WHERE ur.donation_id = $1`,
        [donationId]
      );
      return rows;
    },
    async getUserRating(userId: string): Promise<{ avgRating: number; totalReviews: number }> {
      const { rows } = await pool.query(
        'SELECT AVG(rating)::numeric(2,1) as avg_rating, COUNT(*) as total_reviews FROM user_reviews WHERE reviewed_id = $1',
        [userId]
      );
      return {
        avgRating: parseFloat(rows[0].avg_rating) || 0,
        totalReviews: parseInt(rows[0].total_reviews) || 0
      };
    },
  },
  support: {
    async createTicket(userId: string, type: string, title: string, description: string): Promise<any> {
      const { rows } = await pool.query(
        `INSERT INTO support_tickets (user_id, type, title, description)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [userId, type, title, description]
      );
      return rows[0];
    },
    async findByUser(userId: string): Promise<any[]> {
      const { rows } = await pool.query(
        'SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return rows;
    },
    async findById(ticketId: string): Promise<any | null> {
      const { rows } = await pool.query('SELECT * FROM support_tickets WHERE id = $1', [ticketId]);
      return rows[0] || null;
    },
    async findAll(filters?: { status?: string; priority?: string }, page = 1, limit = 20): Promise<{ tickets: any[]; total: number }> {
      let where = 'WHERE 1=1';
      const params: any[] = [];
      let idx = 1;

      if (filters?.status) {
        where += ` AND status = $${idx++}`;
        params.push(filters.status);
      }
      if (filters?.priority) {
        where += ` AND priority = $${idx++}`;
        params.push(filters.priority);
      }

      const countResult = await pool.query(`SELECT COUNT(*) as total FROM support_tickets ${where}`, params);
      const total = parseInt(countResult.rows[0].total);

      params.push(limit);
      params.push((page - 1) * limit);
      const { rows } = await pool.query(
        `SELECT st.*, u.name as user_name, au.name as assigned_to_name
         FROM support_tickets st
         JOIN users u ON st.user_id = u.id
         LEFT JOIN users au ON st.assigned_to = au.id
         ${where} ORDER BY 
           CASE st.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
           st.created_at DESC
         LIMIT $${idx++} OFFSET $${idx}`,
        params
      );
      return { tickets: rows, total };
    },
    async updateTicket(ticketId: string, updates: { status?: string; priority?: string; assigned_to?: string }): Promise<any | null> {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (updates.status) {
        fields.push(`status = $${idx++}`);
        values.push(updates.status);
      }
      if (updates.priority) {
        fields.push(`priority = $${idx++}`);
        values.push(updates.priority);
      }
      if (updates.assigned_to !== undefined) {
        fields.push(`assigned_to = $${idx++}`);
        values.push(updates.assigned_to);
      }

      fields.push(`updated_at = NOW()`);
      values.push(ticketId);

      const { rows } = await pool.query(
        `UPDATE support_tickets SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
      );
      return rows[0] || null;
    },
  },
  adminAudit: {
    async log(adminId: string, action: string, targetType: string, targetId: string | null, details: any): Promise<void> {
      await pool.query(
        'INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)',
        [adminId, action, targetType, targetId, JSON.stringify(details)]
      );
    },
    async getRecent(limit = 50): Promise<any[]> {
      const { rows } = await pool.query(
        `SELECT al.*, u.name as admin_name
         FROM admin_audit_log al
         JOIN users u ON al.admin_id = u.id
         ORDER BY al.created_at DESC
         LIMIT $1`,
        [limit]
      );
      return rows;
    },
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
