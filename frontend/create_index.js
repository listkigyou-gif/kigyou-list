const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function createIndex() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log("Starting index creation (this may take 1-3 minutes for 5 million rows)...");
    
    // Use CONCURRENTLY so it doesn't lock the table
    // It requires running outside of a transaction block, which pool.query does by default
    await pool.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_default_sort 
      ON companies (has_financials DESC, capital_amount DESC, corporate_number ASC);
    `);
    
    console.log("✅ Successfully created index idx_companies_default_sort!");
  } catch (err) {
    console.error("❌ Error creating index:", err);
  } finally {
    await pool.end();
  }
}

createIndex();
