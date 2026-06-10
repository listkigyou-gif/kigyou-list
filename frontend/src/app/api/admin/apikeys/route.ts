import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { logAdminAction, getAllApiKeysAdmin, adminUpdateApiKeyStatus } from "@/lib/db";

/**
 * GET: Retrieve list of all API keys in the system (Admin only).
 */
export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const apiKeys = await getAllApiKeysAdmin();

    return NextResponse.json({
      success: true,
      apiKeys
    });
  } catch (error) {
    console.error("Error in GET /api/admin/apikeys:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST: Update the status of any API Key (Admin only).
 * Payload: { keyId, status, targetEmail, keyPreview }
 */
export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { keyId, status, targetEmail, keyPreview, reason } = await request.json();

    if (!keyId || !status || !targetEmail) {
      return NextResponse.json({ error: "パラメータが不足しています。" }, { status: 400 });
    }

    if (status !== "active" && status !== "revoked") {
      return NextResponse.json({ error: "ステータスが不正です。" }, { status: 400 });
    }

    const success = await adminUpdateApiKeyStatus(keyId, status, reason);

    if (success) {
      // Log admin action
      const adminEmail = request.headers.get("x-admin-email") || "unknown_admin@gmail.com";
      const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
      const userAgent = request.headers.get("user-agent") || null;

      await logAdminAction(
        adminEmail,
        status === "revoked" ? "REVOKE_API_KEY" : "ACTIVATE_API_KEY",
        targetEmail,
        { keyId, keyPreview, reason: reason || "" },
        ipAddress,
        userAgent
      );

      return NextResponse.json({
        success: true,
        message: `APIキーを${status === "revoked" ? "無効" : "有効"}に更新しました。`
      });
    } else {
      return NextResponse.json({ error: "APIキーの更新に失敗しました。" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in POST /api/admin/apikeys:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
