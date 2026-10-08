const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function setupTrigram() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log("1. Enabling pg_trgm extension...");
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    console.log("✅ Extension pg_trgm enabled.");

    console.log("2. Starting Trigram index creation on company names (this will lock the table and may take 3-5 minutes)...");
    
    // Create GIN index using gin_trgm_ops
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_companies_name_trgm 
      ON companies USING gin (company_name gin_trgm_ops);
    `);
    
    console.log("✅ Successfully created Trigram Index idx_companies_name_trgm!");
  } catch (err) {
    console.error("❌ Error setting up Trigram Index:", err);
  } finally {
    await pool.end();
  }
}

setupTrigram();
