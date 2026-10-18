import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

const globalForOverview = globalThis as unknown as {
  cachedSummary?: any;
  lastSummaryFetch?: number;
};
const SUMMARY_CACHE_TTL = 30 * 1000; // 30 seconds cache

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "1";
    const now = Date.now();

    if (
      !forceRefresh &&
      globalForOverview.cachedSummary &&
      globalForOverview.lastSummaryFetch &&
      now - globalForOverview.lastSummaryFetch < SUMMARY_CACHE_TTL
    ) {
      return NextResponse.json({ success: true, stats: globalForOverview.cachedSummary, cached: true });
    }

    const [
      plansRes,
      usersCountRes,
      creditsRes,
      revenueRes,
      inquiriesSummaryRes,
      claimsRes,
      campaignsRes,
      exportsRes,
      couponsRes,
      recentInquiriesRes,
      recentLogsRes,
      backupRes,
    ] = await Promise.all([
      pool.query(`SELECT plan, count(1) as count FROM user_export_quotas GROUP BY plan`),
      pool.query(`SELECT count(1) as count FROM user_export_quotas`),
      pool.query(`SELECT COALESCE(SUM(balance), 0) as balance, COALESCE(SUM(total_used), 0) as used FROM user_form_credits`),
      pool.query(`SELECT count(1) as count, COALESCE(SUM(amount_jpy), 0) as revenue FROM deposit_history WHERE status IN ('succeeded', 'completed')`),
      pool.query(`SELECT count(1) as total, COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending FROM inquiries`),
      pool.query(`SELECT count(1) as count FROM company_claim_requests WHERE status = 'pending'`),
      pool.query(`SELECT count(1) as count FROM user_form_campaigns WHERE status = 'pending_approval'`),
      pool.query(`SELECT count(1) as count FROM export_jobs`).catch(() => ({ rows: [{ count: 0 }] })),
      pool.query(`SELECT count(1) as count FROM coupons WHERE is_active = true AND expires_at > CURRENT_TIMESTAMP AND used_count < max_uses`).catch(() => ({ rows: [{ count: 0 }] })),
      pool.query(`SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 5`).catch(() => ({ rows: [] })),
      pool.query(`SELECT * FROM admin_action_logs ORDER BY created_at DESC LIMIT 5`).catch(() => ({ rows: [] })),
      pool.query(`SELECT * FROM db_backup_logs ORDER BY created_at DESC LIMIT 1`).catch(() => ({ rows: [] })),
    ]);

    const plans = { free: 0, pro: 0, business: 0, enterprise: 0 };
    for (const r of plansRes.rows) {
      const p = (r.plan || "free").toLowerCase();
      const count = parseInt(r.count, 10) || 0;
      if (p in plans) plans[p as keyof typeof plans] += count;
      else plans.free += count;
    }

    const stats = {
      usersCount: parseInt(usersCountRes.rows[0]?.count || "0", 10),
      planBreakdown: plans,
      totalRevenueJpy: parseInt(revenueRes.rows[0]?.revenue || "0", 10),
      paymentsCount: parseInt(revenueRes.rows[0]?.count || "0", 10),
      pendingInquiriesCount: parseInt(inquiriesSummaryRes.rows[0]?.pending || "0", 10),
      pendingClaimsCount: parseInt(claimsRes.rows[0]?.count || "0", 10),
      pendingFormCampaignsCount: parseInt(campaignsRes.rows[0]?.count || "0", 10),
      totalInquiriesCount: parseInt(inquiriesSummaryRes.rows[0]?.total || "0", 10),
      exportJobsCount: parseInt(exportsRes.rows[0]?.count || "0", 10),
      activeCouponsCount: parseInt(couponsRes.rows[0]?.count || "0", 10),
      totalFormCreditsBalance: parseInt(creditsRes.rows[0]?.balance || "0", 10),
      totalFormCreditsUsed: parseInt(creditsRes.rows[0]?.used || "0", 10),
      latestBackup: backupRes.rows[0] || null,
      recentLogs: recentLogsRes.rows || [],
      recentInquiries: recentInquiriesRes.rows || [],
    };

    globalForOverview.cachedSummary = stats;
    globalForOverview.lastSummaryFetch = now;

    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    console.error("Error in /api/admin/overview-summary GET:", error);
    if (globalForOverview.cachedSummary) {
      return NextResponse.json({ success: true, stats: globalForOverview.cachedSummary, stale: true });
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
