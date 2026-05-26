import { NextResponse } from "next/server";
import { getExportJobs } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const adminEmail = request.headers.get("x-admin-email") || "";
    const isRequesterAdmin = isAdmin(request);

    if (adminEmail && adminEmail.toLowerCase() !== email.toLowerCase() && !isRequesterAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const jobs = await getExportJobs(email);
    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    console.error("Error in /api/export/jobs GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
