import { NextResponse } from "next/server";
import { unsuspendUserQuotaInDb, getUserQuota, logAdminAction } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { targetEmail } = await request.json();

    if (!targetEmail) {
      return NextResponse.json({ error: "メールアドレスが不足しています。" }, { status: 400 });
    }

    // Get user's plan to restore correct allowance
    const quota = await getUserQuota(targetEmail);
    const plan = quota?.plan || "free";

    let allowance = 20;
    if (plan === "pro") allowance = 2000;
    else if (plan === "business") allowance = 10000;
    else if (plan === "enterprise") allowance = 40000;

    const success = await unsuspendUserQuotaInDb(targetEmail, allowance, plan);

    if (success) {
      // Log admin action
      const adminEmail = request.headers.get("x-admin-email") || "unknown_admin@gmail.com";
      const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
      const userAgent = request.headers.get("user-agent") || null;

      await logAdminAction(
        adminEmail,
        "UNSUSPEND_USER",
        targetEmail,
        { plan, allowance },
        ipAddress,
        userAgent
      );

      return NextResponse.json({ success: true, message: "アカウントの一時停止を解除しました。" });
    } else {
      return NextResponse.json({ error: "アカウントの一時停止解除に失敗しました。" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in /api/admin/users/unsuspend POST:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
