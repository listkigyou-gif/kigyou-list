import { NextResponse } from "next/server";
import { verifyCoupon } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { code, email } = await request.json();

    if (!code) {
      return NextResponse.json({ valid: false, error: "クーポンコードを入力してください。" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ valid: false, error: "クーポンのご利用にはログインが必要です。" }, { status: 401 });
    }

    const verification = await verifyCoupon(code, email);
    
    return NextResponse.json(verification);
  } catch (error) {
    console.error("Error in /api/coupon/verify route:", error);
    return NextResponse.json({ valid: false, error: "Internal Server Error" }, { status: 500 });
  }
}
