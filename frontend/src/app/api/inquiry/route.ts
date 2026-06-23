import { NextResponse } from "next/server";
import { createInquiry, checkRateLimit } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { corporate_number, company_name, type, requester_email, person_in_charge, mobile_number, message, website_url, turnstileToken } = await request.json();

    // 1. Honeypot check
    // If 'website_url' is filled, it's a bot. Silently pretend success.
    if (website_url) {
      return NextResponse.json({ success: true, message: "お問い合わせの送信が完了しました。順次対応いたします。" });
    }

    // 2. Extract IP and Rate Limit
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0] : "unknown_ip";
    
    if (ip !== "unknown_ip") {
      const allowed = await checkRateLimit(ip);
      if (!allowed) {
        return NextResponse.json({ error: "24時間以内に送信できる上限数を超えました。しばらく経ってから再度お試しください。" }, { status: 429 });
      }
    }

    // 3. Validation
    if (!corporate_number || !company_name || !type || !requester_email || !person_in_charge || !mobile_number || !message) {
      return NextResponse.json({ error: "必須項目をご入力ください。" }, { status: 400 });
    }

    // Validate corporate number format (exactly 13 digits)
    if (!/^\d{13}$/.test(corporate_number)) {
      return NextResponse.json({ error: "法人番号は13桁の半角数字で入力してください。" }, { status: 400 });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requester_email)) {
      return NextResponse.json({ error: "有効なメールアドレスを入力してください。" }, { status: 400 });
    }

    // Validate inquiry type
    if (type !== "hide" && type !== "update") {
      return NextResponse.json({ error: "お問い合わせ種別が正しくありません。" }, { status: 400 });
    }

    // Verify Cloudflare Turnstile CAPTCHA if configured
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
      if (!turnstileToken) {
        return NextResponse.json({ error: "スパム対策の認証を完了してください。" }, { status: 400 });
      }
      const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: turnstileSecret,
          response: turnstileToken,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        console.error("Turnstile verification failed in inquiry:", verifyData);
        return NextResponse.json({ error: "スパム対策の認証に失敗しました。ページを更新して再度お試しください。" }, { status: 400 });
      }
    }

    const success = await createInquiry(corporate_number, company_name, type, requester_email, person_in_charge, mobile_number, message, ip);
    
    if (success) {
      // NOTE: Security Upgrades: Automatic hiding has been removed to prevent unauthorized company opt-outs.
      // Inquiries must now be manually reviewed and approved (hidden) by an admin in the Admin Dashboard (/admin).
      return NextResponse.json({ success: true, message: "お問い合わせの送信が完了しました。順次対応いたします。" });
    } else {
      return NextResponse.json({ error: "お問い合わせの送信中にエラーが発生しました。" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in /api/inquiry POST:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
