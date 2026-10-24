import { NextRequest, NextResponse } from "next/server";
import { runQuery } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const corporateNumbers: string[] = Array.isArray(body.corporateNumbers)
      ? body.corporateNumbers.filter((n: any) => typeof n === "string" && /^\d{13}$/.test(n))
      : [];

    if (corporateNumbers.length === 0) {
      return NextResponse.json({
        success: true,
        companies: [],
        events: []
      });
    }

    // 1. Fetch watched companies info
    const placeholders = corporateNumbers.map(() => "?").join(", ");
    const companiesSql = `
      SELECT 
        corporate_number,
        company_name,
        prefecture_name,
        city_name,
        phone_number,
        website_url,
        employee_count,
        capital_amount,
        status,
        updated_at
      FROM companies
      WHERE corporate_number IN (${placeholders})
    `;
    const companies = await runQuery(companiesSql, corporateNumbers);

    // 2. Fetch latest change events for these companies
    const eventsSql = `
      SELECT 
        id,
        corporate_number,
        company_name,
        event_category,
        TO_CHAR(event_date, 'YYYY-MM-DD') AS event_date,
        title_ja,
        description_ja,
        old_value,
        new_value,
        source
      FROM hub_dynamic_events
      WHERE corporate_number IN (${placeholders})
      ORDER BY event_date DESC, id DESC
      LIMIT 30
    `;

    let events: any[] = [];
    try {
      events = await runQuery(eventsSql, corporateNumbers);
    } catch (e) {
      // Fallback if sqlite or date format differs
      try {
        const sqliteEventsSql = `
          SELECT 
            id,
            corporate_number,
            company_name,
            event_category,
            event_date,
            title_ja,
            description_ja,
            old_value,
            new_value,
            source
          FROM hub_dynamic_events
          WHERE corporate_number IN (${placeholders})
          ORDER BY event_date DESC, id DESC
          LIMIT 30
        `;
        events = await runQuery(sqliteEventsSql, corporateNumbers);
      } catch (err) {
        console.warn("Could not query hub_dynamic_events:", err);
      }
    }

    return NextResponse.json({
      success: true,
      companies: companies || [],
      events: events || []
    });
  } catch (error: any) {
    console.error("Error in /api/user/watchlist:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch watchlist" },
      { status: 500 }
    );
  }
}
