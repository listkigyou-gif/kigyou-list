import { NextResponse } from "next/server";
import { getAllPayments } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const payments = await getAllPayments();
    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Error in /api/admin/payments GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
