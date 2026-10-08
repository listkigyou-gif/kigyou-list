const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const { loadEnvConfig } = require('@next/env');

loadEnvConfig(process.cwd());

const DATABASE_URL = process.env.DATABASE_URL;

async function run() {
  const isPG = !!DATABASE_URL;
  
  if (isPG) {
    console.log('Detected PostgreSQL. Running PostgreSQL migration...');
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: DATABASE_URL,
    });
    
    try {
      console.log('1. Creating table company_financial_status if not exists...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS company_financial_status (
          corporate_number VARCHAR(13) PRIMARY KEY
        )
      `);
      
      console.log('2. Inserting distinct corporate numbers from financial_records...');
      await pool.query(`
        INSERT INTO company_financial_status (corporate_number)
        SELECT DISTINCT corporate_number FROM financial_records
        ON CONFLICT (corporate_number) DO NOTHING
      `);
      console.log(`PostgreSQL Migration Done!`);
    } catch (e) {
      console.error('PostgreSQL Migration Error:', e);
    } finally {
      await pool.end();
    }
  } else {
    console.log('Detected SQLite. Running SQLite migration...');
    const dbPath = path.resolve(__dirname, '../kigyou-list.db');
    console.log(`Opening SQLite DB at: ${dbPath}`);
    const db = new DatabaseSync(dbPath);
    
    try {
      console.log('1. Creating table company_financial_status if not exists...');
      db.exec(`
        CREATE TABLE IF NOT EXISTS company_financial_status (
          corporate_number TEXT PRIMARY KEY
        )
      `);
      
      console.log('2. Inserting distinct corporate numbers from financial_records...');
      db.exec('BEGIN TRANSACTION');
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO company_financial_status (corporate_number)
        SELECT DISTINCT corporate_number FROM financial_records
      `);
      stmt.run();
      db.exec('COMMIT');
      
      console.log(`SQLite Migration Done!`);
    } catch (e) {
      console.error('SQLite Migration Error:', e);
      try {
        db.exec('ROLLBACK');
      } catch (_) {}
    }
  }
}

run().catch(console.error);
