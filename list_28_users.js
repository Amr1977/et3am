const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_XveTDxw5HRJ7@ep-flat-mountain-an8hva6r-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

(async () => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, role, can_donate, can_receive, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    
    console.log(`\n📊 Total Users: ${result.rows.length}\n`);
    console.table(result.rows);
    
    // Summary
    const roleCount = {};
    result.rows.forEach(user => {
      roleCount[user.role] = (roleCount[user.role] || 0) + 1;
    });
    
    console.log('\n📈 Users by Role:');
    console.table(roleCount);
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
