import { NextResponse } from "next/server";
import { 
  resolveInquiry, 
  hideCompany, 
  unhideCompany, 
  logAdminAction, 
  updateCompanyField,
  getCompanyEditHistoriesByInquiryId,
  runQuery
} from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";
import { revalidatePath } from "next/cache";

async function sendNotificationEmail(
  toEmail: string, 
  subject: string, 
  htmlContent: string
) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Kigyou List <auth@kigyoulist.com>";
  if (!resendApiKey || !toEmail) return;

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
    console.error("Error sending admin notification email via Resend:", err);
  }
}

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const id = body.id || body.inquiryId;
    const action = body.action;
    const corporate_number = body.corporate_number || body.corporateNumber;
    const reason = body.reason || "";
    const requester_email = body.requester_email || "";
    const company_name = body.company_name || "";

    if (!id || !action) {
      return NextResponse.json({ error: "IDまたはアクションが不足しています。" }, { status: 400 });
    }

    const adminEmail = request.headers.get("x-admin-email") || "unknown_admin@gmail.com";
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
    const userAgent = request.headers.get("user-agent") || null;

    // 1. ACTION: APPROVE_UPDATE (Apply all proposed changes to DB)
    if (action === "approve_update") {
      const editHistories = await getCompanyEditHistoriesByInquiryId(id);
      
      if (corporate_number && corporate_number !== "N/A" && editHistories.length > 0) {
        for (const item of editHistories) {
          if (item.field_name && item.new_value !== undefined && item.new_value !== null) {
            await updateCompanyField(corporate_number, item.field_name, item.new_value);
          }
        }

        // Update status of edit history items to approved
        await runQuery(
          "UPDATE company_edit_history SET status = 'approved' WHERE inquiry_id = ?",
          [id]
        );
      }

      await resolveInquiry(id, "resolved");

      // Revalidate cache
      if (corporate_number) {
        try {
          revalidatePath(`/ja/company/${corporate_number}`);
          revalidatePath(`/en/company/${corporate_number}`);
          revalidatePath(`/vi/company/${corporate_number}`);
        } catch (e) {
          console.warn("revalidatePath error in approve_update:", e);
        }
      }

      await logAdminAction(
        adminEmail,
        "APPROVE_COMPANY_UPDATE",
        corporate_number || id,
        { id, fieldCount: editHistories.length },
        ipAddress,
        userAgent
      );

      // Send email notification to applicant
      if (requester_email) {
        const changeRowsHtml = editHistories
          .map((h: any) => `<tr><td style="padding: 6px 12px; border: 1px solid #e2e8f0; font-weight: bold;">${h.field_name}</td><td style="padding: 6px 12px; border: 1px solid #e2e8f0; color: #16a34a;">${h.new_value}</td></tr>`)
          .join("");

        await sendNotificationEmail(
          requester_email,
          `【Kigyou-List】企業情報更新の承認完了のお知らせ（${company_name || corporate_number}）`,
          `
            <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
              <h2 style="font-size: 16px; color: #0f172a; margin-top: 0;">【Kigyou-List】掲載情報の更新を承認いたしました</h2>
              <p style="font-size: 13px; color: #334155; line-height: 1.6;">
                いつもKigyou-Listをご利用いただきありがとうございます。<br />
                ご申請いただきました以下の企業情報につきまして、管理者による審査が完了し、本番サイトへ正常に反映されました。
              </p>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin: 16px 0;">
                <thead>
                  <tr style="background: #f8fafc;">
                    <th style="padding: 6px 12px; border: 1px solid #e2e8f0; text-align: left;">項目</th>
                    <th style="padding: 6px 12px; border: 1px solid #e2e8f0; text-align: left;">更新内容</th>
                  </tr>
                </thead>
                <tbody>
                  ${changeRowsHtml || '<tr><td colspan="2" style="padding: 6px 12px; border: 1px solid #e2e8f0;">申請内容の更新が完了しました。</td></tr>'}
                </tbody>
              </table>
              <div style="text-align: center; margin-top: 20px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://kigyoulist.com'}/ja/company/${corporate_number}" style="display: inline-block; padding: 10px 20px; background: #1B4F8A; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: bold;">企業ページを確認する</a>
              </div>
            </div>
          `
        );
      }

      return NextResponse.json({ success: true, message: "企業情報の更新を承認し、データベースへ反映しました。" });
    }

    // 2. ACTION: REJECT (Reject update or request with reason)
    if (action === "reject") {
      await runQuery(
        "UPDATE company_edit_history SET status = 'rejected' WHERE inquiry_id = ?",
        [id]
      );
      await resolveInquiry(id, "rejected");

      await logAdminAction(
        adminEmail,
        "REJECT_INQUIRY",
        corporate_number || id,
        { id, reason },
        ipAddress,
        userAgent
      );

      // Send rejection notification email
      if (requester_email) {
        await sendNotificationEmail(
          requester_email,
          `【Kigyou-List】申請内容の審査結果について（${company_name || corporate_number}）`,
          `
            <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
              <h2 style="font-size: 16px; color: #0f172a; margin-top: 0;">【Kigyou-List】申請内容の審査結果のご連絡</h2>
              <p style="font-size: 13px; color: #334155; line-height: 1.6;">
                いつもKigyou-Listをご利用いただきありがとうございます。<br />
                ご申請いただきました内容につきまして確認させていただきましたが、誠に恐縮ながら以下の理由により今回は反映を見送らせていただきました。
              </p>
              <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #9f1239; margin: 16px 0;">
                <strong>見送り理由・確認事項:</strong><br />
                ${reason || "公的登記情報または企業公式ウェブサイトとの一致が確認できませんでした。"}
              </div>
              <p style="font-size: 12px; color: #64748b; line-height: 1.6;">
                ※企業関係者様であることを確認できる公式メールアドレス、または公的書類を再度ご確認の上、必要に応じて再申請をお願いいたします。
              </p>
            </div>
          `
        );
      }

      return NextResponse.json({ success: true, message: "申請を却下しました。" });
    }

    // 3. ACTION: HIDE COMPANY
    if (action === "hide" && corporate_number && corporate_number !== "N/A") {
      await hideCompany(corporate_number, reason || "Hidden via Admin Dashboard");
      await resolveInquiry(id, "resolved");

      await logAdminAction(
        adminEmail,
        "HIDE_COMPANY",
        corporate_number,
        { id, reason: reason || "Hidden via Admin Dashboard" },
        ipAddress,
        userAgent
      );
      return NextResponse.json({ success: true, message: "企業を非公開に設定しました。" });
    }

    // 4. ACTION: UNHIDE COMPANY
    if (action === "unhide" && corporate_number && corporate_number !== "N/A") {
      await unhideCompany(corporate_number);
      await resolveInquiry(id, "rejected");

      await logAdminAction(
        adminEmail,
        "UNHIDE_COMPANY",
        corporate_number,
        { id },
        ipAddress,
        userAgent
      );
      return NextResponse.json({ success: true, message: "企業の非公開設定を解除しました。" });
    }

    // 5. ACTION: RESOLVE (Generic)
    if (action === "resolve") {
      await resolveInquiry(id, "resolved");

      await logAdminAction(
        adminEmail,
        "RESOLVE_INQUIRY",
        id,
        { id },
        ipAddress,
        userAgent
      );
      return NextResponse.json({ success: true, message: "お問い合わせを解決済みに設定しました。" });
    }

    return NextResponse.json({ success: true, message: "処理が完了しました。" });
  } catch (error) {
    console.error("Error in /api/admin/inquiries/resolve POST:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
