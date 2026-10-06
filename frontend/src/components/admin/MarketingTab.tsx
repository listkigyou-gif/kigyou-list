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
  Pause,
  Filter,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  Clock,
  Building,
  Check,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react";

interface MarketingStats {
  total_companies_with_email: number;
  total_suppressed: number;
  total_sent: number;
  total_campaigns: number;
  top_prefectures: { prefecture_name: string; email_count: string }[];
  recent_campaigns: any[];
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

export function MarketingTab({ adminEmail, getAdminHeaders }: MarketingTabProps) {
  const [subTab, setSubTab] = useState<"campaign" | "history" | "suppressions">("campaign");

  // Global marketing state
  const [stats, setStats] = useState<MarketingStats | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Audience filters
  const [prefecture, setPrefecture] = useState<string>("all");
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
        setTargetCount(data.total_count);
      }
    } catch (err) {
      console.error("Failed to generate preview:", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Send Test Email
  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      setTestMessage({ type: "error", text: "Vui lòng nhập địa chỉ email hợp lệ để test." });
      return;
    }

    setSendingTest(true);
    setTestMessage(null);
    try {
      const res = await fetch("/api/admin/marketing/send-test", {
        method: "POST",
        headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          test_email: testEmail,
          subject,
          body_html: bodyHtml,
          sample_company: previewData?.sampleCompany,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestMessage({
          type: "success",
          text: `Đã gửi email thử nghiệm thành công tới ${testEmail}! Hãy kiểm tra hộp thư đến (hoặc thư mục Spam).`,
        });
      } else {
        setTestMessage({
          type: "error",
          text: data.error || "Gửi thử nghiệm thất bại.",
        });
      }
    } catch (err: any) {
      setTestMessage({ type: "error", text: err.message || "Lỗi kết nối khi gửi thử nghiệm." });
    } finally {
      setSendingTest(false);
    }
  };

  // Send Batch
  const handleSendBatch = async () => {
    if (!subject.trim() || !bodyHtml.trim()) {
      alert("Vui lòng nhập đầy đủ tiêu đề và nội dung email!");
      return;
    }

    const confirmed = window.confirm(
      `Xác nhận bắt đầu gửi đợt ${batchSize} email B2B tới tệp khách hàng đã chọn?\n\n(Hệ thống sẽ gửi an toàn có giãn cách để đảm bảo uy tín tên miền)`
    );
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
        setBatchError(data.error || "Có lỗi xảy ra khi gửi đợt email này.");
      }
    } catch (err: any) {
      setBatchError(err.message || "Lỗi kết nối máy chủ khi gửi đợt.");
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
      alert("Vui lòng nhập địa chỉ email hợp lệ!");
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
    if (!window.confirm(`Xóa email ${email} khỏi danh sách chặn gửi?`)) return;
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

  return (
    <div className="flex flex-col gap-6">
      {/* Top Marketing Stats KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Sẵn Có Trong DB</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.total_companies_with_email.toLocaleString() || "137,900"}
          </div>
          <p className="text-xs text-slate-500 mt-1">Doanh nghiệp Nhật đã có email</p>
        </div>

        <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Email Đã Gửi</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.total_sent.toLocaleString() || "0"}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Tỷ lệ thành công cao</p>
        </div>

        <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đã Hủy Nhận (Opt-out)</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Ban className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.total_suppressed.toLocaleString() || "0"}
          </div>
          <p className="text-xs text-slate-500 mt-1">Tự động chặn gửi vĩnh viễn</p>
        </div>

        <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chiến Dịch Đã Tạo</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.total_campaigns.toLocaleString() || "0"}
          </div>
          <p className="text-xs text-slate-500 mt-1">Quản lý theo phân khúc</p>
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
          <Mail className="w-4 h-4" /> Soạn & Bắn Chiến Dịch
        </button>
        <button
          onClick={() => setSubTab("history")}
          className={`px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${
            subTab === "history"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" /> Lịch Sử Chiến Dịch
        </button>
        <button
          onClick={() => setSubTab("suppressions")}
          className={`px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${
            subTab === "suppressions"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Ban className="w-4 h-4" /> Danh Sách Chặn (Opt-out)
        </button>
      </div>

      {/* SUBTAB 1: CAMPAIGN CREATOR & DISPATCHER */}
      {subTab === "campaign" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Filter & Settings (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Step 1: Target Audience Filter */}
            <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                  <Filter className="w-4 h-4 text-blue-500" />
                  1. Lọc Tệp Khách Hàng Mục Tiêu
                </h3>
              </div>

              <div className="space-y-4">
                {/* Prefecture */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    Tỉnh / Thành phố
                  </label>
                  <select
                    value={prefecture}
                    onChange={(e) => {
                      setPrefecture(e.target.value);
                      setTargetCount(null);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="all">🇯🇵 Toàn bộ Nhật Bản (137,900 email)</option>
                    {stats?.top_prefectures?.map((p) => (
                      <option key={p.prefecture_name} value={p.prefecture_name}>
                        {p.prefecture_name} ({parseInt(p.email_count, 10).toLocaleString()} email)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Employees */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    Quy mô nhân sự
                  </label>
                  <select
                    value={minEmployees}
                    onChange={(e) => {
                      setMinEmployees(e.target.value);
                      setTargetCount(null);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Tất cả quy mô</option>
                    <option value="10">Từ 10 nhân viên trở lên</option>
                    <option value="30">Từ 30 nhân viên trở lên</option>
                    <option value="50">Từ 50 nhân viên trở lên</option>
                    <option value="100">Từ 100 nhân viên trở lên</option>
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
                  <label htmlFor="hasWebsite" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Chỉ chọn công ty có Website chính thức
                  </label>
                </div>

                {/* Exclude Recent Days */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    Chống Spam: Loại trừ công ty đã nhận email gần đây
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
                      className="w-20 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-500">ngày qua</span>
                  </div>
                </div>

                {/* Calculate target count button */}
                <button
                  type="button"
                  onClick={handleCalculateAudience}
                  disabled={calculatingCount}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {calculatingCount ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Users className="w-3.5 h-3.5" />
                  )}
                  {targetCount !== null ? `Khả dụng: ${targetCount.toLocaleString()} công ty` : "Kiểm tra số lượng mục tiêu"}
                </button>
              </div>
            </div>

            {/* Step 3: Test Send & Safe Dispatcher */}
            <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                3. Gửi Thử Nghiệm & Điều Phối An Toàn
              </h3>

              {/* Test Send */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-750">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  Gửi 1 email test trước vào hòm thư:
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
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {sendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Gửi Test
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
                    Quy mô đợt gửi (Batch Size):
                  </label>
                  <select
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value, 10))}
                    className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                  >
                    <option value={10}>10 emails / đợt</option>
                    <option value={20}>20 emails / đợt (Khuyên dùng)</option>
                    <option value={50}>50 emails / đợt</option>
                    <option value={100}>100 emails / đợt</option>
                  </select>
                </div>

                <p className="text-[11px] text-slate-500 leading-tight">
                  ℹ️ Mỗi email sẽ được gửi cách nhau 600ms và tự động kèm link Hủy nhận (オプトアウト) theo đúng quy định luật Tokushoho Nhật Bản.
                </p>

                <button
                  type="button"
                  onClick={handleSendBatch}
                  disabled={isSendingBatch}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSendingBatch ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang gửi đợt {batchSize} emails...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      Bắt Đầu Bắn Đợt Này ({batchSize} email)
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
                      <span className="text-slate-600 dark:text-slate-400">Tiến độ đợt gửi:</span>
                      <span className="text-blue-600 dark:text-blue-400">
                        {batchProgress.isFinished ? "Hoàn thành tệp!" : `Còn ${batchProgress.remaining.toLocaleString()} công ty`}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium">
                      <span className="text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Thành công: {batchProgress.sentInBatch}
                      </span>
                      {batchProgress.failedInBatch > 0 && (
                        <span className="text-rose-600 flex items-center gap-1">
                          <Ban className="w-3.5 h-3.5" /> Thất bại: {batchProgress.failedInBatch}
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
                  2. Mẫu Thư & Soạn Thảo Nội Dung (Chuẩn Keigo Nhật B2B)
                </h3>

                <button
                  type="button"
                  onClick={handleOpenPreview}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-500" />
                  Xem Trước (Live Preview)
                </button>
              </div>

              {/* Template selector */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  Chọn mẫu thư tiếng Nhật có sẵn:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl.id)}
                      className={`p-3 text-left rounded-xl border transition-all text-xs flex flex-col justify-between ${
                        selectedTemplateId === tpl.id
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-300 font-bold shadow-xs"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span className="line-clamp-2 leading-relaxed">{tpl.name}</span>
                      <span className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-blue-500" /> Chuẩn Keigo
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Campaign Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Tên chiến dịch quản trị
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="VD: Giới thiệu Kigyou-List cho DN Tokyo Tháng 10"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Tiêu đề email (Subject)
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
                  Bấm chèn nhanh biến cá nhân hóa:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "{{company_name}} (Tên công ty)", tag: "{{company_name}}" },
                    { label: "{{representative_name}} (Đại diện)", tag: "{{representative_name}}" },
                    { label: "{{prefecture}} (Tỉnh thành)", tag: "{{prefecture}}" },
                    { label: "{{city}} (Thành phố)", tag: "{{city}}" },
                    { label: "{{corporate_number}} (Mã số thuế)", tag: "{{corporate_number}}" },
                    { label: "{{company_page_url}} (Link bài viết)", tag: "{{company_page_url}}" },
                    { label: "{{unsubscribe_url}} (Link hủy)", tag: "{{unsubscribe_url}}" },
                  ].map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => insertVariableTag(item.tag)}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      + {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body HTML */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Nội dung email (HTML / Rich text)
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
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Lịch Sử Các Chiến Dịch Email</h3>
              <p className="text-xs text-slate-500 mt-0.5">Theo dõi số lượng email đã gửi, thành công và thất bại</p>
            </div>
            <button
              onClick={fetchCampaignsHistory}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              title="Làm mới"
            >
              <RefreshCcw className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 rounded-tl-xl">Thời Gian</th>
                  <th className="px-4 py-3">Tên Chiến Dịch</th>
                  <th className="px-4 py-3">Tiêu Đề Email</th>
                  <th className="px-4 py-3">Tổng Mục Tiêu</th>
                  <th className="px-4 py-3">Đã Gửi</th>
                  <th className="px-4 py-3">Thất Bại</th>
                  <th className="px-4 py-3">Trạng Thái</th>
                  <th className="px-4 py-3 rounded-tr-xl">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {campaignsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      Chưa có chiến dịch nào được tạo.
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
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleViewCampaignLogs(c.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-bold"
                        >
                          Xem logs
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
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Nhật Ký Gửi Thư Của Chiến Dịch</h4>
                  <button
                    onClick={() => setSelectedCampaignLogs(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto py-3 space-y-2 text-xs">
                  {selectedCampaignLogs.logs.length === 0 ? (
                    <p className="text-center py-6 text-slate-400">Không có nhật ký nào cho chiến dịch này.</p>
                  ) : (
                    selectedCampaignLogs.logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{log.company_name || "Công ty"}</div>
                          <div className="text-slate-500 font-mono text-[11px]">{log.recipient_email}</div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.status === "sent" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {log.status === "sent" ? "Đã gửi" : log.error_message || "Thất bại"}
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
                Danh Sách Chặn Gửi (Opt-out / Suppressions)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các email đã bấm hủy nhận tin (配信停止) theo luật Nhật hoặc bị từ chối sẽ được lưu tại đây để vĩnh viễn không gửi lại.
              </p>
            </div>

            {/* Manual add input */}
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={newSuppressionEmail}
                onChange={(e) => setNewSuppressionEmail(e.target.value)}
                placeholder="chặn-email@example.co.jp"
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
              <button
                onClick={handleAddSuppression}
                disabled={addingSuppression}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm chặn thủ công
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 rounded-tl-xl">Thời Gian Chặn</th>
                  <th className="px-4 py-3">Địa Chỉ Email</th>
                  <th className="px-4 py-3">Lý Do</th>
                  <th className="px-4 py-3 rounded-tr-xl text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {suppressionsList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      Chưa có email nào trong danh sách chặn.
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
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                          Gỡ chặn
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
                  Xem Trước Email Gửi Đi (Dữ Liệu Thật)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đã tự động thay thế các biến bằng dữ liệu của công ty mẫu:{" "}
                  <strong>{previewData?.sampleCompany?.company_name || "Mẫu"}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {previewLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Đang chuẩn bị bản xem trước...</p>
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
                className="px-5 py-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
