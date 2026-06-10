import { NextResponse } from "next/server";
import { updateUserPlanQuota, getUserQuota, logAdminAction } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { targetEmail, plan } = await request.json();

    if (!targetEmail || !plan) {
      return NextResponse.json({ error: "メールアドレスまたはプランが不正です。" }, { status: 400 });
    }

    const validPlans = ["free", "pro", "business", "enterprise"];
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: "プランが不正です。" }, { status: 400 });
    }

    // Determine default quota allowance for the plan
    let allowance = 20;
    if (plan === "pro") allowance = 2000;
    else if (plan === "business") allowance = 10000;
    else if (plan === "enterprise") allowance = 40000;

    // Fetch old plan info
    const oldQuota = await getUserQuota(targetEmail);
    const oldPlan = oldQuota ? oldQuota.plan : "unknown";

    const success = await updateUserPlanQuota(targetEmail, allowance, plan);

    if (success) {
      // Log admin action
      const adminEmail = request.headers.get("x-admin-email") || "unknown_admin@gmail.com";
      const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
      const userAgent = request.headers.get("user-agent") || null;

      await logAdminAction(
        adminEmail,
        "UPDATE_USER_PLAN",
        targetEmail,
        { oldPlan, newPlan: plan },
        ipAddress,
        userAgent
      );

      return NextResponse.json({ 
        success: true, 
        message: `プランを${plan.toUpperCase()}に更新しました。`,
        allowance 
      });
    } else {
      return NextResponse.json({ error: "プランの更新に失敗しました。" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in /api/admin/users/plan POST:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
