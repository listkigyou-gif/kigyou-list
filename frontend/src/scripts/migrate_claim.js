require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting company claim migration...');
    await client.query('BEGIN');

    // Add claim & PR columns to companies table
    await client.query(`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS claimed_by_name VARCHAR(100) NULL,
      ADD COLUMN IF NOT EXISTS claimed_by_email VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS claimed_by_phone VARCHAR(30) NULL,
      ADD COLUMN IF NOT EXISTS claimed_by_department VARCHAR(100) NULL,
      ADD COLUMN IF NOT EXISTS pr_title VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS pr_message TEXT NULL;
    `);

    // Create index on is_claimed
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_companies_is_claimed 
      ON companies(is_claimed) WHERE is_claimed = TRUE;
    `);

    await client.query('COMMIT');
    console.log('✅ Company claim columns & index created successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
