import { NextResponse } from "next/server";
import { adminUpdateUserQuota } from "@/lib/db";
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

    const success = await adminUpdateUserQuota(
      targetEmail, 
      allowance, 
      typeof addOnBalance === 'number' ? addOnBalance : undefined
    );
    
    if (success) {
      return NextResponse.json({ success: true, message: "更新が完了しました。" });
    } else {
      return NextResponse.json({ error: "更新に失敗しました。" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in /api/admin/users/quota POST:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
