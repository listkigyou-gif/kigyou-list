import { NextResponse } from "next/server";
import { deductUserQuota } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const email = session.user.email;
    const { count } = await request.json();

    if (typeof count !== "number" || count <= 0 || count > 100000) {
      return NextResponse.json({ error: "Invalid count parameter" }, { status: 400 });
    }

    const deducted = await deductUserQuota(email, count);
    if (!deducted) {
      return NextResponse.json({ error: "insufficient_quota" }, { status: 403 });
    }

    return NextResponse.json({ success: true, deducted: count });
  } catch (error) {
    console.error("Error in /api/export/quota-deduct:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
