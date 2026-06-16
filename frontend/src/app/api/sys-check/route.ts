import { NextRequest, NextResponse } from "next/server";
import { blockIp } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = (forwarded ? forwarded.split(",")[0].trim() : "") || (realIp ? realIp.trim() : "") || "127.0.0.1";

    console.warn(`[Honeypot Triggered] IP: ${ip} accessed /api/sys-check`);

    // Blacklist the offending IP
    await blockIp(ip, "honeypot_trap");

    return NextResponse.json(
      { error: "Access Forbidden: Automated scrapping is prohibited." },
      { status: 403 }
    );
  } catch (error) {
    console.error("Error in honeypot API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
