import { NextResponse } from "next/server";
import { getUserQuota } from "@/lib/db";
import { auth } from "@/auth";


export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const email = session.user.email;
    const { planId, packId, couponCode, couponDiscount } = await request.json();
    
    // Extract IP and UA for logging in payment history
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";

    if (!planId && !packId) {
      return NextResponse.json({ error: "Plan ID or Pack ID is required" }, { status: 400 });
    }

    // Define subscription pricing and quota mappings
    let listPrice = 0;
    let priceJpy = 0;
    let allowance = 0;
    let priceName = "";
    let isSubscription = true;

    if (planId) {
      isSubscription = true;
      switch (planId) {
        case "pro":
          listPrice = 4200;
          allowance = 2000;
          priceName = "PROプラン (月額サブスクリプション)";
          priceJpy = 2900; // campaign default
          break;
        case "business":
          listPrice = 14000;
          allowance = 10000;
          priceName = "BUSINESSプラン (月額サブスクリプション)";
          priceJpy = 9800; // campaign default
          break;
        case "enterprise":
          listPrice = 42000; // ~42,000 JPY
          allowance = 40000;
          priceName = "ENTERPRISEプラン (月額サブスクリプション)";
          priceJpy = 29000; // campaign default
          break;
        default:
          return NextResponse.json({ error: "Invalid planId parameter" }, { status: 400 });
      }
    } else if (packId) {
      isSubscription = false;
      
      const quota = await getUserQuota(email);
      if (quota.plan === "free" || quota.plan === "trial") {
        return NextResponse.json(
          { error: "追加パッケージの購入は、PROプラン以上の有料プランをご契約中のお客様のみご利用いただけます。" },
          { status: 400 }
        );
      }

      switch (packId) {
        case "10k":
          priceJpy = 14800;
          allowance = 10000;
          priceName = "CSV 10k行ダウンロード容量 (追加パッケージ)";
          break;
        case "50k":
          priceJpy = 49800;
          allowance = 50000;
          priceName = "CSV 50k行ダウンロード容量 (追加パッケージ)";
          break;
        case "100k":
          priceJpy = 79800;
          allowance = 100000;
          priceName = "CSV 100k行ダウンロード容量 (追加パッケージ)";
          break;
        default:
          return NextResponse.json({ error: "Invalid packId parameter" }, { status: 400 });
      }
    }

    const campaignCouponId = process.env.STRIPE_CAMPAIGN_COUPON_ID;
    let activeCouponId: string | undefined = undefined;

    // Apply coupon discount if applicable (only for subscription plans)
    if (isSubscription) {
      if (couponCode && couponDiscount) {
        const discountVal = Number(couponDiscount);
        if (!isNaN(discountVal) && discountVal > 0 && discountVal <= 100) {
          priceJpy = Math.floor(listPrice * (1 - discountVal / 100));
          priceName = `${priceName} [クーポン ${discountCodeInfo(couponCode)} 適用]`;
        }
      } else if (campaignCouponId) {
        // If campaign coupon is configured, set recurring subscription price to standard list price
        // and apply the coupon so Stripe charges campaign price for month 1 and standard list price afterwards.
        priceJpy = listPrice;
        activeCouponId = campaignCouponId;
        priceName = `${priceName} [初月キャンペーン割引適用]`;
      }
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Helper to format coupon names in product descriptions
    function discountCodeInfo(code: string): string {
      return code.toUpperCase();
    }

    // =============================================================
    // STRIPE SIMULATION MODE (Offline fallback)
    // =============================================================
    if (!stripeSecret) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Stripe configuration error: missing live keys in production." }, { status: 500 });
      }
      
      if (isSubscription) {
        // Calculate simulated discounted price for first month mock record
        let simulatedAmountJpy = priceJpy;
        if (activeCouponId) {
          if (planId === "pro") simulatedAmountJpy = 2900;
          else if (planId === "business") simulatedAmountJpy = 9800;
          else if (planId === "enterprise") simulatedAmountJpy = 29000;
        }
        console.log(`[Stripe Simulator] Creating subscription checkout for ${email} - plan: ${planId} (¥${simulatedAmountJpy}/mo first month, standard: ¥${listPrice}/mo)`);
        const mockSuccessUrl = `${appUrl}/dashboard?stripe_success=true&email=${encodeURIComponent(email)}&plan=${planId}&amount_jpy=${simulatedAmountJpy}&allowance=${allowance}&couponCode=${encodeURIComponent(couponCode || "")}`;
        return NextResponse.json({ 
          url: mockSuccessUrl,
          simulated: true 
        });
      } else {
        console.log(`[Stripe Simulator] Creating one-time pack checkout for ${email} - pack: ${packId} (¥${priceJpy})`);
        const mockSuccessUrl = `${appUrl}/dashboard?stripe_success=true&pack=${packId}&amount=${allowance}&email=${encodeURIComponent(email)}`;
        return NextResponse.json({
          url: mockSuccessUrl,
          simulated: true
        });
      }
    }

    // =============================================================
    // STRIPE LIVE PRODUCTION MODE
    // =============================================================
    try {
      const StripeLib = require("stripe");
      const stripe = new StripeLib(stripeSecret, {
        apiVersion: "2023-10-16"
      });

      const sessionData: any = {
        payment_method_types: ["card"],
        // consent_collection: {
        //   terms_of_service: "required",
        // },
        line_items: [
          {
            price_data: {
              currency: "jpy",
              product_data: {
                name: priceName,
                description: isSubscription 
                  ? `Kigyou-list 月額プラン購読 (+毎月 ${allowance.toLocaleString()} 行 CSV枠)`
                  : `Kigyou-list 追加容量パッケージ (+${allowance.toLocaleString()} 行 CSV枠)`,
              },
              unit_amount: priceJpy,
            },
            quantity: 1,
          },
        ],
        mode: isSubscription ? "subscription" : "payment",
        customer_email: email,
        metadata: {
          email,
          allowance: String(allowance),
          ip_address: ipAddress,
          user_agent: userAgent.slice(0, 480)
        },
        success_url: `${appUrl}/dashboard?stripe_success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: isSubscription 
          ? `${appUrl}/pricing?stripe_cancel=true`
          : `${appUrl}/search?stripe_cancel=true`,
      };
      if (isSubscription) {
        sessionData.line_items[0].price_data.recurring = {
          interval: "month",
        };
        sessionData.metadata.planId = planId;
        sessionData.metadata.couponCode = couponCode || "";
        if (activeCouponId) {
          sessionData.discounts = [{ coupon: activeCouponId }];
        }
      } else {
        sessionData.metadata.packId = packId;
        sessionData.metadata.amount = String(allowance);
      }

      const session = await stripe.checkout.sessions.create(sessionData);

      return NextResponse.json({ url: session.url, simulated: false });
    } catch (stripeErr: any) {
      console.error("Failed to run Stripe Checkout Mode, falling back to Simulation:", stripeErr);
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Stripe checkout session creation failed." }, { status: 500 });
      }
      
      let simulatedAmountJpy = priceJpy;
      if (isSubscription && activeCouponId) {
        if (planId === "pro") simulatedAmountJpy = 2900;
        else if (planId === "business") simulatedAmountJpy = 9800;
        else if (planId === "enterprise") simulatedAmountJpy = 29000;
      }
      const mockSuccessUrl = isSubscription
        ? `${appUrl}/dashboard?stripe_success=true&email=${encodeURIComponent(email)}&plan=${planId}&amount_jpy=${simulatedAmountJpy}&allowance=${allowance}&couponCode=${encodeURIComponent(couponCode || "")}`
        : `${appUrl}/dashboard?stripe_success=true&pack=${packId}&amount=${allowance}&email=${encodeURIComponent(email)}`;

      return NextResponse.json({ 
        url: mockSuccessUrl,
        simulated: true,
        error: stripeErr.message || String(stripeErr)
      });
    }

  } catch (error) {
    console.error("Error in /api/stripe/checkout route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
