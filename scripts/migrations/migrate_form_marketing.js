require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting internal form marketing tables migration...');
    await client.query('BEGIN');

    // 1. Internal Form Marketing Campaigns
    await client.query(`
      CREATE TABLE IF NOT EXISTS internal_form_campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        sender_company VARCHAR(255) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        sender_furigana VARCHAR(255) NULL,
        sender_email VARCHAR(255) NOT NULL,
        sender_phone VARCHAR(50) NULL,
        sender_website VARCHAR(255) NULL,
        subject VARCHAR(500) NOT NULL,
        message_body TEXT NOT NULL,
        target_filters JSONB NULL,
        total_targeted INT DEFAULT 0,
        sent_count INT DEFAULT 0,
        skipped_count INT DEFAULT 0,
        failed_count INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'draft',
        execution_mode VARCHAR(50) DEFAULT 'local_warp',
        report_file_url VARCHAR(500) NULL,
        duration_seconds INT DEFAULT 0,
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Internal Form Marketing Send Logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS internal_form_send_logs (
        id SERIAL PRIMARY KEY,
        campaign_id UUID REFERENCES internal_form_campaigns(id) ON DELETE CASCADE,
        corporate_number VARCHAR(13) NULL,
        company_name VARCHAR(255) NULL,
        form_url TEXT NOT NULL,
        prefecture_name VARCHAR(50) NULL,
        website_url TEXT NULL,
        status VARCHAR(50) NOT NULL,
        message TEXT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_internal_form_logs_camp ON internal_form_send_logs(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_internal_form_logs_status ON internal_form_send_logs(status);
      CREATE INDEX IF NOT EXISTS idx_internal_form_logs_corp ON internal_form_send_logs(corporate_number);
    `);

    // 3. Add last_form_dm_sent_at column to companies if not exists
    await client.query(`
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS last_form_dm_sent_at TIMESTAMP NULL;
      CREATE INDEX IF NOT EXISTS idx_companies_last_form_dm ON companies(last_form_dm_sent_at) WHERE contact_form_url IS NOT NULL;
    `);

    await client.query('COMMIT');
    console.log('✅ Internal form marketing tables and columns created successfully!');

    // Check count of contact_form_url
    const countRes = await client.query(`
      SELECT count(1) AS count FROM companies 
      WHERE contact_form_url IS NOT NULL AND contact_form_url != ''
    `);
    console.log(`📊 Total companies with contact_form_url: ${parseInt(countRes.rows[0].count, 10).toLocaleString()}`);
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
