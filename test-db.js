const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:REDACTED_PASSWORD@ep-nameless-scene-anwafvan-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function test() {
  const result = await pool.query("SELECT email, password FROM users WHERE email = 'admin@et3am.com'");
  console.log('DB result:', JSON.stringify(result.rows[0]));
  const valid = bcrypt.compareSync('REDACTED_PASSWORD', result.rows[0].password);
  console.log('Valid from db:', valid);
  await pool.end();
}

test().catch(console.error);
