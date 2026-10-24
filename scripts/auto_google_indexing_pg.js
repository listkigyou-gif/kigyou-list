#!/usr/bin/env node
/**
 * Automated Google Search Indexing API Submitter for Kigyou-list (VPS Production / PostgreSQL)
 * Automatically distributes daily quota: 30 Data Hubs (Spider-Web crawl accelerator) + 170 Tier-0 VIP Enterprises.
 * Zero external packages needed: uses Node 22 native crypto + fetch, and existing pg pool.
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(PROJECT_ROOT, '.env.local');
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH || path.join(PROJECT_ROOT, 'google_credentials.json');
const NODE_MODULES = path.join(PROJECT_ROOT, 'frontend', 'node_modules');

try {
  require(path.join(NODE_MODULES, 'dotenv')).config({ path: ENV_PATH });
} catch (e) {
  // Fallback
}

let Pool;
try {
  Pool = require(path.join(NODE_MODULES, 'pg')).Pool;
} catch (e) {
  Pool = require('pg').Pool;
}

const BASE_URL = 'https://kigyoulist.com';
const TOTAL_DAILY_LIMIT = 200;
const HUB_LIMIT = 30;

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    limit: (() => {
      const idx = args.indexOf('--limit');
      return idx !== -1 ? parseInt(args[idx + 1], 10) : TOTAL_DAILY_LIMIT;
    })(),
    hubs: (() => {
      const idx = args.indexOf('--hubs');
      return idx !== -1 ? parseInt(args[idx + 1], 10) : HUB_LIMIT;
    })()
  };
}

async function getGoogleAccessToken(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claimSet = Buffer.from(JSON.stringify({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  })).toString('base64url');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${claimSet}`);
  const signature = sign.sign(credentials.private_key, 'base64url');
  const jwt = `${header}.${claimSet}.${signature}`;

  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!tokenResp.ok) {
    const errText = await tokenResp.text();
    throw new Error(`Failed to obtain Google access token: ${tokenResp.status} ${errText}`);
  }

  const tokenData = await tokenResp.json();
  return tokenData.access_token;
}

async function publishUrl(accessToken, url, action = 'URL_UPDATED') {
  const resp = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: url,
      type: action
    })
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error ? data.error.message : JSON.stringify(data));
  }
  return data;
}

async function initDb(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS google_indexing_submissions (
      corporate_number VARCHAR(100) PRIMARY KEY,
      url TEXT NOT NULL,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      response_code INT DEFAULT 200
    );
    CREATE INDEX IF NOT EXISTS idx_g_indexing_sub_time ON google_indexing_submissions(submitted_at);
  `);
}

async function main() {
  const opts = parseArgs();
  console.log(`[${new Date().toISOString()}] === BẮT ĐẦU CHU KỲ BẮN GOOGLE INDEXING API (Limit: ${opts.limit}, Hubs: ${opts.hubs}, DryRun: ${opts.dryRun}) ===`);

  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error(`[-] Credentials file not found at: ${CREDENTIALS_PATH}`);
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  console.log(`[+] Đã tải Service Account: ${credentials.client_email}`);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || undefined,
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || '127.0.0.1',
    database: process.env.PGDATABASE || 'kigyou_db',
    password: process.env.PGPASSWORD || undefined,
    port: parseInt(process.env.PGPORT || '5432', 10),
  });

  try {
    await initDb(pool);

    // 1. Kiểm tra số lượng đã nạp hôm nay
    const todayRes = await pool.query(`
      SELECT count(*) as count FROM google_indexing_submissions
      WHERE submitted_at::date = CURRENT_DATE
    `);
    const todayCount = parseInt(todayRes.rows[0].count, 10);
    const availableQuota = Math.max(0, opts.limit - todayCount);
    console.log(`[*] Trạng thái hạn mức hôm nay: Đã gửi ${todayCount}/${opts.limit} URLs (Còn lại: ${availableQuota})`);

    if (availableQuota <= 0 && !opts.dryRun) {
      console.log(`[*] Đã đạt hạn mức tối đa hôm nay (${todayCount}/${opts.limit}). Kết thúc chu kỳ an toàn.`);
      return;
    }

    const effectiveQuota = opts.dryRun ? opts.limit : availableQuota;
    const hubQuota = Math.min(opts.hubs, effectiveQuota);
    const vipQuota = effectiveQuota - hubQuota;

    const selectedItems = [];

    // 2. 5 Core Statutory Event Hubs
    const coreHubs = [
      { id: 'hub:changes', url: `${BASE_URL}/ja/changes`, name: 'Hub: 登記・変更履歴 (Changes)' },
      { id: 'hub:invoice', url: `${BASE_URL}/ja/invoice`, name: 'Hub: インボイス制度 (Invoice)' },
      { id: 'hub:jobs', url: `${BASE_URL}/ja/jobs`, name: 'Hub: 求人・採用シグナル (Jobs)' },
      { id: 'hub:new-companies', url: `${BASE_URL}/ja/new-companies`, name: 'Hub: 新設法人 (New Companies)' },
      { id: 'hub:status', url: `${BASE_URL}/ja/status`, name: 'Hub: 企業ステータス・閉鎖 (Status)' }
    ];
    selectedItems.push(...coreHubs.slice(0, hubQuota));

    // 3. 15 Rotating Prefecture Hubs (01 to 47)
    if (selectedItems.length < hubQuota) {
      const prefNeeded = Math.min(15, hubQuota - selectedItems.length);
      const prefSubsRes = await pool.query(`
        SELECT corporate_number, submitted_at FROM google_indexing_submissions
        WHERE corporate_number LIKE 'hub:area:%'
      `);
      const prefSubMap = new Map();
      prefSubsRes.rows.forEach(r => prefSubMap.set(r.corporate_number, new Date(r.submitted_at).getTime()));

      const allPrefs = Array.from({ length: 47 }, (_, i) => String(i + 1).padStart(2, '0'));
      allPrefs.sort((a, b) => {
        const timeA = prefSubMap.get(`hub:area:${a}`) || 0;
        const timeB = prefSubMap.get(`hub:area:${b}`) || 0;
        return timeA - timeB;
      });

      for (let i = 0; i < prefNeeded; i++) {
        const p = allPrefs[i];
        selectedItems.push({
          id: `hub:area:${p}`,
          url: `${BASE_URL}/ja/area/${p}`,
          name: `Hub: 都道府県エリア (${p})`
        });
      }
    }

    // 4. 10 Rotating Industry Hubs
    if (selectedItems.length < hubQuota) {
      const indNeeded = Math.min(10, hubQuota - selectedItems.length);
      let indRows = [];
      try {
        const indQuery = await pool.query(`
          SELECT industry_code, industry_name FROM m_industries
          ORDER BY industry_code ASC LIMIT 100
        `);
        indRows = indQuery.rows;
      } catch (e) {
        // Fallback standard 2-digit industry codes
        indRows = Array.from({ length: 20 }, (_, i) => ({
          industry_code: String(i + 1).padStart(2, '0'),
          industry_name: `Category ${i + 1}`
        }));
      }

      const indSubsRes = await pool.query(`
        SELECT corporate_number, submitted_at FROM google_indexing_submissions
        WHERE corporate_number LIKE 'hub:industry:%'
      `);
      const indSubMap = new Map();
      indSubsRes.rows.forEach(r => indSubMap.set(r.corporate_number, new Date(r.submitted_at).getTime()));

      indRows.sort((a, b) => {
        const timeA = indSubMap.get(`hub:industry:${a.industry_code}`) || 0;
        const timeB = indSubMap.get(`hub:industry:${b.industry_code}`) || 0;
        return timeA - timeB;
      });

      for (let i = 0; i < Math.min(indNeeded, indRows.length); i++) {
        const ind = indRows[i];
        selectedItems.push({
          id: `hub:industry:${ind.industry_code}`,
          url: `${BASE_URL}/ja/industry/${ind.industry_code}`,
          name: `Hub: 業種 (${ind.industry_code} - ${ind.industry_name})`
        });
      }
    }

    // 5. 170 Top Tier-0 VIP Enterprises (ranked by sales & headcount)
    const vipNeeded = Math.min(vipQuota, effectiveQuota - selectedItems.length);
    if (vipNeeded > 0) {
      const vipQuery = await pool.query(`
        SELECT f.corporate_number, c.company_name
        FROM company_financials f
        JOIN companies c ON f.corporate_number = c.corporate_number
        LEFT JOIN google_indexing_submissions sub ON f.corporate_number = sub.corporate_number
        WHERE sub.corporate_number IS NULL
        GROUP BY f.corporate_number, c.company_name, c.sales_amount, c.employee_count
        ORDER BY COALESCE(c.sales_amount, 0) DESC, COALESCE(c.employee_count, 0) DESC
        LIMIT $1
      `, [vipNeeded]);

      vipQuery.rows.forEach(r => {
        selectedItems.push({
          id: r.corporate_number,
          url: `${BASE_URL}/ja/company/${r.corporate_number}`,
          name: r.company_name
        });
      });

      // Fallback to sitemap_companies if needed
      if (selectedItems.length < effectiveQuota) {
        const rem = effectiveQuota - selectedItems.length;
        const sitemapQuery = await pool.query(`
          SELECT s.corporate_number, s.company_name
          FROM sitemap_companies s
          LEFT JOIN google_indexing_submissions sub ON s.corporate_number = sub.corporate_number
          WHERE sub.corporate_number IS NULL
          ORDER BY s.employee_count DESC NULLS LAST, s.corporate_number ASC
          LIMIT $1
        `, [rem]);

        sitemapQuery.rows.forEach(r => {
          selectedItems.push({
            id: r.corporate_number,
            url: `${BASE_URL}/ja/company/${r.corporate_number}`,
            name: r.company_name
          });
        });
      }
    }

    const hubCount = selectedItems.filter(x => x.id.startsWith('hub:')).length;
    const vipCount = selectedItems.length - hubCount;
    console.log(`[+] Đã chọn lọc danh sách nạp: Tổng ${selectedItems.length} URLs (Hubs: ${hubCount}, VIP Doanh nghiệp: ${vipCount})`);

    if (opts.dryRun) {
      console.log('[*] [DRY-RUN] 35 URLs mẫu đầu tiên:');
      selectedItems.slice(0, 35).forEach((item, idx) => {
        console.log(`  [${idx + 1}] ${item.name} (${item.id}) -> ${item.url}`);
      });
      console.log(`[*] [DRY-RUN] Hoàn tất mô phỏng, không có yêu cầu nào được gửi lên Google.`);
      return;
    }

    // 6. Lấy Google Access Token và tiến hành nạp
    console.log(`[*] Đang xác thực với Google OAuth2...`);
    const accessToken = await getGoogleAccessToken(credentials);
    console.log(`[+] Xác thực Google OAuth2 thành công! Bắt đầu gửi dữ liệu...`);

    let successCount = 0;
    let failCount = 0;

    for (let idx = 0; idx < selectedItems.length; idx++) {
      const item = selectedItems[idx];
      try {
        await publishUrl(accessToken, item.url, 'URL_UPDATED');
        await pool.query(`
          INSERT INTO google_indexing_submissions (corporate_number, url, submitted_at, response_code)
          VALUES ($1, $2, NOW(), 200)
          ON CONFLICT (corporate_number) DO UPDATE SET submitted_at = NOW(), response_code = 200
        `, [item.id, item.url]);

        successCount++;
        console.log(`  [${idx + 1}/${selectedItems.length}] ✅ ${item.name} (${item.id}) -> ${item.url}`);
      } catch (err) {
        failCount++;
        const errMsg = err.message || String(err);
        console.error(`  [${idx + 1}/${selectedItems.length}] ❌ Lỗi: ${errMsg}`);
        if (errMsg.includes('RATE_LIMIT_EXCEEDED') || errMsg.toLowerCase().includes('quota') || errMsg.includes('429')) {
          console.warn(`[!] Đã chạm hạn mức Google Indexing hôm nay. Dừng tiến trình nạp.`);
          break;
        }
      }

      // Giãn cách an toàn 500ms giữa các request
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`[${new Date().toISOString()}] === HOÀN THÀNH CHU KỲ BẮN GOOGLE INDEXING: Thành công ${successCount}, Lỗi ${failCount} ===`);

  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('[-] Fatal error in auto_google_indexing_pg:', err);
  process.exit(1);
});
