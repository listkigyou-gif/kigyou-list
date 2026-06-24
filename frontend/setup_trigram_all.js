const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function setupTrigramAll() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log("1. Enabling pg_trgm extension...");
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    console.log("✅ Extension pg_trgm enabled.");

    console.log("2. Starting Trigram index creation on jigyo_shumoku (This may take 5-10 minutes)...");
    await pool.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_jigyo_trgm 
      ON companies USING gin (jigyo_shumoku gin_trgm_ops);
    `);
    console.log("✅ Successfully created Trigram Index on jigyo_shumoku!");

    console.log("3. Starting Trigram index creation on full_address (This may take 5-10 minutes)...");
    await pool.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_address_trgm 
      ON companies USING gin (full_address gin_trgm_ops);
    `);
    console.log("✅ Successfully created Trigram Index on full_address!");

    console.log("🎉 All Trigram Indexes created successfully. CPU should drop to 0% now.");
  } catch (err) {
    console.error("❌ Error setting up Trigram Index:", err);
  } finally {
    await pool.end();
  }
}

setupTrigramAll();
