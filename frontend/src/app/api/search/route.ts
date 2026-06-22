import { NextRequest, NextResponse } from "next/server";
import { searchCompanies, SearchFilters, getCitiesWithCounts, isIpBlocked } from "@/lib/db";

// Memory-based rate limiter store
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 40;

export async function GET(request: NextRequest) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = (forwarded ? forwarded.split(",")[0].trim() : "") || (realIp ? realIp.trim() : "") || "127.0.0.1";

    // 1. Check if the IP is blacklisted in database
    if (await isIpBlocked(ip)) {
      return NextResponse.json(
        { error: "Access Forbidden: Your IP is blocked due to abusive bot crawling behavior." },
        { status: 403 }
      );
    }

    // 2. Rate limiting check (Max 40/min)
    const now = Date.now();

    // Periodically clean up expired entries from memory to prevent leaks
    if (ipRequestCounts.size > 2000) {
      for (const [key, value] of ipRequestCounts.entries()) {
        if (now > value.resetTime) {
          ipRequestCounts.delete(key);
        }
      }
    }

    let limitInfo = ipRequestCounts.get(ip);
    if (!limitInfo || now > limitInfo.resetTime) {
      limitInfo = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
      ipRequestCounts.set(ip, limitInfo);
    } else {
      limitInfo.count++;
    }

    if (limitInfo.count > MAX_REQUESTS_PER_WINDOW) {
      console.warn(`[Rate Limit Exceeded] IP: ${ip} hit search rate limit.`);
      return NextResponse.json(
        { error: "Too Many Requests: Rate limit exceeded (Max 40/min). Please slow down." },
        { status: 429 }
      );
    }

    const { searchParams } = request.nextUrl;
    
    const keyword = searchParams.get("q") || "";
    
    // Parse filters
    const filters: SearchFilters = {};
    
    const prefecture = searchParams.get("prefecture");
    if (prefecture && /^\d{2}$/.test(prefecture)) {
      filters.prefecture_code = prefecture;
    }
    
    const city = searchParams.get("city");
    if (city && typeof city === "string") {
      filters.city_name = city;
    }
    
    const industry = searchParams.get("industry");
    if (industry && (/^[A-Z]$/.test(industry) || /^\d{2}$/.test(industry))) {
      filters.industry_code = industry;
    }
    
    const min_employees = searchParams.get("min_employees");
    if (min_employees) {
      const val = parseInt(min_employees, 10);
      if (!isNaN(val) && val >= 0) filters.min_employees = val;
    }
    
    const max_employees = searchParams.get("max_employees");
    if (max_employees) {
      const val = parseInt(max_employees, 10);
      if (!isNaN(val) && val >= 0) filters.max_employees = val;
    }
    
    const min_capital = searchParams.get("min_capital");
    if (min_capital) {
      const val = parseInt(min_capital, 10);
      if (!isNaN(val) && val >= 0) filters.min_capital = val;
    }
    
    const max_capital = searchParams.get("max_capital");
    if (max_capital) {
      const val = parseInt(max_capital, 10);
      if (!isNaN(val) && val >= 0) filters.max_capital = val;
    }
    
    if (searchParams.get("hiring") === "true") filters.has_hiring = true;
    if (searchParams.get("subsidy") === "true") filters.has_subsidy = true;
    if (searchParams.get("bidding") === "true") filters.has_bidding = true;
    if (searchParams.get("award") === "true") filters.has_award = true;
    if (searchParams.get("certification") === "true") filters.has_certification = true;
    if (searchParams.get("patent") === "true") filters.has_patent = true;
    if (searchParams.get("financials") === "true") filters.has_financials = true;
    
    const min_establishment_year = searchParams.get("min_establishment_year");
    if (min_establishment_year) {
      const val = parseInt(min_establishment_year, 10);
      if (!isNaN(val) && val >= 1000 && val <= 2100) filters.min_establishment_year = val;
    }
    
    const max_establishment_year = searchParams.get("max_establishment_year");
    if (max_establishment_year) {
      const val = parseInt(max_establishment_year, 10);
      if (!isNaN(val) && val >= 1000 && val <= 2100) filters.max_establishment_year = val;
    }

    const min_sales = searchParams.get("min_sales");
    if (min_sales) {
      const val = parseInt(min_sales, 10);
      if (!isNaN(val) && val >= 0) filters.min_sales = val;
    }
    
    const max_sales = searchParams.get("max_sales");
    if (max_sales) {
      const val = parseInt(max_sales, 10);
      if (!isNaN(val) && val >= 0) filters.max_sales = val;
    }
    
    if (searchParams.get("email") === "true") filters.has_email = true;
    if (searchParams.get("phone") === "true") filters.has_phone = true;
    if (searchParams.get("website") === "true") filters.has_website = true;
    if (searchParams.get("fax") === "true") filters.has_fax = true;
    
    const company_status = searchParams.get("status");
    if (company_status && ["活動中", "閉鎖", "解散"].includes(company_status)) {
      filters.company_status = company_status;
    }

    const min_operating_income = searchParams.get("min_operating_income");
    if (min_operating_income) {
      const val = parseFloat(min_operating_income);
      if (!isNaN(val)) filters.min_operating_income = val;
    }

    const max_operating_income = searchParams.get("max_operating_income");
    if (max_operating_income) {
      const val = parseFloat(max_operating_income);
      if (!isNaN(val)) filters.max_operating_income = val;
    }

    const min_ordinary_income = searchParams.get("min_ordinary_income");
    if (min_ordinary_income) {
      const val = parseFloat(min_ordinary_income);
      if (!isNaN(val)) filters.min_ordinary_income = val;
    }

    const max_ordinary_income = searchParams.get("max_ordinary_income");
    if (max_ordinary_income) {
      const val = parseFloat(max_ordinary_income);
      if (!isNaN(val)) filters.max_ordinary_income = val;
    }

    const min_net_income = searchParams.get("min_net_income");
    if (min_net_income) {
      const val = parseFloat(min_net_income);
      if (!isNaN(val)) filters.min_net_income = val;
    }

    const max_net_income = searchParams.get("max_net_income");
    if (max_net_income) {
      const val = parseFloat(max_net_income);
      if (!isNaN(val)) filters.max_net_income = val;
    }
    
    // Keyset cursor pagination (new: has_financials + capital_amount based)
    const cursor_has_fin = searchParams.get("cursor_has_fin");
    if (cursor_has_fin !== null) {
      const val = parseInt(cursor_has_fin, 10);
      if (!isNaN(val) && (val === 0 || val === 1)) filters.cursor_has_fin = val;
    }

    const cursor_cap = searchParams.get("cursor_cap");
    if (cursor_cap !== null) {
      const val = parseInt(cursor_cap, 10);
      if (!isNaN(val) && val >= 0) filters.cursor_cap = val;
    }
    
    const cursor_corp = searchParams.get("cursor_corp");
    if (cursor_corp && /^\d{13}$/.test(cursor_corp)) {
      filters.cursor_corp = cursor_corp;
    }
    
    // Pagination offset/limit
    let limit = parseInt(searchParams.get("limit") || "15", 10); // Standardized to 15 per page
    if (isNaN(limit) || limit < 1) {
      limit = 15;
    } else if (limit > 100) {
      limit = 100;
    }
    
    let offset = parseInt(searchParams.get("offset") || "0", 10);
    if (isNaN(offset) || offset < 0) {
      offset = 0;
    }
    
    const result = await searchCompanies(keyword, filters, limit, offset);
    
    // Dynamically fetch cities with counts if prefecture is selected
    let cities: any[] = [];
    if (filters.prefecture_code) {
      cities = await getCitiesWithCounts(filters.prefecture_code);
    }
    
    return NextResponse.json({
      companies: result.companies,
      totalCount: result.totalCount,
      cities
    });
  } catch (error) {
    console.error("Error in /api/search route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
