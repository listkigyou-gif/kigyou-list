import { NextResponse } from "next/server";
import { saveMagicLinkToken, checkMagicLinkRateLimit } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email, locale = "ja" } = await request.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Rate Limit Checks
    const rateCheck = await checkMagicLinkRateLimit(email);
    if (!rateCheck.allowed) {
      const errorMsg = rateCheck.reason === "RATE_LIMIT_60S"
        ? (locale === "vi" ? "Vui lòng đợi 60 giây trước khi yêu cầu lại liên kết đăng nhập." : locale === "en" ? "Please wait 60 seconds before requesting another login link." : "ログインリンクを再要求する前に60秒お待ちください。")
        : (locale === "vi" ? "Bạn đã vượt quá giới hạn gửi liên kết (tối đa 3 lần mỗi 24 giờ). Vui lòng thử lại sau." : locale === "en" ? "You have exceeded the maximum email limit (3 times per 24 hours). Please try again later." : "メール送信の最大制限（24時間以内で3回）を超えました。後ほどもう一度お試しください。");
      return NextResponse.json({ error: errorMsg }, { status: 429 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    await saveMagicLinkToken(email, token, expiresAt);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verifyUrl = `${appUrl}/${locale}/login/verify?token=${token}&email=${encodeURIComponent(email)}`;

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.log(`\n==================================================`);
      console.log(`[DEVELOPMENT] Magic Link generated for: ${email}`);
      console.log(`URL: ${verifyUrl}`);
      console.log(`==================================================\n`);
      
      if (process.env.NODE_ENV !== "production") {
        return NextResponse.json({ success: true, simulated: true, url: verifyUrl });
      }
      return NextResponse.json({ error: "Email service is not configured." }, { status: 500 });
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    
    let subject = "【kigyou-list】ログインリンク";
    let bodyHtml = `
      <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="font-size: 20px; font-weight: bold; color: #0f172a; margin-bottom: 16px;">kigyou-list にログイン</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 24px;">
          以下のボタンをクリックして、kigyou-listにログインしてください。このリンクの有効期限は1時間です。
        </p>
        <a href="${verifyUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 8px; margin-bottom: 24px;">ログインする</a>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
        <p style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
          もしこのメールを要求していない場合は、無視してください。
        </p>
      </div>
    `;

    if (locale === "vi") {
      subject = "[kigyou-list] Đường dẫn đăng nhập";
      bodyHtml = `
        <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="font-size: 20px; font-weight: bold; color: #0f172a; margin-bottom: 16px;">Đăng nhập vào kigyou-list</h2>
          <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 24px;">
            Vui lòng nhấn vào nút bên dưới để đăng nhập vào tài khoản kigyou-list của bạn. Đường dẫn này sẽ hết hạn sau 1 giờ.
          </p>
          <a href="${verifyUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 8px; margin-bottom: 24px;">Đăng nhập ngay</a>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
          <p style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
            Nếu bạn không yêu cầu liên kết này, bạn có thể bỏ qua email này một cách an toàn.
          </p>
        </div>
      `;
    } else if (locale === "en") {
      subject = "[kigyou-list] Magic Sign-in Link";
      bodyHtml = `
        <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="font-size: 20px; font-weight: bold; color: #0f172a; margin-bottom: 16px;">Sign in to kigyou-list</h2>
          <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 24px;">
            Please click the button below to sign in to your kigyou-list account. This link will expire in 1 hour.
          </p>
          <a href="${verifyUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 8px; margin-bottom: 24px;">Sign In</a>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
          <p style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
            If you did not request this link, you can safely ignore this email.
          </p>
        </div>
      `;
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: subject,
        html: bodyHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      return NextResponse.json({ error: "Failed to send email via Resend" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error in send-magic-link API:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
