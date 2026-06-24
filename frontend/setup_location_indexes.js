const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function setupIndexes() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log("1. Creating composite index for Prefecture (this may take 1-2 minutes)...");
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_companies_pref_sort 
      ON companies (prefecture_code, has_financials DESC, capital_amount DESC NULLS LAST, corporate_number ASC);
    `);
    console.log("✅ Prefecture Index created.");

    console.log("2. Creating composite index for Prefecture + City (this may take 1-2 minutes)...");
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_companies_pref_city_sort 
      ON companies (prefecture_code, city_name, has_financials DESC, capital_amount DESC NULLS LAST, corporate_number ASC);
    `);
    console.log("✅ Prefecture + City Index created.");

  } catch (err) {
    console.error("❌ Error setting up Location Indexes:", err);
  } finally {
    await pool.end();
  }
}

setupIndexes();
