import { NextResponse } from "next/server";
import { getInquiries } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const inquiries = await getInquiries();
    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error("Error in /api/admin/inquiries GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
