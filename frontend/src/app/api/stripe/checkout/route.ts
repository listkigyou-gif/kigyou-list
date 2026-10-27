import { NextResponse } from "next/server";
import { getUserQuota, isFirstTimeSubscriber, isFirstTimeFormBuyer } from "@/lib/db";
import { verifyClientIp, verifyClientEmail, isPaymentInCooldown } from "@/lib/securityGuard";
import { auth } from "@/auth";


export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const email = session.user.email;
    const { planId, packId, formPlanId, couponCode, couponDiscount } = await request.json();
    
    // Extract IP and UA for logging in payment history
    const ipAddress = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";

    // Security Check: Fraudulent email domain or IP blacklist
    const emailCheck = await verifyClientEmail(email);
    if (emailCheck.blocked) {
      console.warn(`[Security Guard] Blocked checkout creation for suspicious email: ${email} (${emailCheck.reason})`);
      return NextResponse.json({ error: "不正なアカウントまたは利用できないメールアドレスです。" }, { status: 403 });
    }

    const ipCheck = await verifyClientIp(ipAddress);
    if (ipCheck.blocked) {
      console.warn(`[Security Guard] Blocked checkout creation from banned IP: ${ipAddress} (${ipCheck.reason}) for email: ${email}`);
      return NextResponse.json({ error: "セキュリティ上の理由により、このIPからの決済手続きは制限されています。" }, { status: 403 });
    }

    // Cooldown Check: Repeated failure on single card / account
    const cooldownCheck = isPaymentInCooldown(email);
    if (cooldownCheck.inCooldown) {
      return NextResponse.json({ 
        error: `決済の試行回数が一時的に上限に達しました。セキュリティ保護のため、約 ${cooldownCheck.remainingMinutes} 分後に再度お試しいただくか、カード会社にお問い合わせください。` 
      }, { status: 429 });
    }

    if (!planId && !packId && !formPlanId) {
      return NextResponse.json({ error: "Plan ID, Pack ID, or Form Plan ID is required" }, { status: 400 });
    }

    // Define subscription pricing and quota mappings
    let listPrice = 0;
    let priceJpy = 0;
    let allowance = 0;
    let priceName = "";
    let isSubscription = true;
    let isFirstTimeForm = false;

    if (planId) {
      isSubscription = true;
      switch (planId) {
        case "pro":
          listPrice = 4200;
          allowance = 2000;
          priceName = "PROプラン (月額サブスクリプション)";
          priceJpy = 4200; // Standard list price
          break;
        case "business":
          listPrice = 14000;
          allowance = 10000;
          priceName = "BUSINESSプラン (月額サブスクリプション)";
          priceJpy = 14000; // Standard list price
          break;
        case "enterprise":
          listPrice = 42000; // ~42,000 JPY
          allowance = 40000;
          priceName = "ENTERPRISEプラン (月額サブスクリプション)";
          priceJpy = 42000; // Standard list price
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
      }
    } else if (formPlanId) {
      isSubscription = false;
      isFirstTimeForm = await isFirstTimeFormBuyer(email);
      let discountedPrice = 0;

      switch (formPlanId) {
        case "form_1k":
          listPrice = 28000;
          discountedPrice = 8400; // 70% OFF
          allowance = 1000;
          break;
        case "form_3k":
          listPrice = 69000;
          discountedPrice = 20700; // 70% OFF
          allowance = 3000;
          break;
        case "form_5k":
          listPrice = 99000;
          discountedPrice = 29700; // 70% OFF
          allowance = 5000;
          break;
        default:
          return NextResponse.json({ error: "Invalid formPlanId parameter" }, { status: 400 });
      }

      if (isFirstTimeForm) {
        priceJpy = discountedPrice;
        priceName = `問い合わせフォーム営業 ${allowance.toLocaleString()}件配信枠 [初回限定70%OFF]`;
      } else {
        priceJpy = listPrice;
        priceName = `問い合わせフォーム営業 ${allowance.toLocaleString()}件配信枠 (通常価格)`;
      }
    }

    const isFirstTime = isSubscription ? await isFirstTimeSubscriber(email) : false;
    const campaignCouponId = process.env.STRIPE_CAMPAIGN_COUPON_ID || "FIRST_MONTH_70_OFF";
    let activeCouponId: string | undefined = undefined;

    // Apply coupon discount if applicable (only for subscription plans)
    if (isSubscription) {
      if (couponCode && couponDiscount) {
        const discountVal = Number(couponDiscount);
        if (!isNaN(discountVal) && discountVal > 0 && discountVal <= 100) {
          priceJpy = Math.floor(listPrice * (1 - discountVal / 100));
          priceName = `${priceName} [クーポン ${discountCodeInfo(couponCode)} 適用]`;
        }
      } else if (isFirstTime && campaignCouponId) {
        // First-time subscriber: apply 70% OFF coupon for the first month
        // In Stripe Subscription mode, unit_amount stays listPrice and Stripe applies 70% off for month 1 only
        priceJpy = listPrice;
        activeCouponId = campaignCouponId;
        priceName = `${priceName} [新規登録・初月70%OFF適用]`;
      } else {
        // Returning/previous subscriber: standard list price
        priceJpy = listPrice;
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
        // Calculate simulated discounted price for first month mock record (70% OFF if first-time)
        let simulatedAmountJpy = isFirstTime ? Math.floor(listPrice * 0.3) : listPrice;
        if (couponCode && couponDiscount) {
          const discountVal = Number(couponDiscount);
          if (!isNaN(discountVal) && discountVal > 0 && discountVal <= 100) {
            simulatedAmountJpy = Math.floor(listPrice * (1 - discountVal / 100));
          }
        }
        console.log(`[Stripe Simulator] Creating subscription checkout for ${email} - plan: ${planId} (¥${simulatedAmountJpy} first month, standard: ¥${listPrice}/mo, isFirstTime: ${isFirstTime})`);
        const mockSuccessUrl = `${appUrl}/dashboard?stripe_success=true&email=${encodeURIComponent(email)}&plan=${planId}&amount_jpy=${simulatedAmountJpy}&allowance=${allowance}&couponCode=${encodeURIComponent(couponCode || "")}`;
        return NextResponse.json({ 
          url: mockSuccessUrl,
          simulated: true 
        });
      } else if (formPlanId) {
        console.log(`[Stripe Simulator] Creating Form DM checkout for ${email} - formPlan: ${formPlanId} (¥${priceJpy})`);
        const mockSuccessUrl = `${appUrl}/dashboard?tab=formCampaigns&stripe_success=true&formPlanId=${formPlanId}&allowance=${allowance}&email=${encodeURIComponent(email)}&amount_jpy=${priceJpy}`;
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
        payment_method_options: {
          card: {
            request_three_d_secure: "any",
          },
        },
        line_items: [
          {
            price_data: {
              currency: "jpy",
              product_data: {
                name: priceName,
                description: formPlanId
                  ? `Kigyou-list 問い合わせフォーム営業配信枠 (+${allowance.toLocaleString()} 件送信枠)`
                  : isSubscription 
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
        success_url: formPlanId
          ? `${appUrl}/dashboard?tab=formCampaigns&stripe_success=true&session_id={CHECKOUT_SESSION_ID}`
          : `${appUrl}/dashboard?stripe_success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: formPlanId
          ? `${appUrl}/pricing?tab=form&stripe_cancel=true`
          : isSubscription 
          ? `${appUrl}/pricing?stripe_cancel=true`
          : `${appUrl}/search?stripe_cancel=true`,
      };
      if (isSubscription) {
        sessionData.line_items[0].price_data.recurring = {
          interval: "month",
        };
        sessionData.subscription_data = {
          metadata: {
            ip_address: ipAddress,
            email: email,
          },
        };
        sessionData.metadata.planId = planId;
        sessionData.metadata.couponCode = couponCode || "";
        if (activeCouponId) {
          sessionData.discounts = [{ coupon: activeCouponId }];
        }
      } else if (formPlanId) {
        sessionData.payment_intent_data = {
          metadata: {
            ip_address: ipAddress,
            email: email,
          },
        };
        sessionData.metadata.formPlanId = formPlanId;
        sessionData.metadata.formAllowance = String(allowance);
        sessionData.metadata.isFirstTime = String(isFirstTimeForm);
      } else {
        sessionData.payment_intent_data = {
          metadata: {
            ip_address: ipAddress,
            email: email,
          },
        };
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
      
      let simulatedAmountJpy = isSubscription && isFirstTime && activeCouponId ? Math.floor(listPrice * 0.3) : priceJpy;
      if (isSubscription && couponCode && couponDiscount) {
        const discountVal = Number(couponDiscount);
        if (!isNaN(discountVal) && discountVal > 0 && discountVal <= 100) {
          simulatedAmountJpy = Math.floor(listPrice * (1 - discountVal / 100));
        }
      }
      const mockSuccessUrl = formPlanId
        ? `${appUrl}/dashboard?tab=formCampaigns&stripe_success=true&formPlanId=${formPlanId}&allowance=${allowance}&email=${encodeURIComponent(email)}&amount_jpy=${priceJpy}`
        : isSubscription
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
