import { NextResponse } from "next/server";
import { verifyApiKey, updateApiKeyUsage, runGetQuery, runQuery } from "@/lib/db";
import crypto from "crypto";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing Bearer Token" }, { status: 401 });
    }

    const rawKey = authHeader.substring(7).trim();
    const verification = await verifyApiKey(rawKey);
    if (!verification) {
      return NextResponse.json({ error: "Unauthorized: Invalid or revoked API Key" }, { status: 401 });
    }

    const { keyInfo, plan } = verification;
    if (plan !== "business" && plan !== "enterprise") {
      return NextResponse.json({
        error: "Forbidden: Real-time Webhooks require BUSINESS or ENTERPRISE plans."
      }, { status: 403 });
    }

    const rows = await runQuery(
      "SELECT id, webhook_url, filter_events, filter_prefecture, is_active, failure_count, created_at, last_dispatched_at FROM webhook_subscriptions WHERE user_email = ? ORDER BY created_at DESC",
      [keyInfo.user_email]
    );

    return NextResponse.json({
      success: true,
      subscriptions: (rows || []).map((r: any) => ({
        ...r,
        filter_events: typeof r.filter_events === "string" ? JSON.parse(r.filter_events || "[]") : r.filter_events
      }))
    });
  } catch (error) {
    console.error("Error in GET /api/v1/webhooks:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing Bearer Token" }, { status: 401 });
    }

    const rawKey = authHeader.substring(7).trim();
    const verification = await verifyApiKey(rawKey);
    if (!verification) {
      return NextResponse.json({ error: "Unauthorized: Invalid or revoked API Key" }, { status: 401 });
    }

    const { keyInfo, plan } = verification;
    if (plan !== "business" && plan !== "enterprise") {
      return NextResponse.json({
        error: "Forbidden: Real-time Webhooks require BUSINESS or ENTERPRISE plans."
      }, { status: 403 });
    }

    const body = await request.json();
    const webhookUrl = body.webhook_url?.trim();
    const filterEvents = body.filter_events || ["hiring", "subsidy", "bidding"];
    const filterPrefecture = body.filter_prefecture?.trim() || null;

    if (!webhookUrl || !webhookUrl.startsWith("http")) {
      return NextResponse.json({
        error: "Bad Request: A valid HTTP/HTTPS webhook_url is required."
      }, { status: 400 });
    }

    // Generate unique ID and HMAC signing secret
    const subscriptionId = "whsub_" + crypto.randomBytes(8).toString("hex");
    const secretToken = "whsec_" + crypto.randomBytes(24).toString("hex");

    await runQuery(
      `INSERT INTO webhook_subscriptions (
        id, user_email, api_key, webhook_url, secret_token, 
        filter_events, filter_prefecture, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
      [
        subscriptionId,
        keyInfo.user_email,
        keyInfo.id,
        webhookUrl,
        secretToken,
        JSON.stringify(filterEvents),
        filterPrefecture
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Webhook subscription registered successfully.",
      subscription: {
        id: subscriptionId,
        webhook_url: webhookUrl,
        filter_events: filterEvents,
        filter_prefecture: filterPrefecture,
        secret_token: secretToken,
        instructions: "Use secret_token to verify the 'X-KigyouList-Signature' HMAC-SHA256 header sent with each event payload."
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Error in POST /api/v1/webhooks:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing Bearer Token" }, { status: 401 });
    }

    const rawKey = authHeader.substring(7).trim();
    const verification = await verifyApiKey(rawKey);
    if (!verification) {
      return NextResponse.json({ error: "Unauthorized: Invalid or revoked API Key" }, { status: 401 });
    }

    const { keyInfo } = verification;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Bad Request: subscription 'id' is required" }, { status: 400 });
    }

    await runQuery(
      "DELETE FROM webhook_subscriptions WHERE id = ? AND user_email = ?",
      [id, keyInfo.user_email]
    );

    return NextResponse.json({
      success: true,
      message: `Webhook subscription ${id} has been deleted.`
    });
  } catch (error) {
    console.error("Error in DELETE /api/v1/webhooks:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
