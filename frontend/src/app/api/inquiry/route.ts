import { NextResponse } from "next/server";
import { 
  createInquiry, 
  checkRateLimit, 
  verifyOtp, 
  hideCompany, 
  getCompanyByNumber, 
  updateCompanyField, 
  saveCompanyEditHistory,
  isUserCompanyOwner,
  ALLOWED_EDIT_FIELDS 
} from "@/lib/db";
import { isAdmin, isAdminEmail } from "@/lib/adminAuth";
import { revalidatePath } from "next/cache";
import { verifyClientIp, verifyClientEmail, autoBanIp } from "@/lib/securityGuard";
import { executePostApprovalSeoPipeline } from "@/lib/seoIndexingTrigger";

async function sendNotificationEmail(
  toEmail: string, 
  subject: string, 
  htmlContent: string
) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_SUPPORT_FROM_EMAIL || "Kigyou-List サポート事務局 <support@kigyoulist.com>";
  if (!resendApiKey) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toEmail,
        subject,
        html: htmlContent,
      }),
    });
  } catch (err) {
    console.error("Error sending notification email via Resend:", err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      corporate_number, 
      company_name, 
      type, 
      requester_email, 
      person_in_charge = "", 
      mobile_number = "", 
      message = "", 
      bot_trap = "",
      otp_code,
      field_name,
      new_value,
      website_url = "",
      locale = "ja",
      turnstileToken 
    } = body;

    // Extract Client IP using standard Cloudflare and proxy headers
    const ip = request.headers.get("cf-connecting-ip") || 
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
      request.headers.get("x-real-ip") || 
      "unknown_ip";

    // 1. Honeypot check: If bot fills hidden bot_trap input, Auto-Ban IP for 48h immediately!
    if (bot_trap) {
      if (ip !== "unknown_ip" && ip !== "127.0.0.1" && ip !== "::1") {
        console.warn(`[Security Guard] Honeypot bot trap triggered by IP: ${ip}. Auto-banning 48h.`);
        await autoBanIp(ip, "Auto-ban: Honeypot bot trap triggered", 48, "system_guard");
      }
      return NextResponse.json({ success: true, message: "お問い合わせの送信が完了しました。" });
    }

    // Check if requester is Administrator
    const isRequestAdmin = 
      isAdmin(request) || 
      isAdminEmail(requester_email) || 
      isAdminEmail(request.headers.get("x-admin-email"));
    
    // 2a. Dynamic IP Blacklist (48h temporary blocks or permanent)
    if (!isRequestAdmin && ip !== "unknown_ip") {
      const ipCheck = await verifyClientIp(ip);
      if (ipCheck.blocked) {
        return NextResponse.json({ error: "Access Denied: Banned IP" }, { status: 403 });
      }
    }

    // 2b. Disposable / Fraudulent Email Domain Check
    if (!isRequestAdmin && requester_email) {
      const emailCheck = await verifyClientEmail(requester_email);
      if (emailCheck.blocked) {
        return NextResponse.json({ 
          error: locale === "vi" 
            ? "Tên miền email không được chấp nhận. Vui lòng sử dụng email công ty hoặc email chính thức." 
            : "このメールアドレスはご利用いただけません。企業メールアドレス等をご利用ください。" 
        }, { status: 400 });
      }
    }

    // 2c. Rate Limit (Skip for admin)
    if (!isRequestAdmin && ip !== "unknown_ip") {
      const allowed = await checkRateLimit(ip);
      if (!allowed) {
        return NextResponse.json({ 
          error: locale === "vi" 
            ? "Bạn đã vượt quá giới hạn gửi trong 24 giờ. Vui lòng thử lại sau." 
            : "24時間以内に送信できる上限数を超えました。しばらく経ってから再度お試しください。" 
        }, { status: 429 });
      }
    }

    // 2d. Cloudflare Turnstile Verification (Universal for all contact & inquiry submissions)
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (!isRequestAdmin && turnstileSecret) {
      if (!turnstileToken) {
        return NextResponse.json({ 
          error: locale === "vi" 
            ? "Vui lòng hoàn tất xác thực bảo mật Cloudflare Turnstile." 
            : "セキュリティ認証（Cloudflare Turnstile）を完了してください。" 
        }, { status: 400 });
      }
      try {
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
          return NextResponse.json({ 
            error: locale === "vi" 
              ? "Xác minh bảo mật thất bại. Vui lòng tải lại trang và thử lại." 
              : "スパム対策の認証に失敗しました。ページを更新して再度お試しください。" 
          }, { status: 400 });
        }
      } catch (tErr) {
        console.error("Turnstile verification error:", tErr);
      }
    }

    // If General / Enterprise API / Partnership / Form Marketing / Billing / Company Manage inquiry
    if (type === "general" || type === "api" || type === "partner" || type === "form_marketing" || type === "billing" || type === "enterprise" || type === "company_manage") {
      if (!requester_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requester_email)) {
        return NextResponse.json({ 
          error: locale === "vi" ? "Vui lòng nhập địa chỉ email hợp lệ." : "有効なメールアドレスを入力してください。" 
        }, { status: 400 });
      }

      if (!person_in_charge || !message) {
        return NextResponse.json({ 
          error: locale === "vi" ? "Vui lòng nhập họ tên và nội dung liên hệ." : "お名前とお問い合わせ内容をご入力ください。" 
        }, { status: 400 });
      }

      await createInquiry(
        corporate_number || 'N/A',
        company_name || '一般お問い合わせ',
        type,
        requester_email,
        person_in_charge,
        mobile_number || '',
        message,
        ip,
        'pending'
      );

      // Send alert to admin
      const adminEmails = (process.env.ADMIN_EMAILS || "trungkim8694@gmail.com,listkigyou@gmail.com").split(",");
      const typeLabel = 
        type === "form_marketing" ? "フォーム営業・配信代行相談" :
        type === "api" ? "法人API・データ一括購入" : 
        type === "billing" || type === "enterprise" ? "料金・見積・請求書払い" :
        type === "partner" ? "業務提携・広告" : 
        type === "company_manage" ? "自社情報管理・掲載修正・オプトアウト申請（一般受付）" :
        "一般お問い合わせ";
      for (const adm of adminEmails) {
        await sendNotificationEmail(
          adm.trim(),
          `【Kigyou-List お問い合わせ】${typeLabel} - ${person_in_charge}様 (${company_name || '一般'})`,
          `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>新しいお問い合わせが届きました</h2>
              <p><strong>種別:</strong> ${typeLabel}</p>
              <p><strong>氏名:</strong> ${person_in_charge}</p>
              <p><strong>会社名/組織名:</strong> ${company_name || '未記入'}</p>
              ${corporate_number && corporate_number !== 'N/A' ? `<p><strong>法人番号:</strong> ${corporate_number}</p>` : ''}
              <p><strong>メールアドレス:</strong> ${requester_email}</p>
              <p><strong>電話番号:</strong> ${mobile_number || '未記入'}</p>
              <p><strong>内容:</strong></p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: pre-wrap;">${message}</div>
            </div>
          `
        );
      }

      // Auto-reply to user
      const userSubject = type === "company_manage"
        ? (locale === "vi" 
            ? `【kigyou-list】Tiếp nhận yêu cầu quản lý / đính chính thông tin doanh nghiệp: ${company_name || 'N/A'}`
            : `【Kigyou-List】掲載情報に関する申請・お問い合わせを受け付けました（${company_name || '貴社'}）`)
        : `【Kigyou-List】お問い合わせを受け付けました`;

      await sendNotificationEmail(
        requester_email,
        userSubject,
        `
          <div style="font-family: sans-serif; padding: 20px;">
            <p>${person_in_charge} 様</p>
            <p>この度はKigyou-List（企業リスト）にお問い合わせ・申請いただき、誠にありがとうございます。<br>以下の内容で受け付けました。</p>
            ${corporate_number && corporate_number !== 'N/A' ? `<p><strong>対象法人番号:</strong> ${corporate_number}<br><strong>対象企業名:</strong> ${company_name}</p>` : ''}
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: pre-wrap; margin: 15px 0;">${message}</div>
            <p>日本国個人情報保護法（APPI）および当社の情報管理基準に基づき、担当者にて内容を確認の上、通常1〜2営業日以内にご連絡または対応いたします。</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="font-size: 12px; color: #64748b;">Kigyou-List 運営事務局<br>https://kigyoulist.com</p>
          </div>
        `
      );

      return NextResponse.json({
        success: true,
        autoApproved: false,
        message: locale === "vi" 
          ? "Đã gửi thông tin liên hệ thành công. Chúng tôi sẽ phản hồi trong vòng 1-2 ngày làm việc."
          : "お問い合わせ・申請を受け付けました。内容を確認の上、通常1〜2営業日以内に担当者よりご返信いたします。"
      });
    }

    // 3. Validation for corporate updates/delistings
    if (!corporate_number || !company_name || !type || !requester_email) {
      return NextResponse.json({ 
        error: locale === "vi" ? "Vui lòng nhập đầy đủ các trường bắt buộc." : "必須項目をご入力ください。" 
      }, { status: 400 });
    }

    // Validate corporate number format (exactly 13 digits)
    if (!/^\d{13}$/.test(corporate_number)) {
      return NextResponse.json({ 
        error: locale === "vi" ? "Mã số thuế/pháp nhân phải gồm đúng 13 chữ số." : "法人番号は13桁の半角数字で入力してください。" 
      }, { status: 400 });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requester_email)) {
      return NextResponse.json({ 
        error: locale === "vi" ? "Vui lòng nhập địa chỉ email hợp lệ." : "有効なメールアドレスを入力してください。" 
      }, { status: 400 });
    }



    // -------------------------------------------------------------
    // CASE A: UNPUBLISH / HIDE REQUEST (100% Manual Admin Review for Users & Owners)
    // -------------------------------------------------------------
    if (type === "hide") {
      const isOwner = await isUserCompanyOwner(requester_email, corporate_number);

      // Only Administrator direct action executes immediately
      if (isRequestAdmin) {
        const reasonText = message ? `管理者直接非公開: ${message}` : "管理者による直接非公開処理";
        await hideCompany(corporate_number, reasonText);

        const inqResult = await createInquiry(
          corporate_number,
          company_name,
          "hide",
          requester_email,
          person_in_charge,
          mobile_number,
          reasonText,
          ip,
          "auto_approved"
        );

        await saveCompanyEditHistory(
          corporate_number,
          company_name,
          "status",
          "公開",
          "非公開",
          requester_email,
          inqResult.id,
          "auto_approved"
        );

        try {
          await executePostApprovalSeoPipeline(corporate_number, "URL_DELETED");
        } catch (e) {
          console.warn("SEO pipeline warning on admin hide:", e);
        }

        return NextResponse.json({
          success: true,
          auto_approved: true,
          type: "hide",
          message: locale === "vi"
            ? "Doanh nghiệp đã được ẩn trực tiếp bởi Quản trị viên (Đã xóa cache & gửi lệnh gỡ Index)."
            : "管理者権限により企業を即時非公開化し、キャッシュ削除・検索インデックス除外を送信しました。"
        });
      }

      // All non-admin requests (Verified Owner or Guest APPI) -> Hold for 100% Manual Admin Review
      const prefixLabel = isOwner ? "【公式オーナー・非公開申請】" : "【一般受付・APPI非公開申請】";
      const inqResult = await createInquiry(
        corporate_number,
        company_name,
        "hide",
        requester_email,
        person_in_charge,
        mobile_number,
        `${prefixLabel} ${message || "掲載取り下げ（非公開・オプトアウト）申請"}`,
        ip,
        "pending"
      );

      await saveCompanyEditHistory(
        corporate_number,
        company_name,
        "status",
        "公開",
        "非公開（審査待ち）",
        requester_email,
        inqResult.id,
        "pending_review"
      );

      // Notify Admin
      const adminEmails = (process.env.ADMIN_EMAILS || "trungkim8694@gmail.com,listkigyou@gmail.com").split(",");
      for (const adm of adminEmails) {
        await sendNotificationEmail(
          adm.trim(),
          `【Kigyou-List 非公開審査待ち】${company_name} (${corporate_number}) - ${person_in_charge || requester_email}`,
          `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>掲載取り下げ（オプトアウト）申請が届きました（要承認）</h2>
              <p><strong>申請区分:</strong> ${isOwner ? "公式認証オーナー" : "一般受付（ログイン不要）"}</p>
              <p><strong>対象企業:</strong> ${company_name} (${corporate_number})</p>
              <p><strong>申請者:</strong> ${person_in_charge || "未記入"} (${requester_email})</p>
              <p><strong>電話番号:</strong> ${mobile_number || "未記入"}</p>
              <p><strong>申請理由・詳細:</strong></p>
              <div style="background: #fff1f2; padding: 15px; border-radius: 8px; border: 1px solid #fecdd3; white-space: pre-wrap;">${message}</div>
              <p style="margin-top: 12px;">管理画面の「非公開・修正依頼一覧」より内容をご確認の上、承認（非公開化）または却下を行ってください。</p>
            </div>
          `
        );
      }

      // Auto-reply to requester
      await sendNotificationEmail(
        requester_email,
        `【Kigyou-List】掲載取り下げ（非公開）申請を受け付けました（${company_name}）`,
        `
          <div style="font-family: sans-serif; padding: 20px;">
            <p>${person_in_charge || requester_email} 様</p>
            <p>Kigyou-List 運営事務局でございます。<br>以下の企業ページの非公開（オプトアウト）申請を受け付けました。</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 15px 0;">
              <div><strong>対象企業名:</strong> ${company_name}</div>
              <div><strong>法人番号:</strong> ${corporate_number}</div>
              <div><strong>ステータス:</strong> 運営事務局 審査待ち</div>
              <div style="margin-top: 8px; white-space: pre-wrap;">${message}</div>
            </div>
            <p>個人情報保護法（APPI）および当社の情報管理基準に基づき、運営事務局にて内容を確認の上、承認後に非公開処理および完了のご連絡を差し上げます。</p>
          </div>
        `
      );

      return NextResponse.json({
        success: true,
        auto_approved: false,
        type: "hide",
        message: locale === "vi"
          ? "Yêu cầu gỡ bỏ/ẩn doanh nghiệp đã được gửi đến Ban quản trị để phê duyệt. Chúng tôi sẽ thông báo qua email ngay sau khi xử lý."
          : "非公開（オプトアウト）申請を受け付けました。運営事務局にて内容を確認・承認後、非公開処理および完了メールをお送りいたします。"
      });
    }

    // -------------------------------------------------------------
    // CASE B: UPDATE / EDIT REQUEST (100% Manual Admin Review for Users & Owners)
    // -------------------------------------------------------------
    if (type === "update") {
      // 1. Gather all active field updates
      const activeUpdates: Record<string, string> = {};
      const hasExplicitUpdatesMap = Boolean(body.updates && typeof body.updates === "object" && Object.keys(body.updates).length > 0);

      if (hasExplicitUpdatesMap) {
        for (const [k, v] of Object.entries(body.updates)) {
          if (ALLOWED_EDIT_FIELDS.includes(k) && typeof v === "string" && v.trim()) {
            activeUpdates[k] = v.trim();
          }
        }
      } else {
        if (field_name && new_value && ALLOWED_EDIT_FIELDS.includes(field_name) && typeof new_value === "string" && new_value.trim()) {
          activeUpdates[field_name] = new_value.trim();
        }
        for (const field of ALLOWED_EDIT_FIELDS) {
          if (body[field] && typeof body[field] === "string" && body[field].trim()) {
            activeUpdates[field] = body[field].trim();
          }
        }
      }

      const updateKeys = Object.keys(activeUpdates);
      if (updateKeys.length === 0) {
        return NextResponse.json({ 
          error: locale === "vi" 
            ? "Vui lòng thay đổi ít nhất một thông tin so với dữ liệu hiện tại." 
            : "現在の登録情報から変更された項目がありません。修正したい項目を入力してください。" 
        }, { status: 400 });
      }

      // 2. Strict Unified Server-Side Validation for each non-empty field
      if (activeUpdates.phone_number) {
        const cleanPhone = activeUpdates.phone_number.replace(/\s+/g, "");
        if (!/^0\d{1,4}-?\d{1,4}-?\d{3,4}$/.test(cleanPhone)) {
          return NextResponse.json({
            error: locale === "vi" 
              ? "Định dạng số điện thoại không hợp lệ (Ví dụ: 03-1234-5678)." 
              : "代表電話番号の形式が正しくありません（例: 03-1234-5678）。"
          }, { status: 400 });
        }
      }

      if (activeUpdates.fax_number) {
        const cleanFax = activeUpdates.fax_number.replace(/\s+/g, "");
        if (!/^0\d{1,4}-?\d{1,4}-?\d{3,4}$/.test(cleanFax)) {
          return NextResponse.json({
            error: locale === "vi" 
              ? "Định dạng số FAX không hợp lệ (Ví dụ: 03-1234-5679)." 
              : "FAX番号の形式が正しくありません（例: 03-1234-5679）。"
          }, { status: 400 });
        }
      }

      if (activeUpdates.website_url) {
        let testUrl = activeUpdates.website_url.trim();
        if (!/^https?:\/\//i.test(testUrl)) {
          testUrl = `https://${testUrl}`;
        }
        if (!/^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/\S*)?$/.test(testUrl)) {
          return NextResponse.json({
            error: locale === "vi"
              ? "URL Website chính thức không đúng định dạng (Ví dụ: https://example.co.jp)."
              : "公式ウェブサイトURLの形式が正しくありません（例: https://example.co.jp）。"
          }, { status: 400 });
        }
        activeUpdates.website_url = testUrl;
      }

      if (activeUpdates.email_address) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(activeUpdates.email_address)) {
          return NextResponse.json({
            error: locale === "vi" 
              ? "Định dạng email đại diện không hợp lệ." 
              : "代表メールアドレスの形式が正しくありません。"
          }, { status: 400 });
        }
      }

      if (activeUpdates.company_name_kana) {
        if (!/^[\u30A0-\u30FF\u3000\sー・＆（）()．.]+$/.test(activeUpdates.company_name_kana)) {
          return NextResponse.json({
            error: locale === "vi"
              ? "Tên Furigana chỉ được phép nhập bằng chữ Katakana (全角カタカナ)."
              : "会社名（フリガナ）は全角カタカナのみで入力してください。"
          }, { status: 400 });
        }
      }

      if (activeUpdates.company_name_en) {
        if (!/^[A-Za-z0-9\s.,&'()\-/]+$/.test(activeUpdates.company_name_en)) {
          return NextResponse.json({
            error: locale === "vi"
              ? "Tên công ty tiếng Anh chỉ được chứa ký tự chữ cái tiếng Anh, số và dấu câu chuẩn."
              : "英語社名表記は半角英数字・標準記号のみで入力してください（例: Sample Inc.）。"
          }, { status: 400 });
        }
      }

      for (const numField of ["capital_amount", "employee_count", "sales_amount"] as const) {
        if (activeUpdates[numField]) {
          const cleaned = activeUpdates[numField].replace(/[,、\s]/g, "");
          if (!/^\d+$/.test(cleaned)) {
            return NextResponse.json({
              error: locale === "vi"
                ? "Các trường Vốn điều lệ, Nhân sự, Doanh thu chỉ được phép nhập số nguyên."
                : "資本金・従業員数・売上高は半角数字（整数）のみで入力してください。"
            }, { status: 400 });
          }
          activeUpdates[numField] = cleaned;
        }
      }

      const currentCompany = await getCompanyByNumber(corporate_number);
      const isOwner = await isUserCompanyOwner(requester_email, corporate_number);

      // Compare against currentCompany to filter out unchanged fields
      const actualChangedUpdates: Record<string, string> = {};
      for (const [k, v] of Object.entries(activeUpdates)) {
        const oldVal = currentCompany ? String((currentCompany as any)[k] ?? "").trim() : "";
        if (v !== oldVal) {
          actualChangedUpdates[k] = v;
        }
      }

      // If both jigyo_shumoku and business_summary are identical, keep jigyo_shumoku as the primary diff entry
      if (
        actualChangedUpdates.jigyo_shumoku &&
        actualChangedUpdates.business_summary &&
        actualChangedUpdates.jigyo_shumoku === actualChangedUpdates.business_summary
      ) {
        delete actualChangedUpdates.business_summary;
      }
      // If both full_address and street_address are identical, keep full_address as the primary diff entry
      if (
        actualChangedUpdates.full_address &&
        actualChangedUpdates.street_address &&
        actualChangedUpdates.full_address === actualChangedUpdates.street_address
      ) {
        delete actualChangedUpdates.street_address;
      }

      if (Object.keys(actualChangedUpdates).length === 0) {
        return NextResponse.json({
          error: locale === "vi"
            ? "Thông tin bạn nhập trùng khớp với dữ liệu hiện tại, không có mục nào thay đổi."
            : "現在の登録情報から変更された項目がありません。"
        }, { status: 400 });
      }

      // Check if email_address is being changed by non-admin Owner
      const currentEmail = (currentCompany?.email_address || "").trim().toLowerCase();
      const newEmail = (actualChangedUpdates.email_address || "").trim().toLowerCase();
      const isEmailChanging = Boolean(newEmail && newEmail !== currentEmail);
      const isGuestSubmission = Boolean(body.is_guest_submission);

      if (isEmailChanging && !isRequestAdmin && !isGuestSubmission) {
        const emailOtp = body.email_otp_code || body.otp_code;
        if (!emailOtp) {
          return NextResponse.json({
            error: locale === "vi" 
              ? "Để thay đổi địa chỉ email, bắt buộc phải nhập mã xác thực OTP gửi về email mới đó." 
              : "メールアドレスを変更・更新するには、新しいメールアドレス宛に送信された認証コード（OTP）の入力が必須です。"
          }, { status: 400 });
        }
        const isEmailOtpValid = await verifyOtp(newEmail, emailOtp);
        if (!isEmailOtpValid) {
          return NextResponse.json({
            error: locale === "vi" 
              ? "Mã xác thực OTP cho email mới không đúng hoặc đã hết hạn." 
              : "新しいメールアドレス宛の認証コードが正しくないか、有効期限が切れています。"
          }, { status: 400 });
        }
      }

      const updateDescriptions: string[] = [];
      for (const [k, v] of Object.entries(actualChangedUpdates)) {
        updateDescriptions.push(`${k}: ${v}`);
      }
      const summaryMsg = updateDescriptions.join(", ");

      // SUB-CASE B0: ONLY Administrator direct action updates DB immediately
      if (isRequestAdmin) {
        const inqResult = await createInquiry(
          corporate_number,
          company_name,
          "update",
          requester_email,
          person_in_charge,
          mobile_number,
          `【管理者直接即時反映】更新項目: [${summaryMsg}]`,
          ip,
          "auto_approved"
        );

        for (const [field, newVal] of Object.entries(actualChangedUpdates)) {
          const oldVal = currentCompany ? (currentCompany as any)[field] || null : null;
          await updateCompanyField(corporate_number, field, newVal);
          await saveCompanyEditHistory(
            corporate_number,
            company_name,
            field,
            oldVal ? String(oldVal) : null,
            newVal,
            requester_email,
            inqResult.id,
            "auto_approved"
          );
        }

        try {
          await executePostApprovalSeoPipeline(corporate_number, "URL_UPDATED");
        } catch (e) {
          console.warn("SEO pipeline warning on admin update:", e);
        }

        return NextResponse.json({
          success: true,
          auto_approved: true,
          type: "update",
          message: locale === "vi" 
            ? "Thông tin doanh nghiệp đã được cập nhật trực tiếp bởi Quản trị viên (Đã xóa cache & gửi Google VIP / Bing IndexNow)!" 
            : "管理者特権により企業情報を即時更新し、キャッシュ削除・検索インデックス送信を完了しました。"
        });
      }

      // SUB-CASE B1: ALL USERS (Both Verified Owner & Guest) -> 100% MANUAL ADMIN REVIEW
      const sourcePrefix = isOwner
        ? "【公式オーナー修正申請・審査待ち】"
        : "【一般受付・修正申請・審査待ち】";
      const inquiryMsg = `${sourcePrefix} 更新項目: [${summaryMsg}]${message ? `\n【補足・理由】${message}` : ""}`;

      const inqResult = await createInquiry(
        corporate_number,
        company_name,
        "update",
        requester_email,
        person_in_charge,
        mobile_number,
        inquiryMsg,
        ip,
        "pending"
      );

      for (const [field, newVal] of Object.entries(actualChangedUpdates)) {
        const oldVal = currentCompany ? (currentCompany as any)[field] || null : null;
        await saveCompanyEditHistory(
          corporate_number,
          company_name,
          field,
          oldVal ? String(oldVal) : null,
          newVal,
          requester_email,
          inqResult.id,
          "pending_review"
        );
      }

      // Send alert email to Admin
      const adminEmails = (process.env.ADMIN_EMAILS || "trungkim8694@gmail.com,listkigyou@gmail.com").split(",");
      const updatedListHtml = Object.entries(actualChangedUpdates)
        .map(([k, v]) => `<div><strong>${k}:</strong> ${v}</div>`)
        .join("");
      for (const adm of adminEmails) {
        await sendNotificationEmail(
          adm.trim(),
          `【Kigyou-List 情報修正審査待ち】${company_name} (${corporate_number}) - ${person_in_charge || requester_email}`,
          `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>企業情報の修正申請が届きました（要承認）</h2>
              <p><strong>申請区分:</strong> ${isOwner ? "公式認証オーナー" : "一般受付（ログイン不要）"}</p>
              <p><strong>対象企業:</strong> ${company_name} (${corporate_number})</p>
              <p><strong>申請者:</strong> ${person_in_charge || "未記入"} (${requester_email})</p>
              <p><strong>電話番号:</strong> ${mobile_number || "未記入"}</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 15px 0;">
                ${updatedListHtml}
                ${message ? `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0;"><strong>補足:</strong> ${message}</div>` : ""}
              </div>
              <p>管理画面の「非公開・修正依頼一覧」より変更差分をご確認の上、1クリックで承認（DB反映・キャッシュ削除・Google/Bingインデックス送信）または却下が可能です。</p>
            </div>
          `
        );
      }

      // Send confirmation email to applicant
      await sendNotificationEmail(
        requester_email,
        `【Kigyou-List】掲載情報の修正申請を受け付けました（${company_name}）`,
        `
          <div style="font-family: sans-serif; padding: 20px;">
            <p>${person_in_charge || requester_email} 様</p>
            <p>この度はKigyou-List（企業リスト）へ掲載情報の修正をご申請いただき、誠にありがとうございます。<br>以下の内容で修正申請を受け付けました（現在、運営事務局の審査待ちです）。</p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 13px; line-height: 1.8;">
              <div><strong>対象企業名:</strong> ${company_name}</div>
              <div><strong>法人番号:</strong> ${corporate_number}</div>
              <div><strong>ステータス:</strong> 審査待ち（承認後に本番反映）</div>
              <div style="margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
                ${updatedListHtml}
              </div>
            </div>
            <p>運営事務局にて内容を確認の上、承認後にデータベースへ反映し、完了のご連絡を差し上げます。</p>
          </div>
        `
      );

      return NextResponse.json({
        success: true,
        auto_approved: false,
        type: "update",
        message: locale === "vi"
          ? "Yêu cầu chỉnh sửa thông tin đã được gửi tới Ban quản trị để kiểm duyệt. Dữ liệu sẽ được cập nhật lên hệ thống ngay sau khi được phê duyệt."
          : "掲載情報の修正申請を受け付けました。運営事務局にて内容を確認・承認後、公式データベースへ反映しメールにてお知らせいたします。"
      });
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error: any) {
    console.error("Error in /api/inquiry POST:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
