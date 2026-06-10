import { NextResponse } from "next/server";
import { verifyApiKey, updateApiKeyUsage, searchCompanies, deductUserQuota, getUserQuota } from "@/lib/db";

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

    const { keyInfo, plan, subscription_status } = verification;

    // API usage is strictly restricted to BUSINESS or ENTERPRISE plans
    if (plan !== "business" && plan !== "enterprise") {
      return NextResponse.json({
        error: "Forbidden: API access is restricted to BUSINESS or ENTERPRISE plans."
      }, { status: 403 });
    }

    if (subscription_status === "suspended") {
      return NextResponse.json({ error: "Forbidden: Account is suspended" }, { status: 403 });
    }

    // Get current quota before query
    const quota = await getUserQuota(keyInfo.user_email);
    const baseRemaining = quota.monthly_base_allowance - quota.monthly_base_used;
    const addOnBalance = quota.purchased_add_on_balance;
    const totalAvailable = Math.max(0, baseRemaining + addOnBalance);

    if (totalAvailable <= 0) {
      return NextResponse.json({ error: "Forbidden: API quota exhausted. Please upgrade or purchase add-on credits." }, { status: 403 });
    }

    // Parse search filters from query parameters
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword") || "";
    const prefecture_code = searchParams.get("prefecture_code") || undefined;
    const city_name = searchParams.get("city_name") || undefined;
    const industry_code = searchParams.get("industry_code") || undefined;
    
    // Numeric filters
    const min_employees = searchParams.get("min_employees") ? parseInt(searchParams.get("min_employees")!) : undefined;
    const max_employees = searchParams.get("max_employees") ? parseInt(searchParams.get("max_employees")!) : undefined;
    const min_capital = searchParams.get("min_capital") ? parseInt(searchParams.get("min_capital")!) : undefined;
    const max_capital = searchParams.get("max_capital") ? parseInt(searchParams.get("max_capital")!) : undefined;
    const min_establishment_year = searchParams.get("min_establishment_year") ? parseInt(searchParams.get("min_establishment_year")!) : undefined;
    const max_establishment_year = searchParams.get("max_establishment_year") ? parseInt(searchParams.get("max_establishment_year")!) : undefined;
    const min_sales = searchParams.get("min_sales") ? parseInt(searchParams.get("min_sales")!) : undefined;
    const max_sales = searchParams.get("max_sales") ? parseInt(searchParams.get("max_sales")!) : undefined;

    // Financial filters
    const min_operating_income = searchParams.get("min_operating_income") ? parseInt(searchParams.get("min_operating_income")!) : undefined;
    const max_operating_income = searchParams.get("max_operating_income") ? parseInt(searchParams.get("max_operating_income")!) : undefined;
    const min_ordinary_income = searchParams.get("min_ordinary_income") ? parseInt(searchParams.get("min_ordinary_income")!) : undefined;
    const max_ordinary_income = searchParams.get("max_ordinary_income") ? parseInt(searchParams.get("max_ordinary_income")!) : undefined;
    const min_net_income = searchParams.get("min_net_income") ? parseInt(searchParams.get("min_net_income")!) : undefined;
    const max_net_income = searchParams.get("max_net_income") ? parseInt(searchParams.get("max_net_income")!) : undefined;

    // Booleans
    const has_hiring = searchParams.get("has_hiring") === "true" ? true : undefined;
    const has_subsidy = searchParams.get("has_subsidy") === "true" ? true : undefined;
    const has_bidding = searchParams.get("has_bidding") === "true" ? true : undefined;
    const has_award = searchParams.get("has_award") === "true" ? true : undefined;
    const has_certification = searchParams.get("has_certification") === "true" ? true : undefined;
    const has_patent = searchParams.get("has_patent") === "true" ? true : undefined;
    
    const has_email = searchParams.get("has_email") === "true" ? true : undefined;
    const has_phone = searchParams.get("has_phone") === "true" ? true : undefined;
    const has_website = searchParams.get("has_website") === "true" ? true : undefined;
    const has_fax = searchParams.get("has_fax") === "true" ? true : undefined;
    const company_status = searchParams.get("company_status") || undefined;

    // Pagination
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));

    const filters = {
      prefecture_code,
      city_name,
      industry_code,
      min_employees,
      max_employees,
      min_capital,
      max_capital,
      has_hiring,
      has_subsidy,
      has_bidding,
      has_award,
      has_certification,
      has_patent,
      min_establishment_year,
      max_establishment_year,
      min_sales,
      max_sales,
      has_email,
      has_phone,
      has_website,
      has_fax,
      company_status,
      min_operating_income,
      max_operating_income,
      min_ordinary_income,
      max_ordinary_income,
      min_net_income,
      max_net_income
    };

    // Execute search query
    const searchResult = await searchCompanies(keyword, filters, limit, offset);

    // Limit returned records to the actual available quota
    let finalCompanies = searchResult.companies;
    if (finalCompanies.length > totalAvailable) {
      finalCompanies = finalCompanies.slice(0, totalAvailable);
    }

    // Deduct quota if records are returned
    if (finalCompanies.length > 0) {
      const deductionSuccess = await deductUserQuota(keyInfo.user_email, finalCompanies.length);
      if (!deductionSuccess) {
        return NextResponse.json({ error: "Failed to deduct quota. Request aborted." }, { status: 500 });
      }
    }

    // Update API Key usage details (IP, UA)
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const ua = request.headers.get("user-agent") || "unknown";
    await updateApiKeyUsage(keyInfo.id, ip, ua);

    const remainingQuota = Math.max(0, totalAvailable - finalCompanies.length);

    return NextResponse.json({
      success: true,
      total_count: searchResult.totalCount,
      count_returned: finalCompanies.length,
      companies: finalCompanies
    }, {
      headers: {
        "X-Quota-Limit": String(quota.monthly_base_allowance + quota.purchased_add_on_balance),
        "X-Quota-Remaining": String(remainingQuota)
      }
    });

  } catch (error) {
    console.error("Error in GET /api/v1/companies:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
