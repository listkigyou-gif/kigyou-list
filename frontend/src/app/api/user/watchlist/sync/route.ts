import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncUserWatchlist, getUserWatchlist, removeUserWatchlistCompany } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const body = await request.json().catch(() => ({}));

    // If explicit removal request
    if (body.action === "remove" && body.corporateNumber) {
      await removeUserWatchlistCompany(email, String(body.corporateNumber).trim());
      const updatedList = await getUserWatchlist(email);
      return NextResponse.json({
        success: true,
        email,
        watchlist: updatedList,
        count: updatedList.length,
      });
    }

    if (Array.isArray(body.removedNumbers)) {
      for (const num of body.removedNumbers) {
        if (num) await removeUserWatchlistCompany(email, String(num).trim());
      }
    }

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

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const { searchParams } = new URL(request.url);
    let corporateNumber = searchParams.get("corporateNumber");

    if (!corporateNumber) {
      const body = await request.json().catch(() => ({}));
      corporateNumber = body?.corporateNumber;
    }

    if (!corporateNumber) {
      return NextResponse.json({ error: "Missing corporateNumber" }, { status: 400 });
    }

    await removeUserWatchlistCompany(email, String(corporateNumber).trim());
    const updatedList = await getUserWatchlist(email);

    return NextResponse.json({
      success: true,
      email,
      removed: corporateNumber,
      watchlist: updatedList,
      count: updatedList.length,
    });
  } catch (error: any) {
    console.error("Error in /api/user/watchlist/sync DELETE:", error);
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
