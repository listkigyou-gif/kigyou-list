import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { verifyClaimToken, sendEmailViaResend } from '@/lib/marketing';
import { verifyOtp, invalidateCompanyCache } from '@/lib/db';
import { isAdmin, isAdminEmail } from '@/lib/adminAuth';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const session = await auth();
    const sessionEmail = session?.user?.email?.toLowerCase().trim() || null;

    const body = await request.json();
    const {
      corporate_number,
      email,
      otp_code,
      claim_token,
      person_in_charge,
      department,
      phone,
      pr_title,
      pr_message,
      locale = 'ja',
    } = body;

    const isJa = locale === 'ja';
    const isVi = locale === 'vi';

    // Check if request is initiated by an Administrator
    const isRequestAdmin = 
      isAdmin(request) || 
      isAdminEmail(email) || 
      isAdminEmail(request.headers.get("x-admin-email")) ||
      isAdminEmail(sessionEmail);

    if (!corporate_number || corporate_number.length !== 13) {
      return NextResponse.json(
        { error: isJa ? '有効な法人番号（13桁）を指定してください。' : 'Mã số pháp nhân không hợp lệ.' },
        { status: 400 }
      );
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: isJa ? '有効なメールアドレスを入力してください。' : 'Email không hợp lệ.' },
        { status: 400 }
      );
    }

    const effectivePersonInCharge = (person_in_charge && person_in_charge.trim()) 
      ? person_in_charge.trim() 
      : (isRequestAdmin ? '管理者 (Admin)' : '');

    if (!effectivePersonInCharge) {
      return NextResponse.json(
        { error: isJa ? '担当者氏名をご入力ください。' : 'Vui lòng nhập họ tên người phụ trách.' },
        { status: 400 }
      );
    }

    // 1. Check company existence and current status
    const compRes = await client.query(
      `SELECT corporate_number, company_name, is_claimed, claimed_by_email FROM companies WHERE corporate_number = $1`,
      [corporate_number]
    );

    if (compRes.rows.length === 0) {
      return NextResponse.json(
        { error: isJa ? '対象の企業情報が見つかりませんでした。' : 'Không tìm thấy thông tin doanh nghiệp.' },
        { status: 404 }
      );
    }

    const company = compRes.rows[0];

    // Check if user is the already-verified company owner
    const isCompanyOwner = Boolean(
      company.is_claimed && 
      company.claimed_by_email && 
      (company.claimed_by_email.toLowerCase() === email.toLowerCase() || 
       (sessionEmail && company.claimed_by_email.toLowerCase() === sessionEmail))
    );

    // If claimed by another email (Only block non-admin users)
    if (!isRequestAdmin && company.is_claimed && company.claimed_by_email && !isCompanyOwner) {
      return NextResponse.json(
        {
          error: isJa
            ? 'この企業ページは既に他の公式担当者により認証済みです。管理者の変更をご希望の場合は事務局までご連絡ください。'
            : 'Hồ sơ doanh nghiệp này đã được xác minh bởi một đại diện khác.',
        },
        { status: 409 }
      );
    }

    // 2. Verify credentials: Admin bypass OR already-verified Owner OR secure claim_token OR 6-digit OTP code
    let isVerified = false;

    if (isRequestAdmin || isCompanyOwner) {
      // Direct Admin or verified Owner Access: bypass OTP
      isVerified = true;
    } else if (claim_token) {
      isVerified = verifyClaimToken(corporate_number, email, claim_token);
    } else if (otp_code) {
      isVerified = await verifyOtp(email, otp_code);
    }

    if (!isVerified) {
      if (!sessionEmail && !otp_code && !claim_token) {
        return NextResponse.json(
          {
            error: isJa
              ? '企業公式アカウントのログインまたは認証コードの入力が必要です。'
              : 'Vui lòng đăng nhập tài khoản hoặc nhập mã xác thực OTP.',
          },
          { status: 401 }
        );
      }
      return NextResponse.json(
        {
          error: isJa
            ? '認証コードが無効または有効期限切れです。最新の認証コードをご入力ください。'
            : 'Mã xác thực OTP hoặc Token không hợp lệ hoặc đã hết hạn.',
        },
        { status: 400 }
      );
    }

    // 3. Update company
    if (isRequestAdmin && !isCompanyOwner) {
      // ADMIN DATA MODERATION MODE:
      // Update company fields (PR message, title, etc.) WITHOUT assigning Admin as Owner in user_companies
      await client.query(
        `UPDATE companies SET
          pr_title = COALESCE($1, pr_title),
          pr_message = COALESCE($2, pr_message),
          updated_at = NOW()
        WHERE corporate_number = $3`,
        [
          pr_title !== undefined ? pr_title.trim() : null,
          pr_message !== undefined ? pr_message.trim() : null,
          corporate_number,
        ]
      );

      // Invalidate memory cache and revalidate Next.js ISR cache
      invalidateCompanyCache(corporate_number);
      try {
        revalidatePath(`/[locale]/company/${corporate_number}`, 'page');
        revalidatePath(`/ja/company/${corporate_number}`);
        revalidatePath(`/vi/company/${corporate_number}`);
        revalidatePath(`/en/company/${corporate_number}`);
      } catch (e) {
        console.warn("revalidatePath warning:", e);
      }

      return NextResponse.json({
        success: true,
        admin_override: true,
        message: isJa
          ? '管理者権限で企業PR情報を直接更新しました。（※自社管理リストには追加されません）'
          : 'Đã cập nhật thông tin PR với quyền Quản trị viên (không liên kết vào danh sách sở hữu cá nhân).',
        company: {
          corporate_number,
          pr_title,
          pr_message,
        },
      });
    }

    // NORMAL OWNER CLAIM MODE (Official company representative):
    await client.query(
      `UPDATE companies SET
        is_claimed = TRUE,
        claimed_at = NOW(),
        claimed_by_name = $1,
        claimed_by_email = $2,
        claimed_by_phone = $3,
        claimed_by_department = $4,
        pr_title = COALESCE($5, pr_title),
        pr_message = COALESCE($6, pr_message),
        updated_at = NOW()
      WHERE corporate_number = $7`,
      [
        effectivePersonInCharge,
        email.toLowerCase().trim(),
        phone ? phone.trim() : null,
        department ? department.trim() : null,
        pr_title !== undefined ? pr_title.trim() : null,
        pr_message !== undefined ? pr_message.trim() : null,
        corporate_number,
      ]
    );

    // Invalidate memory cache and revalidate Next.js ISR cache
    invalidateCompanyCache(corporate_number);
    try {
      revalidatePath(`/[locale]/company/${corporate_number}`, 'page');
      revalidatePath(`/ja/company/${corporate_number}`);
      revalidatePath(`/vi/company/${corporate_number}`);
      revalidatePath(`/en/company/${corporate_number}`);
    } catch (e) {
      console.warn("revalidatePath warning:", e);
    }

    // 4. Record ownership in user_companies for multi-company management
    const verificationMethod = claim_token ? 'token_hmac' : 'instant_domain';
    try {
      await client.query(
        `INSERT INTO user_companies (user_email, corporate_number, role, verification_method, verified_at, status)
         VALUES ($1, $2, 'owner', $3, NOW(), 'active')
         ON CONFLICT (corporate_number) DO UPDATE SET
           user_email = $1,
           role = 'owner',
           verification_method = $3,
           verified_at = NOW(),
           status = 'active'`,
        [email.toLowerCase().trim(), corporate_number, verificationMethod]
      );
    } catch (err) {
      console.error('Failed to update user_companies in claim route:', err);
    }

    // 5. If there was any pending manual claim request, mark it approved
    try {
      await client.query(
        `UPDATE company_claim_requests SET status = 'approved', reviewed_by = 'system_instant_verify', reviewed_at = NOW()
         WHERE corporate_number = $1 AND LOWER(user_email) = LOWER($2) AND status = 'pending'`,
        [corporate_number, email.toLowerCase().trim()]
      );
    } catch (ignore) {}

    // 6. Incentive: Upgrade daily quota to 50 rows/day (free tier) + 100 bonus quota balance
    try {
      await client.query(
        `UPDATE user_export_quotas SET monthly_base_allowance = 50 WHERE LOWER(user_email) = LOWER($1) AND plan = 'free'`,
        [email.toLowerCase().trim()]
      );
    } catch (ignore) {}

    try {
      await client.query(
        `UPDATE users SET purchased_add_on_balance = purchased_add_on_balance + 100 WHERE LOWER(user_email) = LOWER($1)`,
        [email.toLowerCase().trim()]
      );
    } catch (ignore) {}

    // 5. Send Congratulations & Confirmation Email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kigyoulist.com';
    const companyPageUrl = `${appUrl}/ja/company/${corporate_number}`;

    const congratsHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #059669; font-size: 22px; margin: 0;">🛡️ 公式オーナー認証が完了いたしました</h1>
          <p style="color: #64748b; font-size: 13px; margin-top: 6px;">Kigyou-List 企業情報ポータル</p>
        </div>

        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          <strong>${company.company_name}</strong><br>
          ${person_in_charge} 様
        </p>

        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          この度はKigyou-Listの公式オーナー認証をいただき、誠にありがとうございます。<br>
          貴社公式ページに<strong>「公式認証企業バッジ」</strong>が付与されました。
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${companyPageUrl}" style="background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            認証済み公式ページを確認する →
          </a>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; font-size: 12px; color: #64748b; line-height: 1.6;">
          <strong>■ 認証特典について：</strong><br>
          ・貴社専用PRメッセージおよび最新連絡先の直接掲載<br>
          ・月間多くのB2Bビジネスユーザーに対する企業信頼性の向上<br>
          ・新規開拓リスト抽出の無料枠（100件）プレゼント
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 11px; color: #94a3b8; margin: 0;">
          Kigyou-List 運営事務局<br>
          公式サイト: <a href="https://kigyoulist.com" style="color: #3b82f6;">https://kigyoulist.com</a>
        </p>
      </div>
    `;

    // Fire-and-forget confirmation email
    sendEmailViaResend({
      to: email.trim(),
      subject: `【Kigyou-List】公式オーナー認証完了のお知らせ（${company.company_name}様）`,
      html: congratsHtml,
    }).catch((e) => console.error('Failed to send claim confirmation email:', e));

    return NextResponse.json({
      success: true,
      auto_approved: isRequestAdmin ? true : undefined,
      message: isRequestAdmin
        ? (isJa
            ? '管理者特権により、公式企業情報およびPRメッセージがデータベースに即時反映されました（承認・OTP不要）。'
            : 'Quyền Quản trị viên: Đã lưu trực tiếp thông tin doanh nghiệp và PR vào cơ sở dữ liệu (Không cần OTP / Phê duyệt).')
        : (isJa
            ? '公式オーナー認証が完了いたしました。「公式認証済」バッジが付与されました。'
            : 'Xác minh chính chủ thành công! Huy hiệu đã được gắn vào hồ sơ công ty.'),
      company_name: company.company_name,
    });
  } catch (error: any) {
    console.error('Error in /api/companies/claim POST:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
