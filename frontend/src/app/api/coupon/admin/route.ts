import { NextResponse } from "next/server";
import { getCoupons, createCoupon } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const coupons = await getCoupons();
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("Error in /api/coupon/admin GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { code, discountPercent, maxUses, daysValid } = await request.json();

    if (!code || typeof discountPercent !== 'number' || typeof maxUses !== 'number' || typeof daysValid !== 'number') {
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
    }

    // Convert code to uppercase and remove spaces
    const cleanCode = code.toUpperCase().replace(/\s/g, '');

    const success = await createCoupon(cleanCode, discountPercent, maxUses, daysValid);
    
    if (success) {
      return NextResponse.json({ success: true, message: "クーポンコードの作成が完了しました。" });
    } else {
      return NextResponse.json({ error: "このクーポンコードは既に存在するか、エラーが発生しました。" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in /api/coupon/admin POST:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
