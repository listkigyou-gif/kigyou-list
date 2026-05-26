import { NextResponse } from "next/server";
import { resolveInquiry, hideCompany, unhideCompany } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, action, corporate_number, reason } = await request.json();

    if (!id || !action) {
      return NextResponse.json({ error: "IDまたはアクションが不足しています。" }, { status: 400 });
    }

    if (action === "hide" && corporate_number) {
      await hideCompany(corporate_number, reason || "Hidden via Admin Dashboard");
      await resolveInquiry(id, "resolved");
    } else if (action === "unhide" && corporate_number) {
      await unhideCompany(corporate_number);
      await resolveInquiry(id, "rejected");
    } else if (action === "resolve") {
      await resolveInquiry(id, "resolved");
    }

    return NextResponse.json({ success: true, message: "処理が完了しました。" });
  } catch (error) {
    console.error("Error in /api/admin/inquiries/resolve POST:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
