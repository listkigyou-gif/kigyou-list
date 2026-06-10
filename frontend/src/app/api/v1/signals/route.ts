import { NextResponse } from "next/server";
import { verifyApiKey, updateApiKeyUsage, getBusinessSignalsGlobal, deductUserQuota, getUserQuota } from "@/lib/db";

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

    // API usage is strictly restricted to BUSINESS or ENTERPRISE plans
    if (plan !== "business" && plan !== "enterprise") {
      return NextResponse.json({
        error: "Forbidden: API access is restricted to BUSINESS or ENTERPRISE plans."
      }, { status: 403 });
    }

    if (subscription_status === "suspended") {
      return NextResponse.json({ error: "Forbidden: Account is suspended" }, { status: 403 });
    }

    // Get current quota before query
    const quota = await getUserQuota(keyInfo.user_email);
    const baseRemaining = quota.monthly_base_allowance - quota.monthly_base_used;
    const addOnBalance = quota.purchased_add_on_balance;
    const totalAvailable = Math.max(0, baseRemaining + addOnBalance);

    if (totalAvailable <= 0) {
      return NextResponse.json({ error: "Forbidden: API quota exhausted. Please upgrade or purchase add-on credits." }, { status: 403 });
    }

    // Parse parameters
    const { searchParams } = new URL(request.url);
    const corporate_number = searchParams.get("corporate_number") || undefined;
    const signal_type = searchParams.get("signal_type") || undefined;

    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));

    const filters = {
      corporate_number,
      signal_type
    };

    // Execute query
    const queryResult = await getBusinessSignalsGlobal(filters, limit, offset);

    // Limit returned records to the actual available quota
    let finalSignals = queryResult.signals;
    if (finalSignals.length > totalAvailable) {
      finalSignals = finalSignals.slice(0, totalAvailable);
    }

    // Deduct quota if records are returned
    if (finalSignals.length > 0) {
      const deductionSuccess = await deductUserQuota(keyInfo.user_email, finalSignals.length);
      if (!deductionSuccess) {
        return NextResponse.json({ error: "Failed to deduct quota. Request aborted." }, { status: 500 });
      }
    }

    // Update API Key usage details (IP, UA)
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const ua = request.headers.get("user-agent") || "unknown";
    await updateApiKeyUsage(keyInfo.id, ip, ua);

    const remainingQuota = Math.max(0, totalAvailable - finalSignals.length);

    return NextResponse.json({
      success: true,
      total_count: queryResult.totalCount,
      count_returned: finalSignals.length,
      signals: finalSignals
    }, {
      headers: {
        "X-Quota-Limit": String(quota.monthly_base_allowance + quota.purchased_add_on_balance),
        "X-Quota-Remaining": String(remainingQuota)
      }
    });

  } catch (error) {
    console.error("Error in GET /api/v1/signals:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
