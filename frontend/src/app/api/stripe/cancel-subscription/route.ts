import { NextResponse } from "next/server";
import { getUserQuota, cancelUserSubscriptionInDb } from "@/lib/db";
import { auth } from "@/auth";

export async function POST() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const email = session.user.email;

    const quota = await getUserQuota(email);
    if (!quota) {
      return NextResponse.json({ error: "User quota record not found" }, { status: 404 });
    }

    const subId = quota.stripe_subscription_id;
    const stripeSecret = process.env.STRIPE_SECRET_KEY;

    if (stripeSecret && subId && !subId.startsWith("sim_")) {
      // Production cancellation via Stripe
      try {
        const StripeLib = require("stripe");
        const stripe = new StripeLib(stripeSecret, {
          apiVersion: "2023-10-16"
        });

        // Cancel the subscription in Stripe immediately
        await stripe.subscriptions.cancel(subId);
        
        // Also cancel it in database immediately (since the webhook customer.subscription.deleted might fire slightly after,
        // doing it in DB now ensures immediate feedback for the user)
        await cancelUserSubscriptionInDb(email);

        return NextResponse.json({
          success: true,
          message: "Subscription successfully cancelled in Stripe and downgraded locally."
        });
      } catch (stripeErr: any) {
        console.error("Failed to cancel subscription on Stripe, falling back to local DB cancel:", stripeErr);
        // Fallback to local database cancellation anyway so user doesn't get blocked
        await cancelUserSubscriptionInDb(email);
        return NextResponse.json({
          success: true,
          message: "Subscription downgraded locally (Stripe refund/cancel error)."
        });
      }
    } else {
      // Simulation mode cancellation (or no active stripe key)
      console.log(`[Stripe Simulator] Cancelling subscription for ${email} (sub ID: ${subId})`);
      await cancelUserSubscriptionInDb(email);
      return NextResponse.json({
        success: true,
        message: "Subscription successfully cancelled (Simulated)."
      });
    }

  } catch (error) {
    console.error("Error in cancel-subscription route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
