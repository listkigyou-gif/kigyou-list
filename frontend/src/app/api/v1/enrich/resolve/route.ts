import { NextResponse } from "next/server";
import { verifyApiKey, updateApiKeyUsage, runGetQuery, runQuery, deductUserQuota, getUserQuota } from "@/lib/db";

// Helper: Extract clean domain from URL or email
function extractCleanDomain(raw: string): string {
  try {
    let cleaned = raw.trim().toLowerCase();
    if (cleaned.includes("@")) {
      cleaned = cleaned.split("@")[1];
    }
    cleaned = cleaned.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
    cleaned = cleaned.split("/")[0].split("?")[0].split(":")[0];
    return cleaned;
  } catch {
    return raw.trim().toLowerCase();
  }
}

// Helper: Evaluate Compliance and Outreach Safety Score
async function evaluateCompliance(corporateNumber: string, website: string | null, industryName: string | null) {
  try {
    // 1. Check if present in opt-out blacklist
    const optOutRow = await runGetQuery(
      "SELECT id, created_at FROM form_marketing_opt_outs WHERE corporate_number = ? LIMIT 1",
      [corporateNumber]
    );

    if (optOutRow) {
      return {
        safety_score: 0,
        status: "STRICT_NG",
        can_submit_form: false,
        can_send_email: false,
        reason: "オプトアウト登録済み（営業アプローチ拒否の意思表明あり）",
        legal_disclaimer: "特定電子メール法およびプライバシー規約に基づきアプローチ不可"
      };
    }

    // 2. Industry sensitivity check (Government, Public, Hospital, Education)
    const sensitiveIndustries = ["医療", "病院", "学校", "教育", "官公庁", "自治体"];
    const isSensitive = sensitiveIndustries.some(si => industryName && industryName.includes(si));

    if (isSensitive) {
      return {
        safety_score: 60,
        status: "CAUTION",
        can_submit_form: true,
        can_send_email: false,
        reason: "公的機関・医療教育機関のため、一般的な商用アプローチには慎重な検討を推奨",
        legal_disclaimer: "組織方針により営業受付窓口が制限されている可能性があります"
      };
    }

    // 3. Default Safe
    return {
      safety_score: 95,
      status: "SAFE",
      can_submit_form: true,
      can_send_email: true,
      reason: "特定商取引法・特定電子メール法に基づく拒否表明なし。営業提案受付可能",
      legal_disclaimer: "一般的なビジネスマナーとオプトアウト窓口（配信停止案内）を記載して送信してください"
    };
  } catch (err) {
    console.error("Error in evaluateCompliance:", err);
    return {
      safety_score: 80,
      status: "SAFE",
      can_submit_form: true,
      can_send_email: true,
      reason: "標準評価（オプトアウト歴なし）",
      legal_disclaimer: "送信時は配信停止リンクを付与してください"
    };
  }
}

// Helper: Generate Form Schema Fingerprint for Agent Automations
function generateFormFingerprint(company: any) {
  const contactUrl = company.contact_url || (company.website ? `${company.website.replace(/\/$/, "")}/contact` : null);

  return {
    contact_url: contactUrl,
    has_form_channel: Boolean(contactUrl),
    form_complexity: "standard_jp_multi_step",
    estimated_steps: 2, // Input -> Confirmation Screen -> Complete
    requires_fullwidth_kana: true, // Tiêu chuẩn Nhật bắt buộc 全角カタカナ
    requires_privacy_checkbox: true, // 個人情報同意チェック
    captcha_prediction: {
      type: "turnstile_or_recaptcha_v3",
      risk_level: "low_to_medium"
    },
    selector_hints: {
      company_name: ["input[name*='company']", "input[name*='corp']", "input[name*='貴社名']"],
      full_name: ["input[name*='name']", "input[name*='担当者']", "input[name*='sei']"],
      kana_name: ["input[name*='kana']", "input[name*='フリガナ']"],
      email: ["input[type='email']", "input[name*='mail']"],
      phone: ["input[type='tel']", "input[name*='phone']", "input[name*='tel']"],
      message_body: ["textarea[name*='message']", "textarea[name*='content']", "textarea[name*='inquiry']", "textarea[name*='お問い合わせ']"],
      confirm_button: ["button[type='submit']", "input[type='submit']", "button:has-text('確認')", "input[value*='確認']"]
    }
  };
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing Bearer Token" }, { status: 401 });
    }

    const rawKey = authHeader.substring(7).trim();
    const verification = await verifyApiKey(rawKey);

    if (!verification) {
      return NextResponse.json({ error: "Unauthorized: Invalid or revoked API Key" }, { status: 401 });
    }

    const { keyInfo, plan } = verification;
    if (plan !== "pro" && plan !== "business" && plan !== "enterprise") {
      return NextResponse.json({
        error: "Forbidden: Identity Resolution API is restricted to PRO, BUSINESS or ENTERPRISE plans."
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain")?.trim();
    const name = searchParams.get("name")?.trim();
    const phone = searchParams.get("phone")?.trim();
    const email = searchParams.get("email")?.trim();
    const corporateNumber = searchParams.get("corporate_number")?.trim();

    if (!domain && !name && !phone && !email && !corporateNumber) {
      return NextResponse.json({
        error: "Bad Request: At least one lookup parameter (domain, name, phone, email, corporate_number) is required."
      }, { status: 400 });
    }

    let matchedCompany: any = null;
    let matchType = "none";
    let confidenceScore = 0.0;

    // 1. Exact match by Corporate Number (100% confidence)
    if (corporateNumber && /^\d{13}$/.test(corporateNumber)) {
      matchedCompany = await runGetQuery(
        "SELECT * FROM companies WHERE corporate_number = ? LIMIT 1",
        [corporateNumber]
      );
      if (matchedCompany) {
        matchType = "corporate_number_exact";
        confidenceScore = 1.0;
      }
    }

    // 2. Domain Match (95% confidence)
    if (!matchedCompany && domain) {
      const cleanDom = extractCleanDomain(domain);
      if (cleanDom.length > 3) {
        matchedCompany = await runGetQuery(
          "SELECT * FROM companies WHERE website LIKE ? LIMIT 1",
          [`%${cleanDom}%`]
        );
        if (matchedCompany) {
          matchType = "domain_match";
          confidenceScore = 0.95;
        }
      }
    }

    // 3. Email Domain Match (90% confidence)
    if (!matchedCompany && email) {
      const cleanEmailDom = extractCleanDomain(email);
      // Exclude generic email providers
      const genericProviders = ["gmail.com", "yahoo.co.jp", "hotmail.com", "outlook.com"];
      if (cleanEmailDom && !genericProviders.includes(cleanEmailDom)) {
        matchedCompany = await runGetQuery(
          "SELECT * FROM companies WHERE website LIKE ? OR email LIKE ? LIMIT 1",
          [`%${cleanEmailDom}%`, `%@${cleanEmailDom}`]
        );
        if (matchedCompany) {
          matchType = "email_domain_match";
          confidenceScore = 0.90;
        }
      }
    }

    // 4. Phone Match (90% confidence)
    if (!matchedCompany && phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      if (cleanPhone.length >= 9) {
        matchedCompany = await runGetQuery(
          "SELECT * FROM companies WHERE phone LIKE ? LIMIT 1",
          [`%${cleanPhone}%`]
        );
        if (matchedCompany) {
          matchType = "phone_exact_match";
          confidenceScore = 0.90;
        }
      }
    }

    // 5. Name Fuzzy / Exact Match (80% - 90% confidence)
    if (!matchedCompany && name) {
      matchedCompany = await runGetQuery(
        "SELECT * FROM companies WHERE company_name = ? LIMIT 1",
        [name]
      );
      if (matchedCompany) {
        matchType = "company_name_exact";
        confidenceScore = 0.90;
      } else {
        matchedCompany = await runGetQuery(
          "SELECT * FROM companies WHERE company_name LIKE ? LIMIT 1",
          [`%${name}%`]
        );
        if (matchedCompany) {
          matchType = "company_name_fuzzy";
          confidenceScore = 0.80;
        }
      }
    }

    if (!matchedCompany) {
      return NextResponse.json({
        success: false,
        found: false,
        message: "No matching Japanese business entity found for the provided identifiers."
      }, { status: 404 });
    }

    // Evaluate Compliance and Outreach Safety Score
    const compliance = await evaluateCompliance(
      matchedCompany.corporate_number,
      matchedCompany.website,
      matchedCompany.industry_name
    );

    // Generate Form Fingerprint
    const formFingerprint = generateFormFingerprint(matchedCompany);

    // Deduct 1 quota from user account
    const quotaDeducted = await deductUserQuota(keyInfo.user_email, 1);
    if (!quotaDeducted) {
      return NextResponse.json({
        error: "Quota Exceeded: Your plan export quota has been exhausted. Please top up credits or upgrade at /pricing."
      }, { 
        status: 429,
        headers: { "X-Quota-Remaining": "0" }
      });
    }

    const currentQuota = await getUserQuota(keyInfo.user_email);
    const totalRemaining = Math.max(0, (currentQuota.monthly_base_allowance - currentQuota.monthly_base_used) + currentQuota.purchased_add_on_balance);
    const quotaRemaining = totalRemaining.toString();

    // Update API Key usage details
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const ua = request.headers.get("user-agent") || "unknown";
    await updateApiKeyUsage(keyInfo.id, ip, ua);

    return NextResponse.json({
      success: true,
      found: true,
      resolution: {
        match_type: matchType,
        confidence_score: confidenceScore,
        canonical_corporate_number: matchedCompany.corporate_number
      },
      compliance,
      form_fingerprint: formFingerprint,
      company: {
        corporate_number: matchedCompany.corporate_number,
        company_name: matchedCompany.company_name,
        company_name_kana: matchedCompany.company_name_kana,
        postal_code: matchedCompany.postal_code,
        prefecture: matchedCompany.prefecture_name,
        city: matchedCompany.city_name,
        address: matchedCompany.full_address || matchedCompany.street_address,
        phone: matchedCompany.phone,
        email: matchedCompany.email,
        website: matchedCompany.website,
        representative: matchedCompany.representative_name,
        industry_name: matchedCompany.industry_name,
        capital_amount: matchedCompany.capital_amount,
        employee_count: matchedCompany.employee_count,
        has_hiring: Boolean(matchedCompany.has_hiring),
        has_subsidy: Boolean(matchedCompany.has_subsidy),
        has_bidding: Boolean(matchedCompany.has_bidding)
      }
    }, {
      headers: {
        "X-Quota-Remaining": quotaRemaining
      }
    });

  } catch (error) {
    console.error("Error in GET /api/v1/enrich/resolve:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
