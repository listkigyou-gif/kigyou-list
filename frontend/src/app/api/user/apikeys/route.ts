import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserApiKeys, createUserApiKey, revokeUserApiKey, deleteUserApiKey, getUserQuota } from "@/lib/db";
import { isAdminEmail } from "@/lib/adminAuth";

/**
 * GET: Retrieve list of API keys for the current authenticated user.
 * Only returns active keys so the user dashboard stays clean.
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const apiKeys = await getUserApiKeys(email, true);

    return NextResponse.json({
      success: true,
      apiKeys
    });
  } catch (error) {
    console.error("Error in GET /api/user/apikeys:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST: Create a new API key for the current user.
 * Enforces that the user has a BUSINESS or ENTERPRISE subscription.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    
    // Check if user is eligible for API (must be pro, business, enterprise, or system admin)
    const quota = await getUserQuota(email);
    const plan = quota ? quota.plan : "free";

    if (plan !== "pro" && plan !== "business" && plan !== "enterprise" && !isAdminEmail(email)) {
      return NextResponse.json({
        error: "API連携機能はPROプラン以上でご利用いただけます。"
      }, { status: 403 });
    }

    // Limit active keys to a maximum of 5 per user for security and anti-abuse
    const existingKeys = await getUserApiKeys(email);
    const activeKeysCount = existingKeys.filter(k => k.status === "active").length;
    if (activeKeysCount >= 5) {
      return NextResponse.json({
        error: "APIキーの発行上限（最大5個）に達しました。新しいキーを発行する前に、不要なキーを無効化してください。"
      }, { status: 400 });
    }

    const result = await createUserApiKey(email);
    if (!result) {
      return NextResponse.json({ error: "APIキーの生成に失敗しました。" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      rawKey: result.rawKey,
      keyInfo: result.keyInfo
    });
  } catch (error) {
    console.error("Error in POST /api/user/apikeys:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE: Revoke or permanently delete a specific API key for the current user.
 * Supports:
 * - Query param: ?id=xxx or ?keyId=xxx [&action=revoke|delete]
 * - JSON body: { keyId: 'xxx', action: 'revoke'|'delete' }
 */
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const url = new URL(request.url);
    let keyId = url.searchParams.get("id") || url.searchParams.get("keyId");
    let action = url.searchParams.get("action") || "revoke";

    // Try reading JSON body if available
    try {
      const body = await request.json();
      if (body) {
        if (body.keyId || body.id) {
          keyId = body.keyId || body.id;
        }
        if (body.action) {
          action = body.action;
        }
      }
    } catch {
      // Body is empty or not JSON, which is normal for standard DELETE requests with query parameters
    }

    if (!keyId) {
      return NextResponse.json({ error: "APIキーIDが必要です。" }, { status: 400 });
    }

    if (action === "hard_delete") {
      const success = await deleteUserApiKey(email, keyId);
      if (success) {
        return NextResponse.json({
          success: true,
          message: "APIキーを完全に削除しました。"
        });
      } else {
        return NextResponse.json({ error: "APIキーの削除に失敗したか、権限がありません。" }, { status: 400 });
      }
    } else {
      // Default: Soft Delete with Audit Trail ('user' revoked)
      // Completely hidden from user dashboard because GET filters activeOnly=true,
      // but safely preserved in Admin B2B API Key Management for dispute resolution and compliance.
      const success = await revokeUserApiKey(email, keyId, "user", "ユーザー自身による削除 (Dashboard)");
      if (success) {
        return NextResponse.json({
          success: true,
          message: "APIキーを無効化し削除しました。"
        });
      } else {
        return NextResponse.json({ error: "APIキーの削除に失敗したか、権限がありません。" }, { status: 400 });
      }
    }
  } catch (error) {
    console.error("Error in DELETE /api/user/apikeys:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
