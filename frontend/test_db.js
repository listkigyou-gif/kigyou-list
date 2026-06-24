require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const { rows } = await pool.query("SELECT * FROM city_counts WHERE prefecture_code='13' AND city_name='港区'");
  console.log("city_counts:", rows);

  const { rows: rows2 } = await pool.query("SELECT count(*) FROM companies WHERE prefecture_code='13' AND city_name='港区'");
  console.log("companies count:", rows2);
  
  await pool.end();
}

main();
