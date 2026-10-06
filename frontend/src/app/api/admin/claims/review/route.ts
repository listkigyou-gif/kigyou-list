import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { isAdmin } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/db';
import { sendEmailViaResend } from '@/lib/marketing';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { request_id, action, rejection_reason } = await request.json();

    if (!request_id || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: '無効なリクエストパラメータです。' }, { status: 400 });
    }

    const adminEmail = request.headers.get('x-admin-email') || 'admin@kigyoulist.com';
    const client = await pool.connect();

    try {
      // 1. Fetch request details
      const reqRes = await client.query(
        `SELECT * FROM company_claim_requests WHERE id = $1`,
        [request_id]
      );

      if (reqRes.rows.length === 0) {
        return NextResponse.json({ error: '指定された申請が見つかりませんでした。' }, { status: 404 });
      }

      const claimReq = reqRes.rows[0];
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kigyoulist.com';
      const companyUrl = `${appUrl}/ja/company/${claimReq.corporate_number}`;

      if (action === 'approve') {
        // A. Update company
        await client.query(
          `UPDATE companies SET
            is_claimed = TRUE,
            claimed_at = NOW(),
            claimed_by_name = $1,
            claimed_by_email = $2,
            claimed_by_phone = $3,
            claimed_by_department = $4,
            updated_at = NOW()
          WHERE corporate_number = $5`,
          [
            claimReq.applicant_name,
            claimReq.user_email.toLowerCase().trim(),
            claimReq.applicant_phone,
            claimReq.department,
            claimReq.corporate_number,
          ]
        );

        // B. Upsert into user_companies
        await client.query(
          `INSERT INTO user_companies (user_email, corporate_number, role, verification_method, verified_at, status)
           VALUES ($1, $2, 'owner', 'manual_document', NOW(), 'active')
           ON CONFLICT (corporate_number) DO UPDATE SET
             user_email = $1,
             role = 'owner',
             verification_method = 'manual_document',
             verified_at = NOW(),
             status = 'active'`,
          [claimReq.user_email.toLowerCase().trim(), claimReq.corporate_number]
        );

        // C. Upgrade quota to 50 rows/day for free plan
        try {
          await client.query(
            `UPDATE user_export_quotas SET monthly_base_allowance = 50 WHERE LOWER(user_email) = LOWER($1) AND plan = 'free'`,
            [claimReq.user_email.toLowerCase().trim()]
          );
        } catch (ignore) {}

        // D. Incentive bonus 100 quota balance
        try {
          await client.query(
            `UPDATE users SET purchased_add_on_balance = purchased_add_on_balance + 100 WHERE LOWER(user_email) = LOWER($1)`,
            [claimReq.user_email.toLowerCase().trim()]
          );
        } catch (ignore) {}

        // E. Update claim request record
        await client.query(
          `UPDATE company_claim_requests SET status = 'approved', reviewed_by = $1, reviewed_at = NOW(), updated_at = NOW() WHERE id = $2`,
          [adminEmail, request_id]
        );

        // F. Send approval notification email
        const approvalHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #059669; font-size: 20px; margin: 0;">🎉 【審査承認】公式企業認証が完了いたしました</h1>
              <p style="color: #64748b; font-size: 13px; margin-top: 6px;">Kigyou-List 審査事務局</p>
            </div>

            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              <strong>${claimReq.company_name}</strong><br>
              ${claimReq.applicant_name} 様
            </p>

            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              ご提出いただきました書類の確認が完了し、<strong>公式オーナー認証を正式に承認いたしました。</strong><br>
              貴社公式ページに<strong>「公式認証企業バッジ」</strong>が付与され、企業プロファイル管理機能をご利用いただけます。
            </p>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${companyUrl}" style="background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                認証済み公式ページを確認する →
              </a>
            </div>

            <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 16px; border-radius: 8px; font-size: 13px; color: #065f46; line-height: 1.7;">
              <strong>🎁 公式パートナー特典が有効化されました：</strong><br>
              ・毎日の企業リスト無料ダウンロード枠：<strong>20件 → 50件/日（月間1,500件）</strong>にアップグレード<br>
              ・自社PRメッセージ・代表連絡先の掲載<br>
              ・ボーナス枠100件の付与完了
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 11px; color: #94a3b8; margin: 0;">
              Kigyou-List 審査事務局<br>
              公式サイト: <a href="${appUrl}" style="color: #3b82f6;">${appUrl}</a>
            </p>
          </div>
        `;

        sendEmailViaResend({
          to: claimReq.user_email,
          subject: `【Kigyou-List】公式企業認証の承認完了のお知らせ（${claimReq.company_name}様）`,
          html: approvalHtml,
        }).catch((e) => console.error('Failed to send approval email:', e));

        await logAdminAction(adminEmail, 'APPROVE_COMPANY_CLAIM', claimReq.corporate_number, {
          request_id,
          user_email: claimReq.user_email,
        });

        return NextResponse.json({ success: true, message: '申請を承認しました。' });
      } else {
        // Action: Reject
        const reason = rejection_reason || '提出書類が不鮮明または企業関係者様であることを確認できませんでした。';

        await client.query(
          `UPDATE company_claim_requests SET status = 'rejected', rejection_reason = $1, reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW() WHERE id = $3`,
          [reason, adminEmail, request_id]
        );

        // Send rejection email
        const rejectHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #dc2626; font-size: 20px; margin: 0;">【ご確認】公式企業認証の審査結果について</h1>
              <p style="color: #64748b; font-size: 13px; margin-top: 6px;">Kigyou-List 審査事務局</p>
            </div>

            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              <strong>${claimReq.company_name}</strong><br>
              ${claimReq.applicant_name} 様
            </p>

            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              この度は公式企業オーナー認証をお申し込みいただき誠にありがとうございます。<br>
              ご提出いただきました内容を審査いたしました結果、誠に恐れ入りますが、下記の理由により現時点での承認を見送らせていただくこととなりました。
            </p>

            <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; font-size: 13px; color: #991b1b; margin: 20px 0; line-height: 1.7;">
              <strong>■ 見送り理由：</strong><br>
              ${reason}
            </div>

            <p style="font-size: 13px; color: #475569; line-height: 1.6;">
              再度、鮮明な名刺画像または登記簿謄本をご用意いただき、再申請を行っていただくことが可能です。<br>
              ご不明点がございましたら本メール宛またはお問い合わせ窓口までご連絡ください。
            </p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 11px; color: #94a3b8; margin: 0;">
              Kigyou-List 審査事務局<br>
              公式サイト: <a href="${appUrl}" style="color: #3b82f6;">${appUrl}</a>
            </p>
          </div>
        `;

        sendEmailViaResend({
          to: claimReq.user_email,
          subject: `【Kigyou-List】公式企業認証の審査結果について（${claimReq.company_name}様）`,
          html: rejectHtml,
        }).catch((e) => console.error('Failed to send reject email:', e));

        await logAdminAction(adminEmail, 'REJECT_COMPANY_CLAIM', claimReq.corporate_number, {
          request_id,
          rejection_reason: reason,
        });

        return NextResponse.json({ success: true, message: '申請を却下しました。' });
      }
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error in /api/admin/claims/review POST:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
