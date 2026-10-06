import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { sendEmailViaResend } from '@/lib/marketing';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
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
      notes,
      locale = 'ja',
    } = body;

    const isJa = locale === 'ja';

    if (!corporate_number || corporate_number.length !== 13) {
      return NextResponse.json(
        { error: isJa ? '有効な法人番号（13桁）を指定してください。' : 'Mã số pháp nhân không hợp lệ (13 số).' },
        { status: 400 }
      );
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: isJa ? '有効なメールアドレスを入力してください。' : 'Email không hợp lệ.' },
        { status: 400 }
      );
    }

    if (!applicant_name || !applicant_name.trim()) {
      return NextResponse.json(
        { error: isJa ? '申請者のお名前をご入力ください。' : 'Vui lòng nhập họ tên người xin xác thực.' },
        { status: 400 }
      );
    }

    if (!document_url) {
      return NextResponse.json(
        {
          error: isJa
            ? '名刺または登記簿等の証明書類（画像・PDF）を添付してください。'
            : 'Vui lòng đính kèm hình ảnh Danh thiếp (名刺) hoặc giấy tờ chứng minh doanh nghiệp.',
        },
        { status: 400 }
      );
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
            : 'Hồ sơ doanh nghiệp này đã được xác minh bởi một đại diện khác.',
        },
        { status: 409 }
      );
    }

    // 3. Insert claim request
    const insertRes = await client.query(
      `INSERT INTO company_claim_requests (
        corporate_number, company_name, user_email, applicant_name, applicant_phone, department,
        document_url, document_type, notes, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', NOW(), NOW())
      RETURNING id, created_at`,
      [
        corporate_number,
        actualCompanyName,
        email.toLowerCase().trim(),
        applicant_name.trim(),
        applicant_phone ? applicant_phone.trim() : null,
        department ? department.trim() : null,
        document_url,
        document_type,
        notes ? notes.trim() : null,
      ]
    );

    const requestId = insertRes.rows[0]?.id;

    // 4. Send Confirmation Email to applicant
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kigyoulist.com';
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0d9488; font-size: 20px; margin: 0;">📁 企業公式認証の申請を受付いたしました</h1>
          <p style="color: #64748b; font-size: 13px; margin-top: 6px;">Kigyou-List 審査事務局</p>
        </div>

        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          <strong>${actualCompanyName}</strong><br>
          ${applicant_name} 様
        </p>

        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          この度はKigyou-Listの公式企業オーナー認証（書類・名刺審査）をお申し込みいただき、誠にありがとうございます。<br>
          現在、担当スタッフにてご提出いただいた書類の確認作業を行っております。
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; font-size: 13px; color: #475569; margin: 20px 0; line-height: 1.8;">
          <strong>■ 申請情報：</strong><br>
          ・対象企業: ${actualCompanyName} (法人番号: ${corporate_number})<br>
          ・申請番号: #${requestId}<br>
          ・審査予定時間: <strong>通常24時間以内（営業日）</strong>
        </div>

        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 16px; border-radius: 8px; font-size: 12px; color: #065f46; line-height: 1.6;">
          <strong>🎁 審査完了後の特典について：</strong><br>
          審査が承認されますと、公式認証企業バッジの付与とともに、無料企業リストダウンロード枠が<strong>1日50件（月間1,500件）</strong>に自動アップグレードされます。
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 11px; color: #94a3b8; margin: 0;">
          Kigyou-List 審査事務局<br>
          公式サイト: <a href="${appUrl}" style="color: #3b82f6;">${appUrl}</a>
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
        ? '申請を受付いたしました。スタッフによる書類確認後（原則24時間以内）、メールにて結果をご連絡いたします。'
        : 'Yêu cầu xác minh bằng giấy tờ đã được gửi thành công. Kết quả sẽ được thông báo qua email trong vòng 24 giờ.',
    });
  } catch (error: any) {
    console.error('Error in /api/companies/claim-request POST:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
