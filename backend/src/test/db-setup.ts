import { Pool } from 'pg';

const testPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:besmillah@localhost:5433/et3am_test',
});

export async function setupTestDatabase(): Promise<void> {
  const client = await testPool.connect();
  try {
    // Run migrations
    const migrations = [
      `CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`,
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        can_donate BOOLEAN DEFAULT true,
        can_receive BOOLEAN DEFAULT true,
        phone VARCHAR(50),
        address TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        location_city VARCHAR(100),
        location_area VARCHAR(100),
        preferred_language VARCHAR(10) DEFAULT 'en',
        google_id VARCHAR(255),
        avatar_url TEXT,
        reputation_score INTEGER DEFAULT 0,
        total_donations INTEGER DEFAULT 0,
        total_received INTEGER DEFAULT 0,
        sound_enabled BOOLEAN DEFAULT true,
        notifications_enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`,
      // Donations table
      `CREATE TABLE IF NOT EXISTS donations (
        id UUID PRIMARY KEY,
        donor_id UUID REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        food_type VARCHAR(50),
        quantity INTEGER DEFAULT 1,
        unit VARCHAR(50) DEFAULT 'portions',
        expiry_date TIMESTAMP WITH TIME ZONE,
        pickup_address TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        pickup_date TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) DEFAULT 'available',
        reserved_by UUID REFERENCES users(id),
        hash_code VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`,
      // Daily reservations table
      `CREATE TABLE IF NOT EXISTS daily_reservations (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        donation_id UUID REFERENCES donations(id),
        action_type VARCHAR(50),
        reservation_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`,
      // Chat messages table
      `CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY,
        donation_id UUID REFERENCES donations(id),
        sender_id UUID REFERENCES users(id),
        receiver_id UUID REFERENCES users(id),
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`,
      // Support tickets table
      `CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        type VARCHAR(50),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'open',
        priority VARCHAR(20) DEFAULT 'medium',
        assigned_to UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`,
      // Admin audit log table
      `CREATE TABLE IF NOT EXISTS admin_audit_log (
        id UUID PRIMARY KEY,
        admin_id UUID REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id UUID,
        details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`,
    ];

    for (const sql of migrations) {
      await client.query(sql);
    }
    console.log('Test database tables created');
  } finally {
    client.release();
  }
}

export async function cleanupTestData(): Promise<void> {
  const client = await testPool.connect();
  try {
    await client.query('DELETE FROM admin_audit_log');
    await client.query('DELETE FROM chat_messages');
    await client.query('DELETE FROM support_tickets');
    await client.query('DELETE FROM daily_reservations');
    await client.query('DELETE FROM donations');
    await client.query('DELETE FROM users');
  } finally {
    client.release();
  }
}

export async function closeTestPool(): Promise<void> {
  await testPool.end();
}

export { testPool };