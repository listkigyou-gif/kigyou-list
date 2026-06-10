import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserApiKeys, createUserApiKey, revokeUserApiKey, getUserQuota } from "@/lib/db";

/**
 * GET: Retrieve list of API keys for the current authenticated user.
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const apiKeys = await getUserApiKeys(email);

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
    
    // Check if user is eligible for API (must be business or enterprise)
    const quota = await getUserQuota(email);
    const plan = quota ? quota.plan : "free";

    if (plan !== "business" && plan !== "enterprise") {
      return NextResponse.json({
        error: "API連携機能はBUSINESSプラン以上でご利用いただけます。"
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
 * DELETE: Revoke a specific API key for the current user.
 */
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const { keyId } = await request.json();

    if (!keyId) {
      return NextResponse.json({ error: "APIキーIDが必要です。" }, { status: 400 });
    }

    const success = await revokeUserApiKey(email, keyId);
    if (success) {
      return NextResponse.json({
        success: true,
        message: "APIキーを無効化しました。"
      });
    } else {
      return NextResponse.json({ error: "APIキーの無効化に失敗したか, 権限がありません。" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in DELETE /api/user/apikeys:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
