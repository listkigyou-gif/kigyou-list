import { NextResponse } from "next/server";
import { getAdminActionLogs } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const logs = await getAdminActionLogs();
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error("Error in /api/admin/logs GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
