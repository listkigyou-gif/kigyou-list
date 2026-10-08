import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { logAdminAction } from "@/lib/db";
import { getUserFormCredits, addFormCredits, adminSetFormCredits } from "@/lib/formCampaigns";

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { targetEmail, balance, addCredits, reason } = await request.json();

    if (!targetEmail) {
      return NextResponse.json({ error: "対象メールアドレスを指定してください。" }, { status: 400 });
    }

    // Get current credits before modification
    const oldCredits = await getUserFormCredits(targetEmail);

    let newBalance = oldCredits.balance;

    if (typeof addCredits === "number" && addCredits !== 0) {
      newBalance = await addFormCredits(targetEmail, addCredits);
    } else if (typeof balance === "number") {
      await adminSetFormCredits(targetEmail, balance);
      newBalance = balance;
    } else {
      return NextResponse.json({ error: "付与数または設定残高を指定してください。" }, { status: 400 });
    }

    // Log admin audit action
    const adminEmail = request.headers.get("x-admin-email") || "unknown_admin@gmail.com";
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
    const userAgent = request.headers.get("user-agent") || null;

    await logAdminAction(
      adminEmail,
      "UPDATE_USER_FORM_CREDITS",
      targetEmail,
      {
        oldBalance: oldCredits.balance,
        newBalance,
        addCredits: typeof addCredits === "number" ? addCredits : null,
        reason: reason || "Admin manual adjustment"
      },
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      message: `${targetEmail} のフォーム営業枠を更新しました。（残高: ${newBalance.toLocaleString()} 件）`,
      balance: newBalance
    });
  } catch (error) {
    console.error("Error in /api/admin/users/form-credits POST:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
