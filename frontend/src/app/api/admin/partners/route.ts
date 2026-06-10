import { NextResponse } from "next/server";
import { getAllPartnersForAdmin, updatePartnerFeaturedStatus, logAdminAction } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const partners = await getAllPartnersForAdmin();
    return NextResponse.json({ success: true, partners });
  } catch (error) {
    console.error("Error in GET /api/admin/partners:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { targetEmail, isFeatured } = await request.json();

    if (!targetEmail) {
      return NextResponse.json({ error: "対象のメールアドレスが不足しています。" }, { status: 400 });
    }

    const success = await updatePartnerFeaturedStatus(targetEmail, !!isFeatured);

    if (success) {
      // Log admin action
      const adminEmail = request.headers.get("x-admin-email") || "unknown_admin@gmail.com";
      const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
      const userAgent = request.headers.get("user-agent") || null;

      await logAdminAction(
        adminEmail,
        isFeatured ? "APPROVE_PARTNER_LOGO" : "REJECT_PARTNER_LOGO",
        targetEmail,
        { isFeatured },
        ipAddress,
        userAgent
      );

      return NextResponse.json({ success: true, message: "パートナーのステータスを更新しました。" });
    } else {
      return NextResponse.json({ error: "ステータスの更新に失敗しました。" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in POST /api/admin/partners:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
