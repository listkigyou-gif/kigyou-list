import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { logAdminAction, getAllApiKeysAdmin, adminUpdateApiKeyStatus, adminHardDeleteApiKey } from "@/lib/db";

/**
 * GET: Retrieve list of all API keys in the system (Admin only) with statistics.
 */
export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const apiKeys = await getAllApiKeysAdmin();

    const stats = {
      total: apiKeys.length,
      active: apiKeys.filter(k => k.status === "active").length,
      revoked: apiKeys.filter(k => k.status === "revoked").length,
      suspended: apiKeys.filter(k => k.status === "suspended").length,
    };

    return NextResponse.json({
      success: true,
      stats,
      apiKeys
    });
  } catch (error) {
    console.error("Error in GET /api/admin/apikeys:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST: Update the status of any API Key (Admin only).
 * Payload: { keyId, status, targetEmail, keyPreview, reason }
 * Supported statuses: 'active' | 'revoked' | 'suspended'
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

    if (status !== "active" && status !== "revoked" && status !== "suspended") {
      return NextResponse.json({ error: "ステータスが不正です。" }, { status: 400 });
    }

    const success = await adminUpdateApiKeyStatus(keyId, status, reason);

    if (success) {
      // Log admin action
      const adminEmail = request.headers.get("x-admin-email") || "unknown_admin@gmail.com";
      const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
      const userAgent = request.headers.get("user-agent") || null;

      let actionName = "ACTIVATE_API_KEY";
      if (status === "revoked") actionName = "REVOKE_API_KEY";
      if (status === "suspended") actionName = "SUSPEND_API_KEY";

      await logAdminAction(
        adminEmail,
        actionName,
        targetEmail,
        { keyId, keyPreview, reason: reason || "", newStatus: status },
        ipAddress,
        userAgent
      );

      const statusLabels: Record<string, string> = {
        active: "有効 (Active)",
        revoked: "無効化 (Revoked)",
        suspended: "一時停止 (Suspended)"
      };

      return NextResponse.json({
        success: true,
        message: `APIキーを${statusLabels[status] || status}に更新しました。`
      });
    } else {
      return NextResponse.json({ error: "APIキーの更新に失敗しました。" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in POST /api/admin/apikeys:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE: Hard delete an API Key from the system (Super Admin only).
 */
export async function DELETE(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const url = new URL(request.url);
    const keyId = url.searchParams.get("keyId") || url.searchParams.get("id");
    const targetEmail = url.searchParams.get("targetEmail") || "unknown";
    const keyPreview = url.searchParams.get("keyPreview") || "";

    if (!keyId) {
      return NextResponse.json({ error: "keyIdが必要です。" }, { status: 400 });
    }

    const success = await adminHardDeleteApiKey(keyId);
    if (success) {
      const adminEmail = request.headers.get("x-admin-email") || "unknown_admin@gmail.com";
      const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
      const userAgent = request.headers.get("user-agent") || null;

      await logAdminAction(
        adminEmail,
        "HARD_DELETE_API_KEY",
        targetEmail,
        { keyId, keyPreview, note: "Permanently deleted by Super Admin" },
        ipAddress,
        userAgent
      );

      return NextResponse.json({
        success: true,
        message: "APIキーをシステムから完全に削除しました。"
      });
    } else {
      return NextResponse.json({ error: "APIキーの削除に失敗しました。" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in DELETE /api/admin/apikeys:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
