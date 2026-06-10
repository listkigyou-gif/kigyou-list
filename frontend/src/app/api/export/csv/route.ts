import { NextResponse } from "next/server";
import { 
  getUserQuota, deductUserQuota, searchCompaniesAll, 
  createExportJob, updateExportJobStatus, SearchFilters,
  getRecentExportJobs
} from "@/lib/db";
import { uploadFileToR2 } from "@/lib/r2";
import JSZip from "jszip";
import { auth } from "@/auth";

// Helper to escape CSV cell contents safely
function escapeCSVField(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const email = session.user.email;
    const { keyword = "", filters = {}, totalCount } = await request.json();
    
    // Extract Client IP and User Agent for audit logging/dispute proof
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";

    if (totalCount === undefined || typeof totalCount !== "number" || totalCount <= 0) {
      return NextResponse.json({ error: "Invalid totalCount parameter" }, { status: 400 });
    }

    // Sanitize filters
    const sanitizedFilters: SearchFilters = {};
    if (filters) {
      if (filters.prefecture_code && /^\d{2}$/.test(filters.prefecture_code)) {
        sanitizedFilters.prefecture_code = filters.prefecture_code;
      }
      if (filters.city_name && typeof filters.city_name === 'string') {
        sanitizedFilters.city_name = filters.city_name;
      }
      if (filters.industry_code && (/^[A-Z]$/.test(filters.industry_code) || /^\d{2}$/.test(filters.industry_code))) {
        sanitizedFilters.industry_code = filters.industry_code;
      }
      if (filters.min_employees !== undefined) {
        const val = parseInt(filters.min_employees, 10);
        if (!isNaN(val) && val >= 0) sanitizedFilters.min_employees = val;
      }
      if (filters.max_employees !== undefined) {
        const val = parseInt(filters.max_employees, 10);
        if (!isNaN(val) && val >= 0) sanitizedFilters.max_employees = val;
      }
      if (filters.min_capital !== undefined) {
        const val = parseInt(filters.min_capital, 10);
        if (!isNaN(val) && val >= 0) sanitizedFilters.min_capital = val;
      }
      if (filters.max_capital !== undefined) {
        const val = parseInt(filters.max_capital, 10);
        if (!isNaN(val) && val >= 0) sanitizedFilters.max_capital = val;
      }
      if (filters.has_hiring === true) sanitizedFilters.has_hiring = true;
      if (filters.has_subsidy === true) sanitizedFilters.has_subsidy = true;
      if (filters.has_bidding === true) sanitizedFilters.has_bidding = true;
      if (filters.has_award === true) sanitizedFilters.has_award = true;
      if (filters.has_certification === true) sanitizedFilters.has_certification = true;
      if (filters.has_patent === true) sanitizedFilters.has_patent = true;
      
      if (filters.min_establishment_year !== undefined) {
        const val = parseInt(filters.min_establishment_year, 10);
        if (!isNaN(val) && val >= 1000 && val <= 2100) sanitizedFilters.min_establishment_year = val;
      }
      if (filters.max_establishment_year !== undefined) {
        const val = parseInt(filters.max_establishment_year, 10);
        if (!isNaN(val) && val >= 1000 && val <= 2100) sanitizedFilters.max_establishment_year = val;
      }
      if (filters.min_sales !== undefined) {
        const val = parseInt(filters.min_sales, 10);
        if (!isNaN(val) && val >= 0) sanitizedFilters.min_sales = val;
      }
      if (filters.max_sales !== undefined) {
        const val = parseInt(filters.max_sales, 10);
        if (!isNaN(val) && val >= 0) sanitizedFilters.max_sales = val;
      }
      if (filters.has_email === true) sanitizedFilters.has_email = true;
      if (filters.has_phone === true) sanitizedFilters.has_phone = true;
      if (filters.has_website === true) sanitizedFilters.has_website = true;
      if (filters.has_fax === true) sanitizedFilters.has_fax = true;
      
      if (filters.company_status && ["活動中", "閉鎖", "解散"].includes(filters.company_status)) {
        sanitizedFilters.company_status = filters.company_status;
      }
      
      if (filters.min_operating_income !== undefined) {
        const val = parseFloat(filters.min_operating_income);
        if (!isNaN(val)) sanitizedFilters.min_operating_income = val;
      }
      if (filters.max_operating_income !== undefined) {
        const val = parseFloat(filters.max_operating_income);
        if (!isNaN(val)) sanitizedFilters.max_operating_income = val;
      }
      if (filters.min_ordinary_income !== undefined) {
        const val = parseFloat(filters.min_ordinary_income);
        if (!isNaN(val)) sanitizedFilters.min_ordinary_income = val;
      }
      if (filters.max_ordinary_income !== undefined) {
        const val = parseFloat(filters.max_ordinary_income);
        if (!isNaN(val)) sanitizedFilters.max_ordinary_income = val;
      }
      if (filters.min_net_income !== undefined) {
        const val = parseFloat(filters.min_net_income);
        if (!isNaN(val)) sanitizedFilters.min_net_income = val;
      }
      if (filters.max_net_income !== undefined) {
        const val = parseFloat(filters.max_net_income);
        if (!isNaN(val)) sanitizedFilters.max_net_income = val;
      }
    }

    // 1. Quota Verification and Account Status
    const quota = await getUserQuota(email);

    // Block account if suspended
    if (quota && quota.subscription_status === 'suspended') {
      return NextResponse.json({ error: "account_suspended" }, { status: 403 });
    }

    // 2. Export Rate Limit Check (max 5 exports in 10 minutes)
    const recentJobs = await getRecentExportJobs(email, 10);
    if (recentJobs && recentJobs.length >= 5) {
      return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429 });
    }

    const isFreePlan = (quota.plan === 'free');
    const remaining = (quota.monthly_base_allowance - quota.monthly_base_used) + (isFreePlan ? 0 : quota.purchased_add_on_balance);

    if (remaining < totalCount) {
      return NextResponse.json({ 
        error: "insufficient_quota", 
        remaining,
        required: totalCount 
      }, { status: 403 });
    }

    // Header array for Excel dynamic mapping
    const headers = [
      "法人番号", "企業名", "都道府県", "郵便番号", "住所", 
      "代表者名", "資本金", "従業員数", "売上高", 
      "電話番号", "メールアドレス", "Website", "ステータス"
    ];

    const jobId = `job_${Date.now()}`;

    // =============================================================
    // MECHANISM A: Synchronous Zipped Download (< 5,000 records)
    // =============================================================
    if (totalCount <= 5000) {
      // 1. Deduct user quota first
      const deducted = await deductUserQuota(email, totalCount);
      if (!deducted) {
        return NextResponse.json({ error: "insufficient_quota" }, { status: 403 });
      }

      // 2. Fetch all matching companies
      const companies = await searchCompaniesAll(keyword, sanitizedFilters);

      // 3. Format CSV content
      const csvHeader = headers.map(escapeCSVField).join(",") + "\n";
      let csvBody = "";
      
      for (const c of companies) {
        const row = [
          c.corporate_number,
          c.company_name,
          c.prefecture_name || "",
          c.postal_code || "",
          c.full_address || "",
          c.representative_name || "",
          c.capital_amount !== null ? c.capital_amount : "",
          c.employee_count !== null ? c.employee_count : "",
          c.sales_amount !== null ? c.sales_amount : "",
          c.phone_number || "",
          c.email_address || "",
          c.website_url || "",
          c.status
        ].map(escapeCSVField).join(",");
        csvBody += row + "\n";
      }

      // Prepend BOM (\uFEFF) to make it open flawlessly in Microsoft Excel Japanese version
      const csvContent = "\uFEFF" + csvHeader + csvBody;

      // Zip the CSV content
      const zip = new JSZip();
      zip.file(`kigyou_list_${jobId}.csv`, csvContent);
      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      // Upload ZIP to R2 (or local fallback)
      const zipKey = `exports/${jobId}.zip`;
      const filePath = await uploadFileToR2(zipKey, zipBuffer, "application/zip");

      // Save job record to db as completed with IP/UA evidence
      await createExportJob(jobId, email, JSON.stringify({ ...sanitizedFilters, keyword }), totalCount, ipAddress, userAgent);
      await updateExportJobStatus(jobId, "completed", filePath, null);

      return NextResponse.json({
        success: true,
        jobId,
        isAsync: false,
        downloadUrl: `/api/export/download?id=${jobId}&email=${encodeURIComponent(email)}`,
        message: "CSVファイルの書き出しが完了しました。"
      });
    }

    // =============================================================
    // MECHANISM B: Asynchronous Background Scheduler (>= 5,000 records)
    // =============================================================
    // Save job record to db as pending with IP/UA evidence
    await createExportJob(jobId, email, JSON.stringify({ ...sanitizedFilters, keyword }), totalCount, ipAddress, userAgent);

    // Self-invoking async function inside Node context (does not block HTTP response thread)
    (async () => {
      try {
        await updateExportJobStatus(jobId, "processing", null, null);

        const companies = await searchCompaniesAll(keyword, sanitizedFilters);

        const csvHeader = headers.map(escapeCSVField).join(",") + "\n";
        let csvBody = "";
        
        for (const c of companies) {
          const row = [
            c.corporate_number,
            c.company_name,
            c.prefecture_name || "",
            c.postal_code || "",
            c.full_address || "",
            c.representative_name || "",
            c.capital_amount !== null ? c.capital_amount : "",
            c.employee_count !== null ? c.employee_count : "",
            c.sales_amount !== null ? c.sales_amount : "",
            c.phone_number || "",
            c.email_address || "",
            c.website_url || "",
            c.status
          ].map(escapeCSVField).join(",");
          csvBody += row + "\n";
        }

        const csvContent = "\uFEFF" + csvHeader + csvBody;

        // Zip the CSV content
        const zip = new JSZip();
        zip.file(`kigyou_list_${jobId}.csv`, csvContent);
        const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

        // Upload ZIP to R2 (or local fallback)
        const zipKey = `exports/${jobId}.zip`;
        const filePath = await uploadFileToR2(zipKey, zipBuffer, "application/zip");

        // Deduct from DB quota
        await deductUserQuota(email, totalCount);

        await updateExportJobStatus(jobId, "completed", filePath, null);
        console.log(`[Phase 5 Worker] Job ${jobId} completed successfully. Saved to ${filePath}`);
      } catch (err: any) {
        console.error(`[Phase 5 Worker] Job ${jobId} failed:`, err);
        await updateExportJobStatus(jobId, "failed", null, err.message || String(err));
      }
    })();

    return NextResponse.json({
      success: true,
      jobId,
      isAsync: true,
      message: "大量データのエクスポート処理がバックグラウンドで開始されました。ダウンロード履歴より進捗をご確認ください。"
    });

  } catch (error) {
    console.error("Error in /api/export/csv route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
