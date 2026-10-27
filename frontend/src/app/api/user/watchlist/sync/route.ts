import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncUserWatchlist, getUserWatchlist } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const body = await request.json().catch(() => ({}));
    const clientNumbers: string[] = Array.isArray(body.corporateNumbers) ? body.corporateNumbers : [];

    const mergedList = await syncUserWatchlist(email, clientNumbers);

    return NextResponse.json({
      success: true,
      email,
      watchlist: mergedList,
      count: mergedList.length,
    });
  } catch (error: any) {
    console.error("Error in /api/user/watchlist/sync POST:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const watchlist = await getUserWatchlist(email);

    return NextResponse.json({
      success: true,
      email,
      watchlist,
      count: watchlist.length,
    });
  } catch (error: any) {
    console.error("Error in /api/user/watchlist/sync GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
