import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { saveOtp } from '@/lib/db';
import { sendEmailViaResend } from '@/lib/marketing';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.co.jp',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'outlook.jp',
  'icloud.com',
  'me.com',
  'ybb.ne.jp',
  'nifty.com',
  'ocn.ne.jp',
  'plala.or.jp',
  'so-net.ne.jp',
  'biglobe.ne.jp',
  'docomo.ne.jp',
  'ezweb.ne.jp',
  'softbank.ne.jp',
]);

function cleanDomain(input: string): string {
  try {
    let raw = input.trim().toLowerCase();
    if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
      raw = 'http://' + raw;
    }
    const url = new URL(raw);
    let host = url.hostname.toLowerCase();
    if (host.startsWith('www.')) {
      host = host.slice(4);
    }
    return host;
  } catch {
    return input.trim().toLowerCase().replace(/^www\./, '');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { corporate_number, website_url, email, locale = 'ja' } = body;
    const isJa = locale === 'ja';

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: isJa ? '有効なメールアドレスをご入力ください。' : 'Email không hợp lệ.' },
        { status: 400 }
      );
    }

    const emailDomain = email.split('@')[1]?.toLowerCase().trim();
    if (!emailDomain) {
      return NextResponse.json(
        { error: isJa ? 'メールアドレスの形式が正しくありません。' : 'Định dạng email không đúng.' },
        { status: 400 }
      );
    }

    // 1. If public/free email provider, reject instant domain match and guide to Document/Meishi method
    if (PUBLIC_EMAIL_DOMAINS.has(emailDomain)) {
      return NextResponse.json(
        {
          error: isJa
            ? 'フリーメール（@gmail.com等）やプロバイダメールはWEBドメイン即時認証の対象外です。「名刺・書類審査」タブより申請をお願いいたします。'
            : 'Email cá nhân / nhà mạng (@gmail.com...) không thể xác thực tự động theo tên miền web. Vui lòng chuyển sang phương thức "Xét duyệt bằng Danh thiếp / Giấy tờ".',
          is_generic_email: true,
        },
        { status: 400 }
      );
    }

    if (!website_url || !website_url.trim()) {
      return NextResponse.json(
        {
          error: isJa
            ? '企業の公式サイトURLをご入力ください。'
            : 'Vui lòng nhập URL website chính thức của doanh nghiệp.',
        },
        { status: 400 }
      );
    }

    const webDomain = cleanDomain(website_url);

    // Check domain match (exact match or subdomain match: e.g. mail.toyota.co.jp matches toyota.co.jp)
    const isDomainMatched =
      emailDomain === webDomain ||
      emailDomain.endsWith('.' + webDomain) ||
      webDomain.endsWith('.' + emailDomain);

    if (!isDomainMatched) {
      return NextResponse.json(
        {
          error: isJa
            ? `メールのドメイン（@${emailDomain}）とWEBサイトのドメイン（${webDomain}）が一致しません。ドメイン一致のメールをご利用いただくか、「名刺・書類審査」より申請してください。`
            : `Tên miền email (@${emailDomain}) không trùng khớp với tên miền website (${webDomain}). Vui lòng nhập email theo tên miền công ty hoặc dùng phương thức "Xét duyệt bằng Danh thiếp".`,
          is_mismatched: true,
        },
        { status: 400 }
      );
    }

    // Check company existence
    const client = await pool.connect();
    let companyName = 'ご担当企業';
    try {
      const compRes = await client.query(
        `SELECT company_name, is_claimed, claimed_by_email FROM companies WHERE corporate_number = $1`,
        [corporate_number]
      );
      if (compRes.rows.length > 0) {
        companyName = compRes.rows[0].company_name;
        if (compRes.rows[0].is_claimed && compRes.rows[0].claimed_by_email?.toLowerCase() !== email.toLowerCase()) {
          return NextResponse.json(
            {
              error: isJa
                ? 'この企業ページは既に他の公式担当者により認証済みです。管理者変更をご希望の場合は事務局までご連絡ください。'
                : 'Hồ sơ doanh nghiệp này đã được xác minh bởi một đại diện khác.',
            },
            { status: 409 }
          );
        }
      }
    } finally {
      client.release();
    }

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const saved = await saveOtp(email, otpCode);
    if (!saved) {
      return NextResponse.json(
        { error: isJa ? '認証コードの発行に失敗しました。' : 'Không thể tạo mã OTP.' },
        { status: 500 }
      );
    }

    // Send OTP via Resend
    const otpHtml = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #059669; font-size: 20px; margin: 0;">⚡ 企業ドメイン認証コード</h1>
          <p style="color: #64748b; font-size: 13px; margin-top: 6px;">Kigyou-List 公式企業ポータル</p>
        </div>

        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          <strong>${companyName}</strong><br>
          公式ご担当者様
        </p>

        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          貴社WEBドメイン（<strong>${webDomain}</strong>）に基づく本人認証コードを発行いたしました。<br>
          画面に戻り、下記の6桁の認証コードを入力して認証を完了してください。
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <div style="display: inline-block; padding: 14px 32px; background-color: #f1f5f9; border: 2px dashed #059669; border-radius: 12px; font-size: 28px; font-weight: 900; letter-spacing: 6px; color: #0f172a; font-family: monospace;">
            ${otpCode}
          </div>
          <p style="color: #64748b; font-size: 12px; margin-top: 8px;">※有効期限: 10分間</p>
        </div>

        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 14px; border-radius: 8px; font-size: 12px; color: #065f46; line-height: 1.6;">
          <strong>🎁 認証完了の限定特典：</strong><br>
          認証完了後、貴社アカウントの毎日の企業リスト無料ダウンロード枠が<strong>20件 → 50件/日（月間1,500件）</strong>に自動アップグレードされます。
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 11px; color: #94a3b8; margin: 0;">
          Kigyou-List 運営事務局<br>
          ※本メールに心当たりがない場合は破棄してください。
        </p>
      </div>
    `;

    await sendEmailViaResend({
      to: email.trim(),
      subject: `【Kigyou-List】企業ドメイン認証コード（${otpCode}）のご案内`,
      html: otpHtml,
    });

    return NextResponse.json({
      success: true,
      matched_domain: webDomain,
      message: isJa
        ? `企業ドメイン（@${emailDomain}）宛に6桁の認証コードを送信しました。`
        : `Đã gửi mã xác thực 6 số đến email công ty (@${emailDomain}).`,
    });
  } catch (error: any) {
    console.error('Error in /api/companies/verify-domain POST:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
