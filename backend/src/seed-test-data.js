const { Pool } = require('pg');

async function seedTestData() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  console.log('Connecting to database for seeding...');
  const pool = new Pool({ connectionString });

  try {
    // Create test receiver user
    console.log('Creating test users...');
    
    const client = await pool.connect();
    
    // Create receiver@test.com user
    await client.query(`
      INSERT INTO users (id, name, email, password_hash, role, language, created_at)
      VALUES (gen_random_uuid(), 'Test Receiver', 'receiver@test.com', '$2a$10$xRKqVGshQk6.Zf.4r.Y9GZeW0j8n8U8n9n9n9n9n9n9n9n9n9n9n', 'receiver', 'en', NOW())
      ON CONFLICT (email) DO NOTHING
    `);
    
    // Create donor@test.com user  
    await client.query(`
      INSERT INTO users (id, name, email, password_hash, role, language, created_at)
      VALUES (gen_random_uuid(), 'Test Donor', 'donor@test.com', '$2a$10$xRKqVGshQk6.Zf.4r.Y9GZeW0j8n8U8n9n9n9n9n9n9n9n9n9n9n', 'donor', 'en', NOW())
      ON CONFLICT (email) DO NOTHING
    `);
    
    console.log('Test users created');
    client.release();
  } catch (e) {
    console.error('Seed error:', e.message);
  } finally {
    await pool.end();
  }
}

seedTestData().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});