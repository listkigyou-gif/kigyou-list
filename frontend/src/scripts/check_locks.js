require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkLocks() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT pid, query, state, wait_event_type, wait_event, age(clock_timestamp(), query_start) as duration
      FROM pg_stat_activity
      WHERE state != 'idle' AND pid <> pg_backend_pid();
    `);
    console.log('Active queries:', res.rows);
  } finally {
    client.release();
    await pool.end();
  }
}
checkLocks();
