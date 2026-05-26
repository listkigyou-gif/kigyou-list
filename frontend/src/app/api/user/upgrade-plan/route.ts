import { NextResponse } from "next/server";
import { updateUserPlanQuota, redeemCoupon } from "@/lib/db";

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "This debug endpoint is disabled outside of local development mode." },
        { status: 403 }
      );
    }

    const { email, plan, couponCode } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!plan) {
      return NextResponse.json({ error: "Plan name is required" }, { status: 400 });
    }

    let allowance = 10;
    switch (plan) {
      case "free":
        allowance = 10;
        break;
      case "pro":
        allowance = 2000;
        break;
      case "business":
        allowance = 10000;
        break;
      case "enterprise":
        allowance = 40000;
        break;
      default:
        return NextResponse.json({ error: "Invalid plan name" }, { status: 400 });
    }

    // Optional: if a coupon code is provided, redeem it
    if (couponCode) {
      const redeemed = await redeemCoupon(couponCode, email);
      if (!redeemed) {
        // We log but don't strictly fail the upgrade if it's a simulated environment,
        // however, in a real environment we would reject payment.
        console.warn(`Coupon redemption failed for ${email} with code ${couponCode}`);
      }
    }

    const success = await updateUserPlanQuota(email, allowance, plan);

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: `Plan upgraded to ${plan} successfully.`,
        allowance: allowance 
      });
    } else {
      return NextResponse.json({ error: "Failed to update quota in database" }, { status: 550 });
    }

  } catch (error) {
    console.error("Error in /api/user/upgrade-plan route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
