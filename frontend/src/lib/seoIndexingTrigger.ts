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
 * 2. Submit URL immediately to Bing IndexNow API.
 * Note: Google Indexing API (`indexing.googleapis.com`) is intentionally disabled
 * for this B2B directory; Googlebot discovers fresh content via Two-Tier Cache purge,
 * internal links, and clean sitemaps.
 */
export async function triggerInstantSearchIndexing(
  corporateNumber: string,
  actionType: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED"
): Promise<{
  googleVipSubmitted: boolean;
  bingIndexNowSubmitted: boolean;
}> {
  void actionType;
  if (!corporateNumber || !/^\d{13}$/.test(corporateNumber)) {
    return { googleVipSubmitted: false, bingIndexNowSubmitted: false };
  }

  const targetUrlJa = `${BASE_URL}/ja/company/${corporateNumber}`;
  const googleVipSubmitted = false;
  let bingIndexNowSubmitted = false;

  // Bing IndexNow API
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
