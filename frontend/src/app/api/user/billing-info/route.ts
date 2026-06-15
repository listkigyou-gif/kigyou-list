import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserBillingInfo, saveUserBillingInfo } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const billingInfo = await getUserBillingInfo(email);

    return NextResponse.json({
      success: true,
      billingInfo: billingInfo || {
        user_email: email,
        billing_name: "",
        billing_address: "",
        billing_tax_id: "",
        billing_phone: "",
        contact_person: "",
        contact_phone: ""
      }
    });
  } catch (error) {
    console.error("Error in GET /api/user/billing-info:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const { billingName, billingAddress, billingTaxId, billingPhone, logoUrl, contactPerson, contactPhone } = await request.json();

    const current = await getUserBillingInfo(email);

    const success = await saveUserBillingInfo({
      user_email: email,
      billing_name: billingName || "",
      billing_address: billingAddress || "",
      billing_tax_id: billingTaxId || "",
      billing_phone: billingPhone || "",
      logo_url: logoUrl !== undefined ? logoUrl : (current?.logo_url || null),
      is_featured_partner: current?.is_featured_partner || false,
      contact_person: contactPerson || "",
      contact_phone: contactPhone || ""
    });

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Billing information saved successfully."
      });
    } else {
      return NextResponse.json({ error: "Failed to save billing information." }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in POST /api/user/billing-info:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
