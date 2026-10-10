import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import crypto from "crypto";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 10000,
});

function verifyOptOutToken(corporateNumber: string, userId: string, token: string): boolean {
  if (!token) return false;
  let secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "kigyoulist_optout_secure_salt_2026";
  secret = secret.replace(/^["']|["']$/g, '');
  const raw = `${corporateNumber}:${userId}:${secret}`;
  const expected = crypto.createHash("sha256").update(raw, "utf8").digest("hex").substring(0, 16);
  return token.toLowerCase() === expected.toLowerCase();
}

// GET: Retrieve company info for confirmation display
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const corporateNumber = searchParams.get("c") || "";
  const userId = searchParams.get("u") || "admin";
  const token = searchParams.get("token") || "";

  if (!corporateNumber) {
    return NextResponse.json({ error: "法人番号が指定されていません。" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    // 1. Get company details
    const compRes = await client.query(
      `SELECT company_name, prefecture_name, city_name FROM companies WHERE corporate_number = $1 LIMIT 1`,
      [corporateNumber]
    );

    const companyName = compRes.rows[0]?.company_name || "対象企業様";

    // 2. Check if already opted out
    const optRes = await client.query(
      `SELECT id, created_at FROM form_marketing_opt_outs 
       WHERE corporate_number = $1 AND (user_id = $2 OR (user_id IS NULL AND $2 = 'admin'))
       LIMIT 1`,
      [corporateNumber, userId]
    );

    const isAlreadyOptedOut = (optRes.rowCount ?? 0) > 0;
    const isValidToken = verifyOptOutToken(corporateNumber, userId, token);

    return NextResponse.json({
      success: true,
      corporate_number: corporateNumber,
      company_name: companyName,
      user_id: userId,
      already_opted_out: isAlreadyOptedOut,
      valid_token: isValidToken,
    });
  } catch (error: any) {
    console.error("[Opt-out API GET Error]:", error);
    return NextResponse.json({ error: "サーバーエラーが発生しました。" }, { status: 500 });
  } finally {
    client.release();
  }
}

// POST: Execute opt-out submission
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const corporateNumber = (body.corporate_number || body.c || "").trim();
    const userId = (body.user_id || body.u || "admin").trim();
    const campaignId = body.campaign_id || body.cmp || null;
    const token = body.token || "";

    if (!corporateNumber) {
      return NextResponse.json({ error: "法人番号が指定されていません。" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      // 1. Fetch company name
      const compRes = await client.query(
        `SELECT company_name FROM companies WHERE corporate_number = $1 LIMIT 1`,
        [corporateNumber]
      );
      const companyName = compRes.rows[0]?.company_name || body.company_name || null;

      // 2. Insert into form_marketing_opt_outs if not already present
      await client.query(
        `INSERT INTO form_marketing_opt_outs (user_id, corporate_number, company_name, campaign_id, created_at)
         SELECT $1, $2, $3, $4, CURRENT_TIMESTAMP
         WHERE NOT EXISTS (
           SELECT 1 FROM form_marketing_opt_outs 
           WHERE corporate_number = $2 AND (user_id = $1 OR (user_id IS NULL AND $1 = 'admin'))
         )`,
        [userId, corporateNumber, companyName, campaignId]
      );

      return NextResponse.json({
        success: true,
        corporate_number: corporateNumber,
        company_name: companyName,
        message: "お問い合わせフォーム営業の配信停止を正常に受け付けました。",
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("[Opt-out API POST Error]:", error);
    return NextResponse.json({ error: "配信停止の処理中にエラーが発生しました。" }, { status: 500 });
  }
}
