import { NextResponse } from "next/server";
import { getAllUsers } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error in /api/admin/users GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
