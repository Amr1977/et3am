import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const TEST_DB_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:besmillah@localhost:5433/et3am_test';

let testPool: Pool | null = null;
let testClient: PoolClient | null = null;

export async function setupIntegrationTest(): Promise<void> {
  if (!testPool) {
    testPool = new Pool({ connectionString: TEST_DB_URL });
  }
  
  const client = await testPool.connect();
  try {
    await runSchemaMigrations(client);
    console.log('Integration test database initialized');
  } finally {
    client.release();
  }
}

export async function getTestClient(): Promise<PoolClient> {
  if (!testPool) {
    testPool = new Pool({ connectionString: TEST_DB_URL });
  }
  
  if (!testClient) {
    testClient = await testPool.connect();
  }
  
  await testClient.query('BEGIN');
  return testClient;
}

export async function rollbackTest(): Promise<void> {
  if (testClient) {
    await testClient.query('ROLLBACK');
    await testClient.query('BEGIN');
  }
}

export async function endTestTransaction(): Promise<void> {
  if (testClient) {
    await testClient.query('ROLLBACK');
    testClient.release();
    testClient = null;
  }
}

export async function cleanupIntegrationTest(): Promise<void> {
  if (testClient) {
    await testClient.query('ROLLBACK');
    testClient.release();
    testClient = null;
  }
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
}

async function runSchemaMigrations(client: PoolClient): Promise<void> {
  const tables = [
    `CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      migration_name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
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
    `CREATE TABLE IF NOT EXISTS daily_reservations (
      id UUID PRIMARY KEY,
      user_id UUID REFERENCES users(id),
      donation_id UUID REFERENCES donations(id),
      action_type VARCHAR(50),
      reservation_date DATE DEFAULT CURRENT_DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY,
      donation_id UUID REFERENCES donations(id),
      sender_id UUID REFERENCES users(id),
      receiver_id UUID REFERENCES users(id),
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
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
    `CREATE TABLE IF NOT EXISTS admin_audit_log (
      id UUID PRIMARY KEY,
      admin_id UUID REFERENCES users(id),
      action VARCHAR(100) NOT NULL,
      target_type VARCHAR(50),
      target_id UUID,
      details JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS donation_reports (
      id UUID PRIMARY KEY,
      reporter_id UUID REFERENCES users(id),
      donation_id UUID REFERENCES donations(id),
      reason VARCHAR(100) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP WITH TIME ZONE,
      resolved_by UUID REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS user_reviews (
      id UUID PRIMARY KEY,
      reviewer_id UUID REFERENCES users(id),
      reviewed_id UUID REFERENCES users(id),
      donation_id UUID REFERENCES donations(id),
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      review_type VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS crash_logs (
      id UUID PRIMARY KEY,
      crash_type VARCHAR(20) NOT NULL,
      severity VARCHAR(20) DEFAULT 'error',
      title VARCHAR(255) NOT NULL,
      message TEXT,
      stack_trace TEXT,
      user_id UUID REFERENCES users(id),
      session_id VARCHAR(255),
      user_agent TEXT,
      url TEXT,
      metadata JSONB,
      fingerprint VARCHAR(255),
      resolved BOOLEAN DEFAULT false,
      resolved_at TIMESTAMP WITH TIME ZONE,
      resolved_by UUID REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
  ];

  for (const sql of tables) {
    await client.query(sql);
  }
}

export interface TestUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  token: string;
}

export interface TestDonation {
  id: string;
  donor_id: string;
  title: string;
  food_type: string;
  quantity: number;
  status: string;
  reserved_by: string | null;
  hash_code: string | null;
}

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_testing_only_32_chars';

export async function createTestUser(client: PoolClient, overrides?: Partial<TestUser>): Promise<TestUser> {
  const id = uuidv4();
  const user = {
    id,
    name: overrides?.name || 'Test User',
    email: overrides?.email || `test-${id.substring(0, 8)}@test.com`,
    password: overrides?.password || bcrypt.hashSync('password123', 10),
    role: overrides?.role || 'user',
  };

  await client.query(
    `INSERT INTO users (id, name, email, password, role, can_donate, can_receive, preferred_language)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [user.id, user.name, user.email, user.password, user.role, true, true, 'en']
  );

  const token = require('jsonwebtoken').sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  
  return { ...user, token };
}

export async function createTestDonation(client: PoolClient, donorId: string, overrides?: Partial<TestDonation>): Promise<TestDonation> {
  const id = uuidv4();
  const donation = {
    id,
    donor_id: donorId,
    title: overrides?.title || 'Test Donation',
    food_type: overrides?.food_type || 'cooked',
    quantity: overrides?.quantity || 5,
    status: overrides?.status || 'available',
    reserved_by: overrides?.reserved_by || null,
    hash_code: overrides?.hash_code || null,
  };

  await client.query(
    `INSERT INTO donations (id, donor_id, title, food_type, quantity, status, pickup_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [donation.id, donation.donor_id, donation.title, donation.food_type, donation.quantity, donation.status, '123 Test St']
  );

  if (donation.reserved_by) {
    await client.query(
      `UPDATE donations SET reserved_by = $1, hash_code = $2 WHERE id = $3`,
      [donation.reserved_by, donation.hash_code, donation.id]
    );
  }

  return donation;
}

export { testPool };
