import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveUserBillingInfo, getUserBillingInfo } from "@/lib/db";
import { uploadFileToR2 } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const formData = await request.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "ファイルがアップロードされていません。" }, { status: 400 });
    }

    // Validate size (500KB limit)
    if (file.size > 500 * 1024) {
      return NextResponse.json({ error: "ファイルサイズは500KB以下にしてください。" }, { status: 400 });
    }

    // Validate type (PNG, JPEG, JPG, SVG)
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "PNG, JPG, SVG形式の画像のみアップロード可能です。" }, { status: 400 });
    }

    // Determine extension
    let ext = "png";
    if (file.type === "image/svg+xml") {
      ext = "svg";
    } else if (file.type === "image/jpeg" || file.type === "image/jpg") {
      ext = "jpg";
    }

    // Generate safe filename using safe email format
    const safeEmail = email.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `logo_${safeEmail}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Write file to R2 or local storage fallback
    const key = `uploads/logos/${filename}`;
    await uploadFileToR2(key, buffer, file.type);

    const logoUrl = `/api/uploads/logos/${filename}`;

    // Load current billing info to preserve existing values
    const currentBilling = await getUserBillingInfo(email);
    const billingInfo = {
      user_email: email,
      billing_name: currentBilling?.billing_name || "",
      billing_address: currentBilling?.billing_address || "",
      billing_tax_id: currentBilling?.billing_tax_id || "",
      billing_phone: currentBilling?.billing_phone || "",
      logo_url: logoUrl,
      is_featured_partner: currentBilling?.is_featured_partner || false,
    };

    const success = await saveUserBillingInfo(billingInfo);

    if (success) {
      return NextResponse.json({
        success: true,
        logoUrl: logoUrl
      });
    } else {
      return NextResponse.json({ error: "データベースの更新に失敗しました。" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in POST /api/user/billing-info/upload-logo:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
