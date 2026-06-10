import { NextResponse } from "next/server";
import { 
  addUserAddOnBalance, 
  createPaymentRecord, 
  updateUserSubscription, 
  getUserQuotaBySubscriptionId, 
  resetUserQuotaUsage, 
  cancelUserSubscriptionBySubId,
  suspendUserQuotaInDb,
  getUserBillingInfo
} from "@/lib/db";
import { uploadFileToR2 } from "@/lib/r2";

export function generateInvoiceHtml(params: {
  email: string;
  paymentId: string;
  formattedDate: string;
  priceJpy: number;
  priceName: string;
  linesAdded: number;
  taxExclusivePrice: number;
  taxAmount: number;
  billingName?: string;
  billingAddress?: string;
  billingTaxId?: string;
  billingPhone?: string;
}) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <title>領収書 / インボイス</title>
  <link rel="icon" href="/icon.svg" type="image/svg+xml" />
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif;
      color: #333;
      margin: 0;
      padding: 40px;
      background-color: #f9f9f9;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid #eaeaea;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0066cc;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      color: #0066cc;
      font-weight: 700;
    }
    .company-details {
      text-align: right;
      font-size: 14px;
      line-height: 1.6;
    }
    .title-reg {
      font-size: 12px;
      color: #666;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 40px;
    }
    .meta-box h3 {
      margin: 0 0 10px 0;
      font-size: 16px;
      color: #555;
      border-left: 4px solid #0066cc;
      padding-left: 8px;
    }
    .meta-box p {
      margin: 4px 0;
      font-size: 14px;
    }
    .total-display {
      background: #f4f8fc;
      border: 1px solid #d2e4f6;
      padding: 20px;
      border-radius: 6px;
      text-align: center;
      margin-bottom: 35px;
    }
    .total-label {
      font-size: 16px;
      color: #555;
      margin-bottom: 5px;
    }
    .total-amount {
      font-size: 32px;
      font-weight: bold;
      color: #0066cc;
    }
    .item-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .item-table th {
      background: #f5f5f5;
      border-bottom: 2px solid #ddd;
      padding: 12px;
      text-align: left;
      font-size: 14px;
      font-weight: 600;
    }
    .item-table td {
      border-bottom: 1px solid #eee;
      padding: 12px;
      font-size: 14px;
    }
    .item-table th.num, .item-table td.num {
      text-align: right;
    }
    .tax-breakdown {
      width: 50%;
      margin-left: auto;
      border-collapse: collapse;
      margin-bottom: 40px;
    }
    .tax-breakdown td {
      padding: 8px 12px;
      font-size: 14px;
    }
    .tax-breakdown td.label {
      text-align: right;
      color: #666;
    }
    .tax-breakdown td.val {
      text-align: right;
      font-weight: 600;
    }
    .footer-note {
      font-size: 12px;
      color: #777;
      text-align: center;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
    .no-print {
      margin-bottom: 20px;
      text-align: right;
    }
    .print-btn {
      background-color: #0066cc;
      color: #fff;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: background 0.2s;
    }
    .print-btn:hover {
      background-color: #0052a3;
    }
    @media print {
      body {
        background-color: #fff;
        padding: 0;
      }
      .invoice-card {
        box-shadow: none;
        border: none;
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="print-btn" onclick="window.print()">このページを印刷する</button>
  </div>
  <div class="invoice-card">
    <div class="header">
      <div>
        <h1>領収書</h1>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">適格請求書（インボイス）</p>
      </div>
      <div class="company-details">
        <strong>Kigiyou-List (TQC株式会社)</strong><br>
        〒171-0022 東京都豊島区南池袋２丁目３３－６ 佐藤ビル３F<br>
        TEL / FAX: (03) 6907-1219 / (03) 6701-2399<br>
        登録番号: T4013301048678<br>
        EMAIL: info@kigyoulist.com<br>
        website: kigyoulist.com
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <h3>宛先</h3>
        <p><strong>${params.billingName ? params.billingName : `${params.email} 様`}</strong></p>
        ${params.billingAddress ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #555;">${params.billingAddress}</p>` : '<p>※ご登録のメールアドレス</p>'}
        ${params.billingPhone ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #555;">TEL: ${params.billingPhone}</p>` : ''}
        ${params.billingTaxId ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #555;">登録番号: ${params.billingTaxId}</p>` : ''}
      </div>
      <div class="meta-box" style="text-align: right;">
        <h3>詳細</h3>
        <p>領収書番号: ${params.paymentId}</p>
        <p>発行日: ${params.formattedDate}</p>
        <p>お支払い方法: クレジットカード</p>
      </div>
    </div>

    <div class="total-display">
      <div class="total-label">領収金額（税込）</div>
      <div class="total-amount">¥${params.priceJpy.toLocaleString()}-</div>
    </div>

    <table class="item-table">
      <thead>
        <tr>
          <th>品名 / サービス名</th>
          <th class="num">単価 (税抜)</th>
          <th class="num">数量</th>
          <th class="num">金額 (税込)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${params.priceName} (+${params.linesAdded.toLocaleString()} 行)</td>
          <td class="num">¥${params.taxExclusivePrice.toLocaleString()}</td>
          <td class="num">1</td>
          <td class="num">¥${params.priceJpy.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <table class="tax-breakdown">
      <tr>
        <td class="label">10%対象額 (税抜)</td>
        <td class="val">¥${params.taxExclusivePrice.toLocaleString()}</td>
      </tr>
      <tr>
        <td class="label">消費税 (10%)</td>
        <td class="val">¥${params.taxAmount.toLocaleString()}</td>
      </tr>
      <tr style="border-top: 1px solid #ddd; font-size: 16px;">
        <td class="label" style="font-weight: bold;">合計金額 (税込)</td>
        <td class="val" style="font-weight: bold; color: #0066cc;">¥${params.priceJpy.toLocaleString()}</td>
      </tr>
    </table>

    <div class="footer-note">
      <p>上記の通り領収いたしました。ご利用ありがとうございます。</p>
      <p style="margin-top: 10px; color: #999;">Kigiyou-List - Easy B2B Leads Extraction Tool</p>
    </div>
  </div>
</body>
</html>`;
}

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
