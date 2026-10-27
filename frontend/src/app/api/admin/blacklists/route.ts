import { NextResponse } from "next/server";
import { getAllBlacklists, addBlacklistEntry, deleteBlacklistEntry } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";
import { invalidateBlacklistCache } from "@/lib/securityGuard";

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const items = await getAllBlacklists();
    const now = Date.now();

    const formatted = items.map((item) => {
      let isExpired = false;
      let remainingText = "永久 (無期限)";

      if (item.expires_at) {
        const expTime = new Date(item.expires_at).getTime();
        const diffMs = expTime - now;
        if (diffMs <= 0) {
          isExpired = true;
          remainingText = "期限切れ";
        } else {
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          if (diffHours >= 24) {
            const days = Math.floor(diffHours / 24);
            const remHours = diffHours % 24;
            remainingText = `残り ${days}日${remHours}時間`;
          } else {
            remainingText = `残り ${diffHours}時間${diffMins}分`;
          }
        }
      }

      return {
        ...item,
        is_expired: isExpired,
        remaining_text: remainingText,
      };
    });

    return NextResponse.json({ success: true, blacklists: formatted });
  } catch (error: any) {
    console.error("Error in /api/admin/blacklists GET:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { type, target, reason, durationHours } = await request.json();

    if (!type || !target) {
      return NextResponse.json({ error: "Type and Target are required" }, { status: 400 });
    }

    if (!["ip", "email_domain", "email"].includes(type)) {
      return NextResponse.json({ error: "Invalid type. Must be ip, email_domain, or email" }, { status: 400 });
    }

    const adminEmail = request.headers.get("x-admin-email") || "admin";
    const duration = typeof durationHours === "number" ? durationHours : (type === "ip" ? 48 : 0);

    const success = await addBlacklistEntry(type, target, reason, duration, adminEmail);
    if (!success) {
      return NextResponse.json({ error: "Failed to add blacklist entry" }, { status: 500 });
    }

    // Invalidate security cache
    invalidateBlacklistCache();

    return NextResponse.json({ success: true, message: "Blacklist entry added successfully" });
  } catch (error: any) {
    console.error("Error in /api/admin/blacklists POST:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "Valid ID is required" }, { status: 400 });
    }

    const success = await deleteBlacklistEntry(Number(id));
    if (!success) {
      return NextResponse.json({ error: "Failed to delete blacklist entry" }, { status: 500 });
    }

    // Invalidate security cache
    invalidateBlacklistCache();

    return NextResponse.json({ success: true, message: "Blacklist entry released successfully" });
  } catch (error: any) {
    console.error("Error in /api/admin/blacklists DELETE:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
