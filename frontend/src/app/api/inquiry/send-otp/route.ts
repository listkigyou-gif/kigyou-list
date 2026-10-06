import { NextResponse } from "next/server";
import { saveOtp } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email, locale = "ja" } = await request.json();

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ 
        error: locale === "vi" 
          ? "Địa chỉ email không hợp lệ." 
          : locale === "en" 
          ? "Invalid email address." 
          : "有効なメールアドレスを入力してください。" 
      }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save to database
    await saveOtp(cleanEmail, otp, expiresAt);

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "Kigyou List <auth@kigyoulist.com>";

    if (!resendApiKey) {
      console.log(`\n==================================================`);
      console.log(`[DEVELOPMENT] OTP generated for: ${cleanEmail}`);
      console.log(`OTP Code: ${otp}`);
      console.log(`==================================================\n`);
      return NextResponse.json({ 
        success: true, 
        simulated: true,
        message: locale === "vi" 
          ? "Mã xác thực (môi trường dev): " + otp 
          : "認証コード（開発環境）: " + otp 
      });
    }

    let subject = `【kigyou-list】認証コード: ${otp}`;
    let htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0;">Kigyou<span style="color: #2563eb;">-list</span></h1>
          <p style="font-size: 13px; color: #64748b; margin-top: 4px;">企業情報ポータル 認証確認</p>
        </div>

        <p style="font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
          kigyou-listをご利用いただきありがとうございます。<br />
          企業情報の変更または掲載取り下げ手続きを進めるための認証コードです。
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <div style="font-size: 11px; font-weight: bold; letter-spacing: 1px; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">認証コード (6桁)</div>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #2563eb; font-family: monospace;">${otp}</div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 8px;">※有効期限: 10分間</div>
        </div>

        <p style="font-size: 12px; color: #64748b; line-height: 1.6; margin-bottom: 24px;">
          本コードを画面の入力フォームに入力して手続きを完了してください。<br />
          もし心当たりがない場合は、このメールを破棄してください。
        </p>

        <hr style="border: none; border-top: 1px solid #f1f5f9; margin-bottom: 16px;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
          © kigyou-list.com All Rights Reserved.
        </p>
      </div>
    `;

    if (locale === "vi") {
      subject = `[kigyou-list] Mã xác thực OTP: ${otp}`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0;">Kigyou<span style="color: #2563eb;">-list</span></h1>
            <p style="font-size: 13px; color: #64748b; margin-top: 4px;">Xác thực yêu cầu thông tin doanh nghiệp</p>
          </div>

          <p style="font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
            Cảm ơn bạn đã sử dụng kigyou-list.<br />
            Đây là mã xác thực OTP để tiến hành chỉnh sửa hoặc ẩn thông tin doanh nghiệp:
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <div style="font-size: 11px; font-weight: bold; letter-spacing: 1px; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Mã OTP (6 chữ số)</div>
            <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #2563eb; font-family: monospace;">${otp}</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 8px;">※ Có hiệu lực trong 10 phút</div>
          </div>

          <p style="font-size: 12px; color: #64748b; line-height: 1.6; margin-bottom: 24px;">
            Vui lòng nhập mã này vào khung xác nhận trên website. Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email.
          </p>

          <hr style="border: none; border-top: 1px solid #f1f5f9; margin-bottom: 16px;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
            © kigyou-list.com All Rights Reserved.
          </p>
        </div>
      `;
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: cleanEmail,
        subject: subject,
        html: htmlContent,
      }),
    });

    if (!emailRes.ok) {
      const errorText = await emailRes.text();
      console.error("Resend API error sending OTP:", errorText);
      return NextResponse.json({ 
        error: locale === "vi" 
          ? "Không thể gửi email qua Resend. Vui lòng thử lại sau." 
          : "認証コードの送信に失敗しました。時間をおいて再試行してください。" 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: locale === "vi" 
        ? "Mã xác thực đã được gửi đến email của bạn." 
        : "認証コードをメール宛に送信しました。" 
    });
  } catch (error) {
    console.error("Error in /api/inquiry/send-otp:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
