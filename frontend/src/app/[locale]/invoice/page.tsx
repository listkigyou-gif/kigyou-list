"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  FileCheck2,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UploadCloud,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Search,
  ExternalLink,
  Info,
  Activity,
  Bell,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface InvoiceResultItem {
  raw_input: string;
  t_number: string;
  corporate_number: string;
  company_name: string | null;
  full_address: string | null;
  representative_name: string | null;
  status: "valid" | "cancelled" | "unregistered";
  status_label_ja: string;
  status_label_en: string;
  status_label_vi: string;
  registered_date: string | null;
  detail_url: string | null;
}

interface BatchSummary {
  total: number;
  valid: number;
  invalid: number;
  unregistered: number;
}

const SAMPLE_NUMBERS = `T1010001000000
T5010001008844
T4013301048678
T9010001000000
1010001000002
T9999999999999`;

export default function InvoiceBatchPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const { locale: contextLocale, t } = useLanguage();
  const locale = resolvedParams.locale || contextLocale || "ja";
  const invT = t.invoice;

  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [results, setResults] = useState<InvoiceResultItem[]>([]);
  const [filterTab, setFilterTab] = useState<"all" | "valid" | "alert">("all");
  const [tableSearch, setTableSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [watchNotice, setWatchNotice] = useState<string | null>(null);
  const { isLoggedIn, setAuthModalOpen, saveCompaniesBatch, savedCompanies } = useAuth();

  // Count lines in input
  const inputCount = inputVal
    .split(/[\r\n,;\t]+/)
    .map((s) => s.trim())
    .filter(Boolean).length;

  const handleBulkWatch = () => {
    const validCorps = results
      .filter((r) => r.status === "valid" && r.corporate_number && /^\d{13}$/.test(r.corporate_number))
      .map((r) => r.corporate_number);

    if (validCorps.length === 0) {
      setWatchNotice(
        locale === "en"
          ? "No valid registered companies found to watch."
          : locale === "vi"
          ? "Không tìm thấy doanh nghiệp hợp lệ nào để theo dõi."
          : "監視対象に追加可能な有効な登録企業が見つかりませんでした。"
      );
      return;
    }

    if (!isLoggedIn) {
      try {
        localStorage.setItem("pending_watch_corps", JSON.stringify(validCorps));
      } catch (e) {}
      setAuthModalOpen(true);
      return;
    }

    const { addedCount, totalCount, maxReached } = saveCompaniesBatch(validCorps);
    if (addedCount > 0) {
      setWatchNotice(
        locale === "en"
          ? `Added ${addedCount} companies to your Watchlist (Total: ${savedCompanies.length + addedCount}/100 companies).`
          : locale === "vi"
          ? `Đã thêm ${addedCount} doanh nghiệp vào Danh sách theo dõi (Tổng: ${savedCompanies.length + addedCount}/100 công ty).`
          : `${addedCount} 社を監視リスト（ウォッチ）に追加しました！（現在登録数: ${savedCompanies.length + addedCount} / 100社）`
      );
    } else if (maxReached) {
      setWatchNotice(
        locale === "en"
          ? "Watchlist capacity reached (Max 100 companies)."
          : locale === "vi"
          ? "Đã đạt giới hạn danh sách theo dõi (Tối đa 100 công ty)."
          : "監視リストの上限（最大100社）に達しています。"
      );
    } else {
      setWatchNotice(
        locale === "en"
          ? "All valid companies are already in your Watchlist."
          : locale === "vi"
          ? "Tất cả các doanh nghiệp hợp lệ đã có trong danh sách theo dõi."
          : "照会した有効企業はすべて既に監視リストに登録されています。"
      );
    }
  };

  const handleExecuteBatch = async () => {
    if (!inputVal.trim()) {
      setErrorMessage(
        locale === "en"
          ? "Please enter at least one invoice registration number."
          : locale === "vi"
          ? "Vui lòng nhập ít nhất một mã số Invoice T-Number."
          : "照会するインボイス登録番号または13桁の法人番号を入力してください。"
      );
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/invoice/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numbers: inputVal }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to query invoice data");
      }

      setSummary(data.summary);
      setResults(data.results);
      setFilterTab("all");
    } catch (err: any) {
      console.error("Batch invoice error:", err);
      setErrorMessage(
        locale === "en"
          ? "Query failed. Please check your input and try again."
          : locale === "vi"
          ? "Tra cứu thất bại. Vui lòng kiểm tra lại định dạng mã."
          : "照会処理中にエラーが発生しました。入力内容をご確認の上、再度お試しください。"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        // Extract all occurrences of T\d{13} or \d{13}
        const matches = content.match(/(?:[Tt]\d{13}|\b\d{13}\b)/g);
        if (matches && matches.length > 0) {
          const uniqueList = Array.from(new Set(matches));
          setInputVal(uniqueList.join("\n"));
        } else {
          // If no clean pattern match, put raw content
          setInputVal(content);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;

    const headers = [
      invT.csvHeaderInput,
      invT.csvHeaderTNumber,
      invT.csvHeaderCorporateNumber,
      invT.csvHeaderCompanyName,
      invT.csvHeaderAddress,
      invT.csvHeaderRepresentative,
      invT.csvHeaderStatus,
      invT.csvHeaderDetailUrl,
      invT.csvHeaderCheckedAt
    ];

    const timestamp = new Date().toISOString().replace(/T/, " ").replace(/\..+/, "");
    const rows = results.map((r) => [
      `"${r.raw_input.replace(/"/g, '""')}"`,
      `"${r.t_number}"`,
      `"${r.corporate_number}"`,
      `"${(r.company_name || "").replace(/"/g, '""')}"`,
      `"${(r.full_address || "").replace(/"/g, '""')}"`,
      `"${(r.representative_name || "").replace(/"/g, '""')}"`,
      `"${r.status === "valid" ? invT.csvStatusValid : r.status === "cancelled" ? invT.csvStatusCancelled : invT.csvStatusUnregistered}"`,
      `"${(r.detail_url || "").replace(/"/g, '""')}"`,
      `"${timestamp}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `invoice_batch_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered rows for the table
  const filteredResults = results.filter((r) => {
    if (filterTab === "valid" && r.status !== "valid") return false;
    if (filterTab === "alert" && r.status === "valid") return false;

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      const matchNum = r.t_number.toLowerCase().includes(q) || r.corporate_number.includes(q);
      const matchName = (r.company_name || "").toLowerCase().includes(q);
      const matchAddr = (r.full_address || "").toLowerCase().includes(q);
      return matchNum || matchName || matchAddr;
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0D1117] text-slate-800 dark:text-slate-100 font-sans">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6">
          <Link href={`/${locale}`} className="hover:text-slate-900 dark:hover:text-white transition-colors">
            {invT.breadcrumbsHome}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 dark:text-white font-medium">{invT.breadcrumbsCurrent}</span>
        </nav>

        {/* Hero Section */}
        <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs mb-8">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{invT.heroBadge}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight mb-3">
              {invT.heroTitle}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {invT.heroDesc}
            </p>
          </div>
        </div>

        {/* Input & Action Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          <div className="lg:col-span-8 bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="invoice-input" className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                <span>{invT.inputLabel}</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInputVal(SAMPLE_NUMBERS)}
                  className="text-xs text-[#1B4F8A] dark:text-blue-400 hover:underline cursor-pointer font-medium"
                >
                  {invT.sampleInsert}
                </button>
                {inputVal && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputVal("");
                      setSummary(null);
                      setResults([]);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {invT.clear}
                  </button>
                )}
              </div>
            </div>

            <textarea
              id="invoice-input"
              rows={8}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={invT.placeholder}
              className="w-full p-3.5 text-xs sm:text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent transition-all"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <span>{invT.inputCount} <strong className="text-slate-900 dark:text-white">{inputCount}</strong> {invT.itemUnit}</span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span>{invT.inputLimit}</span>
              </div>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors">
                  <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                  <span>{invT.uploadBtn}</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleExecuteBatch}
                  disabled={loading || inputCount === 0}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold text-white bg-[#1B4F8A] hover:bg-[#143D6C] disabled:bg-slate-300 dark:disabled:bg-slate-700 shadow-sm cursor-pointer transition-all active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{invT.queryingBtn}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{invT.submitBtn}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Quick Guide Card */}
          <div className="lg:col-span-4 bg-slate-50/80 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                <span>{invT.guideTitle}</span>
              </h3>

              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                  <span><strong>{invT.guide1Title}</strong> {invT.guide1Desc}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                  <span><strong>{invT.guide2Title}</strong> {invT.guide2Desc}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                  <span><strong>{invT.guide3Title}</strong> {invT.guide3Desc}</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 p-3 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-500 dark:text-slate-400">
              {invT.guideNote}
            </div>
          </div>
        </div>

        {/* Results Section */}
        {summary && (
          <div className="space-y-6 animate-fadeIn">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{invT.summaryTotal}</span>
                <div className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                  {summary.total} <span className="text-xs font-normal text-slate-400">{invT.itemUnit}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#161B22] border border-emerald-200/80 dark:border-emerald-900/40 rounded-xl p-4 shadow-xs bg-emerald-50/20">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {invT.summaryValid}
                </span>
                <div className="mt-1 text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300 tabular-nums">
                  {summary.valid} <span className="text-xs font-normal text-emerald-600">{invT.itemUnit}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#161B22] border border-rose-200/80 dark:border-rose-900/40 rounded-xl p-4 shadow-xs bg-rose-50/20">
                <span className="text-xs font-semibold text-rose-800 dark:text-rose-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  {invT.summaryInvalid}
                </span>
                <div className="mt-1 text-2xl font-bold font-mono text-rose-700 dark:text-rose-300 tabular-nums">
                  {summary.invalid} <span className="text-xs font-normal text-rose-600">{invT.itemUnit}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#161B22] border border-amber-200/80 dark:border-amber-900/40 rounded-xl p-4 shadow-xs bg-amber-50/20">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {invT.summaryUnregistered}
                </span>
                <div className="mt-1 text-2xl font-bold font-mono text-amber-700 dark:text-amber-300 tabular-nums">
                  {summary.unregistered} <span className="text-xs font-normal text-amber-600">{invT.itemUnit}</span>
                </div>
              </div>
            </div>

            {/* Results Filter & Export Header */}
            <div className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFilterTab("all")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    filterTab === "all"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  {invT.tabAll} ({results.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("valid")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    filterTab === "valid"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-emerald-700"
                  }`}
                >
                  {invT.tabValid} ({summary.valid})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("alert")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    filterTab === "alert"
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-rose-700"
                  }`}
                >
                  {invT.tabAlert} ({summary.invalid + summary.unregistered})
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder={invT.searchPlaceholder}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleBulkWatch}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#143D6C] shadow-2xs cursor-pointer transition-colors"
                  title={invT.addWatchlistTooltip}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{invT.addWatchlistBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-2xs cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{invT.exportCsvBtn}</span>
                </button>
              </div>
            </div>

            {watchNotice && (
              <div className="p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs flex items-center justify-between gap-2 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 shrink-0 text-[#1B4F8A] dark:text-blue-400" />
                  <span>{watchNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWatchNotice(null)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Results Data Table */}
            <div className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">{invT.thTNumber}</th>
                      <th className="py-3 px-4">{invT.thCompanyName}</th>
                      <th className="py-3 px-4">{invT.thAddress}</th>
                      <th className="py-3 px-4">{invT.thResult}</th>
                      <th className="py-3 px-4 text-center">{invT.thDetail}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                    {filteredResults.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                          {invT.noData}
                        </td>
                      </tr>
                    ) : (
                      filteredResults.map((item, idx) => {
                        const isValid = item.status === "valid";
                        const isCancelled = item.status === "cancelled";

                        return (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            {/* T-Number */}
                            <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                              {item.t_number}
                              {item.corporate_number && (
                                <span className="block text-[10px] font-normal text-slate-400">
                                  {invT.thCorporateNumber}: {item.corporate_number}
                                </span>
                              )}
                            </td>

                            {/* Company Name */}
                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                              {item.company_name ? (
                                item.detail_url ? (
                                  <Link
                                    href={item.detail_url}
                                    target="_blank"
                                    className="hover:text-[#1B4F8A] dark:hover:text-blue-400 hover:underline flex items-center gap-1.5"
                                  >
                                    <span>{item.company_name}</span>
                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                  </Link>
                                ) : (
                                  <span>{item.company_name}</span>
                                )
                              ) : (
                                <span className="text-slate-400 italic">{invT.noCompany}</span>
                              )}
                            </td>

                            {/* Address */}
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                              {item.full_address || <span className="text-slate-400">—</span>}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              {isValid ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  {invT.validBadge}
                                </span>
                              ) : isCancelled ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  {locale === "en" ? item.status_label_en : locale === "vi" ? item.status_label_vi : item.status_label_ja}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  {invT.unregisteredBadge}
                                </span>
                              )}
                            </td>

                            {/* Detail Link */}
                            <td className="py-3 px-4 text-center">
                              {item.detail_url ? (
                                <Link
                                  href={item.detail_url}
                                  target="_blank"
                                  className="inline-flex items-center justify-center p-1.5 rounded text-slate-500 hover:text-[#1B4F8A] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title={invT.viewDetailTitle}
                                >
                                  <ArrowRight className="w-4 h-4" />
                                </Link>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-700">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Watchlist & Change Alert Feature Introduction Section (Cầu nối chuyển đổi người dùng) */}
        <section className="mt-14 p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-slate-50 to-white dark:from-[#161B22] dark:to-[#0D1117] border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#1B4F8A] border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                <Bell className="w-3.5 h-3.5" />
                <span>{invT.bridgeBadge}</span>
                <span className="font-normal text-slate-400">|</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">{invT.bridgeFreeQuota}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug whitespace-pre-line">
                {invT.bridgeTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {invT.bridgeDesc}
              </p>
            </div>

            {/* 3 Core Value Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/80 dark:border-slate-800 hover:border-blue-400/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center font-bold text-xs mb-3 border border-rose-200/80 dark:border-rose-800">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                    {invT.bridgeCard1Title}
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {invT.bridgeCard1Desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 font-medium">
                  {invT.bridgeCard1Sub}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/80 dark:border-slate-800 hover:border-purple-400/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 flex items-center justify-center font-bold text-xs mb-3 border border-purple-200/80 dark:border-purple-800">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                    {invT.bridgeCard2Title}
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {invT.bridgeCard2Desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 font-medium">
                  {invT.bridgeCard2Sub}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/80 dark:border-slate-800 hover:border-amber-400/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center font-bold text-xs mb-3 border border-amber-200/80 dark:border-amber-800">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                    {invT.bridgeCard3Title}
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {invT.bridgeCard3Desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 font-medium">
                  {invT.bridgeCard3Sub}
                </div>
              </div>
            </div>

            {/* Interactive Timeline Mockup Preview */}
            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                  <span>{invT.timelineTitle}</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">{invT.timelineSub}</span>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">{invT.timelineItem1Tag}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{invT.timelineItem1Company}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {invT.timelineItem1Desc}
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {invT.timelineItem1Before} ➔ <strong className="text-rose-600">{invT.timelineItem1After}</strong>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{invT.timelineItem1Time}</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">{invT.timelineItem2Tag}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{invT.timelineItem2Company}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {invT.timelineItem2Desc}
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {invT.timelineItem2Before} ➔ <strong className="text-emerald-600">{invT.timelineItem2After}</strong>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{invT.timelineItem2Time}</span>
                </div>
              </div>
            </div>

            {/* CTA Box */}
            <div className="p-5 sm:p-6 rounded-xl bg-gradient-to-r from-[#1B4F8A]/5 via-blue-50/50 to-emerald-50/50 dark:from-blue-950/20 dark:via-slate-900/40 dark:to-emerald-950/20 border border-blue-200/60 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {invT.ctaTitle}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {invT.ctaDesc}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (isLoggedIn) {
                      window.location.href = `/${locale}/dashboard?tab=watchlist`;
                    } else {
                      setAuthModalOpen(true);
                    }
                  }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#143D6C] shadow-sm transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isLoggedIn ? invT.ctaBtnLoggedIn : invT.ctaBtnLoggedOut}</span>
                </button>

                <Link
                  href={`/${locale}/watchlist`}
                  className="inline-flex items-center gap-1 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs whitespace-nowrap"
                >
                  <span>{invT.ctaDetailBtn}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SEO Knowledge & FAQ Section */}
        <section className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto space-y-10">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                {invT.faqTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {invT.faqDesc}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                  <span>{invT.faqCard1Title}</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {invT.faqCard1Desc}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{invT.faqCard2Title}</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {invT.faqCard2Desc}
                </p>
              </div>
            </div>

            {/* Legal Disclaimer */}
            <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <strong className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {invT.disclaimerTitle}
              </strong>
              {invT.disclaimerDesc}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
