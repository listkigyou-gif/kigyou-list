import { NextResponse } from "next/server";
import { getCompanyByNumber, getCompaniesByNumbers } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const corporateNumber = searchParams.get("corporate_number") || searchParams.get("id");
    
    if (!corporateNumber || !/^\d{13}$/.test(corporateNumber.trim())) {
      return NextResponse.json({ error: "Invalid corporate_number" }, { status: 400 });
    }

    const company = await getCompanyByNumber(corporateNumber.trim());
    if (!company) {
      return NextResponse.json({ found: false, company: null }, { status: 404 });
    }

    return NextResponse.json({
      found: true,
      company: {
        corporate_number: company.corporate_number,
        company_name: company.company_name,
        website_url: company.website_url || null,
        phone_number: company.phone_number || null,
        representative_name: company.representative_name || null,
        full_address: company.full_address || null
      }
    });
  } catch (error) {
    console.error("Error in GET /api/companies route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawIds = body.ids || body.corporateNumbers;
    if (!Array.isArray(rawIds) || rawIds.length === 0) {
      return NextResponse.json({ companies: [] });
    }

    // Single-query batch fetch instead of sequential N queries
    const companies = await getCompaniesByNumbers(rawIds);

    return NextResponse.json({ companies });
  } catch (error) {
    console.error("Error in /api/companies route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

