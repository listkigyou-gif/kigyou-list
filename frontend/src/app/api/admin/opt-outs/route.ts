import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { runQuery, runGetQuery } from "@/lib/db";

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    let rows;
    if (q) {
      rows = await runQuery(
        `SELECT id, user_id, corporate_number, company_name, campaign_id, domain, email, reason, created_at 
         FROM form_marketing_opt_outs 
         WHERE corporate_number LIKE ? OR domain LIKE ? OR company_name LIKE ? OR email LIKE ?
         ORDER BY created_at DESC 
         LIMIT 100`,
        [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]
      );
    } else {
      rows = await runQuery(
        `SELECT id, user_id, corporate_number, company_name, campaign_id, domain, email, reason, created_at 
         FROM form_marketing_opt_outs 
         ORDER BY created_at DESC 
         LIMIT 100`
      );
    }

    const totalCount = await runGetQuery(`SELECT COUNT(*) as count FROM form_marketing_opt_outs`);

    return NextResponse.json({
      success: true,
      optOuts: rows || [],
      total: Number(totalCount?.count || 0)
    });
  } catch (error) {
    console.error("Error in GET /api/admin/opt-outs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { corporate_number, company_name, domain, email, reason } = await request.json();

    if (!corporate_number && !domain && !email) {
      return NextResponse.json(
        { error: "法人番号、ドメイン、またはメールアドレスのいずれかを入力してください。" },
        { status: 400 }
      );
    }

    await runQuery(
      `INSERT INTO form_marketing_opt_outs (user_id, corporate_number, company_name, domain, email, reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        "admin",
        (corporate_number || "").trim(),
        (company_name || "").trim(),
        (domain || "").trim(),
        (email || "").trim(),
        (reason || "admin_manual").trim()
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST /api/admin/opt-outs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await runQuery(`DELETE FROM form_marketing_opt_outs WHERE id = ?`, [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/opt-outs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
