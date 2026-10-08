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

async function sendNotificationEmail(
  toEmail: string, 
  subject: string, 
  htmlContent: string
) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Kigyou List <auth@kigyoulist.com>";
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

    // 1. Honeypot check
    if (bot_trap) {
      return NextResponse.json({ success: true, message: "お問い合わせの送信が完了しました。" });
    }

    // Check if requester is Administrator
    const isRequestAdmin = 
      isAdmin(request) || 
      isAdminEmail(requester_email) || 
      isAdminEmail(request.headers.get("x-admin-email"));

    // 2. Extract IP and Rate Limit (Skip for admin)
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0] : "unknown_ip";
    
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

    // If General / Enterprise API / Partnership / Form Marketing / Billing inquiry
    if (type === "general" || type === "api" || type === "partner" || type === "form_marketing" || type === "billing" || type === "enterprise") {
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
              <p><strong>メールアドレス:</strong> ${requester_email}</p>
              <p><strong>電話番号:</strong> ${mobile_number || '未記入'}</p>
              <p><strong>内容:</strong></p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: pre-wrap;">${message}</div>
            </div>
          `
        );
      }

      // Auto-reply to user
      await sendNotificationEmail(
        requester_email,
        `【Kigyou-List】お問い合わせを受け付けました`,
        `
          <div style="font-family: sans-serif; padding: 20px;">
            <p>${person_in_charge} 様</p>
            <p>この度はKigyou-List（企業リスト）にお問い合わせいただき、誠にありがとうございます。<br>以下の内容でお問い合わせを受け付けました。</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: pre-wrap; margin: 15px 0;">${message}</div>
            <p>内容を確認の上、担当者より2営業日以内にご返信申し上げます。</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="font-size: 12px; color: #64748b;">Kigyou-List 運営事務局<br>https://kigyoulist.com</p>
          </div>
        `
      );

      return NextResponse.json({
        success: true,
        autoApproved: false,
        message: locale === "vi" 
          ? "Đã gửi thông tin liên hệ thành công. Chúng tôi sẽ phản hồi trong vòng 2 ngày làm việc."
          : "お問い合わせを受け付けました。内容を確認の上、2営業日以内に担当者よりご返信いたします。"
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

    // Verify Turnstile CAPTCHA if configured (Skip for admin)
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (!isRequestAdmin && turnstileSecret && turnstileToken) {
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
            ? "Xác minh CAPTCHA thất bại. Vui lòng thử lại." 
            : "スパム対策の認証に失敗しました。ページを更新して再度お試しください。" 
        }, { status: 400 });
      }
    }

    // -------------------------------------------------------------
    // CASE A: UNPUBLISH / HIDE REQUEST (Auto-Approved with Rollback)
    // -------------------------------------------------------------
    if (type === "hide") {
      // Check if verified owner or if requester is admin
      const isOwner = isRequestAdmin || await isUserCompanyOwner(requester_email, corporate_number);
      if (!isOwner) {
        if (!otp_code) {
          return NextResponse.json({ 
            error: locale === "vi" 
              ? "Vui lòng lấy và nhập mã xác thực OTP gửi về email." 
              : "非公開申請を確認するため、メール宛に送信された認証コード（6桁）を入力してください。" 
          }, { status: 400 });
        }
        const isOtpValid = await verifyOtp(requester_email, otp_code);
        if (!isOtpValid) {
          return NextResponse.json({ 
            error: locale === "vi" 
              ? "Mã xác thực OTP không đúng hoặc đã hết hạn." 
              : "認証コードが正しくないか、有効期限が切れています。" 
          }, { status: 400 });
        }
      }

      const reasonText = message ? `ユーザー申請: ${message}` : "ユーザー申請による非公開（自動承認）";
      await hideCompany(corporate_number, reasonText);

      const inqResult = await createInquiry(
        corporate_number, 
        company_name, 
        "hide", 
        requester_email, 
        person_in_charge, 
        mobile_number, 
        message || "掲載取り下げ（自動承認）", 
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

      const emailSubject = locale === "vi"
        ? `[kigyou-list] Đã hoàn tất ẩn thông tin doanh nghiệp: ${company_name}`
        : `【kigyou-list】掲載情報の取り下げ（非公開）手続き完了のお知らせ`;

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">【kigyou-list】掲載情報の取り下げ完了</h2>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            平素より「kigyou-list」をご利用いただきありがとうございます。<br /><br />
            ご申請いただきました以下の企業情報につきまして、掲載の取り下げ（非公開）処理が正常に完了いたしました。
          </p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px; line-height: 1.8;">
            <div><strong>対象企業名:</strong> ${company_name}</div>
            <div><strong>法人番号:</strong> ${corporate_number}</div>
            <div><strong>処理結果:</strong> 非公開（検索結果および企業ページより除外）</div>
            <div><strong>処理日時:</strong> ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</div>
          </div>
          <p style="font-size: 12px; color: #64748b; line-height: 1.6;">
            ※検索エンジンのキャッシュ等により一時的に表示が残る場合がございますが、順次削除されます。
          </p>
        </div>
      `;
      await sendNotificationEmail(requester_email, emailSubject, emailHtml);

      return NextResponse.json({
        success: true,
        auto_approved: true,
        type: "hide",
        message: locale === "vi" 
          ? "Thông tin doanh nghiệp đã được ẩn thành công." 
          : "企業情報の非公開処理が完了しました。"
      });
    }

    // -------------------------------------------------------------
    // CASE B: UPDATE / EDIT REQUEST (Supports Multi-Field Input)
    // -------------------------------------------------------------
    if (type === "update") {
      // 1. Gather all active field updates
      const activeUpdates: Record<string, string> = {};

      if (body.updates && typeof body.updates === "object") {
        for (const [k, v] of Object.entries(body.updates)) {
          if (ALLOWED_EDIT_FIELDS.includes(k) && typeof v === "string" && v.trim()) {
            activeUpdates[k] = v.trim();
          }
        }
      }

      // Backward compatibility: single field_name and new_value
      if (field_name && new_value && ALLOWED_EDIT_FIELDS.includes(field_name) && typeof new_value === "string" && new_value.trim()) {
        activeUpdates[field_name] = new_value.trim();
      }

      // Also check root body keys
      for (const field of ALLOWED_EDIT_FIELDS) {
        if (body[field] && typeof body[field] === "string" && body[field].trim()) {
          activeUpdates[field] = body[field].trim();
        }
      }

      const updateKeys = Object.keys(activeUpdates);
      if (updateKeys.length === 0) {
        return NextResponse.json({ 
          error: locale === "vi" 
            ? "Vui lòng nhập ít nhất một thông tin cần chỉnh sửa." 
            : "修正したい項目を少なくとも1つ入力してください。" 
        }, { status: 400 });
      }

      // 2. Syntax Validation for each non-empty field
      if (activeUpdates.phone_number) {
        const cleanPhone = activeUpdates.phone_number.replace(/\s+/g, "");
        if (!/^0\d{1,4}-?\d{1,4}-?\d{3,4}$/.test(cleanPhone)) {
          return NextResponse.json({
            error: locale === "vi" 
              ? "Định dạng số điện thoại không hợp lệ (Ví dụ: 03-1234-5678)." 
              : "電話番号の形式が正しくありません (例: 03-1234-5678)。"
          }, { status: 400 });
        }
      }

      if (activeUpdates.fax_number) {
        const cleanFax = activeUpdates.fax_number.replace(/\s+/g, "");
        if (!/^0\d{1,4}-?\d{1,4}-?\d{3,4}$/.test(cleanFax)) {
          return NextResponse.json({
            error: locale === "vi" 
              ? "Định dạng số FAX không hợp lệ (Ví dụ: 03-1234-5679)." 
              : "FAX番号の形式が正しくありません (例: 03-1234-5679)。"
          }, { status: 400 });
        }
      }

      if (activeUpdates.website_url) {
        let testUrl = activeUpdates.website_url;
        if (!/^https?:\/\//i.test(testUrl)) {
          testUrl = `https://${testUrl}`;
          activeUpdates.website_url = testUrl;
        }
      }

      if (activeUpdates.email_address) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(activeUpdates.email_address)) {
          return NextResponse.json({
            error: locale === "vi" 
              ? "Định dạng email liên hệ không hợp lệ." 
              : "メールアドレスの形式が正しくありません。"
          }, { status: 400 });
        }
      }

      const currentCompany = await getCompanyByNumber(corporate_number);
      const isOwner = isRequestAdmin || await isUserCompanyOwner(requester_email, corporate_number);

      // Check if email_address is being changed/updated
      const currentEmail = (currentCompany?.email_address || "").trim().toLowerCase();
      const newEmail = (activeUpdates.email_address || "").trim().toLowerCase();
      const isEmailChanging = Boolean(newEmail && newEmail !== currentEmail);

      // RULE 1: Sửa email bắt buộc nhập OTP gửi về chính email mới đó (Admin bypasses OTP)
      if (isEmailChanging && !isRequestAdmin) {
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

      // RULE 2: SĐT sửa KHÔNG CẦN THIẾT nhận OTP!
      // (activeUpdates.phone_number does not require any OTP)

      // Build summary of changes
      const updateDescriptions: string[] = [];
      for (const [k, v] of Object.entries(activeUpdates)) {
        updateDescriptions.push(`${k}: ${v}`);
      }
      const summaryMsg = updateDescriptions.join(", ");

      // SUB-CASE B0: If verified company owner or Admin -> AUTO-APPROVE IMMEDIATELY
      if (isOwner) {
        const inqResult = await createInquiry(
          corporate_number,
          company_name,
          "update",
          requester_email,
          person_in_charge,
          mobile_number,
          isRequestAdmin 
            ? `【管理者直接即時反映】更新項目: [${summaryMsg}]`
            : `【公式オーナー即時更新】更新項目: [${summaryMsg}]`,
          ip,
          "auto_approved"
        );

        for (const [field, newVal] of Object.entries(activeUpdates)) {
          const oldVal = currentCompany ? (currentCompany as any)[field] || null : null;
          await updateCompanyField(corporate_number, field, newVal);
          await saveCompanyEditHistory(
            corporate_number,
            company_name,
            field,
            oldVal,
            newVal,
            requester_email,
            inqResult.id,
            "auto_approved"
          );
        }

        try {
          revalidatePath(`/[locale]/company/${corporate_number}`, 'page');
          revalidatePath(`/ja/company/${corporate_number}`);
          revalidatePath(`/vi/company/${corporate_number}`);
          revalidatePath(`/en/company/${corporate_number}`);
        } catch (e) {
          console.warn("revalidatePath warning in inquiry:", e);
        }

        // Send confirmation email
        const emailSubject = `【kigyou-list】企業情報の更新が完了いたしました（公式オーナー更新）`;
        const updatedListHtml = Object.entries(activeUpdates)
          .map(([k, v]) => `<div><strong>${k}:</strong> ${v}</div>`)
          .join("");
        const emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">【kigyou-list】企業情報の更新完了</h2>
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              平素より「kigyou-list」をご利用いただきありがとうございます。<br /><br />
              公式オーナー様による以下の企業情報更新が即座に反映されました。
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px; line-height: 1.8;">
              <div><strong>対象企業名:</strong> ${company_name}</div>
              <div><strong>法人番号:</strong> ${corporate_number}</div>
              <div style="margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
                ${updatedListHtml}
              </div>
              <div style="margin-top: 8px; color: #64748b;"><strong>更新日時:</strong> ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</div>
            </div>
          </div>
        `;
        await sendNotificationEmail(requester_email, emailSubject, emailHtml);
        if (isEmailChanging && newEmail && newEmail !== requester_email.toLowerCase()) {
          await sendNotificationEmail(newEmail, emailSubject, emailHtml);
        }

        return NextResponse.json({
          success: true,
          auto_approved: true,
          type: "update",
          message: isRequestAdmin
            ? (locale === "vi" 
                ? "Thông tin doanh nghiệp đã được cập nhật trực tiếp vào cơ sở dữ liệu bởi Quản trị viên (Không cần OTP / Phê duyệt)!" 
                : "管理者特権により、企業情報がデータベースに直接更新・反映されました（承認・OTP不要）。")
            : (locale === "vi"
                ? "Thông tin doanh nghiệp đã được cập nhật thành công!"
                : "企業情報が正常に更新されました。")
        });
      }

      // SUB-CASE FOR PUBLIC PROPOSALS (Requires matching official website or manual admin review)
      if (!website_url.trim()) {
        return NextResponse.json({
          error: locale === "vi" 
            ? "Vui lòng nhập URL website chính thức để đối chiếu (bắt buộc)." 
            : "照合用公式ウェブサイトURLを入力してください（必須）。"
        }, { status: 400 });
      }

      // Determine website to verify against
      const targetWebsite = website_url.trim();
      let isVerified = false;

      // Rule: Check targetWebsite
      if (targetWebsite) {
        try {
          let crawlUrl = targetWebsite;
          if (!/^https?:\/\//i.test(crawlUrl)) {
            crawlUrl = `https://${crawlUrl}`;
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 7000);
          const webRes = await fetch(crawlUrl, {
            signal: controller.signal,
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) KigyouListBot/1.0",
              "Accept": "text/html,application/xhtml+xml"
            }
          });
          clearTimeout(timeoutId);

          if (webRes.ok || webRes.status === 403 || webRes.status === 301 || webRes.status === 302) {
            if (updateKeys.length === 1 && updateKeys[0] === "website_url") {
              isVerified = true;
            } else {
              const html = await webRes.text();
              let matchedCount = 0;
              let checkedCount = 0;

              for (const [key, val] of Object.entries(activeUpdates)) {
                if (key === "website_url") {
                  matchedCount++;
                  checkedCount++;
                } else if (key === "phone_number" || key === "fax_number") {
                  checkedCount++;
                  const digits = val.replace(/\D/g, "");
                  const cleanHtml = html.replace(/[-\s()]/g, "");
                  if (digits.length >= 8 && cleanHtml.includes(digits)) {
                    matchedCount++;
                  }
                } else if (key === "email_address") {
                  checkedCount++;
                  if (html.toLowerCase().includes(val.toLowerCase())) {
                    matchedCount++;
                  }
                } else if (key === "representative_name") {
                  checkedCount++;
                  const cleanRep = val.replace(/\s+/g, "");
                  if (cleanRep.length >= 2 && html.replace(/\s+/g, "").includes(cleanRep)) {
                    matchedCount++;
                  }
                } else {
                  checkedCount++;
                  if (html.includes(val)) {
                    matchedCount++;
                  }
                }
              }

              if (checkedCount > 0 && matchedCount > 0) {
                isVerified = true;
              }
            }
          }
        } catch (crawlErr) {
          console.warn("Website crawl error in inquiry verify:", crawlErr);
          isVerified = false;
        }
      }

      // SUB-CASE B1: MATCHED -> AUTO APPROVE ALL FIELDS
      if (isVerified) {
        const inqResult = await createInquiry(
          corporate_number,
          company_name,
          "update",
          requester_email,
          person_in_charge,
          mobile_number,
          `【自動承認】更新項目: [${summaryMsg}], 参照URL: ${targetWebsite}`,
          ip,
          "auto_approved"
        );

        // Update each field in DB & save history
        for (const [field, newVal] of Object.entries(activeUpdates)) {
          const oldVal = currentCompany ? (currentCompany as any)[field] || null : null;
          await updateCompanyField(corporate_number, field, newVal);
          await saveCompanyEditHistory(
            corporate_number,
            company_name,
            field,
            oldVal,
            newVal,
            requester_email,
            inqResult.id,
            "auto_approved"
          );
        }

        // Send confirmation email
        const emailSubject = `【kigyou-list】貴社の情報更新が完了いたしました（自動承認）`;
        const updatedListHtml = Object.entries(activeUpdates).map(([k, v]) => `<div><strong>${k}:</strong> ${v}</div>`).join("");
        const emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">【kigyou-list】企業情報の更新完了</h2>
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              平素より「kigyou-list」をご利用いただきありがとうございます。<br /><br />
              ウェブサイトとの照合が完了し、以下の企業情報が正常に自動更新されました。
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px; line-height: 1.8;">
              <div><strong>対象企業名:</strong> ${company_name}</div>
              <div><strong>法人番号:</strong> ${corporate_number}</div>
              <div style="margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
                ${updatedListHtml}
              </div>
              <div style="margin-top: 8px; color: #64748b;"><strong>更新日時:</strong> ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</div>
            </div>
            <p style="font-size: 12px; color: #64748b;">
              kigyou-listをご利用いただき誠にありがとうございます。
            </p>
          </div>
        `;
        await sendNotificationEmail(requester_email, emailSubject, emailHtml);

        return NextResponse.json({
          success: true,
          auto_approved: true,
          type: "update",
          message: locale === "vi" 
            ? "Thông tin đã được đối chiếu với website và cập nhật thành công!" 
            : "ウェブサイトとの照合が完了し、入力された各情報が自動更新されました。"
        });
      } 
      // SUB-CASE B2: MISMATCH -> HOLD FOR ADMIN MANUAL REVIEW
      else {
        const inqResult = await createInquiry(
          corporate_number,
          company_name,
          "update",
          requester_email,
          person_in_charge,
          mobile_number,
          `【自動照合不一致・要確認】更新項目: [${summaryMsg}], 参照URL: ${targetWebsite} - 備考: ${message}`,
          ip,
          "pending"
        );

        for (const [field, newVal] of Object.entries(activeUpdates)) {
          const oldVal = currentCompany ? (currentCompany as any)[field] || null : null;
          await saveCompanyEditHistory(
            corporate_number,
            company_name,
            field,
            oldVal,
            newVal,
            requester_email,
            inqResult.id,
            "pending_review"
          );
        }

        return NextResponse.json({
          success: true,
          auto_approved: false,
          type: "update",
          message: locale === "vi"
            ? "Yêu cầu đã được tiếp nhận. Do chưa tìm thấy đối chiếu khớp trên website, ban quản trị sẽ xem xét và duyệt trong thời gian sớm nhất."
            : "リクエストを受け付けました。ウェブサイトとの自動照合で一致を確認できなかったため、管理者の確認後に反映されます。"
        });
      }
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error: any) {
    console.error("Error in /api/inquiry POST:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
