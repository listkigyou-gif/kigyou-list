#!/usr/bin/env node
/**
 * Automated Google Search Indexing API Multi-Key Pool Submitter for Kigyou-list (VPS Production / PostgreSQL)
 * Features:
 * - Multi-Key Pool: Rotates across all Service Accounts in google_keys/ (5 projects = 1,000 URLs/day).
 * - Smart Hybrid Allocation: 80 Data Hubs (All 47 Prefectures + 5 Event Hubs + 28 Industries) + 920 Tier-0 VIP Enterprises.
 * - Auto Key Switching: If a key hits its 200 daily limit, immediately switches to the next available key.
 * - Zero external npm packages: pure Node 22 native crypto + fetch, and existing pg pool.
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(PROJECT_ROOT, '.env.local');
const KEYS_DIR = path.join(PROJECT_ROOT, 'google_keys');
const DEFAULT_KEY_PATH = path.join(PROJECT_ROOT, 'google_credentials.json');
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
const PER_KEY_LIMIT = 200;

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    limit: (() => {
      const idx = args.indexOf('--limit');
      return idx !== -1 ? parseInt(args[idx + 1], 10) : null;
    })(),
    hubs: (() => {
      const idx = args.indexOf('--hubs');
      return idx !== -1 ? parseInt(args[idx + 1], 10) : null;
    })()
  };
}

function loadAllServiceAccountKeys() {
  const keys = [];

  if (fs.existsSync(KEYS_DIR)) {
    const files = fs.readdirSync(KEYS_DIR)
      .filter(f => f.endsWith('.json'))
      .sort();

    for (const f of files) {
      try {
        const fullPath = path.join(KEYS_DIR, f);
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        if (data.client_email && data.private_key) {
          keys.push({
            id: f,
            projectId: data.project_id || 'unknown',
            clientEmail: data.client_email,
            credentials: data,
            token: null,
            tokenExpiresAt: 0,
            submittedCount: 0,
            isExhausted: false
          });
        }
      } catch (err) {
        console.warn(`[-] Could not parse key file: ${f}: ${err.message}`);
      }
    }
  }

  // Fallback to single credentials file if pool dir empty
  if (keys.length === 0 && fs.existsSync(DEFAULT_KEY_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(DEFAULT_KEY_PATH, 'utf-8'));
      if (data.client_email && data.private_key) {
        keys.push({
          id: 'default_key',
          projectId: data.project_id || 'unknown',
          clientEmail: data.client_email,
          credentials: data,
          token: null,
          tokenExpiresAt: 0,
          submittedCount: 0,
          isExhausted: false
        });
      }
    } catch (err) {
      console.warn(`[-] Could not parse default credentials: ${err.message}`);
    }
  }

  return keys;
}

async function getGoogleAccessToken(keyObj) {
  const now = Math.floor(Date.now() / 1000);
  if (keyObj.token && now < (keyObj.tokenExpiresAt - 300)) {
    return keyObj.token;
  }

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claimSet = Buffer.from(JSON.stringify({
    iss: keyObj.clientEmail,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  })).toString('base64url');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${claimSet}`);
  const signature = sign.sign(keyObj.credentials.private_key, 'base64url');
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
    throw new Error(`[${keyObj.clientEmail}] Failed to obtain Google token: ${tokenResp.status} ${errText}`);
  }

  const tokenData = await tokenResp.json();
  keyObj.token = tokenData.access_token;
  keyObj.tokenExpiresAt = now + (tokenData.expires_in || 3600);
  return keyObj.token;
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
      response_code INT DEFAULT 200,
      service_account VARCHAR(150)
    );
    CREATE INDEX IF NOT EXISTS idx_g_indexing_sub_time ON google_indexing_submissions(submitted_at);

    CREATE TABLE IF NOT EXISTS google_vip_queue (
      corporate_number VARCHAR(100) PRIMARY KEY,
      url TEXT NOT NULL,
      priority_score INT DEFAULT 50,
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20) DEFAULT 'PENDING'
    );
    CREATE INDEX IF NOT EXISTS idx_g_vip_queue_score ON google_vip_queue(status, priority_score DESC, created_at ASC);
  `);

  // Ensure service_account column exists
  try {
    await pool.query(`ALTER TABLE google_indexing_submissions ADD COLUMN IF NOT EXISTS service_account VARCHAR(150);`);
  } catch (e) {
    // Ignore if already exists
  }
}

async function main() {
  const opts = parseArgs();
  console.log(`[${new Date().toISOString()}] === BẮT ĐẦU CHU KỲ BẮN GOOGLE INDEXING API (MULTI-KEY POOL ENGINE) ===`);

  const keys = loadAllServiceAccountKeys();
  if (keys.length === 0) {
    console.error(`[-] No service account keys found in ${KEYS_DIR} or ${DEFAULT_KEY_PATH}!`);
    process.exit(1);
  }

  console.log(`[+] Đã tải ${keys.length} Google Cloud Projects vào Multi-Key Pool:`);
  keys.forEach((k, idx) => {
    console.log(`    [Key ${idx + 1}] ${k.projectId} -> ${k.clientEmail}`);
  });

  const totalCapacity = keys.length * PER_KEY_LIMIT;
  const targetTotal = opts.limit !== null ? opts.limit : totalCapacity;
  const targetHubs = opts.hubs !== null ? opts.hubs : (keys.length >= 3 ? 80 : 30);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || undefined,
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || '127.0.0.1',
    database: process.env.PGDATABASE || 'kigyou_list',
    password: process.env.PGPASSWORD || undefined,
    port: parseInt(process.env.PGPORT || '5432', 10),
  });

  try {
    await initDb(pool);

    // 1. Kiểm tra số lượng đã nạp hôm nay theo từng key
    const todayRes = await pool.query(`
      SELECT COALESCE(service_account, 'default') as sa, count(*) as count
      FROM google_indexing_submissions
      WHERE submitted_at::date = CURRENT_DATE
      GROUP BY service_account
    `);

    const subTodayMap = new Map();
    let totalSubmittedToday = 0;
    todayRes.rows.forEach(r => {
      const cnt = parseInt(r.count, 10);
      subTodayMap.set(r.sa, cnt);
      totalSubmittedToday += cnt;
    });

    keys.forEach(k => {
      k.submittedCount = subTodayMap.get(k.clientEmail) || 0;
      if (k.submittedCount >= PER_KEY_LIMIT) {
        k.isExhausted = true;
      }
    });

    const activeKeys = keys.filter(k => !k.isExhausted);
    const availableQuota = activeKeys.reduce((acc, k) => acc + (PER_KEY_LIMIT - k.submittedCount), 0);

    console.log(`[*] Trạng thái hôm nay: Đã gửi ${totalSubmittedToday}/${totalCapacity} URLs.`);
    keys.forEach((k, idx) => {
      console.log(`    - Key ${idx + 1} (${k.projectId}): ${k.submittedCount}/${PER_KEY_LIMIT} URLs ${k.isExhausted ? '🔴 (Đầy)' : '🟢 (Sẵn sàng)'}`);
    });
    console.log(`[*] Hạn mức khả dụng cho chu kỳ này: ${availableQuota} URLs (Mục tiêu: ${targetTotal} URLs)`);

    if (availableQuota <= 0 && !opts.dryRun) {
      console.log(`[*] Toàn bộ ${keys.length} keys đều đã đạt hạn mức tối đa 200/ngày. Kết thúc chu kỳ an toàn.`);
      return;
    }

    const effectiveTotal = opts.dryRun ? targetTotal : Math.min(targetTotal, availableQuota);
    const selectedItems = [];

    // =========================================================================
    // TẦNG 1: HÀNG ĐỢI CUỐN CHIẾU TỪ NGÀY HÔM TRƯỚC (CARRY-OVER VIP QUEUE)
    // =========================================================================
    const queueRes = await pool.query(`
      SELECT corporate_number, url, priority_score, reason
      FROM google_vip_queue
      WHERE status = 'PENDING'
      ORDER BY priority_score DESC, created_at ASC
      LIMIT $1
    `, [effectiveTotal]);

    queueRes.rows.forEach(r => {
      selectedItems.push({
        id: r.corporate_number,
        url: r.url,
        name: `[Queue VIP - ${r.priority_score}đ] ${r.reason || r.corporate_number}`,
        isFromQueue: true
      });
    });

    if (queueRes.rows.length > 0) {
      console.log(`[+] Đã lấy ${queueRes.rows.length} URLs từ hàng đợi cuốn chiếu hôm trước (Carry-over VIP Queue).`);
    }

    // =========================================================================
    // TẦNG 2: 100% CÔNG TY CÓ BIẾN ĐỘNG NÓNG TRONG 48H QUA (HOT DELTA DETECTOR)
    //         KÈM MÔ HÌNH TRỤC BÁNH XE (HUB & SPOKE PATTERN)
    // =========================================================================
    if (selectedItems.length < effectiveTotal) {
      const quotaRemaining = effectiveTotal - selectedItems.length;
      const deltaQuery = await pool.query(`
        SELECT 
          c.corporate_number, 
          c.company_name,
          c.has_financial_report,
          c.has_public_tender,
          c.has_license,
          c.has_invoice,
          c.prefecture_code,
          c.primary_industry_code,
          c.major_industry_code,
          c.updated_at,
          c.has_hiring,
          c.is_hiring,
          (
            CASE 
              WHEN c.has_financial_report = true THEN 100
              WHEN c.has_public_tender = true THEN 80
              WHEN c.has_hiring = true OR c.is_hiring = true THEN 75
              WHEN c.has_license = true THEN 60
              ELSE 40
            END
          ) AS priority_score,
          (
            CASE 
              WHEN c.has_financial_report = true THEN 'EDINET Báo cáo tài chính mới'
              WHEN c.has_public_tender = true THEN 'GEPS Trúng thầu công mới'
              WHEN c.has_hiring = true OR c.is_hiring = true THEN 'HelloWork Tuyển dụng mới (JobPosting)'
              WHEN c.has_license = true THEN 'Cấp phép kinh doanh mới'
              ELSE 'Thay đổi pháp lý NTA / Thông tin doanh nghiệp'
            END
          ) AS reason
        FROM companies c
        LEFT JOIN google_indexing_submissions sub ON c.corporate_number = sub.corporate_number
        WHERE c.updated_at >= NOW() - INTERVAL '48 hours'
          AND (sub.submitted_at IS NULL OR sub.submitted_at < NOW() - INTERVAL '24 hours')
          -- THIN CONTENT GUARD (Đồng bộ 100% với Frontend: richnessScore >= 3) --
          AND (
            (CASE WHEN c.phone_number IS NOT NULL AND c.phone_number != '' THEN 2 ELSE 0 END) +
            (CASE WHEN c.website_url IS NOT NULL AND c.website_url != '' AND c.website_url NOT LIKE '%なし%' THEN 2 ELSE 0 END) +
            (CASE WHEN c.has_license = true OR c.has_financial_report = true OR c.has_financials = true OR c.has_public_tender = true OR c.has_hiring = true THEN 3 ELSE 0 END) +
            (CASE WHEN c.capital_amount IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN c.employee_count IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN c.representative_name IS NOT NULL AND c.representative_name != '' THEN 1 ELSE 0 END) +
            (CASE WHEN c.primary_industry_code IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN c.has_invoice = true THEN 1 ELSE 0 END)
          ) >= 3
        ORDER BY priority_score DESC, c.updated_at DESC
        LIMIT 2500
      `);

      const alreadySelected = new Set(selectedItems.map(x => x.id));
      const validDeltas = deltaQuery.rows.filter(r => !alreadySelected.has(r.corporate_number));

      console.log(`[+] Phát hiện ${validDeltas.length} công ty có biến động thực tế trong 48h qua.`);

      // -----------------------------------------------------------------------
      // MÔ HÌNH HUB & SPOKE: Tự động trích xuất Parent Hubs tương ứng với biến động
      // -----------------------------------------------------------------------
      const associatedHubsMap = new Map();
      validDeltas.forEach(r => {
        if (r.has_license) {
          associatedHubsMap.set('hub:licenses', { id: 'hub:licenses', url: `${BASE_URL}/ja/licenses`, name: 'Hub: 許認可・国家資格 (Licenses)', isFromQueue: false });
        }
        if (r.has_invoice) {
          associatedHubsMap.set('hub:invoice', { id: 'hub:invoice', url: `${BASE_URL}/ja/invoice`, name: 'Hub: インボイス制度 (Invoice)', isFromQueue: false });
        }
        if (r.has_financial_report) {
          associatedHubsMap.set('hub:status', { id: 'hub:status', url: `${BASE_URL}/ja/status/bankruptcies`, name: 'Hub: 決算・財務開示 (Financials)', isFromQueue: false });
        if (r.has_hiring || r.is_hiring) {
          associatedHubsMap.set('hub:jobs', { id: 'hub:jobs', url: ${BASE_URL}/ja/jobs/latest, name: 'Hub: 最新求人・採用シグナル (Jobs)', isFromQueue: false });
        }
        if (r.has_public_tender) {
          associatedHubsMap.set('hub:bidding', { id: 'hub:bidding', url: ${BASE_URL}/ja/search?subsidy=true&bidding=true, name: 'Hub: 入札・補助金 (Bidding)', isFromQueue: false });
        }
        }
        if (r.prefecture_code) {
          const pCode = String(r.prefecture_code).padStart(2, '0');
          associatedHubsMap.set(`hub:area:${pCode}`, { id: `hub:area:${pCode}`, url: `${BASE_URL}/ja/area/${pCode}`, name: `Hub: 都道府県エリア (${pCode})`, isFromQueue: false });
        }
        if (r.primary_industry_code) {
          associatedHubsMap.set(`hub:industry:${r.primary_industry_code}`, { id: `hub:industry:${r.primary_industry_code}`, url: `${BASE_URL}/ja/industry/${r.primary_industry_code}`, name: `Hub: 業種コード (${r.primary_industry_code})`, isFromQueue: false });
        }
      });

      // Lấy tối đa 50 Parent Hubs liên quan để nạp kèm (chiếm ~5% quota)
      const hubsToInject = Array.from(associatedHubsMap.values())
        .filter(h => !alreadySelected.has(h.id))
        .slice(0, 50);

      hubsToInject.forEach(h => {
        selectedItems.push(h);
        alreadySelected.add(h.id);
      });

      if (hubsToInject.length > 0) {
        console.log(`  [+] [Hub & Spoke] Tự động kích hoạt ${hubsToInject.length} Parent Hubs mẹ liên quan đến biến động hôm nay.`);
      }

      // Lấy số lượng công ty con (Spokes) còn lại cho quota hôm nay
      const quotaForDeltas = Math.max(0, effectiveTotal - selectedItems.length);
      const deltasToSubmit = validDeltas.slice(0, quotaForDeltas);
      deltasToSubmit.forEach(r => {
        selectedItems.push({
          id: r.corporate_number,
          url: `${BASE_URL}/ja/company/${r.corporate_number}`,
          name: `[Biến động ${r.priority_score}đ - ${r.reason}] ${r.company_name || r.corporate_number}`,
          isFromQueue: false
        });
      });

      // Nếu có biến động dôi dư vượt quá hạn mức: LƯU VÀO HÀNG ĐỢI CUỐN CHIẾU HÔM SAU
      const spillover = validDeltas.slice(quotaForDeltas);
      if (spillover.length > 0) {
        console.log(`[*] [SPILLOVER] Có ${spillover.length} công ty biến động vượt hạn mức hôm nay. Đang đưa vào hàng đợi VIP cuốn chiếu hôm sau...`);
        for (const item of spillover) {
          await pool.query(`
            INSERT INTO google_vip_queue (corporate_number, url, priority_score, reason, created_at, status)
            VALUES ($1, $2, $3, $4, NOW(), 'PENDING')
            ON CONFLICT (corporate_number) DO UPDATE
            SET priority_score = EXCLUDED.priority_score,
                reason = EXCLUDED.reason,
                status = 'PENDING';
          `, [item.corporate_number, `${BASE_URL}/ja/company/${item.corporate_number}`, item.priority_score, item.reason]);
        }
      }
    }

    // =========================================================================
    // TẦNG 3: NẾU VẪN CÒN DƯ QUOTA (< 1.000 BIẾN ĐỘNG), PHÂN BỔ CHO HUBS & ENTERPRISES
    // =========================================================================
    if (selectedItems.length < effectiveTotal) {
      const remainingQuota = effectiveTotal - selectedItems.length;
      console.log(`[*] Còn dư ${remainingQuota} quota Google VIP. Đang phân bổ cho Core Hubs & Tier-0 VIP Enterprises...`);

      // Core Statutory Event Hubs
      const coreHubs = [
        { id: 'hub:changes:relocation', url: `${BASE_URL}/ja/changes/relocation`, name: 'Hub: 本店移転・所在地変更 (Relocation)' },
        { id: 'hub:changes:merger', url: `${BASE_URL}/ja/changes/merger`, name: 'Hub: 吸収合併・組織再編 (Merger)' },
        { id: 'hub:invoice', url: `${BASE_URL}/ja/invoice`, name: 'Hub: インボイス制度 (Invoice)' },
        { id: 'hub:jobs', url: `${BASE_URL}/ja/jobs/latest`, name: 'Hub: 求人・採用シグナル (Jobs)' },
        { id: 'hub:new-companies', url: `${BASE_URL}/ja/new-companies`, name: 'Hub: 新設法人 (New Companies)' },
        { id: 'hub:status', url: `${BASE_URL}/ja/status/bankruptcies`, name: 'Hub: 倒産・企業ステータス (Status)' },
        { id: 'hub:licenses', url: `${BASE_URL}/ja/licenses`, name: 'Hub: 許認可・国家資格 (Licenses)' }
      ];
      const hubsToAdd = Math.min(coreHubs.length, Math.floor(remainingQuota * 0.1));
      selectedItems.push(...coreHubs.slice(0, hubsToAdd));

      // Tier-0 VIP Enterprises (ranked by sales & headcount)
      if (selectedItems.length < effectiveTotal) {
        const vipNeeded = effectiveTotal - selectedItems.length;
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
            name: `[Enterprise Tier-0] ${r.company_name}`,
            isFromQueue: false
          });
        });
      }
    }

    const hubCount = selectedItems.filter(x => x.id.startsWith('hub:')).length;
    const vipCount = selectedItems.length - hubCount;
    console.log(`[+] Đã chọn lọc danh sách nạp: Tổng ${selectedItems.length} URLs (Hubs: ${hubCount}, VIP Doanh nghiệp: ${vipCount})`);

    if (opts.dryRun) {
      console.log(`[*] [DRY-RUN] Mô phỏng 50 URLs mẫu đầu tiên:`);
      selectedItems.slice(0, 50).forEach((item, idx) => {
        console.log(`  [${idx + 1}] ${item.name} (${item.id}) -> ${item.url}`);
      });
      console.log(`[*] [DRY-RUN] ... và ${selectedItems.length - 50} URLs tiếp theo.`);
      console.log(`[*] [DRY-RUN] Hoàn tất mô phỏng, không có yêu cầu nào được gửi lên Google.`);
      return;
    }

    // 6. Multi-Key Round-Robin Submitter
    let activeKeyIndex = 0;
    let successCount = 0;
    let failCount = 0;

    function getNextAvailableKey() {
      for (let i = 0; i < keys.length; i++) {
        const idx = (activeKeyIndex + i) % keys.length;
        const k = keys[idx];
        if (!k.isExhausted && k.submittedCount < PER_KEY_LIMIT) {
          activeKeyIndex = idx;
          return k;
        }
      }
      return null;
    }

    for (let idx = 0; idx < selectedItems.length; idx++) {
      const item = selectedItems[idx];
      const currentKey = getNextAvailableKey();

      if (!currentKey) {
        console.warn(`[!] Toàn bộ ${keys.length} keys trong Pool đã cạn hạn mức hôm nay. Dừng nạp tại item ${idx + 1}.`);
        break;
      }

      try {
        const token = await getGoogleAccessToken(currentKey);
        await publishUrl(token, item.url, 'URL_UPDATED');

        await pool.query(`
          INSERT INTO google_indexing_submissions (corporate_number, url, submitted_at, response_code, service_account)
          VALUES ($1, $2, NOW(), 200, $3)
          ON CONFLICT (corporate_number) DO UPDATE 
          SET submitted_at = NOW(), response_code = 200, service_account = EXCLUDED.service_account
        `, [item.id, item.url, currentKey.clientEmail]);

        if (item.isFromQueue) {
          await pool.query(`UPDATE google_vip_queue SET status = 'SUBMITTED' WHERE corporate_number = $1`, [item.id]);
        }

        currentKey.submittedCount++;
        successCount++;
        console.log(`  [${idx + 1}/${selectedItems.length}] ✅ [${currentKey.projectId}] ${item.name} (${item.id}) -> ${item.url}`);

        if (currentKey.submittedCount >= PER_KEY_LIMIT) {
          console.log(`[*] [${currentKey.projectId}] Đã đạt đủ 200 URLs hôm nay. Chuyển sang key tiếp theo...`);
          currentKey.isExhausted = true;
          activeKeyIndex = (activeKeyIndex + 1) % keys.length;
        }

      } catch (err) {
        failCount++;
        const errMsg = err.message || String(err);
        console.error(`  [${idx + 1}/${selectedItems.length}] ❌ [${currentKey.projectId}] Lỗi: ${errMsg}`);

        if (errMsg.includes('RATE_LIMIT_EXCEEDED') || errMsg.toLowerCase().includes('quota') || errMsg.includes('429')) {
          console.log(`[*] [${currentKey.projectId}] Hết hạn mức 200/ngày. Tự động chuyển sang key khả dụng tiếp theo...`);
          currentKey.isExhausted = true;
          activeKeyIndex = (activeKeyIndex + 1) % keys.length;
          idx--; // Thử lại URL này với key tiếp theo
        }
      }

      // Giãn cách 400ms giữa các request
      await new Promise(r => setTimeout(r, 400));
    }

    console.log(`[${new Date().toISOString()}] === HOÀN THÀNH CHU KỲ BẮN MULTI-KEY POOL: Thành công ${successCount}, Lỗi ${failCount} ===`);
    keys.forEach((k, idx) => {
      console.log(`    - Key ${idx + 1} (${k.projectId}): ${k.submittedCount}/${PER_KEY_LIMIT} URLs đã gửi.`);
    });

  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('[-] Fatal error in auto_google_indexing_pg:', err);
  process.exit(1);
});
