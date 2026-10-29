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
  connectionString: process.env.DATABASE_URL || undefined,
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || '127.0.0.1',
  database: process.env.PGDATABASE || 'kigyou_list',
  password: process.env.PGPASSWORD || undefined,
  port: parseInt(process.env.PGPORT || '5432', 10),
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

  // Auto-clean records older than 30 days to allow healthy cyclic re-crawling
  const cleanRes = await client.query("DELETE FROM indexnow_submissions WHERE submitted_at < NOW() - INTERVAL '30 days';");
  if (cleanRes.rowCount > 0) {
    console.log(`[*] [IndexNow Clean] Đã dọn dẹp ${cleanRes.rowCount.toLocaleString()} bản ghi cũ hơn 30 ngày để giải phóng hàng đợi.`);
  }
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

async function fetchTargets(client, limit = 3000) {
  const selectedCorps = [];
  const selectedHubsMap = new Map();
  const seenCorpSet = new Set();

  // =========================================================================
  // TẦNG 1: 100% CÔNG TY CÓ BIẾN ĐỘNG NÓNG TRONG 48H (HOT DELTA DETECTOR)
  //         KÈM MÔ HÌNH TRỤC BÁNH XE (HUB & SPOKE PATTERN)
  // =========================================================================
  const deltaQuery = `
    SELECT 
      c.corporate_number, 
      c.company_name,
      c.has_financial_report,
      c.has_financials,
      c.has_public_tender,
      c.has_bidding,
      c.has_license,
      c.has_invoice,
      c.prefecture_code,
      c.primary_industry_code,
      c.updated_at,
      (
        CASE 
          WHEN c.has_financial_report = true OR c.has_financials = true THEN 100
          WHEN c.has_public_tender = true OR c.has_bidding = true THEN 80
          WHEN c.has_license = true THEN 60
          ELSE 40
        END
      ) AS priority_score,
      (
        CASE 
          WHEN c.has_financial_report = true OR c.has_financials = true THEN 'EDINET Báo cáo tài chính mới'
          WHEN c.has_public_tender = true OR c.has_bidding = true THEN 'GEPS Trúng thầu công mới'
          WHEN c.has_license = true THEN 'Cấp phép kinh doanh mới'
          ELSE 'Thay đổi pháp lý NTA / Dữ liệu doanh nghiệp'
        END
      ) AS reason
    FROM companies c
    LEFT JOIN indexnow_submissions sub ON c.corporate_number = sub.corporate_number
    WHERE c.updated_at >= NOW() - INTERVAL '48 hours'
      AND (sub.submitted_at IS NULL OR sub.submitted_at < NOW() - INTERVAL '24 hours')
      -- THIN CONTENT GUARD (Đồng bộ 100% với Frontend page.tsx: richnessScore >= 3) --
      AND (
        (CASE WHEN c.phone_number IS NOT NULL AND c.phone_number != '' THEN 2 ELSE 0 END) +
        (CASE WHEN c.website_url IS NOT NULL AND c.website_url != '' AND c.website_url NOT LIKE '%なし%' THEN 2 ELSE 0 END) +
        (CASE WHEN c.has_license = true OR c.has_financial_report = true OR c.has_financials = true OR c.has_public_tender = true OR c.has_bidding = true THEN 3 ELSE 0 END) +
        (CASE WHEN c.capital_amount IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN c.employee_count IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN c.representative_name IS NOT NULL AND c.representative_name != '' THEN 1 ELSE 0 END) +
        (CASE WHEN c.primary_industry_code IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN c.has_invoice = true THEN 1 ELSE 0 END)
      ) >= 3
    ORDER BY priority_score DESC, c.updated_at DESC
    LIMIT $1
  `;
  const deltaRes = await client.query(deltaQuery, [limit]);

  deltaRes.rows.forEach(r => {
    selectedCorps.push(r.corporate_number);
    seenCorpSet.add(r.corporate_number);

    // Gom Parent Hubs tương ứng với biến động thực tế
    if (r.has_license) {
      selectedHubsMap.set('hub:licenses', `${BASE_URL}/ja/licenses`);
    }
    if (r.has_invoice) {
      selectedHubsMap.set('hub:invoice', `${BASE_URL}/ja/invoice`);
    }
    if (r.has_financial_report || r.has_financials) {
      selectedHubsMap.set('hub:status', `${BASE_URL}/ja/status/bankruptcies`);
    }
    if (r.has_public_tender || r.has_bidding) {
      selectedHubsMap.set('hub:bidding', `${BASE_URL}/ja/search?subsidy=true&bidding=true`);
    }
    if (r.prefecture_code) {
      const p = String(r.prefecture_code).padStart(2, '0');
      selectedHubsMap.set(`hub:area:${p}`, `${BASE_URL}/ja/area/${p}`);
    }
    if (r.primary_industry_code) {
      selectedHubsMap.set(`hub:industry:${r.primary_industry_code}`, `${BASE_URL}/ja/industry/${r.primary_industry_code}`);
    }
  });

  if (deltaRes.rows.length > 0) {
    console.log(`[+] [Hot Delta & Thin Guard] Đã bắt được ${deltaRes.rows.length} doanh nghiệp biến động thực tế đạt chuẩn Rich Entity (>= 3đ) cho IndexNow.`);
  } else {
    console.log(`[*] [IndexNow Hot Delta] Không có doanh nghiệp nào biến động mới trong 48h qua đạt chuẩn Rich Entity. (Zero Spam Ping)`);
  }

  // =========================================================================
  // TẦNG 2: BACKLOG CHỈ CHẠY KHI BẬT CỜ --allow-backlog (MẶC ĐỊNH LÀ FALSE)
  // =========================================================================
  const allowBacklog = process.argv.includes('--allow-backlog');
  const quotaRemaining = limit - selectedCorps.length;
  if (allowBacklog && quotaRemaining > 0) {
    const backlogQuery = `
      SELECT c.corporate_number, c.prefecture_code, c.primary_industry_code, c.has_license, c.has_invoice, c.has_financials
      FROM companies c
      WHERE NOT EXISTS (
        SELECT 1 FROM indexnow_submissions sub WHERE sub.corporate_number = c.corporate_number
      )
      AND (
        (CASE WHEN c.phone_number IS NOT NULL AND c.phone_number != '' THEN 2 ELSE 0 END) +
        (CASE WHEN c.website_url IS NOT NULL AND c.website_url != '' AND c.website_url NOT LIKE '%なし%' THEN 2 ELSE 0 END) +
        (CASE WHEN c.has_license = true OR c.has_financial_report = true OR c.has_financials = true THEN 3 ELSE 0 END)
      ) >= 3
      ORDER BY c.has_financials DESC, c.capital_amount DESC NULLS LAST, c.corporate_number ASC
      LIMIT $1
    `;
    const backlogRes = await client.query(backlogQuery, [quotaRemaining]);

    backlogRes.rows.forEach(r => {
      if (!seenCorpSet.has(r.corporate_number)) {
        selectedCorps.push(r.corporate_number);
        seenCorpSet.add(r.corporate_number);

        if (r.has_license) selectedHubsMap.set('hub:licenses', `${BASE_URL}/ja/licenses`);
        if (r.has_invoice) selectedHubsMap.set('hub:invoice', `${BASE_URL}/ja/invoice`);
        if (r.has_financials) selectedHubsMap.set('hub:status', `${BASE_URL}/ja/status/bankruptcies`);
        if (r.prefecture_code) {
          const p = String(r.prefecture_code).padStart(2, '0');
          selectedHubsMap.set(`hub:area:${p}`, `${BASE_URL}/ja/area/${p}`);
        }
        if (r.primary_industry_code) {
          selectedHubsMap.set(`hub:industry:${r.primary_industry_code}`, `${BASE_URL}/ja/industry/${r.primary_industry_code}`);
        }
      }
    });

    if (backlogRes.rows.length > 0) {
      console.log(`[+] [Tầng 2 - Backlog] Bổ sung ${backlogRes.rows.length} doanh nghiệp rich entities chưa từng nộp để phủ dần.`);
    }
  }

  // Giới hạn tối đa 30 Hub mẹ mỗi chu kỳ (~1-3% quota)
  const parentHubs = Array.from(selectedHubsMap.values()).slice(0, 30);

  return {
    parentHubUrls: parentHubs,
    companyCorps: selectedCorps
  };
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
  
  let batchSize = 3000;
  const batchIdx = args.indexOf('--batch-size');
  if (batchIdx !== -1 && args[batchIdx + 1]) {
    batchSize = parseInt(args[batchIdx + 1], 10) || 3000;
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
    if (targets.companyCorps.length === 0 && targets.parentHubUrls.length === 0) {
      console.log('[*] Không còn công ty nào chưa nộp.');
      return;
    }

    const companyUrls = targets.companyCorps.map(corp => `${BASE_URL}/ja/company/${corp}`);
    const allUrlsToSubmit = [...targets.parentHubUrls, ...companyUrls];

    console.log(`[+] [Hub & Spoke] Đã gom ${targets.parentHubUrls.length} Parent Hubs mẹ + ${companyUrls.length} Trang công ty lá = Tổng ${allUrlsToSubmit.length} URLs.`);

    const CHUNK_SIZE = 10000;
    const chunks = [];
    for (let i = 0; i < allUrlsToSubmit.length; i += CHUNK_SIZE) {
      chunks.push(allUrlsToSubmit.slice(i, i + CHUNK_SIZE));
    }
    console.log(`[*] Chia ${allUrlsToSubmit.length.toLocaleString()} URLs thành ${chunks.length} gói nộp (tối đa ${CHUNK_SIZE.toLocaleString()} URLs/gói theo chuẩn IndexNow)...`);

    if (dryRun) {
      console.log(`[*] Chạy thử (Dry Run): Tìm thấy ${allUrlsToSubmit.length} URLs hợp lệ chưa nộp:`);
      allUrlsToSubmit.slice(0, 5).forEach(u => console.log('  -', u));
      return;
    }

    let totalSaved = 0;

    for (let idx = 0; idx < chunks.length; idx++) {
      const chunkUrls = chunks[idx];
      console.log(`[*] [Gói ${idx + 1}/${chunks.length}] Đang nộp ${chunkUrls.length.toLocaleString()} URLs lên IndexNow...`);

      const res = await submitToIndexNow(chunkUrls);
      console.log(`    ↳ Phản hồi IndexNow: HTTP ${res.status} ${res.statusText}`);

      if (res.status === 200 || res.status === 202) {
        // Fast batch insert company records into PostgreSQL
        await client.query('BEGIN');
        const DB_SUB_BATCH = 1000;
        for (let j = 0; j < targets.companyCorps.length; j += DB_SUB_BATCH) {
          const sub = targets.companyCorps.slice(j, j + DB_SUB_BATCH);
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
            ON CONFLICT (corporate_number) DO UPDATE SET
              submitted_at = NOW(),
              batch_id = EXCLUDED.batch_id,
              response_code = EXCLUDED.response_code,
              priority_level = EXCLUDED.priority_level
          `;
          await client.query(insertSql, params);
        }
        await client.query('COMMIT');
        totalSaved += targets.companyCorps.length;
        console.log(`    ↳ [OK] Đã lưu thành công ${targets.companyCorps.length.toLocaleString()} URLs công ty vào PostgreSQL.`);

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

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('[FATAL ERROR]:', err);
    process.exit(1);
  });
