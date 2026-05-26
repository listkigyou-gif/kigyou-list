const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read DATABASE_URL from frontend/.env.local
const envContent = fs.readFileSync(path.join(__dirname, '../frontend/.env.local'), 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
if (!dbUrlMatch) {
  console.error("Could not find DATABASE_URL in frontend/.env.local");
  process.exit(1);
}
const databaseUrl = dbUrlMatch[1];
console.log("Connecting to:", databaseUrl);

const pool = new Pool({
  connectionString: databaseUrl,
});

function convertSqlForPG(sql) {
  const cleanSql = sql.replace(/INDEXED\s+BY\s+\w+/gi, '');
  let index = 1;
  return cleanSql.replace(/\?/g, () => `$${index++}`);
}

async function profile(name, sql, params = []) {
  const start = Date.now();
  try {
    const pgSql = convertSqlForPG(sql);
    const res = await pool.query(pgSql, params);
    const duration = Date.now() - start;
    console.log(`[PROFILER] ${name} took ${duration}ms (returned ${res.rowCount} rows)`);
    return res.rows;
  } catch (err) {
    const duration = Date.now() - start;
    console.error(`[PROFILER] ${name} FAILED after ${duration}ms:`, err.message);
  }
}

async function run() {
  console.log("Starting profiling...");

  // 1. Prefecture counts
  await profile("Prefectures counts", `
    SELECT prefecture_code as code, prefecture_name as name, company_count as count 
    FROM prefecture_counts
    ORDER BY company_count DESC
  `);

  // 2. Industry hierarchy
  await profile("Industry Hierarchy", `
    SELECT 
      m.industry_code as code,
      m.industry_name as name,
      m.classification_level as level,
      m.parent_code as parent_code,
      COALESCE(ic.company_count, 0) as count
    FROM m_industries m
    LEFT JOIN industry_counts ic ON m.industry_code = ic.industry_code
    ORDER BY m.industry_code
  `);

  // 3. Cities with counts (using a dummy prefecture '13' - Tokyo)
  await profile("Cities counts (Tokyo)", `
    SELECT city_name, company_count
    FROM city_counts
    WHERE prefecture_code = ?
    ORDER BY company_count DESC, city_name ASC
  `, ['13']);

  // 4. Industry Map
  await profile("Industry Map", `
    SELECT industry_code, industry_name FROM m_industries
  `);

  // 5. Database stats
  await profile("Database Stats", `
    SELECT stat_key, stat_value FROM database_stats
  `);

  // 6. Default search query (no filters)
  await profile("Default Search Query (no filters)", `
    SELECT c.* FROM companies c ORDER BY c.employee_count DESC NULLS LAST, c.corporate_number ASC LIMIT 15 OFFSET 0
  `);

  // 7. Explaining Default search query
  const explainRows = await profile("Explain Default Search", `
    EXPLAIN ANALYZE SELECT c.* FROM companies c ORDER BY c.employee_count DESC NULLS LAST, c.corporate_number ASC LIMIT 15 OFFSET 0
  `);
  if (explainRows) {
    console.log("\nEXPLAIN ANALYZE OUTPUT:");
    explainRows.forEach(r => console.log(r['QUERY PLAN']));
  }

  await pool.end();
}

run();
