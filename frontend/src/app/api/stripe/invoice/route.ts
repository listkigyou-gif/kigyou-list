import { NextResponse } from "next/server";
import { getPaymentRecordById } from "@/lib/db";
import { getFileFromR2 } from "@/lib/r2";
import { isAdmin } from "@/lib/adminAuth";
import { auth } from "@/auth";

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

  } catch (error) {
    console.error("Error in /api/stripe/invoice route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
