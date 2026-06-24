const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testCity() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const res = await pool.query('SELECT * FROM city_counts WHERE prefecture_code = $1 AND city_name = $2', ['13', '港区']);
    console.log("Result string params:", res.rows);
    
    const res2 = await pool.query('SELECT * FROM city_counts WHERE prefecture_code = $1 AND city_name = $2', [13, '港区']);
    console.log("Result int params:", res2.rows);

    const res3 = await pool.query('SELECT * FROM companies WHERE prefecture_code = $1 AND city_name = $2 LIMIT 1', ['13', '港区']);
    console.log("Company result string:", res3.rows.length);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

testCity();
