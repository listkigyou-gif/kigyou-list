#!/usr/bin/env node
/**
 * Automated Anti-Duplicate IndexNow Submitter for Kigyou-list (VPS Production / PostgreSQL)
 * Automatically queries top unindexed companies from PostgreSQL and submits to Microsoft Bing & IndexNow.
 * Guarantees ZERO DUPLICATES using the indexnow_submissions PostgreSQL table.
 */

const path = require('path');
const fs = require('fs');

// Resolve frontend node_modules and env
const PROJECT_ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(PROJECT_ROOT, '.env.local');
const NODE_MODULES = path.join(PROJECT_ROOT, 'frontend', 'node_modules');

try {
  require(path.join(NODE_MODULES, 'dotenv')).config({ path: ENV_PATH });
} catch (e) {
  // Fallback if dotenv not available
}

const { Pool } = require(path.join(NODE_MODULES, 'pg'));

const HOST = 'kigyoulist.com';
const BASE_URL = 'https://kigyoulist.com';
const KEY = '0a1fbe0a7866441bb57817e0bf538068';
const KEY_LOCATION = `https://${HOST}/0a1fbe0a7866441bb57817e0bf538068.txt`;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Hrptlcct6789@127.0.0.1:5432/kigyou_list',
  max: 5,
  idleTimeoutMillis: 10000,
});

async function initDb(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS indexnow_submissions (
      corporate_number VARCHAR(20) PRIMARY KEY,
      url TEXT NOT NULL,
      submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      batch_id VARCHAR(50),
      response_code INTEGER DEFAULT 200,
      priority_level INTEGER DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_indexnow_submitted_at ON indexnow_submissions(submitted_at);
  `);
}

async function getStats(client) {
  const totalComp = await client.query('SELECT count(1) FROM companies');
  const totalSub = await client.query('SELECT count(1) FROM indexnow_submissions');
  const recent = await client.query(`
    SELECT batch_id, count(1) as cnt, max(submitted_at) as last_time
    FROM indexnow_submissions
    GROUP BY batch_id
    ORDER BY max(submitted_at) DESC
    LIMIT 5
  `);

  const total = parseInt(totalComp.rows[0].count, 10);
  const submitted = parseInt(totalSub.rows[0].count, 10);
  const remaining = total - submitted;
  const coverage = total > 0 ? ((submitted / total) * 100).toFixed(4) : 0;

  return {
    total_companies: total,
    total_submitted: submitted,
    remaining_unsubmitted: remaining,
    coverage_percent: coverage,
    recent_batches: recent.rows
  };
}

async function fetchTargets(client, limit = 1000) {
  const query = `
    SELECT c.corporate_number
    FROM companies c
    LEFT JOIN indexnow_submissions sub ON c.corporate_number = sub.corporate_number
    WHERE sub.corporate_number IS NULL
    ORDER BY c.employee_count DESC NULLS LAST, c.corporate_number ASC
    LIMIT $1
  `;
  const res = await client.query(query, [limit]);
  return res.rows.map(r => r.corporate_number);
}

async function submitToIndexNow(urls) {
  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls
  };

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'User-Agent': 'Kigyoulist-AutoIndexNow-Node/1.0 (https://kigyoulist.com)'
    },
    body: JSON.stringify(payload)
  });

  return { status: response.status, statusText: response.statusText };
}

async function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const showStats = args.includes('--stats');
  
  let batchSize = 1000;
  const batchIdx = args.indexOf('--batch-size');
  if (batchIdx !== -1 && args[batchIdx + 1]) {
    batchSize = parseInt(args[batchIdx + 1], 10) || 1000;
  }

  const client = await pool.connect();
  try {
    await initDb(client);

    if (showStats) {
      const stats = await getStats(client);
      console.log('=== BÁO CÁO TIẾN ĐỘ INDEXNOW TRÊN VPS (POSTGRESQL) ===');
      console.log(`Tổng số công ty trong DB : ${stats.total_companies.toLocaleString()}`);
      console.log(`Đã nộp thành công lên Bing: ${stats.total_submitted.toLocaleString()} (${stats.coverage_percent}%)`);
      console.log(`Còn lại chưa nộp         : ${stats.remaining_unsubmitted.toLocaleString()}`);
      console.log('\nCác đợt nộp gần nhất:');
      for (const b of stats.recent_batches) {
        console.log(` - ${b.batch_id}: ${b.cnt} URLs vào lúc ${b.last_time}`);
      }
      return;
    }

    const now = new Date();
    const batchId = `BATCH_${now.toISOString().replace(/[-:T]/g, '').slice(0, 14)}`;
    console.log(`[*] [${now.toISOString()}] Bắt đầu lấy mục tiêu IndexNow (Batch size: ${batchSize}, Dry run: ${dryRun})...`);

    const targets = await fetchTargets(client, batchSize);
    if (targets.length === 0) {
      console.log('[*] Không còn công ty nào chưa nộp.');
      return;
    }

    const CHUNK_SIZE = 10000;
    const chunks = [];
    for (let i = 0; i < targets.length; i += CHUNK_SIZE) {
      chunks.push(targets.slice(i, i + CHUNK_SIZE));
    }
    console.log(`[*] Chia ${targets.length.toLocaleString()} URLs thành ${chunks.length} gói nộp (tối đa ${CHUNK_SIZE.toLocaleString()} URLs/gói theo chuẩn IndexNow)...`);

    if (dryRun) {
      console.log(`[*] Chạy thử (Dry Run): Tìm thấy ${targets.length} URLs hợp lệ chưa nộp:`);
      targets.slice(0, 5).forEach(corp => console.log('  -', `${BASE_URL}/ja/company/${corp}`));
      return;
    }

    let totalSaved = 0;

    for (let idx = 0; idx < chunks.length; idx++) {
      const chunkTargets = chunks[idx];
      const chunkUrls = chunkTargets.map(corp => `${BASE_URL}/ja/company/${corp}`);
      console.log(`[*] [Gói ${idx + 1}/${chunks.length}] Đang nộp ${chunkUrls.length.toLocaleString()} URLs lên IndexNow...`);

      const res = await submitToIndexNow(chunkUrls);
      console.log(`    ↳ Phản hồi IndexNow: HTTP ${res.status} ${res.statusText}`);

      if (res.status === 200 || res.status === 202) {
        // Fast batch insert into PostgreSQL (in sub-batches of 1000)
        await client.query('BEGIN');
        const DB_SUB_BATCH = 1000;
        for (let j = 0; j < chunkTargets.length; j += DB_SUB_BATCH) {
          const sub = chunkTargets.slice(j, j + DB_SUB_BATCH);
          const values = [];
          const params = [batchId, res.status];
          sub.forEach((corp) => {
            const pIdx = params.length + 1;
            params.push(corp, `${BASE_URL}/ja/company/${corp}`);
            values.push(`($${pIdx}, $${pIdx + 1}, NOW(), $1, $2, 1)`);
          });
          const insertSql = `
            INSERT INTO indexnow_submissions (corporate_number, url, submitted_at, batch_id, response_code, priority_level)
            VALUES ${values.join(', ')}
            ON CONFLICT (corporate_number) DO NOTHING
          `;
          await client.query(insertSql, params);
        }
        await client.query('COMMIT');
        totalSaved += chunkTargets.length;
        console.log(`    ↳ [OK] Đã lưu thành công ${chunkTargets.length.toLocaleString()} URLs vào PostgreSQL.`);

        // Nghỉ 2 giây giữa các gói để tránh dồn dập
        if (idx < chunks.length - 1) {
          await new Promise(r => setTimeout(r, 2000));
        }
      } else {
        console.error(`[ERROR] IndexNow API từ chối gói ${idx + 1} với mã lỗi: HTTP ${res.status}`);
        process.exit(1);
      }
    }

    const stats = await getStats(client);
    console.log(`\n[HOÀN TẤT XUẤT SẮC] Đã nộp và lưu ${totalSaved.toLocaleString()} URLs. Tổng số đã nộp toàn sàn: ${stats.total_submitted.toLocaleString()} (${stats.coverage_percent}%).`);
  } catch (err) {
    console.error('[FATAL ERROR]:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
