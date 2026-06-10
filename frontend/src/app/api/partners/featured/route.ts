import { NextResponse } from "next/server";
import { getFeaturedPartners } from "@/lib/db";

export const revalidate = 600; // Cache for 10 minutes

export async function GET() {
  try {
    const partners = await getFeaturedPartners();
    return NextResponse.json({ success: true, partners });
  } catch (error) {
    console.error("Error in GET /api/partners/featured:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
