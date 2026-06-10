import { NextResponse } from "next/server";
import { verifyApiKey, updateApiKeyUsage, getUserQuota } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing Bearer Token" }, { status: 401 });
    }

    const rawKey = authHeader.substring(7).trim();
    const verification = await verifyApiKey(rawKey);

    if (!verification) {
      return NextResponse.json({ error: "Unauthorized: Invalid or revoked API Key" }, { status: 401 });
    }

    const { keyInfo, plan, subscription_status } = verification;

    // Check account status
    if (subscription_status === "suspended") {
      return NextResponse.json({ error: "Forbidden: Account is suspended" }, { status: 403 });
    }

    // Update API key metadata (IP, UA)
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const ua = request.headers.get("user-agent") || "unknown";
    await updateApiKeyUsage(keyInfo.id, ip, ua);

    // Get live quota statistics
    const quota = await getUserQuota(keyInfo.user_email);

    const baseRemaining = quota.monthly_base_allowance - quota.monthly_base_used;
    const addOnBalance = quota.purchased_add_on_balance;
    const totalRemaining = Math.max(0, baseRemaining + addOnBalance);

    return NextResponse.json({
      success: true,
      plan: quota.plan,
      monthly_base_allowance: quota.monthly_base_allowance,
      monthly_base_used: quota.monthly_base_used,
      purchased_add_on_balance: quota.purchased_add_on_balance,
      remaining_quota: totalRemaining
    }, {
      headers: {
        "X-Quota-Limit": String(quota.monthly_base_allowance + quota.purchased_add_on_balance),
        "X-Quota-Remaining": String(totalRemaining)
      }
    });
  } catch (error) {
    console.error("Error in GET /api/v1/quota:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
