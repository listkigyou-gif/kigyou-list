import { NextResponse } from "next/server";
import { suspendUserQuotaInDb, logAdminAction } from "@/lib/db";
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

    const success = await suspendUserQuotaInDb(targetEmail);

    if (success) {
      // Log admin action
      const adminEmail = request.headers.get("x-admin-email") || "unknown_admin@gmail.com";
      const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
      const userAgent = request.headers.get("user-agent") || null;

      await logAdminAction(
        adminEmail,
        "SUSPEND_USER",
        targetEmail,
        { reason: reason || "No reason provided" },
        ipAddress,
        userAgent
      );

      return NextResponse.json({ success: true, message: "アカウントを一時停止しました。" });
    } else {
      return NextResponse.json({ error: "アカウントの一時停止に失敗しました。" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in /api/admin/users/suspend POST:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
