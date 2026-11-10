import { NextResponse } from "next/server";
import { countCompaniesForExport, SearchFilters } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keyword = "", filters = {} } = await request.json();

    // Sanitize filters
    const sanitizedFilters: SearchFilters = {};
    if (filters) {
      if (filters.prefecture_code && /^\d{2}$/.test(filters.prefecture_code)) {
        sanitizedFilters.prefecture_code = filters.prefecture_code;
      }
      if (Array.isArray(filters.prefecture_codes)) {
        sanitizedFilters.prefecture_codes = filters.prefecture_codes
          .map((s: any) => String(s).trim())
          .filter((s: string) => /^\d{2}$/.test(s))
          .slice(0, 3);
      }
      if (filters.city_name && typeof filters.city_name === "string") {
        sanitizedFilters.city_name = filters.city_name;
      }
      if (filters.industry_code && (/^[A-Z]$/.test(filters.industry_code) || /^\d{2}$/.test(filters.industry_code))) {
        sanitizedFilters.industry_code = filters.industry_code;
      }
      if (Array.isArray(filters.industry_codes)) {
        sanitizedFilters.industry_codes = filters.industry_codes
          .map((s: any) => String(s).trim())
          .filter((s: string) => /^[A-Z]$/.test(s) || /^\d{2}$/.test(s))
          .slice(0, 3);
      }
      if (filters.min_employees !== undefined) {
        const val = parseInt(filters.min_employees, 10);
        if (!isNaN(val) && val >= 0) sanitizedFilters.min_employees = val;
      }
      if (filters.max_employees !== undefined) {
        const val = parseInt(filters.max_employees, 10);
        if (!isNaN(val) && val >= 0) sanitizedFilters.max_employees = val;
      }
      if (filters.min_capital !== undefined) {
        const val = parseInt(filters.min_capital, 10);
        if (!isNaN(val) && val >= 0) sanitizedFilters.min_capital = val;
      }
      if (filters.max_capital !== undefined) {
        const val = parseInt(filters.max_capital, 10);
        if (!isNaN(val) && val >= 0) sanitizedFilters.max_capital = val;
      }
      if (filters.has_hiring === true) sanitizedFilters.has_hiring = true;
      if (filters.has_subsidy === true) sanitizedFilters.has_subsidy = true;
      if (filters.has_bidding === true) sanitizedFilters.has_bidding = true;
      if (filters.has_award === true) sanitizedFilters.has_award = true;
      if (filters.has_certification === true) sanitizedFilters.has_certification = true;
      if (filters.has_patent === true) sanitizedFilters.has_patent = true;
      if (filters.has_financials === true) sanitizedFilters.has_financials = true;
      if (filters.is_listed === true) sanitizedFilters.is_listed = true;
      if (filters.has_license === true) sanitizedFilters.has_license = true;
      if (filters.has_tokutei_lic === true) sanitizedFilters.has_tokutei_lic = true;
      if (filters.has_shigyo_lic === true) sanitizedFilters.has_shigyo_lic = true;
      if (filters.has_real_estate_lic === true) sanitizedFilters.has_real_estate_lic = true;
      if (filters.has_kobutsu_lic === true) sanitizedFilters.has_kobutsu_lic = true;
      if (filters.has_construction_lic === true) sanitizedFilters.has_construction_lic = true;
      
      if (filters.min_establishment_year !== undefined) {
        const val = parseInt(filters.min_establishment_year, 10);
        if (!isNaN(val) && val >= 1000 && val <= 2100) sanitizedFilters.min_establishment_year = val;
      }
      if (filters.max_establishment_year !== undefined) {
        const val = parseInt(filters.max_establishment_year, 10);
        if (!isNaN(val) && val >= 1000 && val <= 2100) sanitizedFilters.max_establishment_year = val;
      }
      if (filters.min_sales !== undefined) {
        const val = parseInt(filters.min_sales, 10);
        if (!isNaN(val) && val >= 0) sanitizedFilters.min_sales = val;
      }
      if (filters.max_sales !== undefined) {
        const val = parseInt(filters.max_sales, 10);
        if (!isNaN(val) && val >= 0) sanitizedFilters.max_sales = val;
      }
      if (filters.has_email === true) sanitizedFilters.has_email = true;
      if (filters.has_phone === true) sanitizedFilters.has_phone = true;
      if (filters.has_website === true) sanitizedFilters.has_website = true;
      if (filters.has_fax === true) sanitizedFilters.has_fax = true;
      if (filters.has_contact_form === true) sanitizedFilters.has_contact_form = true;
      if (filters.email_type && ["RECRUIT", "PR", "SALES", "GENERAL"].includes(filters.email_type)) {
        sanitizedFilters.email_type = filters.email_type;
      }
      
      if (filters.company_status && ["活動中", "閉鎖", "解散"].includes(filters.company_status)) {
        sanitizedFilters.company_status = filters.company_status;
      }
    }

    const result = await countCompaniesForExport(keyword, sanitizedFilters, 100000);

    return NextResponse.json({
      success: true,
      total: result.total,
      isCapped: result.isCapped
    });
  } catch (error) {
    console.error("Error in /api/export/count route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

