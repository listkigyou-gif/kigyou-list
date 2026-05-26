import { NextResponse } from "next/server";
import { adminGetAllExportJobs } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const jobs = await adminGetAllExportJobs();
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Error in /api/admin/exports GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
