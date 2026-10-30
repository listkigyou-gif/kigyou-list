import fs from "fs";
import path from "path";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { invalidateCompanyCache, runQuery } from "./db";

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://kigyoulist.com").replace(/\/$/, "");
const CF_EMAIL = process.env.CLOUDFLARE_EMAIL || "trungkim8694@gmail.com";
const CF_KEY = process.env.CLOUDFLARE_API_KEY || "";
const CF_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || "881d2cbd9004c4216cb9f8d28c99b0b9";
const NGINX_PURGE_SECRET = "kigyou_cache_bypass_secret_2026";
const INDEXNOW_KEY = "0a1fbe0a7866441bb57817e0bf538068";

export interface SeoTriggerResult {
  cachePurged: boolean;
  cloudflarePurged: boolean;
  nginxRevalidated: boolean;
  googleVipSubmitted: boolean;
  bingIndexNowSubmitted: boolean;
  details: string[];
}

/**
 * 1. Purge Next.js ISR/Memory Cache + Nginx VPS Micro-Cache + Cloudflare Edge Cache
 */
export async function purgeTwoTierCacheForCompany(corporateNumber: string): Promise<{
  cloudflarePurged: boolean;
  nginxRevalidated: boolean;
}> {
  if (!corporateNumber || !/^\d{13}$/.test(corporateNumber)) {
    return { cloudflarePurged: false, nginxRevalidated: false };
  }

  // A. In-memory & Next.js ISR cache
  invalidateCompanyCache(corporateNumber);
  try {
    revalidatePath(`/[locale]/company/${corporateNumber}`, "page");
    revalidatePath(`/ja/company/${corporateNumber}`);
    revalidatePath(`/en/company/${corporateNumber}`);
    revalidatePath(`/vi/company/${corporateNumber}`);
  } catch (e) {
    console.warn("[SEO Trigger] revalidatePath warning:", e);
  }

  const targetUrls = [
    `${BASE_URL}/ja/company/${corporateNumber}`,
    `${BASE_URL}/en/company/${corporateNumber}`,
    `${BASE_URL}/vi/company/${corporateNumber}`,
  ];

  // B. Cloudflare Edge Cache Purge
  let cloudflarePurged = false;
  try {
    const cfRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache`, {
      method: "POST",
      headers: {
        "X-Auth-Email": CF_EMAIL,
        "X-Auth-Key": CF_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ files: targetUrls }),
    });
    const cfData = await cfRes.json().catch(() => ({}));
    cloudflarePurged = Boolean(cfRes.ok && cfData?.success);
  } catch (err) {
    console.warn("[SEO Trigger] Cloudflare purge error:", err);
  }

  // C. Nginx VPS Micro-Cache Revalidation (via X-Purge-Cache secret header)
  let nginxRevalidated = false;
  try {
    await Promise.all(
      targetUrls.map((u) =>
        fetch(u, {
          method: "GET",
          headers: {
            "User-Agent": "Kigyoulist-Admin-Cache-Purger/1.0",
            "X-Purge-Cache": NGINX_PURGE_SECRET,
          },
        }).catch(() => null)
      )
    );
    nginxRevalidated = true;
  } catch (err) {
    console.warn("[SEO Trigger] Nginx revalidate error:", err);
  }

  return { cloudflarePurged, nginxRevalidated };
}

/**
 * Helper: Load Google Service Account credentials from google_keys/ directory
 */
function loadGoogleServiceAccounts(): Array<{ id: string; clientEmail: string; privateKey: string }> {
  const accounts: Array<{ id: string; clientEmail: string; privateKey: string }> = [];
  const candidateDirs = [
    path.resolve(process.cwd(), "../google_keys"),
    path.resolve(process.cwd(), "google_keys"),
    "/var/www/kigyou-list/google_keys",
  ];

  for (const dir of candidateDirs) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs
          .readdirSync(dir)
          .filter((f) => f.endsWith(".json"))
          .sort();
        for (const f of files) {
          try {
            const raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
            if (raw.client_email && raw.private_key) {
              accounts.push({
                id: f,
                clientEmail: raw.client_email,
                privateKey: raw.private_key,
              });
            }
          } catch {}
        }
        if (accounts.length > 0) break;
      } catch {}
    }
  }

  if (accounts.length === 0) {
    const fallbackFiles = [
      path.resolve(process.cwd(), "../google_credentials.json"),
      "/var/www/kigyou-list/google_credentials.json",
    ];
    for (const fp of fallbackFiles) {
      if (fs.existsSync(fp)) {
        try {
          const raw = JSON.parse(fs.readFileSync(fp, "utf-8"));
          if (raw.client_email && raw.private_key) {
            accounts.push({
              id: "default_key",
              clientEmail: raw.client_email,
              privateKey: raw.private_key,
            });
            break;
          }
        } catch {}
      }
    }
  }

  return accounts;
}

async function getGoogleAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claimSet = Buffer.from(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/indexing",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  ).toString("base64url");

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(`${header}.${claimSet}`);
  const signature = sign.sign(privateKey, "base64url");
  const jwt = `${header}.${claimSet}.${signature}`;

  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenResp.ok) {
    const errText = await tokenResp.text();
    throw new Error(`Google token error (${tokenResp.status}): ${errText}`);
  }

  const tokenData = await tokenResp.json();
  return tokenData.access_token;
}

/**
 * 2. Submit URL immediately to Google Indexing API VIP (Multi-Key Pool) & Bing IndexNow API
 */
export async function triggerInstantSearchIndexing(
  corporateNumber: string,
  actionType: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED"
): Promise<{
  googleVipSubmitted: boolean;
  bingIndexNowSubmitted: boolean;
}> {
  if (!corporateNumber || !/^\d{13}$/.test(corporateNumber)) {
    return { googleVipSubmitted: false, bingIndexNowSubmitted: false };
  }

  const targetUrlJa = `${BASE_URL}/ja/company/${corporateNumber}`;
  let googleVipSubmitted = false;
  let bingIndexNowSubmitted = false;

  // A. Google Indexing API VIP (Multi-Key Pool with auto-failover across keys)
  const serviceAccounts = loadGoogleServiceAccounts();
  for (const acc of serviceAccounts) {
    try {
      const accessToken = await getGoogleAccessToken(acc.clientEmail, acc.privateKey);
      const gRes = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: targetUrlJa,
          type: actionType,
        }),
      });

      if (gRes.ok) {
        googleVipSubmitted = true;
        try {
          await runQuery(
            `INSERT INTO google_indexing_submissions (url, target_type, corporate_number, status_code, submitted_at)
             VALUES (?, 'admin_approved_company', ?, 200, CURRENT_TIMESTAMP)
             ON CONFLICT (url) DO UPDATE SET
               status_code = 200,
               submitted_at = CURRENT_TIMESTAMP`,
            [targetUrlJa, corporateNumber]
          );
        } catch {}
        break;
      } else if (gRes.status === 429) {
        // Quota exhausted on this key, try next key in pool
        continue;
      }
    } catch (gErr) {
      console.warn(`[SEO Trigger] Google VIP key ${acc.id} warning:`, gErr);
    }
  }

  // B. Bing IndexNow API
  try {
    const indexNowRes = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: "kigyoulist.com",
        key: INDEXNOW_KEY,
        keyLocation: `https://kigyoulist.com/${INDEXNOW_KEY}.txt`,
        urlList: [targetUrlJa],
      }),
    });

    if (indexNowRes.ok || indexNowRes.status === 200 || indexNowRes.status === 202) {
      bingIndexNowSubmitted = true;
      try {
        await runQuery(
          `INSERT INTO indexnow_submissions (corporate_number, url, submitted_at, batch_id, response_code, priority_level)
           VALUES (?, ?, CURRENT_TIMESTAMP, 'admin_approve_instant', ?, 0)
           ON CONFLICT (corporate_number) DO UPDATE SET
             url = EXCLUDED.url,
             submitted_at = CURRENT_TIMESTAMP,
             batch_id = 'admin_approve_instant',
             response_code = EXCLUDED.response_code`,
          [corporateNumber, targetUrlJa, indexNowRes.status]
        );
      } catch {}
    }
  } catch (bErr) {
    console.warn("[SEO Trigger] Bing IndexNow error:", bErr);
  }

  return { googleVipSubmitted, bingIndexNowSubmitted };
}

/**
 * Combined helper called after Admin approves any company edit or hide/unhide action
 */
export async function executePostApprovalSeoPipeline(
  corporateNumber: string,
  actionType: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED"
): Promise<SeoTriggerResult> {
  const details: string[] = [];
  const cacheRes = await purgeTwoTierCacheForCompany(corporateNumber);
  details.push(
    cacheRes.cloudflarePurged
      ? "Cloudflare Edge + Nginx キャッシュ即時パージ完了"
      : "サーバーキャッシュ更新完了"
  );

  const indexRes = await triggerInstantSearchIndexing(corporateNumber, actionType);
  if (indexRes.googleVipSubmitted) {
    details.push(`Google Indexing VIP (${actionType}) 送信完了`);
  }
  if (indexRes.bingIndexNowSubmitted) {
    details.push("Bing IndexNow API 送信完了");
  }

  return {
    cachePurged: true,
    cloudflarePurged: cacheRes.cloudflarePurged,
    nginxRevalidated: cacheRes.nginxRevalidated,
    googleVipSubmitted: indexRes.googleVipSubmitted,
    bingIndexNowSubmitted: indexRes.bingIndexNowSubmitted,
    details,
  };
}
