"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { LocaleLink } from "@/components/LocaleLink";
import {
  ExternalLink,
  Trash2,
  CheckCircle2,
  Search,
  X,
  Plus,
  Loader2,
  Bell,
  Mail,
  AlertCircle,
  FileCheck2,
  ShieldCheck,
  Clock,
  Calendar
} from "lucide-react";
import { BatchInvoiceModal } from "./BatchInvoiceModal";

interface WatchedCompany {
  corporate_number: string;
  company_name: string;
  prefecture_name: string | null;
  city_name: string | null;
  phone_number: string | null;
  website_url: string | null;
  employee_count: number | null;
  capital_amount: number | null;
  status: string | null;
  updated_at: string | null;
}

interface ChangeEvent {
  id: number;
  corporate_number: string;
  company_name: string;
  event_category: string;
  event_date: string;
  title_ja: string;
  description_ja: string | null;
  old_value: string | null;
  new_value: string | null;
  source: string;
}

interface SearchResultItem {
  corporate_number: string;
  company_name: string;
  prefecture_name?: string | null;
  city_name?: string | null;
}

interface WatchlistTabProps {
  onEventsCountChange?: (count: number) => void;
}

export const WatchlistTab: React.FC<WatchlistTabProps> = ({ onEventsCountChange }) => {
  const { savedCompanies, toggleSaveCompany } = useAuth();
  const { locale } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<WatchedCompany[]>([]);
  const [events, setEvents] = useState<ChangeEvent[]>([]);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Quick Add Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatchInvoiceModal, setShowBatchInvoiceModal] = useState(false);
  const [batchInvoiceMode, setBatchInvoiceMode] = useState<"add" | "audit">("add");
  const [batchInvoiceNumbers, setBatchInvoiceNumbers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [addNotice, setAddNotice] = useState<string | null>(null);

  // Load email alert preference from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("kigyou_watchlist_email_alert");
      if (stored !== null) {
        setEmailAlerts(stored === "true");
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleToggleEmailAlert = () => {
    const nextVal = !emailAlerts;
    setEmailAlerts(nextVal);
    try {
      localStorage.setItem("kigyou_watchlist_email_alert", String(nextVal));
    } catch {
      // Ignore localStorage errors
    }
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  // Fetch watched companies & events when savedCompanies change
  useEffect(() => {
    if (savedCompanies.length === 0) {
      setCompanies([]);
      setEvents([]);
      if (onEventsCountChange) onEventsCountChange(0);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetch("/api/user/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ corporateNumbers: savedCompanies })
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success) {
          const fetchedCompanies = data.companies || [];
          const fetchedEvents = data.events || [];
          setCompanies(fetchedCompanies);
          setEvents(fetchedEvents);
          if (onEventsCountChange) {
            onEventsCountChange(fetchedEvents.length);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load watchlist data:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [savedCompanies, onEventsCountChange]);

  // Debounced Search for Quick Add Modal
  useEffect(() => {
    if (!showAddModal || !searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}&limit=6`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.companies || []);
        }
      } catch (err) {
        console.error("Quick add search error:", err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, showAddModal]);

  const handleAddCompany = (corp: SearchResultItem) => {
    if (!savedCompanies.includes(corp.corporate_number)) {
      toggleSaveCompany(corp.corporate_number);
      setAddNotice(`「${corp.company_name}」を監視リストに追加しました`);
      setTimeout(() => setAddNotice(null), 3000);
    }
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (selectedCategory === "all") return events;
    return events.filter((ev) => {
      if (selectedCategory === "relocation") return ev.event_category === "relocation";
      if (selectedCategory === "merger") return ev.event_category === "merger";
      if (selectedCategory === "representative") return ev.event_category === "representative_change" || ev.event_category === "representative";
      if (selectedCategory === "invoice") return ev.event_category === "invoice" || ev.event_category === "invoice_cancel";
      if (selectedCategory === "hiring") return ev.event_category === "hiring";
      if (selectedCategory === "bankruptcies") return ev.event_category === "bankruptcies";
      if (selectedCategory === "new_establishment") return ev.event_category === "new_establishment";
      return true;
    });
  }, [events, selectedCategory]);

  const maxFreeQuota = 100;
  const currentCount = savedCompanies.length;

  const categoryLabels: Record<string, { ja: string; en: string; vi: string }> = {
    all: { ja: "すべて", en: "All", vi: "Tất cả" },
    relocation: { ja: "本店移転", en: "Relocation", vi: "Chuyển trụ sở" },
    merger: { ja: "合併・商号変更", en: "Merger / Name", vi: "Sáp nhập / Đổi tên" },
    representative: { ja: "代表者変更", en: "CEO / Rep Change", vi: "Đổi người đại diện" },
    invoice: { ja: "インボイス変動", en: "Invoice Alert", vi: "Biến động Invoice" },
    hiring: { ja: "新着求人", en: "Hiring", vi: "Tuyển dụng mới" },
    bankruptcies: { ja: "倒産・閉鎖", en: "Closure", vi: "Đóng cửa / Giải thể" },
    new_establishment: { ja: "新設法人", en: "New Entity", vi: "Thành lập mới" },
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Notification Settings Card */}
      <div className="p-5 sm:p-6 bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-[#1B4F8A] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900 px-2 py-0.5 rounded">
                {locale === "en" ? "Corporate Intelligence & Alerts" : locale === "vi" ? "Giám Sát Biến Động Doanh Nghiệp" : "企業監視・重要変動検知"}
              </span>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                {locale === "en" ? "FREE TIER (100 CO.)" : locale === "vi" ? "MIỄN PHÍ (100 CÔNG TY)" : "無料枠: 最大100社"}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {locale === "en"
                ? "Corporate Watchlist & Real-Time Change Timeline"
                : locale === "vi"
                ? "Danh Sách Doanh Nghiệp Theo Dõi & Dòng Thời Gian Biến Động"
                : "監視リスト企業・最新変動タイムライン"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-3xl">
              {locale === "en"
                ? "Track official corporate name changes, relocations, invoice registrations, hiring signals, and public tender awards. Automated email digests are dispatched upon detected events."
                : locale === "vi"
                ? "Theo dõi tự động các thay đổi pháp lý: đổi tên, chuyển trụ sở, chứng nhận Invoice, tín hiệu tuyển dụng và trúng thầu công. Email cảnh báo được gửi tự động khi có biến động."
                : "社名変更、本店移転、適格請求書(インボイス)登録、決算公表、求人新着、官公庁入札などの重要変動を自動追跡。変動発生時にご登録メールへ速報通知します。"}
            </p>
          </div>

          {/* Email Notification Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>{locale === "en" ? "Email Alerts:" : locale === "vi" ? "Báo qua Email:" : "メール速報通知:"}</span>
            </div>
            <button
              onClick={handleToggleEmailAlert}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                emailAlerts
                  ? "bg-[#1B4F8A] text-white hover:bg-[#143D6C] shadow-2xs"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{emailAlerts ? (locale === "ja" ? "受信中 (ON)" : "ON") : (locale === "ja" ? "停止中 (OFF)" : "OFF")}</span>
            </button>
          </div>
        </div>

        {/* Quota Indicator */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <span className="font-medium">
              {locale === "en" ? "Monitored Capacity:" : locale === "vi" ? "Dung lượng theo dõi:" : "現在の登録数:"}
            </span>
            <strong className="text-slate-900 dark:text-white font-mono tabular-nums text-sm font-bold">
              {currentCount} / {maxFreeQuota} 社
            </strong>
            <span className="text-[10px] text-slate-400">
              ({locale === "en" ? "Free Tier limit: 100 companies" : locale === "vi" ? "Hạn mức gói miễn phí: 100 công ty" : "無料プラン上限: 最大100社"})
            </span>
          </div>

          {saveSuccessNotice && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{locale === "ja" ? "通知設定を保存しました" : "Settings saved"}</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Main Content Grid: Left Monitored List (40%) + Right Timeline (60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: Monitored Companies List (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 gap-2">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {locale === "en" ? "Monitored Companies" : locale === "vi" ? "Doanh nghiệp đang theo dõi" : "監視対象企業"} ({companies.length})
            </h3>
            <div className="flex flex-wrap items-center gap-1.5">
              {companies.length > 0 && (
                <button
                  onClick={() => {
                    setBatchInvoiceMode("audit");
                    setBatchInvoiceNumbers(savedCompanies);
                    setShowBatchInvoiceModal(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 px-2 py-1 rounded-md transition-colors cursor-pointer"
                  title={locale === "ja" ? "監視リストに登録中の全企業のインボイス登録状況を一括対照" : "Audit all monitored companies invoice status"}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{locale === "ja" ? "全社照会" : "Audit All"}</span>
                </button>
              )}
              <button
                onClick={() => {
                  setBatchInvoiceMode("add");
                  setBatchInvoiceNumbers([]);
                  setShowBatchInvoiceModal(true);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-1 rounded-md transition-colors cursor-pointer"
                title={locale === "ja" ? "インボイス登録番号や法人番号を最大100社まで一括照会して監視リストへ追加" : "Bulk query & watch up to 100 invoice numbers"}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>{locale === "ja" ? "一括追加" : "+ Batch"}</span>
              </button>
              <button
                onClick={() => {
                  setShowAddModal(true);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1B4F8A] hover:text-[#143D6C] dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{locale === "en" ? "Add" : locale === "vi" ? "Thêm" : "企業追加"}</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-lg">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin mx-auto mb-2" />
              <span className="text-xs text-slate-500">{locale === "ja" ? "監視リストを読み込み中..." : "Loading watchlist..."}</span>
            </div>
          ) : companies.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-[#161B22] border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              <AlertCircle className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {locale === "en" ? "No monitored companies yet" : locale === "vi" ? "Chưa có doanh nghiệp nào trong danh sách" : "監視中の企業はまだありません"}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                {locale === "en"
                  ? "Add companies or import invoice numbers (up to 100 companies) to monitor official changes."
                  : locale === "vi"
                  ? "Thêm doanh nghiệp hoặc tra cứu hàng loạt số hóa đơn (tối đa 100 công ty) để theo dõi biến động."
                  : "企業を追加またはインボイス番号を一括照会（最大100社）すると、登記や適格請求書の重要変動がタイムラインに即時反映されます。"}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  onClick={() => setShowBatchInvoiceModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors cursor-pointer shadow-2xs"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>{locale === "ja" ? "インボイス一括照会して登録 (最大100社)" : "Batch Invoice Query & Watch"}</span>
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{locale === "ja" ? "企業を検索して追加" : "Search & Add"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {companies.map((comp) => (
                <div
                  key={comp.corporate_number}
                  className="p-3 bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs flex flex-col justify-between gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <LocaleLink
                        href={`/company/${comp.corporate_number}`}
                        className="text-xs font-bold text-slate-900 dark:text-white hover:text-[#1B4F8A] dark:hover:text-blue-400 block truncate"
                        title={comp.company_name}
                      >
                        {comp.company_name}
                      </LocaleLink>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                        <span>{comp.corporate_number}</span>
                        {comp.prefecture_name && (
                          <>
                            <span>·</span>
                            <span>{comp.prefecture_name}{comp.city_name || ""}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => toggleSaveCompany(comp.corporate_number)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors shrink-0 cursor-pointer"
                      title={locale === "ja" ? "監視リストから解除" : "Remove from watchlist"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{locale === "ja" ? "正常監視中" : "Monitoring Active"}</span>
                    </span>

                    <LocaleLink
                      href={`/company/${comp.corporate_number}`}
                      className="text-[#1B4F8A] dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>{locale === "ja" ? "詳細を見る" : "View Dossier"}</span>
                      <ExternalLink className="w-3 h-3" />
                    </LocaleLink>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Live Change Event Timeline (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {locale === "en" ? "Recent Change Events Timeline" : locale === "vi" ? "Dòng thời gian biến động phát hiện gần đây" : "検知された最新変動タイムライン"}
            </h3>
            <span className="text-[10px] text-slate-400">
              {locale === "ja" ? "国税庁・登記所・EDINET自動同期" : "NTA & EDINET Automated Sync"}
            </span>
          </div>

          {/* Event Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pb-1">
            {Object.keys(categoryLabels).map((catKey) => {
              const isActive = selectedCategory === catKey;
              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer border ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100 font-bold"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-[#161B22] dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800"
                  }`}
                >
                  {categoryLabels[catKey][locale === "ja" ? "ja" : locale === "vi" ? "vi" : "en"]}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="p-8 text-center bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-lg">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin mx-auto mb-2" />
              <span className="text-xs text-slate-500">{locale === "ja" ? "変動履歴を取得中..." : "Fetching change logs..."}</span>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-lg">
              <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-800 dark:text-white mb-1">
                {locale === "en" ? "All Monitored Companies are Stable" : locale === "vi" ? "Tất cả các công ty theo dõi đang ổn định" : "監視対象企業の直近変動はありません"}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                {locale === "en"
                  ? "When an official change is detected in corporate name, representative, head office, invoice status, or financial filing, it will appear here instantly."
                  : locale === "vi"
                  ? "Khi có biến động về tên công ty, người đại diện, trụ sở, trạng thái hóa đơn hoặc báo cáo tài chính mới, hệ thống sẽ tự động cập nhật tại đây."
                  : "商号変更、代表者異動、本店移転、インボイス登録、新着決算等の変動が公表され次第、タイムラインに自動反映されます。"}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3.5 bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-lg shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                          ev.event_category === "representative_change" || ev.event_category === "representative"
                            ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                            : ev.event_category === "invoice" || ev.event_category === "invoice_cancel"
                            ? ev.new_value?.includes("取消") || ev.new_value?.includes("失効") || ev.title_ja?.includes("失効") || ev.title_ja?.includes("取消")
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                              : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                            : ev.event_category === "bankruptcies"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                            : ev.event_category === "hiring"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {categoryLabels[ev.event_category]?.ja ||
                          (ev.event_category === "representative_change"
                            ? "代表者変更"
                            : ev.event_category === "invoice"
                            ? "インボイス変動"
                            : ev.event_category)}
                      </span>
                      <LocaleLink
                        href={`/company/${ev.corporate_number}`}
                        className="text-xs font-bold text-slate-900 dark:text-white hover:text-[#1B4F8A] dark:hover:text-blue-400 truncate max-w-xs"
                      >
                        {ev.company_name}
                      </LocaleLink>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{locale === "ja" ? "公表日:" : "Date:"} {ev.event_date}</span>
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    {ev.title_ja}
                  </h4>

                  {ev.description_ja && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                      {ev.description_ja}
                    </p>
                  )}

                  {ev.event_category !== "hiring" && (ev.old_value || ev.new_value) && (
                    <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-[11px] space-y-1.5">
                      <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-200/60 dark:border-slate-800 text-[10px] text-slate-500 font-mono">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>
                          {locale === "ja" ? "変動公表・効力発生日:" : locale === "vi" ? "Mốc thời gian phát sinh biến động:" : "Effective Date:"}{" "}
                          <strong className="text-slate-800 dark:text-slate-200 font-bold">{ev.event_date}</strong>
                        </span>
                      </div>
                      {ev.old_value && (
                        <div className="text-slate-500 flex items-start gap-1.5">
                          <span className="font-semibold text-rose-600 shrink-0">変更前:</span>
                          <span className="line-through">{ev.old_value}</span>
                        </div>
                      )}
                      {ev.new_value && (
                        <div className="text-slate-800 dark:text-slate-200 flex items-start gap-1.5 font-medium">
                          <span className="font-semibold text-emerald-600 shrink-0">変更後:</span>
                          <span>{ev.new_value}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span>情報ソース: {ev.source}</span>
                    <LocaleLink
                      href={`/company/${ev.corporate_number}`}
                      className="text-[#1B4F8A] dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>{locale === "ja" ? "企業詳細を確認" : "View Profile"}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </LocaleLink>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 3. Quick Add Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {locale === "en" ? "Add Company to Watchlist" : locale === "vi" ? "Thêm doanh nghiệp vào danh sách theo dõi" : "監視リストに企業を追加"}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {locale === "ja" ? "企業名または13桁の法人番号で検索" : "Search by company name or 13-digit corporate number"}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={locale === "ja" ? "例: トヨタ自動車、日立製作所、7010001008844" : "e.g. Toyota, Sony, 13-digit Corporate No."}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#1B4F8A]"
                autoFocus
              />
              {searching && (
                <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
              )}
            </div>

            {/* Feedback Notice */}
            {addNotice && (
              <div className="p-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{addNotice}</span>
              </div>
            )}

            {/* Results List */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/60">
              {searchResults.length > 0 ? (
                searchResults.map((item) => {
                  const isAlreadyAdded = savedCompanies.includes(item.corporate_number);
                  return (
                    <div
                      key={item.corporate_number}
                      className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white block truncate">
                          {item.company_name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.corporate_number} {item.prefecture_name ? `· ${item.prefecture_name}` : ""}
                        </span>
                      </div>

                      <button
                        onClick={() => handleAddCompany(item)}
                        disabled={isAlreadyAdded}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors shrink-0 cursor-pointer ${
                          isAlreadyAdded
                            ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
                            : "bg-[#1B4F8A] text-white hover:bg-[#143D6C]"
                        }`}
                      >
                        {isAlreadyAdded ? (locale === "ja" ? "監視中" : "Added") : (locale === "ja" ? "+ 監視追加" : "+ Watch")}
                      </button>
                    </div>
                  );
                })
              ) : searchQuery.trim().length >= 2 && !searching ? (
                <div className="text-center py-4 text-xs text-slate-400">
                  {locale === "ja" ? "該当する企業が見つかりませんでした" : "No matching companies found"}
                </div>
              ) : (
                <div className="text-center py-4 text-[11px] text-slate-400">
                  {locale === "ja" ? "2文字以上入力するとリアルタイム検索します" : "Type at least 2 characters to search"}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
              >
                {locale === "ja" ? "閉じる" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Invoice Query & Auto-Watch Modal */}
      <BatchInvoiceModal
        isOpen={showBatchInvoiceModal}
        onClose={() => setShowBatchInvoiceModal(false)}
        locale={locale}
        initialNumbers={batchInvoiceNumbers}
        mode={batchInvoiceMode}
      />
    </div>
  );
};
