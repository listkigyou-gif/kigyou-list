import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { sendEmailViaResend } from '@/lib/marketing';
import { verifyOtp } from '@/lib/db';
import { auth } from '@/auth';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const session = await auth();
    const sessionEmail = session?.user?.email?.toLowerCase().trim();

    const body = await request.json();
    const {
      corporate_number,
      company_name,
      email,
      applicant_name,
      applicant_phone,
      department,
      document_url,
      document_type = 'business_card',
      otp_code,
      notes,
      pr_title,
      pr_message,
      locale = 'ja',
    } = body;

    const isJa = locale === 'ja';
    const isVi = locale === 'vi';

    if (!sessionEmail) {
      return NextResponse.json(
        {
          error: isJa
            ? '企業公式オーナー認証の申請には、アカウントへのログイン（または無料登録）が必要です。'
            : isVi
            ? 'Vui lòng đăng nhập tài khoản để thực hiện gửi yêu cầu xác minh doanh nghiệp.'
            : 'Authentication required. Please log in to claim this company.',
        },
        { status: 401 }
      );
    }

    if (!corporate_number || corporate_number.length !== 13) {
      return NextResponse.json(
        { error: isJa ? '有効な法人番号（13桁）を指定してください。' : isVi ? 'Mã số pháp nhân không hợp lệ (13 số).' : 'Invalid corporate number (13 digits).' },
        { status: 400 }
      );
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: isJa ? '有効なメールアドレスを入力してください。' : isVi ? 'Email không hợp lệ.' : 'Invalid email address.' },
        { status: 400 }
      );
    }

    if (!applicant_name || !applicant_name.trim()) {
      return NextResponse.json(
        { error: isJa ? '申請者のお名前をご入力ください。' : isVi ? 'Vui lòng nhập họ tên người nộp đơn.' : 'Applicant name is required.' },
        { status: 400 }
      );
    }

    let finalDocumentUrl: string | null = null;

    // Branch 1: Domain Email Match (Fast-track)
    if (document_type === 'domain_email') {
      if (!otp_code || !otp_code.trim()) {
        return NextResponse.json(
          { error: isJa ? 'メールに届いた6桁の認証コード（OTP）をご入力ください。' : isVi ? 'Vui lòng nhập mã OTP 6 số gửi đến email.' : 'Please enter the 6-digit OTP code.' },
          { status: 400 }
        );
      }

      const isValidOtp = await verifyOtp(email.trim().toLowerCase(), otp_code.trim());
      if (!isValidOtp) {
        return NextResponse.json(
          { error: isJa ? '認証コードが無効または有効期限（10分）切れです。' : isVi ? 'Mã OTP không chính xác hoặc đã hết hạn.' : 'Invalid or expired OTP code.' },
          { status: 400 }
        );
      }
      finalDocumentUrl = 'DOMAIN_EMAIL_VERIFIED';
    } else {
      // Branch 2: Document Verification (Business Card / Registry Document / Employee ID)
      if (!document_url) {
        return NextResponse.json(
          {
            error: isJa
              ? '名刺または登記簿謄本等の証明書類（画像・PDF）を添付してください。'
              : isVi
              ? 'Vui lòng đính kèm hình ảnh Danh thiếp (名刺) hoặc giấy tờ chứng minh doanh nghiệp.'
              : 'Please attach a business card or official registry document.',
          },
          { status: 400 }
        );
      }
      finalDocumentUrl = document_url;
    }

    // 1. Fetch company details
    const compRes = await client.query(
      `SELECT company_name, is_claimed, claimed_by_email FROM companies WHERE corporate_number = $1`,
      [corporate_number]
    );

    const actualCompanyName = compRes.rows[0]?.company_name || company_name || '対象企業';

    // 2. Check if already claimed by someone else
    if (compRes.rows[0]?.is_claimed && compRes.rows[0]?.claimed_by_email?.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        {
          error: isJa
            ? 'この企業ページは既に他の公式担当者により認証済みです。管理者変更をご希望の場合は事務局までお問い合わせください。'
            : isVi
            ? 'Doanh nghiệp này đã được đại diện khác xác minh chính chủ.'
            : 'This company profile has already been claimed.',
        },
        { status: 409 }
      );
    }

    // 3. Insert claim request (Status: pending for 100% manual review)
    const insertRes = await client.query(
      `INSERT INTO company_claim_requests (
        corporate_number, company_name, user_email, applicant_name, applicant_phone, department,
        document_url, document_type, notes, pr_title, pr_message, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', NOW(), NOW())
      RETURNING id, created_at`,
      [
        corporate_number,
        actualCompanyName,
        email.toLowerCase().trim(),
        applicant_name.trim(),
        applicant_phone ? applicant_phone.trim() : null,
        department ? department.trim() : null,
        finalDocumentUrl,
        document_type,
        notes ? notes.trim() : null,
        pr_title ? pr_title.trim() : null,
        pr_message ? pr_message.trim() : null,
      ]
    );

    const requestId = insertRes.rows[0]?.id;

    // 4. Send Confirmation Email to applicant
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kigyoulist.com';
    const isDomainTrack = document_type === 'domain_email';

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px 24px; border: 1px solid #e2e8f0; border-radius: 14px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1B4F8A; font-size: 20px; font-weight: 800; margin: 0;">📁 企業公式認証の申請を受付いたしました</h1>
          <p style="color: #64748b; font-size: 13px; margin-top: 6px;">Kigyou-List 審査事務局</p>
        </div>

        <p style="font-size: 14px; color: #334155; line-height: 1.7;">
          <strong>${actualCompanyName}</strong><br>
          ${applicant_name} 様
        </p>

        <p style="font-size: 14px; color: #334155; line-height: 1.7;">
          この度はKigyou-Listの<strong>公式企業オーナー認証</strong>をお申し込みいただき、誠にありがとうございます。<br>
          申請内容を受領いたしました。担当スタッフにて最終確認を行い、結果をメールにてご案内いたします。
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 10px; font-size: 13px; color: #334155; margin: 20px 0; line-height: 1.8;">
          <strong>■ 申請受付概要：</strong><br>
          ・対象企業: <strong>${actualCompanyName}</strong> (法人番号: ${corporate_number})<br>
          ・申請番号: <strong>#${requestId}</strong><br>
          ・審査方式: <strong>${isDomainTrack ? '会社ドメインメール認証 (優先審査)' : '書類・名刺審査'}</strong><br>
          ・審査予定時間: <strong>${isDomainTrack ? '最短即日〜24時間以内' : '通常1〜2営業日以内'}</strong>
        </div>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 10px; font-size: 12px; color: #166534; line-height: 1.7;">
          <strong>🎁 認証完了後の公式パートナー特典：</strong><br>
          審査が承認されますと、公式認証企業バッジの付与とともに、無料企業リストダウンロード枠が<strong>1日50件（月間1,500件）</strong>に自動アップグレードされ、公式PRや採用情報の掲載が可能になります。
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 11px; color: #94a3b8; margin: 0; line-height: 1.6;">
          Kigyou-List 審査事務局<br>
          公式サイト: <a href="${appUrl}" style="color: #1B4F8A; text-decoration: none;">${appUrl}</a>
        </p>
      </div>
    `;

    sendEmailViaResend({
      to: email.trim(),
      subject: `【Kigyou-List】企業公式認証のお申込み受付完了（申請番号: #${requestId}）`,
      html: emailHtml,
    }).catch((e) => console.error('Failed to send claim request email:', e));

    return NextResponse.json({
      success: true,
      request_id: requestId,
      message: isJa
        ? (isDomainTrack 
            ? '会社ドメインメールの認証が完了し、申請を受付いたしました！事務局による最終確認後（原則当日〜24h以内）、メールにて結果をご連絡いたします。'
            : '書類審査の申請を受付いたしました。スタッフによる書類確認後（原則24時間以内）、メールにて結果をご連絡いたします。')
        : isVi
        ? 'Đã tiếp nhận yêu cầu xác minh doanh nghiệp! Kết quả thẩm định sẽ được thông báo qua email trong vòng 24 giờ.'
        : 'Your company verification request has been received. Our team will review and notify you within 24 hours.',
    });
  } catch (error: any) {
    console.error('Error in /api/companies/claim-request POST:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
