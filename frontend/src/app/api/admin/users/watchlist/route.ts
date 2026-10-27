import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { adminGetUserWatchlistDetailed } from "@/lib/db";

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const companies = await adminGetUserWatchlistDetailed(email);

    return NextResponse.json({
      success: true,
      email,
      count: companies.length,
      companies,
    });
  } catch (error: any) {
    console.error("Error in /api/admin/users/watchlist GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
