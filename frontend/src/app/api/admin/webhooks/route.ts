import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { runQuery, runGetQuery } from "@/lib/db";

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const rows = await runQuery(
      `SELECT id, user_email, webhook_url, filter_events, filter_prefecture, is_active, failure_count, created_at, last_dispatched_at 
       FROM webhook_subscriptions 
       ORDER BY created_at DESC 
       LIMIT 200`
    );

    const stats = await runGetQuery(
      `SELECT 
         COUNT(*) as total_subscriptions,
         SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_subscriptions,
         SUM(failure_count) as total_failures
       FROM webhook_subscriptions`
    );

    return NextResponse.json({
      success: true,
      subscriptions: rows || [],
      stats: {
        total: Number(stats?.total_subscriptions || 0),
        active: Number(stats?.active_subscriptions || 0),
        failures: Number(stats?.total_failures || 0),
      }
    });
  } catch (error) {
    console.error("Error in GET /api/admin/webhooks:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, is_active, reset_failures } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 });
    }

    if (reset_failures) {
      await runQuery(
        `UPDATE webhook_subscriptions SET failure_count = 0, is_active = 1 WHERE id = ?`,
        [id]
      );
    } else if (typeof is_active === "number" || typeof is_active === "boolean") {
      const activeVal = is_active ? 1 : 0;
      await runQuery(
        `UPDATE webhook_subscriptions SET is_active = ? WHERE id = ?`,
        [activeVal, id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PATCH /api/admin/webhooks:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
