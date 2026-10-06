require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting marketing tables migration...');
    await client.query('BEGIN');

    // 1. Marketing suppressions (opt-out / blacklist)
    await client.query(`
      CREATE TABLE IF NOT EXISTS marketing_suppressions (
        email VARCHAR(255) PRIMARY KEY,
        reason VARCHAR(50) DEFAULT 'unsubscribe',
        corporate_number VARCHAR(13) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Marketing campaigns
    await client.query(`
      CREATE TABLE IF NOT EXISTS marketing_campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        body_html TEXT NOT NULL,
        target_filters JSONB NULL,
        total_targeted INT DEFAULT 0,
        sent_count INT DEFAULT 0,
        failed_count INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Marketing send logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS marketing_send_logs (
        id SERIAL PRIMARY KEY,
        campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
        corporate_number VARCHAR(13) NULL,
        company_name VARCHAR(255) NULL,
        recipient_email VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        error_message TEXT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_mkt_logs_email ON marketing_send_logs(recipient_email);
      CREATE INDEX IF NOT EXISTS idx_mkt_logs_campaign ON marketing_send_logs(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_mkt_logs_sent_at ON marketing_send_logs(sent_at);
    `);

    // 4. Add last_emailed_at column to companies if not exists
    await client.query(`
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS last_emailed_at TIMESTAMP NULL;
      CREATE INDEX IF NOT EXISTS idx_companies_last_emailed ON companies(last_emailed_at) WHERE email_address IS NOT NULL;
    `);

    await client.query('COMMIT');
    console.log('✅ Marketing tables and indexes created successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
