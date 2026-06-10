import { NextResponse } from "next/server";
import { getPaymentRecordById, getUserBillingInfo } from "@/lib/db";
import { getFileFromR2 } from "@/lib/r2";
import { isAdmin } from "@/lib/adminAuth";
import { auth } from "@/auth";
import { generateInvoiceHtml } from "@/app/api/stripe/webhook/route";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing required parameter: id" }, { status: 400 });
    }

    const isRequesterAdmin = isAdmin(request);
    let sessionEmail: string | null = null;

    if (!isRequesterAdmin) {
      const session = await auth();
      if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      sessionEmail = session.user.email.toLowerCase();
    }

    const record = await getPaymentRecordById(id);
    if (!record) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const normalizedRecordEmail = record.user_email.toLowerCase();

    if (!isRequesterAdmin && sessionEmail !== normalizedRecordEmail) {
      return NextResponse.json({ error: "Unauthorized access to invoice" }, { status: 403 });
    }

    // Try to render dynamically first
    try {
      const billing = await getUserBillingInfo(record.user_email);
      
      let priceName = "";
      const packId = record.pack_id || "custom";
      if (packId === "pro" || packId === "business" || packId === "enterprise") {
        priceName = `${packId.toUpperCase()}プラン (月額サブスクリプション)`;
      } else if (packId === "10k") {
        priceName = "CSV 10k行ダウンロード容量";
      } else if (packId === "50k") {
        priceName = "CSV 50k行ダウンロード容量";
      } else if (packId === "100k") {
        priceName = "CSV 100k行ダウンロード容量";
      } else {
        priceName = `CSV ${record.lines_added.toLocaleString()}行ダウンロード容量`;
      }

      // Convert DB date (which might be standard string) into Japanese Date format
      const formattedDate = new Intl.DateTimeFormat('ja-JP', { dateStyle: 'long' }).format(new Date(record.created_at));
      const taxExclusivePrice = Math.round(record.amount_jpy / 1.1);
      const taxAmount = record.amount_jpy - taxExclusivePrice;

      const htmlInvoice = generateInvoiceHtml({
        email: record.user_email,
        paymentId: record.id,
        formattedDate,
        priceJpy: record.amount_jpy,
        priceName,
        linesAdded: record.lines_added,
        taxExclusivePrice,
        taxAmount,
        billingName: billing?.billing_name || undefined,
        billingAddress: billing?.billing_address || undefined,
        billingTaxId: billing?.billing_tax_id || undefined,
        billingPhone: billing?.billing_phone || undefined
      });

      return new Response(htmlInvoice, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename="invoice_${id}.html"`,
        },
      });
    } catch (dynamicErr) {
      console.warn("Failed to generate dynamic invoice, falling back to R2:", dynamicErr);
      
      if (!record.invoice_url) {
        return NextResponse.json({ error: "Invoice file not generated yet" }, { status: 404 });
      }

      // Extract storage key from invoice_url (remove r2:// or local://)
      const key = record.invoice_url.replace(/^(r2:\/\/|local:\/\/)/, "");
      
      const fileBuffer = await getFileFromR2(key);
      if (!fileBuffer) {
        return NextResponse.json({ error: "Invoice file not found in storage" }, { status: 404 });
      }

      return new Response(new Uint8Array(fileBuffer), {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename="invoice_${id}.html"`,
        },
      });
    }

  } catch (error) {
    console.error("Error in /api/stripe/invoice route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
