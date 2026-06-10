import { NextResponse } from "next/server";
import { runCleanupCron } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    // Secure token checks to prevent unauthorized invocation
    const cronKey = process.env.CRON_SECRET_KEY || "kigyou_list_cleanup_secret";

    if (key !== cronKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await runCleanupCron();
    return NextResponse.json(res);
  } catch (error: any) {
    console.error("Error in /api/cron/cleanup route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
