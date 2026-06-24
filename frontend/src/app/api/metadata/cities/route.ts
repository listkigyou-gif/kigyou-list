import { NextResponse } from "next/server";
import { getCitiesInPrefecture } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const prefectureCode = searchParams.get("prefecture");

    if (!prefectureCode) {
      return NextResponse.json({ error: "Missing prefecture code" }, { status: 400 });
    }

    const cities = await getCitiesInPrefecture(prefectureCode);
    
    return NextResponse.json(cities);
  } catch (error) {
    console.error("Error fetching cities metadata:", error);
    return NextResponse.json({ error: "Failed to fetch cities" }, { status: 500 });
  }
}
