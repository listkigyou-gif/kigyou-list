import { NextResponse } from "next/server";
import { getAllUsers } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

let cachedUsers: any = null;
let lastUsersFetch = 0;
const USERS_CACHE_TTL = 30 * 1000;

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "1";
    const now = Date.now();

    if (!forceRefresh && cachedUsers && (now - lastUsersFetch < USERS_CACHE_TTL)) {
      return NextResponse.json({ users: cachedUsers, cached: true });
    }

    const users = await getAllUsers();
    cachedUsers = users;
    lastUsersFetch = now;

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error in /api/admin/users GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
