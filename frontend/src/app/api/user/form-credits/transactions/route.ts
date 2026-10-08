import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserCreditTransactions } from "@/lib/formCampaigns";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const email = session?.user?.email || request.headers.get("x-user-email");
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "100")));

    const transactions = await getUserCreditTransactions(email, limit);
    return NextResponse.json({
      success: true,
      transactions
    });
  } catch (err: any) {
    console.error("Error in GET /api/user/form-credits/transactions:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
