import { NextResponse } from "next/server";
import { rollbackCompanyEdit, unhideCompany } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { history_id, corporate_number, action_type } = await request.json();

    if (action_type === "unhide" && corporate_number) {
      const success = await unhideCompany(corporate_number);
      return NextResponse.json({ success, message: "企業を再公開しました。" });
    }

    if (!history_id) {
      return NextResponse.json({ error: "history_id is required." }, { status: 400 });
    }

    const success = await rollbackCompanyEdit(history_id);
    if (success) {
      return NextResponse.json({ success: true, message: "変更内容を以前の状態にロールバック（復元）しました。" });
    } else {
      return NextResponse.json({ error: "ロールバック処理に失敗しました。" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in /api/admin/rollback POST:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
