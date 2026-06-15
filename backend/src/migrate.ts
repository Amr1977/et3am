import { Pool } from 'pg';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
import { existsSync } from 'fs';

const distPath = __dirname;
const basePath = distPath.includes('dist') ? join(distPath, '..') : distPath;
const envPath = join(basePath, '.env.production');
const devEnvPath = join(basePath, '.env');

if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else if (existsSync(devEnvPath)) {
  dotenv.config({ path: devEnvPath });
} else {
  dotenv.config();
}

async function migrate(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const result = await pool.query('SELECT migration_name FROM migrations ORDER BY applied_at ASC');
    const applied = result.rows.map(row => row.migration_name);

    const migrationsDir = join(basePath, 'migrations');
    const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      const name = file.replace('.sql', '');
      if (!applied.includes(name)) {
        console.log('Running migration:', name);
        const sql = readFileSync(join(migrationsDir, file), 'utf8');
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
