import { NextResponse } from "next/server";
import { suspendUserQuotaInDb, logAdminAction, getUserQuota } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { targetEmail, reason } = await request.json();

    if (!targetEmail) {
      return NextResponse.json({ error: "メールアドレスが不足しています。" }, { status: 400 });
    }

    // 1. Check if user has an active Stripe subscription and automatically cancel it
    let canceledSubId: string | null = null;
    try {
      const quota = await getUserQuota(targetEmail);
      const subId = quota?.stripe_subscription_id;
      const stripeSecret = process.env.STRIPE_SECRET_KEY;

      if (stripeSecret && subId && !subId.startsWith("sim_")) {
        const StripeLib = require("stripe");
        const stripe = new StripeLib(stripeSecret, { apiVersion: "2023-10-16" });
        await stripe.subscriptions.cancel(subId);
        canceledSubId = subId;
        console.log(`[Admin Suspend] Automatically cancelled active Stripe subscription ${subId} for ${targetEmail}`);
      }
    } catch (stripeErr: any) {
      console.warn(`[Admin Suspend] Stripe cancel warning for ${targetEmail}:`, stripeErr?.message || stripeErr);
    }

    // 2. Suspend quota and permissions in database
    const success = await suspendUserQuotaInDb(targetEmail);

    if (success) {
      // 3. Log admin action
      const adminEmail = request.headers.get("x-admin-email") || "unknown_admin@gmail.com";
      const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
      const userAgent = request.headers.get("user-agent") || null;

      await logAdminAction(
        adminEmail,
        "SUSPEND_USER",
        targetEmail,
        { 
          reason: reason || "No reason provided",
          canceledStripeSub: canceledSubId
        },
        ipAddress,
        userAgent
      );

      const msg = canceledSubId 
        ? "アカウントを一時停止し、Stripeの定期課金（サブスクリプション）を即時解約しました。" 
        : "アカウントを一時停止しました。";

      return NextResponse.json({ success: true, message: msg, canceledSubId });
    } else {
      return NextResponse.json({ error: "アカウントの一時停止に失敗しました。" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in /api/admin/users/suspend POST:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
