import { Pool } from 'pg';

const pool = new Pool({
  connectionString: "postgresql://postgres:Hrptlcct6789@163.44.116.98:5432/kigyou_list"
});

async function run() {
  console.log('1. Creating index idx_companies_pref_cap_corp on PostgreSQL VPS...');
  const startIdx = Date.now();
  try {
    // We create the index on the parent table companies
    // Note: Creating index on partitioned table automatically creates it on all partitions.
    // CONCURRENTLY cannot be used on partitioned tables in older Postgres, but standard CREATE INDEX is fine.
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_companies_pref_cap_corp 
      ON companies (prefecture_code, capital_amount DESC NULLS LAST, corporate_number ASC)
    `);
    console.log(`Index created successfully in ${Date.now() - startIdx} ms!`);

    console.log('\n2. Re-testing split queries with the new index...');
    
    // Pass 1: Tokyo WITH financials
    console.log('Pass 1: Tokyo companies WITH financials...');
    const start1 = Date.now();
    const res1 = await pool.query(`
      SELECT c.corporate_number, c.company_name, c.capital_amount
      FROM companies c
      JOIN company_financial_status cfs ON c.corporate_number = cfs.corporate_number
      WHERE c.prefecture_code = '13'
      ORDER BY c.capital_amount DESC NULLS LAST, c.corporate_number ASC
      LIMIT 10
    `);
    console.log(`Pass 1 completed in ${Date.now() - start1} ms. Found ${res1.rows.length} rows.`);

    // Pass 2: Tokyo WITHOUT financials
    console.log('Pass 2: Tokyo companies WITHOUT financials...');
    const start2 = Date.now();
    const res2 = await pool.query(`
      SELECT c.corporate_number, c.company_name, c.capital_amount
      FROM companies c
      LEFT JOIN company_financial_status cfs ON c.corporate_number = cfs.corporate_number
      WHERE c.prefecture_code = '13'
        AND cfs.corporate_number IS NULL
        AND c.corporate_number NOT IN ('8120001068678')
      ORDER BY c.capital_amount DESC NULLS LAST, c.corporate_number ASC
      LIMIT 10
    `);
    console.log(`Pass 2 completed in ${Date.now() - start2} ms. Found ${res2.rows.length} rows.`);

    // 3. Same industry ('06') WITH financials
    console.log('Pass 3: Construction companies WITH financials...');
    const start3 = Date.now();
    const res3 = await pool.query(`
      SELECT c.corporate_number, c.company_name, c.capital_amount
      FROM companies c
      JOIN company_financial_status cfs ON c.corporate_number = cfs.corporate_number
      WHERE c.corporate_number IN (
        SELECT ci.corporate_number 
        FROM company_industries ci 
        WHERE ci.industry_code IN ('06')
      )
      ORDER BY c.capital_amount DESC NULLS LAST, c.corporate_number ASC
      LIMIT 10
    `);
    console.log(`Pass 3 completed in ${Date.now() - start3} ms. Found ${res3.rows.length} rows.`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
