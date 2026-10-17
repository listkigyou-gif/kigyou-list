const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  console.log('🚀 Starting creation of Outreach Partial Composite Indexes on PostgreSQL...');

  const indexes = [
    {
      name: 'idx_companies_email_phone_sort',
      sql: `CREATE INDEX IF NOT EXISTS idx_companies_email_phone_sort 
            ON companies (has_financials DESC, capital_amount DESC NULLS LAST, corporate_number) 
            WHERE (email_address IS NOT NULL AND email_address <> '' AND phone_number IS NOT NULL AND phone_number <> '')`
    },
    {
      name: 'idx_companies_form_web_sort',
      sql: `CREATE INDEX IF NOT EXISTS idx_companies_form_web_sort 
            ON companies (has_financials DESC, capital_amount DESC NULLS LAST, corporate_number) 
            WHERE (contact_form_url IS NOT NULL AND contact_form_url <> '' AND website_url IS NOT NULL AND website_url <> '')`
    },
    {
      name: 'idx_companies_email_web_sort',
      sql: `CREATE INDEX IF NOT EXISTS idx_companies_email_web_sort 
            ON companies (has_financials DESC, capital_amount DESC NULLS LAST, corporate_number) 
            WHERE (email_address IS NOT NULL AND email_address <> '' AND website_url IS NOT NULL AND website_url <> '')`
    }
  ];

  for (const idx of indexes) {
    console.log(`\nCreating ${idx.name}...`);
    const t0 = Date.now();
    await pool.query(idx.sql);
    console.log(`✅ ${idx.name} created in ${Date.now() - t0}ms`);
  }

  console.log('\nTesting email + phone + website query performance...');
  const t1 = Date.now();
  const testRes = await pool.query(`
    EXPLAIN ANALYZE
    SELECT c.corporate_number, c.company_name
    FROM companies c
    WHERE c.email_address IS NOT NULL AND c.email_address != '' 
      AND c.phone_number IS NOT NULL AND c.phone_number != '' 
      AND c.website_url IS NOT NULL AND c.website_url != ''
    ORDER BY c.has_financials DESC, c.capital_amount DESC NULLS LAST, c.corporate_number ASC
    LIMIT 15
  `);
  testRes.rows.slice(0, 10).forEach(r => console.log(r['QUERY PLAN']));
  console.log(`Executed in ${Date.now() - t1}ms`);

  await pool.end();
  console.log('\n🎉 All partial composite indexes ready!');
}

main().catch(err => {
  console.error('Index creation failed:', err);
  process.exit(1);
});
