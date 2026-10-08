const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function createIndex() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log("Starting index creation (this may take 1-3 minutes for 5 million rows)...");
    
    // Removed CONCURRENTLY because PostgreSQL doesn't support it on partitioned tables.
    // This will lock the table for 1-3 minutes while building the index.
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_companies_default_sort 
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
