"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Send,
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Copy,
  Check,
  Eye,
  RefreshCw,
  Loader2,
  Sparkles,
  Search,
  ExternalLink,
  Laptop,
  Server,
  Filter,
  FileSpreadsheet,
  X,
  Zap,
  Target,
  Mail,
  Globe,
  Phone,
  User,
  FileText,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface FormMarketingStats {
  total_companies_with_form: number;
  total_sent: number;
  total_skipped: number;
  total_campaigns: number;
  top_prefectures: { prefecture_name: string; form_count: string }[];
  recent_campaigns: any[];
  industries?: { industry_code: string; industry_name: string }[];
}

interface InternalFormMarketingSubTabProps {
  adminEmail: string;
  getAdminHeaders: () => Record<string, string>;
}

export function InternalFormMarketingSubTab({
  adminEmail,
  getAdminHeaders,
}: InternalFormMarketingSubTabProps) {
  const { locale } = useLanguage();
  const isJa = locale === "ja";

  const [activeSection, setActiveSection] = useState<"compose" | "history">("compose");

  // Stats
  const [stats, setStats] = useState<FormMarketingStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Filters
  const [prefecture, setPrefecture] = useState("all");
  const [industryCode, setIndustryCode] = useState("all");
  const [minEmployees, setMinEmployees] = useState("");
  const [hasWebsite, setHasWebsite] = useState(true);
  const [excludeDays, setExcludeDays] = useState(60);

  // Audience Count
  const [targetCount, setTargetCount] = useState<number | null>(null);
  const [calculatingCount, setCalculatingCount] = useState(false);

  // Sender Info & Content
  // Sender Info & Content (Default: TQC株式会社 / Kigyou-list)
  const [campaignName, setCampaignName] = useState("");
  const [senderCompany, setSenderCompany] = useState("TQC株式会社（Kigyou-list 運営事務局）");
  const [senderName, setSenderName] = useState("栗本 賢之");
  const [senderFurigana, setSenderFurigana] = useState("クリモト ヨシユキ");
  const [senderEmail, setSenderEmail] = useState("info@kigyoulist.com");
  const [senderPhone, setSenderPhone] = useState("03-6907-1219");
  const [senderWebsite, setSenderWebsite] = useState("https://kigyoulist.com");
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [executionMode, setExecutionMode] = useState<"local_warp" | "server_proxy">("local_warp");

  // Templates
  const [presetTemplates, setPresetTemplates] = useState<any[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");

  // Live Preview Modal States
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTargetName, setPreviewTargetName] = useState("株式会社サンプル");
  const [previewTab, setPreviewTab] = useState<"email" | "form">("email");

  // Create Campaign State
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [createdCampaign, setCreatedCampaign] = useState<any | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // History & Logs
  const [campaignsList, setCampaignsList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedCampaignLogs, setSelectedCampaignLogs] = useState<{
    campaign: any;
    logs: any[];
    total: number;
  } | null>(null);
  const [logsFilterStatus, setLogsFilterStatus] = useState("all");
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Fetch initial stats & presets
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/internal-form-marketing/stats", {
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
        if (data.preset_templates && data.preset_templates.length > 0) {
          setPresetTemplates(data.preset_templates);
          if (!subject) {
            const first = data.preset_templates[0];
            setSelectedPresetId(first.id);
            setSubject(first.subject);
            setMessageBody(first.body);
            setCampaignName(first.name);
            if (first.sender_company) setSenderCompany(first.sender_company);
            if (first.sender_name) setSenderName(first.sender_name);
            if (first.sender_furigana) setSenderFurigana(first.sender_furigana);
            if (first.sender_email) setSenderEmail(first.sender_email);
            if (first.sender_phone) setSenderPhone(first.sender_phone);
            if (first.sender_website) setSenderWebsite(first.sender_website);
            if (first.default_filters) {
              if (first.default_filters.prefecture_name) setPrefecture(first.default_filters.prefecture_name);
              if (first.default_filters.industry_code) setIndustryCode(first.default_filters.industry_code);
              if (first.default_filters.min_employees !== undefined) {
                setMinEmployees(first.default_filters.min_employees > 0 ? String(first.default_filters.min_employees) : "");
              }
              if (first.default_filters.has_website !== undefined) setHasWebsite(first.default_filters.has_website);
              if (first.default_filters.exclude_recent_days !== undefined) setExcludeDays(first.default_filters.exclude_recent_days);
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to load form stats:", e);
    } finally {
      setLoadingStats(false);
    }
  }, [getAdminHeaders, subject]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Recalculate Target Count
  const handleCalculateCount = async () => {
    setCalculatingCount(true);
    try {
      const res = await fetch("/api/admin/internal-form-marketing/count", {
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
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTargetCount(data.count);
      }
    } catch (e) {
      console.error("Failed to calculate count:", e);
    } finally {
      setCalculatingCount(false);
    }
  };

  // Select Preset Template
  const handleSelectTemplate = (templateId: string) => {
    setSelectedPresetId(templateId);
    const found = presetTemplates.find((t) => t.id === templateId);
    if (found) {
      setSubject(found.subject);
      setMessageBody(found.body);
      setCampaignName(found.name);
      if (found.sender_company) setSenderCompany(found.sender_company);
      if (found.sender_name) setSenderName(found.sender_name);
      if (found.sender_furigana) setSenderFurigana(found.sender_furigana);
      if (found.sender_email) setSenderEmail(found.sender_email);
      if (found.sender_phone) setSenderPhone(found.sender_phone);
      if (found.sender_website) setSenderWebsite(found.sender_website);

      if (found.default_filters) {
        if (found.default_filters.prefecture_name) setPrefecture(found.default_filters.prefecture_name);
        if (found.default_filters.industry_code) setIndustryCode(found.default_filters.industry_code);
        if (found.default_filters.min_employees !== undefined) {
          setMinEmployees(found.default_filters.min_employees > 0 ? String(found.default_filters.min_employees) : "");
        }
        if (found.default_filters.has_website !== undefined) setHasWebsite(found.default_filters.has_website);
        if (found.default_filters.exclude_recent_days !== undefined) setExcludeDays(found.default_filters.exclude_recent_days);
      }
    }
  };

  // Create Campaign
  const handleCreateCampaign = async () => {
    if (!campaignName || !subject || !messageBody || !senderCompany || !senderName || !senderEmail) {
      alert(
        isJa
          ? "必須項目（キャンペーン名、送信者名、メール、件名、本文）を入力してください。"
          : "Vui lòng nhập đầy đủ các trường bắt buộc (Tên chiến dịch, Người gửi, Email, Tiêu đề, Nội dung)."
      );
      return;
    }

    setCreatingCampaign(true);
    try {
      const res = await fetch("/api/admin/internal-form-marketing/campaigns", {
        method: "POST",
        headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          sender_company: senderCompany,
          sender_name: senderName,
          sender_furigana: senderFurigana,
          sender_email: senderEmail,
          sender_phone: senderPhone,
          sender_website: senderWebsite,
          subject,
          message_body: messageBody,
          target_filters: {
            prefecture_name: prefecture,
            industry_code: industryCode,
            min_employees: minEmployees ? parseInt(minEmployees, 10) : undefined,
            has_website: hasWebsite,
            exclude_recent_days: excludeDays,
          },
          execution_mode: executionMode,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCreatedCampaign(data.campaign);
        fetchStats();
      } else {
        alert(data.error || "Failed to create campaign");
      }
    } catch (e) {
      console.error("Create campaign error:", e);
    } finally {
      setCreatingCampaign(false);
    }
  };

  // Fetch Campaigns History
  const fetchCampaignsHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/admin/internal-form-marketing/campaigns", {
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCampaignsList(data.campaigns || []);
      }
    } catch (e) {
      console.error("History fetch error:", e);
    } finally {
      setLoadingHistory(false);
    }
  }, [getAdminHeaders]);

  useEffect(() => {
    if (activeSection === "history") {
      fetchCampaignsHistory();
    }
  }, [activeSection, fetchCampaignsHistory]);

  // View Single Campaign Logs
  const handleViewLogs = async (campaign: any, filter = "all") => {
    setLoadingLogs(true);
    try {
      const res = await fetch(
        `/api/admin/internal-form-marketing/campaigns/${campaign.id}?status=${filter}&limit=100`,
        { headers: getAdminHeaders() }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedCampaignLogs({
          campaign: data.campaign,
          logs: data.logs || [],
          total: data.total || 0,
        });
      }
    } catch (e) {
      console.error("Logs fetch error:", e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const getRunnerCliCommand = (campaignId: string) => {
    return `python scripts/form_dispatcher/internal_runner.py --campaign-id ${campaignId} --warp --concurrency 5 --rotate-every 5 --live`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Form DM KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isJa ? "フォーム保有企業数" : "DN Có Contact Form Trong DB"}
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {loadingStats ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              stats?.total_companies_with_form.toLocaleString() || "0"
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isJa ? "日本企業の問い合わせ窓口URL保有" : "Tỷ lệ đọc tiếp cận 85-90%"}
          </p>
        </div>

        <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isJa ? "フォーム送信完了数" : "Tổng Form Đã Gửi Thành Công"}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {loadingStats ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              stats?.total_sent.toLocaleString() || "0"
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isJa ? "送信完了（サンクスページ確認済）" : "Gửi trực tiếp vào inbox DN"}
          </p>
        </div>

        <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isJa ? "安全除外（営業お断り・Captcha）" : "Đã Né Tránh An Toàn"}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {loadingStats ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              stats?.total_skipped.toLocaleString() || "0"
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isJa ? "法令遵守・スパム防止AI自動スキップ" : "Bảo vệ an toàn thương hiệu"}
          </p>
        </div>

        <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isJa ? "作成済みキャンペーン" : "Chiến Dịch Form Đã Tạo"}
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {loadingStats ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              stats?.total_campaigns.toLocaleString() || "0"
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isJa ? "ターゲット別セグメント管理" : "Quản lý chiến dịch nội bộ"}
          </p>
        </div>
      </div>

      {/* Sub-Tabs: Compose vs History */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSection("compose")}
            className={`px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${
              activeSection === "compose"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{isJa ? "キャンペーン作成・実行" : "Soạn & Khởi Tạo Chiến Dịch"}</span>
          </button>
          <button
            onClick={() => setActiveSection("history")}
            className={`px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${
              activeSection === "history"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{isJa ? "配信履歴・対照レポート" : "Lịch Sử & Báo Cáo Đối Soát"}</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>{isJa ? "特定商取引法・営業お断り自動除外対応" : "Tuân thủ luật Tokushoho & Tự động né form cấm"}</span>
        </div>
      </div>

      {/* SECTION 1: COMPOSE & RUN CAMPAIGN */}
      {activeSection === "compose" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Targeting & Presets (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Step 1: Targeting Filter */}
            <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-4">
                <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 text-xs flex items-center justify-center font-black">
                  1
                </span>
                <span>{isJa ? "配信ターゲット企業の抽出" : "Lọc Tệp Doanh Nghiệp Mục Tiêu"}</span>
              </div>

              <div className="space-y-4">
                {/* Prefecture */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    {isJa ? "都道府県" : "Tỉnh / Thành phố"}
                  </label>
                  <select
                    value={prefecture}
                    onChange={(e) => setPrefecture(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="all">
                      {isJa ? "🇯🇵 日本全国すべて（全47都道府県）" : "🇯🇵 Toàn bộ Nhật Bản (47 tỉnh thành)"}
                    </option>
                    {stats?.top_prefectures.map((p) => (
                      <option key={p.prefecture_name} value={p.prefecture_name}>
                        {p.prefecture_name} ({parseInt(p.form_count, 10).toLocaleString()} {isJa ? "社" : "cty"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    {isJa ? "JSIC 産業分類" : "Ngành nghề theo chuẩn JSIC"}
                  </label>
                  <select
                    value={industryCode}
                    onChange={(e) => setIndustryCode(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="all">
                      {isJa ? "すべての産業分類（全業種）" : "Tất cả ngành nghề JSIC"}
                    </option>
                    {stats?.industries?.map((ind) => (
                      <option key={ind.industry_code} value={ind.industry_code}>
                        [{ind.industry_code}] {ind.industry_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Employees */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    {isJa ? "従業員規模" : "Quy mô nhân sự"}
                  </label>
                  <select
                    value={minEmployees}
                    onChange={(e) => setMinEmployees(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="">{isJa ? "すべての規模" : "Tất cả quy mô"}</option>
                    <option value="5">{isJa ? "5名以上" : "Từ 5 nhân viên trở lên"}</option>
                    <option value="10">{isJa ? "10名以上" : "Từ 10 nhân viên trở lên"}</option>
                    <option value="30">{isJa ? "30名以上" : "Từ 30 nhân viên trở lên"}</option>
                    <option value="50">{isJa ? "50名以上" : "Từ 50 nhân viên trở lên"}</option>
                    <option value="100">{isJa ? "100名以上" : "Từ 100 nhân viên trở lên"}</option>
                  </select>
                </div>

                {/* Has Website Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="chk_form_website"
                    checked={hasWebsite}
                    onChange={(e) => setHasWebsite(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="chk_form_website" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {isJa ? "公式Webサイトを保有する企業のみ" : "Chỉ chọn công ty có Website chính thức"}
                  </label>
                </div>

                {/* Cooldown Anti-spam Days */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    {isJa ? "スパム防止：直近にフォーム送信済みの企業を除外" : "Chống Spam: Loại trừ công ty đã gửi gần đây"}
                  </label>
                  <select
                    value={excludeDays}
                    onChange={(e) => setExcludeDays(parseInt(e.target.value, 10))}
                    className="w-full text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="0">{isJa ? "除外しない（全件）" : "Không loại trừ"}</option>
                    <option value="30">{isJa ? "過去30日以内に送信済みを除外" : "30 ngày qua"}</option>
                    <option value="60">{isJa ? "過去60日以内に送信済みを除外（推奨）" : "60 ngày qua (Khuyên dùng)"}</option>
                    <option value="90">{isJa ? "過去90日以内に送信済みを除外" : "90 ngày qua"}</option>
                  </select>
                </div>

                {/* Calculate Button */}
                <div className="pt-2">
                  <button
                    onClick={handleCalculateCount}
                    disabled={calculatingCount}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-sm font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    {calculatingCount ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span>{isJa ? "ターゲット件数を算出" : "Kiểm tra số lượng mục tiêu"}</span>
                  </button>

                  {targetCount !== null && (
                    <div className="mt-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between text-indigo-900 dark:text-indigo-200">
                      <span className="text-xs font-bold">
                        {isJa ? "配信対象:" : "Số lượng khả dụng:"}
                      </span>
                      <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                        {targetCount.toLocaleString()} {isJa ? "社" : "công ty"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Execution Mode & Runner Option */}
            <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-4">
                <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 text-xs flex items-center justify-center font-black">
                  3
                </span>
                <span>{isJa ? "実行環境・ネットワーク設定" : "Chọn Chế Độ Chạy & Mạng"}</span>
              </div>

              <div className="space-y-3">
                {/* Local WARP option */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    executionMode === "local_warp"
                      ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="execution_mode"
                    value="local_warp"
                    checked={executionMode === "local_warp"}
                    onChange={() => setExecutionMode("local_warp")}
                    className="mt-1 text-indigo-600"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {isJa ? "ローカル実行 + Cloudflare WARP / Docker Pool（推奨・高速・無料）" : "Local Multi-Worker + Cloudflare WARP / Docker Pool (0đ)"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isJa
                        ? "自社PCのCPU/RAMを活用し、マルチスレッド並列処理（--concurrency 5〜10）とDocker WARPプロキシプールで超高速・コスト0円で安全に送信します。"
                        : "Tận dụng CPU/RAM máy cá nhân: chạy đa luồng song song (--concurrency 5-10), tự nhận diện Docker WARP Pool, chi phí 0đ."}
                    </p>
                  </div>
                </label>

                {/* Server Proxy option */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    executionMode === "server_proxy"
                      ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="execution_mode"
                    value="server_proxy"
                    checked={executionMode === "server_proxy"}
                    onChange={() => setExecutionMode("server_proxy")}
                    className="mt-1 text-indigo-600"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {isJa ? "サーバー実行 + 専用プロキシ（自動化）" : "Server Worker + Dedicated Proxy (Tự động)"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isJa
                        ? "VPSサーバー上でバックグラウンド実行。購入したプロキシ（OUTREACH_PROXY_URL）を経由。"
                        : "Chạy nền trên server, xoay IP proxy dân cư, không cần bật máy tính."}
                    </p>
                  </div>
                </label>
              </div>

              {/* Create Campaign Action Button */}
              <div className="mt-5">
                <button
                  onClick={handleCreateCampaign}
                  disabled={creatingCampaign}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {creatingCampaign ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 fill-white" />
                  )}
                  <span>{isJa ? "キャンペーンを作成する" : "Tạo Chiến Dịch & Sinh Lệnh Chạy"}</span>
                </button>
              </div>

              {/* Show Created Campaign CLI Box */}
              {createdCampaign && (
                <div className="mt-5 p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      {isJa ? "キャンペーン作成完了！" : "Đã tạo chiến dịch thành công!"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: {createdCampaign.id.substring(0, 8)}...
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    {isJa
                      ? "以下のコマンドをターミナルで実行すると、ローカル環境（Playwright + WARP）から自動配信が開始されます："
                      : "Mở Terminal trên máy tính và chạy lệnh sau để bắt đầu bắn Form tự động qua WARP:"}
                  </p>

                  <div className="relative">
                    <pre className="p-3 rounded-lg bg-black/60 font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre-wrap select-all">
                      {getRunnerCliCommand(createdCampaign.id)}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(getRunnerCliCommand(createdCampaign.id))}
                      className="absolute top-2 right-2 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold flex items-center gap-1 border border-slate-700"
                    >
                      {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCmd ? (isJa ? "コピー済" : "Đã copy") : (isJa ? "コピー" : "Copy")}</span>
                    </button>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{isJa ? "※ まずシミュレーションしたい場合は --dry-run を付与" : "Muốn chạy thử an toàn: thêm cờ --dry-run"}</span>
                    <button
                      onClick={() => {
                        setActiveSection("history");
                        fetchCampaignsHistory();
                      }}
                      className="text-indigo-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      {isJa ? "履歴で確認する" : "Xem tiến độ tại Lịch sử"} &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sender Profile & Keigo Template (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 text-xs flex items-center justify-center font-black">
                    2
                  </span>
                  <span>{isJa ? "送信者情報 ＆ メッセージ内容（敬語・特商法準拠）" : "Thông Tin Người Gửi & Thư Ngỏ (Chuẩn Keigo)"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs border border-indigo-200/80 dark:border-indigo-800/80 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isJa ? "受信プレビュー（表示確認）" : "Xem trước nội dung"}</span>
                  </button>

                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {isJa ? "特定商取引法対応" : "Chuẩn Tokushoho"}
                  </span>
                </div>
              </div>

              {/* Template Presets Selector */}
              {presetTemplates.length > 0 && (
                <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50/80 to-blue-50/50 dark:from-indigo-950/40 dark:to-blue-950/30 border border-indigo-200/80 dark:border-indigo-800/60 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>{isJa ? "Kigyou-list公式 営業キャンペーンテンプレートを選択:" : "Chọn mẫu chiến dịch tiếp thị Kigyou-List:"}</span>
                    </label>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-200/80 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200">
                      {presetTemplates.length} {isJa ? "種類の高成約率パターン" : "mẫu chuẩn Keigo"}
                    </span>
                  </div>

                  <select
                    value={selectedPresetId}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                    className="w-full text-xs font-bold rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white shadow-sm"
                  >
                    {presetTemplates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name}
                      </option>
                    ))}
                  </select>

                  {/* Recommendation Callout */}
                  {selectedPresetId && (
                    <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-indigo-100 dark:border-indigo-900/60 text-[11px] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-300">
                        <Target className="w-3.5 h-3.5" />
                        <span>{isJa ? "推奨ターゲット層:" : "Gợi ý tệp khách hàng:"}</span>
                        <span className="font-normal text-slate-700 dark:text-slate-300">
                          {presetTemplates.find((t) => t.id === selectedPresetId)?.target_recommendation}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        <span>{isJa ? "TQC株式会社の特定商取引法表示およびオプトアウト文言を自動補完済み" : "Đã tự động điền thông tin TQC株式会社 & câu opt-out luật Tokushoho"}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Campaign Name */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    {isJa ? "キャンペーン管理名" : "Tên chiến dịch quản trị"} *
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder={isJa ? "例: 【東京・IT業向け】Kigyou-List紹介キャンペーン" : "VD: Giới thiệu Kigyou-List cho DN Tokyo"}
                    className="w-full text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Sender Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {isJa ? "送信元 会社名（貴社名）" : "Tên công ty người gửi"} *
                    </label>
                    <input
                      type="text"
                      value={senderCompany}
                      onChange={(e) => setSenderCompany(e.target.value)}
                      placeholder="株式会社Kigyou-List"
                      className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {isJa ? "担当者 氏名" : "Họ tên người phụ trách"} *
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="佐藤 健一"
                      className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {isJa ? "氏名フリガナ（カタカナ）" : "Phiên âm Furigana"}
                    </label>
                    <input
                      type="text"
                      value={senderFurigana}
                      onChange={(e) => setSenderFurigana(e.target.value)}
                      placeholder="サトウ ケンイチ"
                      className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {isJa ? "返信用メールアドレス" : "Email nhận phản hồi"} *
                    </label>
                    <input
                      type="email"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="contact@kigyoulist.com"
                      className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {isJa ? "電話番号" : "Số điện thoại liên hệ"}
                    </label>
                    <input
                      type="text"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="03-6820-1234"
                      className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {isJa ? "貴社WebサイトURL" : "Website công ty"}
                    </label>
                    <input
                      type="text"
                      value={senderWebsite}
                      onChange={(e) => setSenderWebsite(e.target.value)}
                      placeholder="https://kigyoulist.com"
                      className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    {isJa ? "件名（Subject）" : "Tiêu đề liên hệ (Subject)"} *
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="【ご提案】貴社の業務効率化・コスト削減を支援するソリューションのご案内"
                    className="w-full text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Message Body */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {isJa ? "本文（お問い合わせ内容）" : "Nội dung thư ngỏ (Message Body)"} *
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowPreviewModal(true)}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{isJa ? "プレビュー表示" : "Xem trước"}</span>
                      </button>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {isJa ? "変数 {{company_name}} を使用可能" : "Hỗ trợ biến {{company_name}}"}
                      </span>
                    </div>
                  </div>
                  <textarea
                    rows={10}
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    placeholder="お問い合わせ本文を入力..."
                    className="w-full text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 text-slate-900 dark:text-white leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    {isJa
                      ? "※ 末尾に特定商取引法に基づく配信停止（オプトアウト）の一文を必ず記載してください。"
                      : "※ Luôn đính kèm câu xin lỗi làm phiền và hướng dẫn hủy nhận tin theo luật Tokushoho."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: HISTORY & AUDIT REPORT TABLE */}
      {activeSection === "history" && (
        <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isJa ? "フォームDM配信キャンペーン履歴" : "Lịch Sử Chiến Dịch Form DM"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isJa
                  ? "各キャンペーンの送信成功・安全除外・エラー件数およびCSV監査レポートのダウンロード"
                  : "Theo dõi số lượng thành công, né cấm quảng cáo và tải báo cáo CSV đối soát"}
              </p>
            </div>

            <button
              onClick={fetchCampaignsHistory}
              disabled={loadingHistory}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? "animate-spin" : ""}`} />
              <span>{isJa ? "更新" : "Làm mới"}</span>
            </button>
          </div>

          {loadingHistory ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs">{isJa ? "履歴を読み込み中..." : "Đang tải lịch sử..."}</span>
            </div>
          ) : campaignsList.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-medium">{isJa ? "作成されたキャンペーンはありません。" : "Chưa có chiến dịch Form DM nào."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">{isJa ? "作成日時" : "Thời Gian"}</th>
                    <th className="py-3 px-4">{isJa ? "キャンペーン名" : "Tên Chiến Dịch"}</th>
                    <th className="py-3 px-4">{isJa ? "対象数" : "Mục Tiêu"}</th>
                    <th className="py-3 px-4">{isJa ? "送信成功" : "Thành Công"}</th>
                    <th className="py-3 px-4">{isJa ? "安全除外" : "Né Tránh"}</th>
                    <th className="py-3 px-4">{isJa ? "ステータス" : "Trạng Thái"}</th>
                    <th className="py-3 px-4">{isJa ? "実行環境" : "Chế Độ"}</th>
                    <th className="py-3 px-4 text-right">{isJa ? "操作" : "Thao Tác"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium">
                  {campaignsList.map((cmp) => (
                    <tr key={cmp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(cmp.created_at).toLocaleString(isJa ? "ja-JP" : "vi-VN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        <div className="max-w-[220px] truncate" title={cmp.name}>
                          {cmp.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {cmp.id.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {cmp.total_targeted?.toLocaleString() || "0"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {cmp.sent_count?.toLocaleString() || "0"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-600 dark:text-amber-400">
                        {cmp.skipped_count?.toLocaleString() || "0"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cmp.status === "completed"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : cmp.status === "processing"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 animate-pulse"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {cmp.status === "completed"
                            ? isJa ? "完了" : "Hoàn thành"
                            : cmp.status === "processing"
                            ? isJa ? "配信中" : "Đang chạy"
                            : isJa ? "準備完了" : "Sẵn sàng"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {cmp.execution_mode === "local_warp" ? (
                          <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                            <Laptop className="w-3 h-3" />
                            <span>Local WARP</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                            <Server className="w-3 h-3" />
                            <span>Server Proxy</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Export CSV Report Button */}
                          <a
                            href={`/api/admin/internal-form-marketing/campaigns/${cmp.id}/export`}
                            download
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1"
                            title={isJa ? "CSV対照レポート出力" : "Tải CSV báo cáo đối soát"}
                          >
                            <Download className="w-3.5 h-3.5 text-indigo-600" />
                            <span>CSV</span>
                          </a>

                          {/* View Logs Detail Button */}
                          <button
                            onClick={() => handleViewLogs(cmp, "all")}
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1"
                            title={isJa ? "詳細ログ" : "Xem logs"}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isJa ? "ログ" : "Logs"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DETAIL AUDIT LOGS MODAL */}
      {selectedCampaignLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    {isJa ? "キャンペーン配信対照ログ" : "Nhật Ký Đối Soát Chiến Dịch"}
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                    {selectedCampaignLogs.total} {isJa ? "件" : "logs"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">
                  {selectedCampaignLogs.campaign.name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/api/admin/internal-form-marketing/campaigns/${selectedCampaignLogs.campaign.id}/export`}
                  download
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isJa ? "CSVダウンロード" : "Tải file CSV"}</span>
                </a>
                <button
                  onClick={() => setSelectedCampaignLogs(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Status Filter Bar */}
            <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">{isJa ? "ステータス絞り込み:" : "Lọc trạng thái:"}</span>
              {["all", "SUCCESS_SENT", "SKIPPED_DISCLAIMER", "BLOCKED_CAPTCHA"].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setLogsFilterStatus(st);
                    handleViewLogs(selectedCampaignLogs.campaign, st);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    logsFilterStatus === st
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  {st === "all"
                    ? isJa ? "すべて" : "Tất cả"
                    : st === "SUCCESS_SENT"
                    ? isJa ? "送信成功" : "Thành công"
                    : st === "SKIPPED_DISCLAIMER"
                    ? isJa ? "営業お断り除外" : "Cấm quảng cáo"
                    : isJa ? "CAPTCHA検出" : "Gặp Captcha"}
                </button>
              ))}
            </div>

            {/* Modal Body Table */}
            <div className="flex-1 overflow-y-auto p-5">
              {loadingLogs ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : selectedCampaignLogs.logs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {isJa ? "該当するログはありません。" : "Không có nhật ký nào phù hợp."}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedCampaignLogs.logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {log.company_name || "Target Company"}
                          </span>
                          {log.prefecture_name && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {log.prefecture_name}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              log.status === "SUCCESS_SENT"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : log.status.startsWith("SKIPPED") || log.status.startsWith("BLOCKED")
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>

                        {log.message && (
                          <p className="text-[11px] text-slate-500 mt-1">{log.message}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {log.form_url && (
                          <a
                            href={log.form_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            <span>Form URL</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.sent_at).toLocaleTimeString(isJa ? "ja-JP" : "vi-VN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FORM DM LIVE PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{isJa ? "フォーム営業 送信プレビュー（クライアント受信イメージ）" : "Xem Trước Thư Ngỏ (Mô Phỏng Doanh Nghiệp Nhận Thư)"}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {isJa ? "特定商取引法確認済" : "Chuẩn Tokushoho"}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isJa
                      ? "相手先の問い合わせ窓口や社内通知（メール・Slack等）でどのように表示されるかを確認できます。"
                      : "Mô phỏng chính xác giao diện khi ban giám đốc hoặc bộ phận phụ trách của doanh nghiệp Nhật nhận được tin nhắn."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Switcher & View Mode Toggle Bar */}
            <div className="px-5 py-3 bg-white dark:bg-[#1C2128] border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {isJa ? "送信先 模擬企業名:" : "Tên công ty nhận mẫu:"}
                </span>
                <input
                  type="text"
                  value={previewTargetName}
                  onChange={(e) => setPreviewTargetName(e.target.value)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white w-48"
                  placeholder="株式会社サンプル"
                />
                <div className="hidden md:flex items-center gap-1">
                  {["株式会社サンプル", "ソニーグループ株式会社", "トヨタ自動車株式会社"].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => setPreviewTargetName(sample)}
                      className={`text-[10px] px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                        previewTargetName === sample
                          ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold"
                          : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {sample.replace("株式会社", "")}
                    </button>
                  ))}
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewTab("email")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    previewTab === "email"
                      ? "bg-white dark:bg-[#1C2128] text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{isJa ? "📧 受信通知メール形式" : "Dạng Email Nhận Tin"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("form")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    previewTab === "form"
                      ? "bg-white dark:bg-[#1C2128] text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{isJa ? "🌐 Webフォーム入力画面" : "Dạng Điền Web Form"}</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-black/20">
              {(() => {
                const renderedSubject = subject
                  ? subject.replace(/\{\{company_name\}\}/g, previewTargetName)
                  : "";
                const renderedBody = messageBody
                  ? messageBody.replace(/\{\{company_name\}\}/g, previewTargetName)
                  : "";

                if (previewTab === "email") {
                  return (
                    <div className="max-w-2xl mx-auto bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                      {/* Email Client Simulated Header */}
                      <div className="bg-slate-100/80 dark:bg-slate-900/80 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-white text-sm">
                            {renderedSubject || "(件名なし)"}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date().toLocaleTimeString(isJa ? "ja-JP" : "vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 flex flex-wrap gap-x-4">
                          <span><strong>From:</strong> {senderCompany} ({senderName}) &lt;{senderEmail}&gt;</span>
                          <span><strong>To:</strong> {previewTargetName} お問い合わせ窓口</span>
                        </div>
                      </div>

                      {/* Notification Header Banner */}
                      <div className="px-6 py-3 bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                        <Mail className="w-4 h-4 shrink-0 text-amber-600" />
                        <span>※このメッセージは、貴社Webサイトのお問い合わせフォーム経由で送信されました。</span>
                      </div>

                      {/* Submission Summary Table */}
                      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                          {isJa ? "▼ フォーム送信内容サマリー" : "▼ Chi tiết các trường đã gửi qua form"}
                        </div>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                          <div>
                            <dt className="text-slate-400 text-[10px]">【貴社名 / 送信元】</dt>
                            <dd className="font-bold text-slate-800 dark:text-slate-200">{senderCompany}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-400 text-[10px]">【ご担当者様名】</dt>
                            <dd className="font-bold text-slate-800 dark:text-slate-200">{senderName} ({senderFurigana})</dd>
                          </div>
                          <div>
                            <dt className="text-slate-400 text-[10px]">【メールアドレス】</dt>
                            <dd className="font-bold text-indigo-600 dark:text-indigo-400">{senderEmail}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-400 text-[10px]">【お電話番号】</dt>
                            <dd className="font-bold text-slate-800 dark:text-slate-200">{senderPhone}</dd>
                          </div>
                          {senderWebsite && (
                            <div className="sm:col-span-2">
                              <dt className="text-slate-400 text-[10px]">【WebサイトURL】</dt>
                              <dd className="text-indigo-600 dark:text-indigo-400 truncate">{senderWebsite}</dd>
                            </div>
                          )}
                        </dl>
                      </div>

                      {/* Email Body Content */}
                      <div className="p-6">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                          {isJa ? "▼ お問い合わせ内容（本文）" : "▼ Nội dung tin nhắn"}
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 font-sans text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap select-all">
                          {renderedBody || "(本文が入力されていません)"}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Form simulated mode
                return (
                  <div className="max-w-2xl mx-auto bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    {/* Simulated Browser URL bar */}
                    <div className="bg-slate-200/80 dark:bg-slate-800/80 px-4 py-2 border-b border-slate-300 dark:border-slate-700 flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      </div>
                      <div className="flex-1 bg-white dark:bg-slate-900 rounded-lg px-3 py-1 text-[11px] text-slate-500 font-mono flex items-center gap-1.5 border border-slate-300 dark:border-slate-700">
                        <span className="text-emerald-500 font-bold">🔒</span>
                        <span>https://www.example-target.co.jp/contact/</span>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h5 className="font-black text-sm text-slate-900 dark:text-white">
                          {previewTargetName} お問い合わせフォーム（自動入力シミュレーション）
                        </h5>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Bot（Playwright）が各入力フィールドを検知し、自動で正確に値を代入します。
                        </p>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            会社名 <span className="text-rose-500 font-bold">[必須]</span>
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={senderCompany}
                            className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-300 font-medium"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              お名前 <span className="text-rose-500 font-bold">[必須]</span>
                            </label>
                            <input
                              type="text"
                              readOnly
                              value={senderName}
                              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-300 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              フリガナ
                            </label>
                            <input
                              type="text"
                              readOnly
                              value={senderFurigana}
                              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-300 font-medium"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              メールアドレス <span className="text-rose-500 font-bold">[必須]</span>
                            </label>
                            <input
                              type="text"
                              readOnly
                              value={senderEmail}
                              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-300 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              電話番号
                            </label>
                            <input
                              type="text"
                              readOnly
                              value={senderPhone}
                              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-300 font-medium"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            件名・題名
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={renderedSubject}
                            className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-300 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            お問い合わせ内容 <span className="text-rose-500 font-bold">[必須]</span>
                          </label>
                          <textarea
                            rows={8}
                            readOnly
                            value={renderedBody}
                            className="w-full text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-1 text-slate-600 dark:text-slate-400">
                          <input type="checkbox" checked readOnly className="w-4 h-4 text-indigo-600 rounded" />
                          <span className="text-[11px]">プライバシーポリシー・個人情報保護方針に同意する（Bot自動チェック）</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {isJa ? "※ プレビュー上の内容は送信時に自動で適用されます。" : "※ Nội dung xem trước sẽ được áp dụng tự động khi chạy chiến dịch."}
              </span>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isJa ? "閉じる" : "Đóng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
