"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Send,
  Users,
  ShieldCheck,
  Ban,
  RefreshCcw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Play,
  Sparkles,
  Clock,
  Check,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { InternalFormMarketingSubTab } from "./InternalFormMarketingSubTab";

interface MarketingStats {
  total_companies_with_email: number;
  total_suppressed: number;
  total_sent: number;
  total_campaigns: number;
  top_prefectures: { prefecture_name: string; email_count: string }[];
  recent_campaigns: any[];
  industries?: { industry_code: string; industry_name: string }[];
}

interface Template {
  id: string;
  name: string;
  subject: string;
  body_html: string;
}

interface CompanyRecipient {
  corporate_number: string;
  company_name: string;
  representative_name: string | null;
  email_address: string;
  prefecture_name: string | null;
  city_name: string | null;
  website_url: string | null;
  employee_count: number | null;
}

interface MarketingTabProps {
  adminEmail: string;
  getAdminHeaders: () => Record<string, string>;
}

const I18N = {
  ja: {
    kpiDbEmails: "DB内保有メール数",
    kpiDbDesc: "メールアドレス保有の日本企業",
    kpiSentEmails: "総配信済みメール数",
    kpiSentDesc: "高い到達・配信実績",
    kpiSuppressed: "配信停止（オプトアウト）",
    kpiSuppressedDesc: "法令遵守・自動配信除外",
    kpiCampaigns: "作成済みキャンペーン",
    kpiCampaignsDesc: "ターゲット別セグメント管理",
    tabCompose: "キャンペーン作成・配信",
    tabHistory: "配信履歴",
    tabSuppressions: "配信停止リスト（オプトアウト）",
    step1Title: "1. 配信ターゲット企業の抽出",
    lblPrefecture: "都道府県",
    allJapan: (count: string) => `🇯🇵 日本全国すべて（${count}件）`,
    lblIndustry: "JSIC 産業分類",
    allIndustries: "すべての産業分類（全業種）",
    lblEmployees: "従業員規模",
    empAll: "すべての規模",
    emp10: "10名以上",
    emp30: "30名以上",
    emp50: "50名以上",
    emp100: "100名以上",
    chkWebsite: "公式Webサイトを保有する企業のみ",
    lblAntiSpam: "スパム防止：直近に配信済みの企業を除外",
    daysAgo: "日以内",
    btnCalculate: "ターゲット件数を算出",
    availableCount: (count: string) => `配信対象: ${count} 社`,
    step3Title: "3. テスト送信＆安全配信設定",
    lblTestEmail: "テストメール送信先アドレス:",
    btnSendTest: "テスト送信",
    testSuccess: (email: string) => `テストメールを ${email} に正常送信しました。受信トレイまたは迷惑メールフォルダをご確認ください。`,
    testError: "テストメール送信に失敗しました。",
    lblBatchSize: "配信バッチサイズ（1回あたり）:",
    optBatch10: "10件 / 回",
    optBatch20: "20件 / 回（推奨）",
    optBatch50: "50件 / 回",
    optBatch100: "100件 / 回",
    tokushohoNotice: "ℹ️ 特定電子メール法・特商法に基づき、各メール間に600msの間隔を設け、オプトアウト（配信停止）リンクを自動付与して安全に配信します。",
    btnStartBatch: (size: number) => `配信を開始する（${size}件）`,
    btnSendingBatch: (size: number) => `配信中（${size}件）...`,
    progressTitle: "配信進捗:",
    progressFinished: "全件配信が完了しました！",
    progressRemaining: (count: string) => `残り ${count} 社`,
    sentSuccess: "成功:",
    sentFailed: "失敗:",
    step2Title: "2. メッセージ作成（B2B敬語対応）",
    btnLivePreview: "プレビュー確認 (Live Preview)",
    lblPresetTemplates: "プリセットテンプレートを選択:",
    badgeKeigo: "敬語最適化",
    lblCampaignName: "管理用キャンペーン名",
    phCampaignName: "例: 2026年10月度 東京都新規開拓アプローチ",
    lblSubject: "メール件名 (Subject)",
    lblInsertVars: "変数の挿入（クリックで追加）:",
    lblBodyHtml: "メール本文 (HTML / テキスト)",
    historyTitle: "配信キャンペーン履歴",
    historyDesc: "配信数、送信成功・失敗の推移を確認",
    thTime: "送信日時",
    thCampaignName: "キャンペーン名",
    thSubject: "件名",
    thTargetCount: "対象件数",
    thSent: "送信成功",
    thFailed: "失敗",
    thStatus: "ステータス",
    thDetails: "詳細",
    noCampaigns: "配信キャンペーンの履歴がありません。",
    btnViewLogs: "ログ確認",
    logsModalTitle: "キャンペーン配信ログ詳細",
    noLogs: "このキャンペーンのログはありません。",
    statusSent: "送信完了",
    statusFailed: "送信失敗",
    statusCompleted: "完了",
    statusSending: "送信中",
    companyLabel: "企業",
    suppressionsTitle: "配信除外リスト（オプトアウト）",
    suppressionsDesc: "配信停止（オプトアウト）を希望された企業や無効なメールアドレスの一覧です。特定電子メール法に基づき、今後のすべての配信から恒久的に自動除外されます。",
    phSuppressionInput: "除外アドレスを入力 (例: info@example.co.jp)",
    btnAddSuppression: "除外リストに追加",
    thSuppressedAt: "登録日時",
    thEmail: "メールアドレス",
    thReason: "除外理由",
    thAction: "操作",
    noSuppressions: "除外リストに登録されたメールアドレスはありません。",
    btnRemoveSuppression: "解除",
    confirmRemoveSuppression: (email: string) => `メールアドレス「${email}」を配信除外リストから削除してもよろしいですか？`,
    alertEnterSubjectBody: "メール件名と本文を入力してください。",
    confirmBatchSend: (size: number) => `選択したターゲット企業に向けて、${size}件のB2Bメール配信を開始しますか？\n\n（ドメイン信頼性を維持するため、安全な配信間隔を設けて送信されます）`,
    alertValidEmail: "有効なメールアドレスを入力してください。",
    previewModalTitle: "送信メールプレビュー（実データ反映）",
    previewModalDesc: (name: string) => `サンプル企業の実際のデータで変数を展開しています: ${name}`,
    previewPreparing: "プレビューを生成中...",
    sampleText: "サンプル",
    btnClose: "閉じる",
    vars: [
      { label: "{{company_name}}（会社名）", tag: "{{company_name}}" },
      { label: "{{representative_name}}（代表者名）", tag: "{{representative_name}}" },
      { label: "{{prefecture}}（都道府県）", tag: "{{prefecture}}" },
      { label: "{{city}}（市区町村）", tag: "{{city}}" },
      { label: "{{corporate_number}}（法人番号）", tag: "{{corporate_number}}" },
      { label: "{{company_page_url}}（企業詳細URL）", tag: "{{company_page_url}}" },
      { label: "{{unsubscribe_url}}（配信停止URL）", tag: "{{unsubscribe_url}}" },
    ],
  },
  vi: {
    kpiDbEmails: "Email Sẵn Có Trong DB",
    kpiDbDesc: "Doanh nghiệp Nhật đã có email",
    kpiSentEmails: "Tổng Email Đã Gửi",
    kpiSentDesc: "Tỷ lệ thành công cao",
    kpiSuppressed: "Đã Hủy Nhận (Opt-out)",
    kpiSuppressedDesc: "Tự động chặn gửi vĩnh viễn",
    kpiCampaigns: "Chiến Dịch Đã Tạo",
    kpiCampaignsDesc: "Quản lý theo phân khúc",
    tabCompose: "Soạn & Bắn Chiến Dịch",
    tabHistory: "Lịch Sử Chiến Dịch",
    tabSuppressions: "Danh Sách Chặn (Opt-out)",
    step1Title: "1. Lọc Tệp Khách Hàng Mục Tiêu",
    lblPrefecture: "Tỉnh / Thành phố",
    allJapan: (count: string) => `🇯🇵 Toàn bộ Nhật Bản (${count} email)`,
    lblIndustry: "Ngành nghề JSIC",
    allIndustries: "Tất cả ngành nghề JSIC",
    lblEmployees: "Quy mô nhân sự",
    empAll: "Tất cả quy mô",
    emp10: "Từ 10 nhân viên trở lên",
    emp30: "Từ 30 nhân viên trở lên",
    emp50: "Từ 50 nhân viên trở lên",
    emp100: "Từ 100 nhân viên trở lên",
    chkWebsite: "Chỉ chọn công ty có Website chính thức",
    lblAntiSpam: "Chống Spam: Loại trừ công ty đã nhận email gần đây",
    daysAgo: "ngày qua",
    btnCalculate: "Kiểm tra số lượng mục tiêu",
    availableCount: (count: string) => `Khả dụng: ${count} công ty`,
    step3Title: "3. Gửi Thử Nghiệm & Điều Phối An Toàn",
    lblTestEmail: "Gửi 1 email test trước vào hòm thư:",
    btnSendTest: "Gửi Test",
    testSuccess: (email: string) => `Đã gửi email thử nghiệm thành công tới ${email}! Hãy kiểm tra hộp thư đến (hoặc thư mục Spam).`,
    testError: "Gửi thử nghiệm thất bại.",
    lblBatchSize: "Quy mô đợt gửi (Batch Size):",
    optBatch10: "10 emails / đợt",
    optBatch20: "20 emails / đợt (Khuyên dùng)",
    optBatch50: "50 emails / đợt",
    optBatch100: "100 emails / đợt",
    tokushohoNotice: "ℹ️ Mỗi email sẽ được gửi cách nhau 600ms và tự động kèm link Hủy nhận (オプトアウト) theo đúng quy định luật Tokushoho Nhật Bản.",
    btnStartBatch: (size: number) => `Bắt Đầu Bắn Đợt Này (${size} email)`,
    btnSendingBatch: (size: number) => `Đang gửi đợt ${size} emails...`,
    progressTitle: "Tiến độ đợt gửi:",
    progressFinished: "Hoàn thành tệp!",
    progressRemaining: (count: string) => `Còn ${count} công ty`,
    sentSuccess: "Thành công:",
    sentFailed: "Thất bại:",
    step2Title: "2. Mẫu Thư & Soạn Thảo Nội Dung (Chuẩn Keigo Nhật B2B)",
    btnLivePreview: "Xem Trước (Live Preview)",
    lblPresetTemplates: "Chọn mẫu thư tiếng Nhật có sẵn:",
    badgeKeigo: "Chuẩn Keigo",
    lblCampaignName: "Tên chiến dịch quản trị",
    phCampaignName: "VD: Giới thiệu Kigyou-List cho DN Tokyo Tháng 10",
    lblSubject: "Tiêu đề email (Subject)",
    lblInsertVars: "Bấm chèn nhanh biến cá nhân hóa:",
    lblBodyHtml: "Nội dung email (HTML / Rich text)",
    historyTitle: "Lịch Sử Các Chiến Dịch Email",
    historyDesc: "Theo dõi số lượng email đã gửi, thành công và thất bại",
    thTime: "Thời Gian",
    thCampaignName: "Tên Chiến Dịch",
    thSubject: "Tiêu Đề Email",
    thTargetCount: "Tổng Mục Tiêu",
    thSent: "Đã Gửi",
    thFailed: "Thất Bại",
    thStatus: "Trạng Thái",
    thDetails: "Chi Tiết",
    noCampaigns: "Chưa có chiến dịch nào được tạo.",
    btnViewLogs: "Xem logs",
    logsModalTitle: "Nhật Ký Gửi Thư Của Chiến Dịch",
    noLogs: "Không có nhật ký nào cho chiến dịch này.",
    statusSent: "Đã gửi",
    statusFailed: "Thất bại",
    statusCompleted: "Hoàn thành",
    statusSending: "Đang gửi",
    companyLabel: "Công ty",
    suppressionsTitle: "Danh Sách Chặn Gửi (Opt-out / Suppressions)",
    suppressionsDesc: "Các email đã bấm hủy nhận tin (配信停止) theo luật Nhật hoặc bị từ chối sẽ được lưu tại đây để vĩnh viễn không gửi lại.",
    phSuppressionInput: "chặn-email@example.co.jp",
    btnAddSuppression: "Thêm chặn thủ công",
    thSuppressedAt: "Thời Gian Chặn",
    thEmail: "Địa Chỉ Email",
    thReason: "Lý Do",
    thAction: "Thao Tác",
    noSuppressions: "Chưa có email nào trong danh sách chặn.",
    btnRemoveSuppression: "Gỡ chặn",
    confirmRemoveSuppression: (email: string) => `Xóa email ${email} khỏi danh sách chặn gửi?`,
    alertEnterSubjectBody: "Vui lòng nhập đầy đủ tiêu đề và nội dung email!",
    confirmBatchSend: (size: number) => `Xác nhận bắt đầu gửi đợt ${size} email B2B tới tệp khách hàng đã chọn?\n\n(Hệ thống sẽ gửi an toàn có giãn cách để đảm bảo uy tín tên miền)`,
    alertValidEmail: "Vui lòng nhập địa chỉ email hợp lệ!",
    previewModalTitle: "Xem Trước Email Gửi Đi (Dữ Liệu Thật)",
    previewModalDesc: (name: string) => `Đã tự động thay thế các biến bằng dữ liệu của công ty mẫu: ${name}`,
    previewPreparing: "Đang chuẩn bị bản xem trước...",
    sampleText: "Mẫu",
    btnClose: "Đóng",
    vars: [
      { label: "{{company_name}} (Tên công ty)", tag: "{{company_name}}" },
      { label: "{{representative_name}} (Đại diện)", tag: "{{representative_name}}" },
      { label: "{{prefecture}} (Tỉnh thành)", tag: "{{prefecture}}" },
      { label: "{{city}} (Thành phố)", tag: "{{city}}" },
      { label: "{{corporate_number}} (Mã số thuế)", tag: "{{corporate_number}}" },
      { label: "{{company_page_url}} (Link bài viết)", tag: "{{company_page_url}}" },
      { label: "{{unsubscribe_url}} (Link hủy)", tag: "{{unsubscribe_url}}" },
    ],
  },
};

export function MarketingTab({ adminEmail, getAdminHeaders }: MarketingTabProps) {
  let locale = "ja";
  try {
    const lang = useLanguage();
    if (lang && lang.locale) {
      locale = lang.locale;
    }
  } catch {
    // Fallback to ja if accessed outside LanguageProvider
  }
  const isVi = locale === "vi";
  const isJa = locale === "ja";
  const t = isVi ? I18N.vi : I18N.ja;

  const [subTab, setSubTab] = useState<"campaign" | "history" | "suppressions">("campaign");
  const [marketingChannel, setMarketingChannel] = useState<"email" | "form">("email");

  // Global marketing state
  const [stats, setStats] = useState<MarketingStats | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Audience filters
  const [prefecture, setPrefecture] = useState<string>("all");
  const [industryCode, setIndustryCode] = useState<string>("all");
  const [minEmployees, setMinEmployees] = useState<string>("");
  const [hasWebsite, setHasWebsite] = useState<boolean>(false);
  const [excludeDays, setExcludeDays] = useState<number>(30);
  const [calculatingCount, setCalculatingCount] = useState(false);
  const [targetCount, setTargetCount] = useState<number | null>(null);

  // Email content & templates
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("intro_kigyou_list");
  const [campaignName, setCampaignName] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [bodyHtml, setBodyHtml] = useState<string>("");

  // Live preview & test send
  const [previewData, setPreviewData] = useState<{
    subject: string;
    html: string;
    sampleCompany: CompanyRecipient | null;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [testEmail, setTestEmail] = useState<string>(adminEmail || "trungkim8694@gmail.com");
  const [sendingTest, setSendingTest] = useState(false);
  const [testMessage, setTestMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Batch Sender
  const [batchSize, setBatchSize] = useState<number>(20);
  const [isSendingBatch, setIsSendingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{
    campaignId: string | null;
    sentInBatch: number;
    failedInBatch: number;
    remaining: number;
    isFinished: boolean;
    logs: any[];
  } | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);

  // History & Suppressions
  const [campaignsList, setCampaignsList] = useState<any[]>([]);
  const [selectedCampaignLogs, setSelectedCampaignLogs] = useState<{ id: string; logs: any[] } | null>(null);
  const [suppressionsList, setSuppressionsList] = useState<any[]>([]);
  const [newSuppressionEmail, setNewSuppressionEmail] = useState("");
  const [addingSuppression, setAddingSuppression] = useState(false);

  // Fetch initial stats & templates
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/marketing/stats", {
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
        setTemplates(data.templates || []);

        if (data.templates && data.templates.length > 0 && !subject) {
          const firstTpl = data.templates[0];
          setSelectedTemplateId(firstTpl.id);
          setSubject(firstTpl.subject);
          setBodyHtml(firstTpl.body_html);
          setCampaignName(firstTpl.name);
        }
      }
    } catch (err) {
      console.error("Failed to fetch marketing stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, [getAdminHeaders, subject]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handle template selection
  const handleSelectTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const found = templates.find((t) => t.id === tplId);
    if (found) {
      setSubject(found.subject);
      setBodyHtml(found.body_html);
      setCampaignName(found.name);
    }
  };

  // Recalculate target audience count
  const handleCalculateAudience = async () => {
    setCalculatingCount(true);
    try {
      const res = await fetch("/api/admin/marketing/preview", {
        method: "POST",
        headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: {
            prefecture_name: prefecture,
            industry_code: industryCode,
            min_employees: minEmployees ? parseInt(minEmployees, 10) : undefined,
            has_website: hasWebsite,
            exclude_recent_days: excludeDays,
          },
          subject,
          body_html: bodyHtml,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTargetCount(data.total_count);
        setPreviewData({
          subject: data.rendered_subject,
          html: data.rendered_html,
          sampleCompany: data.sample_company,
        });
      }
    } catch (err) {
      console.error("Failed to calculate target count:", err);
    } finally {
      setCalculatingCount(false);
    }
  };

  // Live preview generator
  const handleOpenPreview = async () => {
    setPreviewLoading(true);
    setShowPreviewModal(true);
    try {
      const res = await fetch("/api/admin/marketing/preview", {
        method: "POST",
        headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: {
            prefecture_name: prefecture,
            industry_code: industryCode,
            min_employees: minEmployees ? parseInt(minEmployees, 10) : undefined,
            has_website: hasWebsite,
            exclude_recent_days: excludeDays,
          },
          subject,
          body_html: bodyHtml,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPreviewData({
          subject: data.rendered_subject,
          html: data.rendered_html,
          sampleCompany: data.sample_company,
        });
      }
    } catch (err) {
      console.error("Failed to load preview:", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Send single test email
  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      setTestMessage({ type: "error", text: t.alertValidEmail });
      return;
    }
    setSendingTest(true);
    setTestMessage(null);
    try {
      const res = await fetch("/api/admin/marketing/test-send", {
        method: "POST",
        headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_email: testEmail,
          subject,
          body_html: bodyHtml,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestMessage({
          type: "success",
          text: t.testSuccess(testEmail),
        });
      } else {
        setTestMessage({
          type: "error",
          text: data.error || t.testError,
        });
      }
    } catch (err: any) {
      setTestMessage({ type: "error", text: err.message || t.testError });
    } finally {
      setSendingTest(false);
    }
  };

  // Send Batch
  const handleSendBatch = async () => {
    if (!subject.trim() || !bodyHtml.trim()) {
      alert(t.alertEnterSubjectBody);
      return;
    }

    const confirmed = window.confirm(t.confirmBatchSend(batchSize));
    if (!confirmed) return;

    setIsSendingBatch(true);
    setBatchError(null);

    try {
      const res = await fetch("/api/admin/marketing/send-batch", {
        method: "POST",
        headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: batchProgress?.campaignId || undefined,
          campaign_name: campaignName || "B2B Marketing Campaign",
          subject,
          body_html: bodyHtml,
          filters: {
            prefecture_name: prefecture,
            industry_code: industryCode,
            min_employees: minEmployees ? parseInt(minEmployees, 10) : undefined,
            has_website: hasWebsite,
            exclude_recent_days: excludeDays,
          },
          batch_size: batchSize,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBatchProgress((prev) => ({
          campaignId: data.campaign_id,
          sentInBatch: (prev?.sentInBatch || 0) + data.sent_in_batch,
          failedInBatch: (prev?.failedInBatch || 0) + data.failed_in_batch,
          remaining: data.remaining,
          isFinished: data.is_finished,
          logs: [...(data.logs || []), ...(prev?.logs || [])],
        }));
        fetchStats();
      } else {
        setBatchError(data.error || "Error occurred during batch dispatch.");
      }
    } catch (err: any) {
      setBatchError(err.message || "Server connection error.");
    } finally {
      setIsSendingBatch(false);
    }
  };

  // Fetch campaign history
  const fetchCampaignsHistory = async () => {
    try {
      const res = await fetch("/api/admin/marketing/history", {
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCampaignsList(data.items || []);
      }
    } catch (err) {
      console.error("Failed to load campaigns history:", err);
    }
  };

  // Fetch campaign detail logs
  const handleViewCampaignLogs = async (campaignId: string) => {
    try {
      const res = await fetch(`/api/admin/marketing/history?campaign_id=${campaignId}`, {
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedCampaignLogs({ id: campaignId, logs: data.logs || [] });
      }
    } catch (err) {
      console.error("Failed to load campaign logs:", err);
    }
  };

  // Fetch suppressions
  const fetchSuppressions = async () => {
    try {
      const res = await fetch("/api/admin/marketing/suppressions", {
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuppressionsList(data.items || []);
      }
    } catch (err) {
      console.error("Failed to load suppressions:", err);
    }
  };

  const handleAddSuppression = async () => {
    if (!newSuppressionEmail || !newSuppressionEmail.includes("@")) {
      alert(t.alertValidEmail);
      return;
    }
    setAddingSuppression(true);
    try {
      const res = await fetch("/api/admin/marketing/suppressions", {
        method: "POST",
        headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ email: newSuppressionEmail, reason: "manual_admin" }),
      });
      if (res.ok) {
        setNewSuppressionEmail("");
        fetchSuppressions();
        fetchStats();
      }
    } finally {
      setAddingSuppression(false);
    }
  };

  const handleRemoveSuppression = async (email: string) => {
    if (!window.confirm(t.confirmRemoveSuppression(email))) return;
    try {
      const res = await fetch(`/api/admin/marketing/suppressions?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        fetchSuppressions();
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to delete suppression:", err);
    }
  };

  useEffect(() => {
    if (subTab === "history") {
      fetchCampaignsHistory();
    } else if (subTab === "suppressions") {
      fetchSuppressions();
    }
  }, [subTab]);

  // Insert variable tag into editor
  const insertVariableTag = (tag: string) => {
    setBodyHtml((prev) => prev + " " + tag + " ");
  };

  const totalCompaniesWithEmailText = stats?.total_companies_with_email != null
    ? stats.total_companies_with_email.toLocaleString()
    : "";

  return (
    <div className="flex flex-col gap-6">
      {/* Marketing Dual Channel Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100 dark:bg-slate-900/80 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMarketingChannel("email")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              marketingChannel === "email"
                ? "bg-white dark:bg-[#1C2128] text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>{isJa ? "📧 メール営業配信（Cold Email）" : "📧 Email Marketing"}</span>
          </button>

          <button
            onClick={() => setMarketingChannel("form")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              marketingChannel === "form"
                ? "bg-white dark:bg-[#1C2128] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{isJa ? "📝 問い合わせフォーム営業（Form DM）" : "📝 Form DM Marketing"}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 text-[11px] text-slate-500 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{isJa ? "アウトバウンド自動化チャネル" : "Kênh tiếp thị tự động kép"}</span>
        </div>
      </div>

      {marketingChannel === "form" ? (
        <InternalFormMarketingSubTab adminEmail={adminEmail} getAdminHeaders={getAdminHeaders} />
      ) : (
        <>
          {/* Top Marketing Stats KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.kpiDbEmails}</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {loadingStats ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              stats?.total_companies_with_email?.toLocaleString() || "0"
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">{t.kpiDbDesc}</p>
        </div>

        <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.kpiSentEmails}</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.total_sent.toLocaleString() || "0"}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{t.kpiSentDesc}</p>
        </div>

        <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.kpiSuppressed}</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Ban className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.total_suppressed.toLocaleString() || "0"}
          </div>
          <p className="text-xs text-slate-500 mt-1">{t.kpiSuppressedDesc}</p>
        </div>

        <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.kpiCampaigns}</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.total_campaigns.toLocaleString() || "0"}
          </div>
          <p className="text-xs text-slate-500 mt-1">{t.kpiCampaignsDesc}</p>
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setSubTab("campaign")}
          className={`px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${
            subTab === "campaign"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>{t.tabCompose}</span>
        </button>

        <button
          onClick={() => setSubTab("history")}
          className={`px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${
            subTab === "history"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{t.tabHistory}</span>
        </button>

        <button
          onClick={() => setSubTab("suppressions")}
          className={`px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${
            subTab === "suppressions"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Ban className="w-4 h-4" />
          <span>{t.tabSuppressions}</span>
        </button>
      </div>

      {/* SUBTAB 1: CAMPAIGN BUILDER & DISPATCHER */}
      {subTab === "campaign" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Target Selector (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Step 1: Filter Audience */}
            <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-blue-500" />
                  {t.step1Title}
                </h3>
              </div>

              <div className="space-y-4">
                {/* Prefecture */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    {t.lblPrefecture}
                  </label>
                  <select
                    value={prefecture}
                    onChange={(e) => {
                      setPrefecture(e.target.value);
                      setTargetCount(null);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="all">
                      {t.allJapan(totalCompaniesWithEmailText || "...")}
                    </option>
                    {stats?.top_prefectures?.map((p) => (
                      <option key={p.prefecture_name} value={p.prefecture_name}>
                        {p.prefecture_name} ({parseInt(p.email_count, 10).toLocaleString()} {isVi ? "email" : "件"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* JSIC Industry Classification */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    {t.lblIndustry}
                  </label>
                  <select
                    value={industryCode}
                    onChange={(e) => {
                      setIndustryCode(e.target.value);
                      setTargetCount(null);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="all">🏢 {t.allIndustries}</option>
                    {(stats?.industries && stats.industries.length > 0
                      ? stats.industries
                      : [
                          { industry_code: "A", industry_name: "農業・林業" },
                          { industry_code: "B", industry_name: "漁業" },
                          { industry_code: "C", industry_name: "鉱業・採石業・砂利採取業" },
                          { industry_code: "D", industry_name: "建設業" },
                          { industry_code: "E", industry_name: "製造業" },
                          { industry_code: "F", industry_name: "電気・ガス・熱供給・水道業" },
                          { industry_code: "G", industry_name: "情報通信業 (IT・通信)" },
                          { industry_code: "H", industry_name: "運輸業・郵便業" },
                          { industry_code: "I", industry_name: "卸売業・小売業" },
                          { industry_code: "J", industry_name: "金融業・保険業" },
                          { industry_code: "K", industry_name: "不動産業・物品賃貸業" },
                          { industry_code: "L", industry_name: "学術研究・専門・技術サービス業" },
                          { industry_code: "M", industry_name: "宿泊業・飲食サービス業" },
                          { industry_code: "N", industry_name: "生活関連サービス業・娯楽業" },
                          { industry_code: "O", industry_name: "教育・学習支援業" },
                          { industry_code: "P", industry_name: "医療・福祉" },
                          { industry_code: "Q", industry_name: "複合サービス事業" },
                          { industry_code: "R", industry_name: "サービス業（他に分類されないもの）" },
                          { industry_code: "S", industry_name: "公務（他に分類されるものを除く）" },
                          { industry_code: "T", industry_name: "分類不能の産業" },
                        ]
                    ).map((ind) => (
                      <option key={ind.industry_code} value={ind.industry_code}>
                        {ind.industry_code}. {ind.industry_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Employees */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    {t.lblEmployees}
                  </label>
                  <select
                    value={minEmployees}
                    onChange={(e) => {
                      setMinEmployees(e.target.value);
                      setTargetCount(null);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">{t.empAll}</option>
                    <option value="10">{t.emp10}</option>
                    <option value="30">{t.emp30}</option>
                    <option value="50">{t.emp50}</option>
                    <option value="100">{t.emp100}</option>
                  </select>
                </div>

                {/* Has Website */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasWebsite"
                    checked={hasWebsite}
                    onChange={(e) => {
                      setHasWebsite(e.target.checked);
                      setTargetCount(null);
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="hasWebsite" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    {t.chkWebsite}
                  </label>
                </div>

                {/* Exclude Recently Emailed */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                    {t.lblAntiSpam}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={365}
                      value={excludeDays}
                      onChange={(e) => {
                        setExcludeDays(parseInt(e.target.value, 10) || 0);
                        setTargetCount(null);
                      }}
                      className="w-20 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                    />
                    <span className="text-xs text-slate-500">{t.daysAgo}</span>
                  </div>
                </div>

                {/* Calculate target count button */}
                <button
                  type="button"
                  onClick={handleCalculateAudience}
                  disabled={calculatingCount}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {calculatingCount ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Users className="w-3.5 h-3.5" />
                  )}
                  {targetCount !== null ? t.availableCount(targetCount.toLocaleString()) : t.btnCalculate}
                </button>
              </div>
            </div>

            {/* Step 3: Test Send & Safe Dispatcher */}
            <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                {t.step3Title}
              </h3>

              {/* Test Send */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-750">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  {t.lblTestEmail}
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="admin@gmail.com"
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={sendingTest}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {sendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {t.btnSendTest}
                  </button>
                </div>
                {testMessage && (
                  <p
                    className={`text-xs mt-2 font-medium ${
                      testMessage.type === "success" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {testMessage.text}
                  </p>
                )}
              </div>

              {/* Batch Sender Box */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.lblBatchSize}
                  </label>
                  <select
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value, 10))}
                    className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                  >
                    <option value={10}>{t.optBatch10}</option>
                    <option value={20}>{t.optBatch20}</option>
                    <option value={50}>{t.optBatch50}</option>
                    <option value={100}>{t.optBatch100}</option>
                  </select>
                </div>

                <p className="text-[11px] text-slate-500 leading-tight">
                  {t.tokushohoNotice}
                </p>

                <button
                  type="button"
                  onClick={handleSendBatch}
                  disabled={isSendingBatch}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSendingBatch ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t.btnSendingBatch(batchSize)}
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      {t.btnStartBatch(batchSize)}
                    </>
                  )}
                </button>

                {batchError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{batchError}</span>
                  </div>
                )}

                {batchProgress && (
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600 dark:text-slate-400">{t.progressTitle}</span>
                      <span className="text-blue-600 dark:text-blue-400">
                        {batchProgress.isFinished ? t.progressFinished : t.progressRemaining(batchProgress.remaining.toLocaleString())}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium">
                      <span className="text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> {t.sentSuccess} {batchProgress.sentInBatch}
                      </span>
                      {batchProgress.failedInBatch > 0 && (
                        <span className="text-rose-600 flex items-center gap-1">
                          <Ban className="w-3.5 h-3.5" /> {t.sentFailed} {batchProgress.failedInBatch}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Template Studio & Editor (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  {t.step2Title}
                </h3>

                <button
                  type="button"
                  onClick={handleOpenPreview}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-500" />
                  {t.btnLivePreview}
                </button>
              </div>

              {/* Template selector */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  {t.lblPresetTemplates}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl.id)}
                      className={`p-3 text-left rounded-xl border transition-all text-xs flex flex-col justify-between cursor-pointer ${
                        selectedTemplateId === tpl.id
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-300 font-bold shadow-xs"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span className="line-clamp-2 leading-relaxed">{tpl.name}</span>
                      <span className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-blue-500" /> {t.badgeKeigo}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Campaign Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {t.lblCampaignName}
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder={t.phCampaignName}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {t.lblSubject}
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Variable pills helper */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 mb-1.5 block">
                  {t.lblInsertVars}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {t.vars.map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => insertVariableTag(item.tag)}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      + {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body HTML */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {t.lblBodyHtml}
                </label>
                <textarea
                  rows={14}
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs leading-relaxed focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: CAMPAIGN HISTORY */}
      {subTab === "history" && (
        <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">{t.historyTitle}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{t.historyDesc}</p>
            </div>
            <button
              onClick={fetchCampaignsHistory}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              title="Refresh"
            >
              <RefreshCcw className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 rounded-tl-xl">{t.thTime}</th>
                  <th className="px-4 py-3">{t.thCampaignName}</th>
                  <th className="px-4 py-3">{t.thSubject}</th>
                  <th className="px-4 py-3">{t.thTargetCount}</th>
                  <th className="px-4 py-3">{t.thSent}</th>
                  <th className="px-4 py-3">{t.thFailed}</th>
                  <th className="px-4 py-3">{t.thStatus}</th>
                  <th className="px-4 py-3 rounded-tr-xl">{t.thDetails}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {campaignsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      {t.noCampaigns}
                    </td>
                  </tr>
                ) : (
                  campaignsList.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(c.created_at).toLocaleString("ja-JP", {
                          timeZone: "Asia/Tokyo",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{c.name}</td>
                      <td className="px-4 py-3 max-w-xs truncate text-slate-600 dark:text-slate-300">{c.subject}</td>
                      <td className="px-4 py-3 font-semibold">{c.total_targeted?.toLocaleString() || 0}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-600">{c.sent_count?.toLocaleString() || 0}</td>
                      <td className="px-4 py-3 font-semibold text-rose-500">{c.failed_count || 0}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === "completed"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : c.status === "sending"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 animate-pulse"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {c.status === "completed" ? t.statusCompleted : c.status === "sending" ? t.statusSending : c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleViewCampaignLogs(c.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          {t.btnViewLogs}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Logs detail modal */}
          {selectedCampaignLogs && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
              <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{t.logsModalTitle}</h4>
                  <button
                    onClick={() => setSelectedCampaignLogs(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto py-3 space-y-2 text-xs">
                  {selectedCampaignLogs.logs.length === 0 ? (
                    <p className="text-center py-6 text-slate-400">{t.noLogs}</p>
                  ) : (
                    selectedCampaignLogs.logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{log.company_name || t.companyLabel}</div>
                          <div className="text-slate-500 font-mono text-[11px]">{log.recipient_email}</div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.status === "sent" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {log.status === "sent" ? t.statusSent : log.error_message || t.statusFailed}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(log.sent_at).toLocaleTimeString("ja-JP")}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: SUPPRESSIONS / OPT-OUT */}
      {subTab === "suppressions" && (
        <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-500" />
                {t.suppressionsTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.suppressionsDesc}
              </p>
            </div>

            {/* Manual add input */}
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={newSuppressionEmail}
                onChange={(e) => setNewSuppressionEmail(e.target.value)}
                placeholder={t.phSuppressionInput}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
              <button
                onClick={handleAddSuppression}
                disabled={addingSuppression}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> {t.btnAddSuppression}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 rounded-tl-xl">{t.thSuppressedAt}</th>
                  <th className="px-4 py-3">{t.thEmail}</th>
                  <th className="px-4 py-3">{t.thReason}</th>
                  <th className="px-4 py-3 rounded-tr-xl text-right">{t.thAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {suppressionsList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      {t.noSuppressions}
                    </td>
                  </tr>
                ) : (
                  suppressionsList.map((item) => (
                    <tr key={item.email} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(item.created_at).toLocaleString("ja-JP", {
                          timeZone: "Asia/Tokyo",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">{item.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {item.reason}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveSuppression(item.email)}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                          {t.btnRemoveSuppression}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LIVE PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-500" />
                  {t.previewModalTitle}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.previewModalDesc(previewData?.sampleCompany?.company_name || t.sampleText)}
                </p>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {previewLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">{t.previewPreparing}</p>
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500">
                      <strong>To:</strong> {previewData?.sampleCompany?.email_address} (
                      {previewData?.sampleCompany?.company_name})
                    </div>
                    <div className="text-xs text-slate-900 dark:text-white font-bold mt-1">
                      <strong>Subject:</strong> {previewData?.subject}
                    </div>
                  </div>

                  <div
                    className="p-4 bg-white text-slate-900 rounded-xl border border-slate-200 shadow-inner"
                    dangerouslySetInnerHTML={{ __html: previewData?.html || "" }}
                  />
                </>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-xl cursor-pointer"
              >
                {t.btnClose}
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
