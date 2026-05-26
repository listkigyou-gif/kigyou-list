import { NextResponse } from "next/server";
import { getCompanyByNumber } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ companies: [] });
    }

    const companyPromises = ids.map((id) => getCompanyByNumber(String(id)));
    const resolvedCompanies = await Promise.all(companyPromises);
    const companies = resolvedCompanies.filter((c) => c !== null);

    return NextResponse.json({ companies });
  } catch (error) {
    console.error("Error in /api/companies route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
