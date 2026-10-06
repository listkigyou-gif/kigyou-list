import { NextResponse } from "next/server";
import { 
  addUserAddOnBalance, 
  createPaymentRecord, 
  updateUserSubscription, 
  getUserQuotaBySubscriptionId, 
  resetUserQuotaUsage, 
  cancelUserSubscriptionBySubId,
  suspendUserQuotaInDb,
  getUserBillingInfo,
  redeemCoupon
} from "@/lib/db";
import { uploadFileToR2 } from "@/lib/r2";
import { generateInvoiceHtml } from "@/lib/invoice";

export async function POST(request: Request) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // Extract IP and UA for simulated checkout webhook calls
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";

    // Detect if this is a Simulated Mock Credit request from frontend checkout simulation
    let bodyText = "";
    try {
      bodyText = await request.text();
    } catch {
      return NextResponse.json({ error: "Empty request body" }, { status: 400 });
    }

    let isSimulated = false;
    let email = "";
    let amount = 0;
    let simulatedJson: any = null;

    try {
      const json = JSON.parse(bodyText);
      if (json.simulated === true) {
        isSimulated = true;
        simulatedJson = json;
        email = json.email;
        amount = Number(json.amount || 0);
      }
    } catch {
      // Not JSON, probably standard Stripe raw signature payload
    }

    // =============================================================
    // HANDLE SIMULATION / DEVELOPER CREDIT REDEMPTION & SUBSCRIPTIONS
    // =============================================================
    if (isSimulated) {
      if (process.env.NODE_ENV !== "development") {
        console.warn(`[Stripe Webhook] Rejected simulation request outside development mode for ${email}`);
        return NextResponse.json({ error: "Simulation mode is disabled outside development environment" }, { status: 403 });
      }

      if (!email) {
        return NextResponse.json({ error: "Invalid simulation data: email is required" }, { status: 400 });
      }

      if (simulatedJson?.type === "dispute_created" || simulatedJson?.type === "refunded") {
        console.log(`[Stripe Simulator Webhook] Suspending user ${email} due to simulated ${simulatedJson.type}`);
        await suspendUserQuotaInDb(email);
        return NextResponse.json({
          success: true,
          message: `Successfully simulated suspension for ${email}.`
        });
      } else if (simulatedJson?.type === "subscription_created") {
        const plan = simulatedJson.plan;
        const amountJpy = Number(simulatedJson.amount_jpy || 0);
        const allowance = Number(simulatedJson.allowance || 0);

        console.log(`[Stripe Simulator Webhook] Upgrading email ${email} to subscription: ${plan} (allowance: ${allowance})`);
        
        const customerId = `sim_cus_${Math.random().toString(36).substring(2, 7)}`;
        const subscriptionId = `sim_sub_${Math.random().toString(36).substring(2, 7)}`;
        
        await updateUserSubscription(email, customerId, subscriptionId, plan, allowance, 'active');

        const paymentId = `sim_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const formattedDate = new Intl.DateTimeFormat('ja-JP', { dateStyle: 'long' }).format(new Date());
        const taxExclusivePrice = Math.round(amountJpy / 1.1);
        const taxAmount = amountJpy - taxExclusivePrice;
        const priceName = `${plan.toUpperCase()}プラン (月額サブスクリプション - シミュレーション)`;
        const billing = await getUserBillingInfo(email);

        const htmlInvoice = generateInvoiceHtml({
          email,
          paymentId,
          formattedDate,
          priceJpy: amountJpy,
          priceName,
          linesAdded: allowance,
          taxExclusivePrice,
          taxAmount,
          billingName: billing?.billing_name || undefined,
          billingAddress: billing?.billing_address || undefined,
          billingTaxId: billing?.billing_tax_id || undefined,
          billingPhone: billing?.billing_phone || undefined
        });

        const invoiceKey = `invoices/inv_${paymentId}.html`;
        const invoiceUrl = await uploadFileToR2(invoiceKey, htmlInvoice, "text/html");

        await createPaymentRecord(paymentId, email, plan, amountJpy, allowance, 'completed', invoiceUrl, ipAddress, userAgent);

        return NextResponse.json({
          success: true,
          message: `Successfully simulated ${plan.toUpperCase()} subscription for ${email}.`
        });
      } else {
        if (isNaN(amount) || amount <= 0) {
          return NextResponse.json({ error: "Invalid simulation data" }, { status: 400 });
        }

        console.log(`[Stripe Simulator Webhook] Crediting email ${email} with +${amount} lines`);
        await addUserAddOnBalance(email, amount);

        // Determine JPY price and package ID
        let packId = "custom";
        let priceJpy = 0;
        let priceName = "";
        if (amount === 10000) {
          packId = "10k";
          priceJpy = 14800;
          priceName = "CSV 10k行ダウンロード容量";
        } else if (amount === 50000) {
          packId = "50k";
          priceJpy = 49800;
          priceName = "CSV 50k行ダウンロード容量";
        } else if (amount === 100000) {
          packId = "100k";
          priceJpy = 79800;
          priceName = "CSV 100k行ダウンロード容量";
        } else {
          packId = "custom";
          priceJpy = Math.round(amount * 1.0);
          priceName = `CSV ${amount.toLocaleString()}行ダウンロード容量`;
        }

        const paymentId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const formattedDate = new Intl.DateTimeFormat('ja-JP', { dateStyle: 'long' }).format(new Date());
        const taxExclusivePrice = Math.round(priceJpy / 1.1);
        const taxAmount = priceJpy - taxExclusivePrice;
        const billing = await getUserBillingInfo(email);

        const htmlInvoice = generateInvoiceHtml({
          email,
          paymentId,
          formattedDate,
          priceJpy,
          priceName,
          linesAdded: amount,
          taxExclusivePrice,
          taxAmount,
          billingName: billing?.billing_name || undefined,
          billingAddress: billing?.billing_address || undefined,
          billingTaxId: billing?.billing_tax_id || undefined,
          billingPhone: billing?.billing_phone || undefined
        });

        const invoiceKey = `invoices/inv_${paymentId}.html`;
        const invoiceUrl = await uploadFileToR2(invoiceKey, htmlInvoice, "text/html");

        await createPaymentRecord(paymentId, email, packId, priceJpy, amount, 'completed', invoiceUrl, ipAddress, userAgent);
        
        return NextResponse.json({ 
          success: true, 
          message: `Successfully credited +${amount.toLocaleString()} lines to ${email} (Simulated).` 
        });
      }
    }

    // =============================================================
    // HANDLE REAL STRIPE WEBHOOK
    // =============================================================
    if (!stripeSecret) {
      return NextResponse.json({ error: "Stripe is in simulation mode" }, { status: 400 });
    }

    const StripeLib = require("stripe");
    const stripe = new StripeLib(stripeSecret, {
      apiVersion: "2023-10-16"
    });

    const sig = request.headers.get("stripe-signature");
    if (!sig || !webhookSecret) {
      return NextResponse.json({ error: "Missing stripe-signature or webhook secret" }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(bodyText, sig, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed:`, err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const metadata = session.metadata;

      if (metadata && metadata.email) {
        const userEmail = metadata.email;
        const paymentId = session.id;
        const priceJpy = session.amount_total || 0;
        const sessionIp = metadata.ip_address || null;
        const sessionUa = metadata.user_agent || null;

        if (session.mode === "subscription") {
          const planId = metadata.planId;
          const allowance = Number(metadata.allowance || 0);
          const stripeSubscriptionId = session.subscription as string;
          const stripeCustomerId = session.customer as string;

          console.log(`[Stripe Webhook] Real Subscription Checkout Completed for ${userEmail}. Plan: ${planId}`);
          
          await updateUserSubscription(
            userEmail,
            stripeCustomerId,
            stripeSubscriptionId,
            planId,
            allowance,
            'active'
          );

          if (metadata && metadata.couponCode) {
            try {
              console.log(`[Stripe Webhook] Redeeming coupon ${metadata.couponCode} for ${userEmail}`);
              await redeemCoupon(metadata.couponCode, userEmail);
            } catch (couponErr) {
              console.error(`[Stripe Webhook] Failed to redeem coupon ${metadata.couponCode}:`, couponErr);
            }
          }

          const formattedDate = new Intl.DateTimeFormat('ja-JP', { dateStyle: 'long' }).format(new Date());
          const taxExclusivePrice = Math.round(priceJpy / 1.1);
          const taxAmount = priceJpy - taxExclusivePrice;
          const priceName = `${planId.toUpperCase()}プラン (月額サブスクリプション)`;
          const billing = await getUserBillingInfo(userEmail);

          const htmlInvoice = generateInvoiceHtml({
            email: userEmail,
            paymentId,
            formattedDate,
            priceJpy,
            priceName,
            linesAdded: allowance,
            taxExclusivePrice,
            taxAmount,
            billingName: billing?.billing_name || undefined,
            billingAddress: billing?.billing_address || undefined,
            billingTaxId: billing?.billing_tax_id || undefined,
            billingPhone: billing?.billing_phone || undefined
          });

          const invoiceKey = `invoices/inv_${paymentId}.html`;
          const invoiceUrl = await uploadFileToR2(invoiceKey, htmlInvoice, "text/html");

          await createPaymentRecord(paymentId, userEmail, planId, priceJpy, allowance, 'completed', invoiceUrl, sessionIp, sessionUa);
        } else if (metadata.amount) {
          const addOnLines = Number(metadata.amount);
          const packId = metadata.packId || "custom";
          
          let priceName = "";
          if (packId === "10k") priceName = "CSV 10k行ダウンロード容量";
          else if (packId === "50k") priceName = "CSV 50k行ダウンロード容量";
          else if (packId === "100k") priceName = "CSV 100k行ダウンロード容量";
          else priceName = `CSV ${addOnLines.toLocaleString()}行ダウンロード容量`;

          console.log(`[Stripe Webhook] Real Payment Received. Crediting ${userEmail} with +${addOnLines} lines`);
          await addUserAddOnBalance(userEmail, addOnLines);

          const formattedDate = new Intl.DateTimeFormat('ja-JP', { dateStyle: 'long' }).format(new Date());
          const taxExclusivePrice = Math.round(priceJpy / 1.1);
          const taxAmount = priceJpy - taxExclusivePrice;
          const billing = await getUserBillingInfo(userEmail);

          const htmlInvoice = generateInvoiceHtml({
            email: userEmail,
            paymentId,
            formattedDate,
            priceJpy,
            priceName,
            linesAdded: addOnLines,
            taxExclusivePrice,
            taxAmount,
            billingName: billing?.billing_name || undefined,
            billingAddress: billing?.billing_address || undefined,
            billingTaxId: billing?.billing_tax_id || undefined,
            billingPhone: billing?.billing_phone || undefined
          });

          const invoiceKey = `invoices/inv_${paymentId}.html`;
          const invoiceUrl = await uploadFileToR2(invoiceKey, htmlInvoice, "text/html");

          await createPaymentRecord(paymentId, userEmail, packId, priceJpy, addOnLines, 'completed', invoiceUrl, sessionIp, sessionUa);
        }
      }
    } 
    // Handle charge refund event
    else if (event.type === "charge.refunded") {
      const charge = event.data.object;
      const paymentIntentId = charge.payment_intent as string;
      console.log(`[Stripe Webhook] charge.refunded event received for charge ${charge.id}`);
      
      let userEmail = charge.billing_details?.email || charge.metadata?.email;
      
      // If we don't have user email, try to retrieve payment intent to check its metadata
      if (!userEmail && paymentIntentId) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          userEmail = paymentIntent.metadata?.email;
        } catch (err) {
          console.error(`Failed to retrieve payment intent ${paymentIntentId} metadata:`, err);
        }
      }
      
      if (userEmail) {
        console.log(`[Stripe Webhook] Suspending user ${userEmail} due to refund.`);
        await suspendUserQuotaInDb(userEmail);
      } else {
        console.warn(`[Stripe Webhook] Could not resolve user email for charge.refunded event ${charge.id}`);
      }
    }
    // Handle charge dispute created (chargeback)
    else if (event.type === "charge.dispute.created") {
      const dispute = event.data.object;
      const paymentIntentId = dispute.payment_intent as string;
      const chargeId = dispute.charge as string;
      console.log(`[Stripe Webhook] charge.dispute.created event received for dispute ${dispute.id}`);
      
      let userEmail = dispute.metadata?.email;
      
      // If not in dispute metadata, try to retrieve the payment intent to find user email
      if (!userEmail && paymentIntentId) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          userEmail = paymentIntent.metadata?.email;
        } catch (err) {
          console.error(`Failed to retrieve payment intent ${paymentIntentId} metadata for dispute:`, err);
        }
      }
      
      // If still not found, try to retrieve the charge to find user email
      if (!userEmail && chargeId) {
        try {
          const charge = await stripe.charges.retrieve(chargeId);
          userEmail = charge.billing_details?.email || charge.metadata?.email;
        } catch (err) {
          console.error(`Failed to retrieve charge ${chargeId} metadata for dispute:`, err);
        }
      }
      
      if (userEmail) {
        console.log(`[Stripe Webhook] Suspending user ${userEmail} due to dispute.`);
        await suspendUserQuotaInDb(userEmail);
      } else {
        console.warn(`[Stripe Webhook] Could not resolve user email for charge.dispute.created event ${dispute.id}`);
      }
    }
    // Handle subscription renewal event (monthly recurring billing)
    else if (event.type === "invoice.paid") {
      const invoice = event.data.object;
      const stripeSubscriptionId = invoice.subscription as string;
      
      if (stripeSubscriptionId) {
        const quota = await getUserQuotaBySubscriptionId(stripeSubscriptionId);
        if (quota) {
          console.log(`[Stripe Webhook] Subscription renewed (invoice.paid). Resetting usage for ${quota.user_email}`);
          await resetUserQuotaUsage(quota.user_email);
          
          const userEmail = quota.user_email;
          const paymentId = invoice.id || `inv_${Date.now()}`;
          const priceJpy = invoice.amount_paid || 0;
          const allowance = quota.monthly_base_allowance;
          const planId = quota.plan || 'pro';
          
          const formattedDate = new Intl.DateTimeFormat('ja-JP', { dateStyle: 'long' }).format(new Date());
          const taxExclusivePrice = Math.round(priceJpy / 1.1);
          const taxAmount = priceJpy - taxExclusivePrice;
          const priceName = `${planId.toUpperCase()}プラン (月額サブスクリプション更新)`;
          const billing = await getUserBillingInfo(userEmail);

          const htmlInvoice = generateInvoiceHtml({
            email: userEmail,
            paymentId,
            formattedDate,
            priceJpy,
            priceName,
            linesAdded: allowance,
            taxExclusivePrice,
            taxAmount,
            billingName: billing?.billing_name || undefined,
            billingAddress: billing?.billing_address || undefined,
            billingTaxId: billing?.billing_tax_id || undefined,
            billingPhone: billing?.billing_phone || undefined
          });

          const invoiceKey = `invoices/inv_${paymentId}.html`;
          const invoiceUrl = await uploadFileToR2(invoiceKey, htmlInvoice, "text/html");

          await createPaymentRecord(paymentId, userEmail, planId, priceJpy, allowance, 'completed', invoiceUrl);
        }
      }
    }
    // Handle customer subscription deletion (expired/cancelled)
    else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const stripeSubscriptionId = subscription.id as string;
      
      if (stripeSubscriptionId) {
        console.log(`[Stripe Webhook] Subscription deleted. Downgrading sub ID: ${stripeSubscriptionId}`);
        await cancelUserSubscriptionBySubId(stripeSubscriptionId);
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Error in Stripe Webhook route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
