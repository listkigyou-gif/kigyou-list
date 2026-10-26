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

    // 3. Fetch real hiring job postings from business_signals (with accurate release date, salary & location)
    let hiringSignals: any[] = [];
    try {
      const hiringSql = `
        SELECT id, corporate_number, signal_title, signal_date, details, source_url
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY corporate_number ORDER BY signal_date DESC, id DESC) as rn
          FROM business_signals
          WHERE corporate_number IN (${placeholders}) AND signal_type = '求人あり'
        ) t
        WHERE rn <= 3
        ORDER BY signal_date DESC, id DESC
      `;
      hiringSignals = await runQuery(hiringSql, corporateNumbers);
    } catch (err) {
      console.warn("Could not query hiring business_signals:", err);
    }

    const companyNameMap = new Map<string, string>();
    (companies || []).forEach((c: any) => {
      companyNameMap.set(c.corporate_number, c.company_name);
    });

    const realHiringEvents = (hiringSignals || []).map((h: any) => {
      let desc = "";
      if (h.details) {
        try {
          const d = JSON.parse(h.details);
          const parts: string[] = [];
          if (d.wages) parts.push(`【賃金】${d.wages.replace(/\n/g, ' ')}`);
          if (d.work_location) parts.push(`【就業場所】${d.work_location.replace(/\n/g, ' ')}`);
          if (d.holidays) parts.push(`【休日】${d.holidays.replace(/\n/g, ' ')}`);
          desc = parts.join(" ");
        } catch {
          desc = h.details;
        }
      }
      return {
        id: typeof h.id === 'number' ? h.id : parseInt(String(h.id), 10),
        corporate_number: h.corporate_number,
        company_name: companyNameMap.get(h.corporate_number) || "",
        event_category: "hiring",
        event_date: h.signal_date || "",
        title_ja: h.signal_title,
        description_ja: desc,
        old_value: null,
        new_value: null,
        source: "ハローワーク"
      };
    });

    const corpsWithRealJobs = new Set(realHiringEvents.map((r: any) => r.corporate_number));
    const nonGenericEvents = (events || []).filter((e: any) => {
      if (e.event_category === 'hiring' && corpsWithRealJobs.has(e.corporate_number)) {
        return false;
      }
      return true;
    });

    const mergedEvents = [...nonGenericEvents, ...realHiringEvents].sort(
      (a: any, b: any) => (b.event_date || "").localeCompare(a.event_date || "")
    ).slice(0, 30);

    return NextResponse.json({
      success: true,
      companies: companies || [],
      events: mergedEvents
    });
  } catch (error: any) {
    console.error("Error in /api/user/watchlist:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch watchlist" },
      { status: 500 }
    );
  }
}
