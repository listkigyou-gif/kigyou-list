import { NextResponse } from "next/server";
import { getIndustriesHierarchy } from "@/lib/db";

export async function GET() {
  try {
    const hierarchy = await getIndustriesHierarchy();
    return NextResponse.json(hierarchy, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error fetching industries hierarchy metadata:", error);
    return NextResponse.json({ error: "Failed to fetch industries hierarchy" }, { status: 500 });
  }
}
