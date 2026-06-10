import { NextResponse } from "next/server";
import { adminUpdateUserQuota, getUserQuota, logAdminAction } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { targetEmail, allowance, addOnBalance } = await request.json();

    if (!targetEmail || typeof allowance !== 'number') {
      return NextResponse.json({ error: "メールアドレスまたはクォータが不正です。" }, { status: 400 });
    }

    // Fetch old quota info
    const oldQuota = await getUserQuota(targetEmail);
    const oldAllowance = oldQuota ? oldQuota.monthly_base_allowance : 0;
    const oldAddOn = oldQuota ? oldQuota.purchased_add_on_balance : 0;

    const success = await adminUpdateUserQuota(
      targetEmail, 
      allowance, 
      typeof addOnBalance === 'number' ? addOnBalance : undefined
    );
    
    if (success) {
      // Log admin action
      const adminEmail = request.headers.get("x-admin-email") || "unknown_admin@gmail.com";
      const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
      const userAgent = request.headers.get("user-agent") || null;

      await logAdminAction(
        adminEmail,
        "UPDATE_USER_QUOTA",
        targetEmail,
        {
          oldAllowance,
          newAllowance: allowance,
          oldAddOn,
          newAddOn: typeof addOnBalance === 'number' ? addOnBalance : oldAddOn
        },
        ipAddress,
        userAgent
      );

      return NextResponse.json({ success: true, message: "更新が完了しました。" });
    } else {
      return NextResponse.json({ error: "更新に失敗しました。" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in /api/admin/users/quota POST:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
