const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    // Create migrations table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get applied migrations
    const result = await pool.query('SELECT migration_name FROM migrations ORDER BY applied_at ASC');
    const applied = result.rows.map(row => row.migration_name);

    // Run each migration
    const migrationsDir = './migrations';
    const files = fs.readdirSync(migrationsDir).filter((f: string) => f.endsWith('.sql')).sort();

    for (const file of files) {
      const name = file.replace('.sql', '');
      if (!applied.includes(name)) {
        console.log('Running migration:', name);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(sql);
          await client.query('INSERT INTO migrations (migration_name, applied_at) VALUES ($1, NOW())', [name]);
          await client.query('COMMIT');
          console.log('Applied:', name);
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      }
    }

    console.log('All migrations complete');
  } finally {
    await pool.end();
  }
}

migrate().catch(e => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});