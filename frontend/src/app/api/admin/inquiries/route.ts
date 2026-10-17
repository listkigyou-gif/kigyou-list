import { NextResponse } from "next/server";
import { getInquiries, resolveInquiry, hideCompany, unhideCompany, logAdminAction } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const inquiries = await getInquiries();
    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error("Error in /api/admin/inquiries GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const id = body.id || body.inquiryId;
    const action = body.action;
    const corporate_number = body.corporate_number || body.corporateNumber;
    const reason = body.reason;

    if (!id || !action) {
      return NextResponse.json({ error: "IDまたはアクションが不足しています。" }, { status: 400 });
    }

    const adminEmail = request.headers.get("x-admin-email") || "unknown_admin@gmail.com";
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
    const userAgent = request.headers.get("user-agent") || null;

    if (action === "hide" && corporate_number && corporate_number !== "N/A") {
      await hideCompany(corporate_number, reason || "Hidden via Admin Dashboard");
      await resolveInquiry(id, "resolved");

      await logAdminAction(
        adminEmail,
        "HIDE_COMPANY",
        corporate_number,
        { id, reason: reason || "Hidden via Admin Dashboard" },
        ipAddress,
        userAgent
      );
    } else if (action === "unhide" && corporate_number && corporate_number !== "N/A") {
      await unhideCompany(corporate_number);
      await resolveInquiry(id, "rejected");

      await logAdminAction(
        adminEmail,
        "UNHIDE_COMPANY",
        corporate_number,
        { id },
        ipAddress,
        userAgent
      );
    } else if (action === "resolve") {
      await resolveInquiry(id, "resolved");

      await logAdminAction(
        adminEmail,
        "RESOLVE_INQUIRY",
        id,
        { id },
        ipAddress,
        userAgent
      );
    }

    return NextResponse.json({ success: true, message: "処理が完了しました。" });
  } catch (error) {
    console.error("Error in /api/admin/inquiries POST:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
