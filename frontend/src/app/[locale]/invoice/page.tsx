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
  const locale = resolvedParams.locale || "ja";

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
      "入力番号",
      "インボイス登録番号",
      "法人番号",
      "商号・法人名",
      "所在地",
      "代表者名",
      "判定結果",
      "登録区分",
      "照会日時"
    ];

    const timestamp = new Date().toISOString().replace(/T/, " ").replace(/\..+/, "");
    const rows = results.map((r) => [
      `"${r.raw_input.replace(/"/g, '""')}"`,
      `"${r.t_number}"`,
      `"${r.corporate_number}"`,
      `"${(r.company_name || "").replace(/"/g, '""')}"`,
      `"${(r.full_address || "").replace(/"/g, '""')}"`,
      `"${(r.representative_name || "").replace(/"/g, '""')}"`,
      `"${r.status === "valid" ? "適格事業者（有効）" : r.status === "cancelled" ? "登録取消・失効" : "未登録・形式不正"}"`,
      `"${r.status_label_ja.replace(/"/g, '""')}"`,
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
            ホーム
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 dark:text-white font-medium">インボイス一括照会ツール</span>
        </nav>

        {/* Hero Section */}
        <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs mb-8">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>国税庁公表オープンデータ連携・仕入税額控除対策（完全無料）</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight mb-3">
              インボイス登録番号 一括照会・検索ツール
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              取引先のインボイス登録番号（T番号）や13桁の法人番号をまとめて照会できます。
              適格請求書発行事業者の有効性・正式商号・所在地を即座に確認し、税務調査対策用のCSVレポートを1クリックで出力可能です。
            </p>
          </div>
        </div>

        {/* Input & Action Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          <div className="lg:col-span-8 bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="invoice-input" className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                <span>照会番号の入力（1行に1件）</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInputVal(SAMPLE_NUMBERS)}
                  className="text-xs text-[#1B4F8A] dark:text-blue-400 hover:underline cursor-pointer font-medium"
                >
                  【サンプル番号を挿入】
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
                    クリア
                  </button>
                )}
              </div>
            </div>

            <textarea
              id="invoice-input"
              rows={8}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="例:&#10;T1010001000000&#10;T5010001008844&#10;1010001000002&#10;（Excelの列をコピーしてそのまま貼り付け可能です）"
              className="w-full p-3.5 text-xs sm:text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent transition-all"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <span>入力件数: <strong className="text-slate-900 dark:text-white">{inputCount}</strong> 件</span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span>最大 100 件まで一括照会可能</span>
              </div>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors">
                  <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                  <span>CSV/TXT読込</span>
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
                      <span>データベース照会中...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>一括照会を実行する (無料)</span>
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
                <span>一括照会ツールの特長</span>
              </h3>

              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                  <span><strong>高速一括判定:</strong> Excelからコピー＆ペーストするだけで、数百社のインボイス有効性を瞬時に判定。</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                  <span><strong>税務調査・監査対策:</strong> 照会日時・商号・所在地を記録したCSVファイルを1クリックで出力可能。</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                  <span><strong>解散・失効チェック:</strong> 過去に登録されていても、現在解散・清算結了している法人を自動アラート。</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 p-3 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-500 dark:text-slate-400">
              ※本ツールは国税庁オープンデータに基づき照会しています。利用登録なしで完全無料にてご利用いただけます。
            </div>
          </div>
        </div>

        {/* Results Section */}
        {summary && (
          <div className="space-y-6 animate-fadeIn">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">総照会件数</span>
                <div className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                  {summary.total} <span className="text-xs font-normal text-slate-400">件</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#161B22] border border-emerald-200/80 dark:border-emerald-900/40 rounded-xl p-4 shadow-xs bg-emerald-50/20">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  適格事業者（有効）
                </span>
                <div className="mt-1 text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300 tabular-nums">
                  {summary.valid} <span className="text-xs font-normal text-emerald-600">件</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#161B22] border border-rose-200/80 dark:border-rose-900/40 rounded-xl p-4 shadow-xs bg-rose-50/20">
                <span className="text-xs font-semibold text-rose-800 dark:text-rose-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  取消・失効・解散
                </span>
                <div className="mt-1 text-2xl font-bold font-mono text-rose-700 dark:text-rose-300 tabular-nums">
                  {summary.invalid} <span className="text-xs font-normal text-rose-600">件</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#161B22] border border-amber-200/80 dark:border-amber-900/40 rounded-xl p-4 shadow-xs bg-amber-50/20">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  未登録・形式不正
                </span>
                <div className="mt-1 text-2xl font-bold font-mono text-amber-700 dark:text-amber-300 tabular-nums">
                  {summary.unregistered} <span className="text-xs font-normal text-amber-600">件</span>
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
                  すべて ({results.length})
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
                  🟢 有効のみ ({summary.valid})
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
                  🔴 要確認・失効のみ ({summary.invalid + summary.unregistered})
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="企業名・所在地で絞り込み..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleBulkWatch}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#143D6C] shadow-2xs cursor-pointer transition-colors"
                  title="照会した企業を一括で監視リスト（ウォッチ）に登録し、社名変更・移転・インボイス失効を検知します"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>一括ウォッチに追加 (最大100社)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-2xs cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>照会結果をCSV出力</span>
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
                      <th className="py-3 px-4">インボイス登録番号</th>
                      <th className="py-3 px-4">商号（法人名）</th>
                      <th className="py-3 px-4">所在地（本店）</th>
                      <th className="py-3 px-4">判定結果</th>
                      <th className="py-3 px-4 text-center">詳細</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                    {filteredResults.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                          該当する照会データがありません。
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
                                  法人番号: {item.corporate_number}
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
                                <span className="text-slate-400 italic">（該当法人なし）</span>
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
                                  適格事業者（有効）
                                </span>
                              ) : isCancelled ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  {item.status_label_ja}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  未登録 / 形式不正
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
                                  title="企業詳細を確認"
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
                <span>企業監視・重要変動検知エンジン</span>
                <span className="font-normal text-slate-400">|</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">無料枠: 最大100社</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                「都度照会」から「自動見守り」へ。<br className="hidden sm:inline" />
                取引先のインボイス失効・倒産・代表交代を24時間自動検知
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                照会時点では有効だった取引先も、数ヶ月後に突然「登録取消・失効」となるリスクを抱えています。
                Kigyou-listの見守りエンジンに登録すれば、国税庁公表データの失効や法人の重大変動を毎日自動巡回し、異動発生時に即座にメールでお知らせします。
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
                    インボイス失効・取消検知
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    国税庁公表データを毎日自動照合。取引先の事業者取消・失効をいち早く検知し、仕入税額控除の適用否認リスクを未然に防止します。
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 font-medium">
                  ※ 経理・税務コンプライアンス保護
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/80 dark:border-slate-800 hover:border-purple-400/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 flex items-center justify-center font-bold text-xs mb-3 border border-purple-200/80 dark:border-purple-800">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                    代表者・役員交代の速報
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    金融庁EDINET臨時報告書や商業登記を監視。新社長就任の祝電・挨拶、キーマン変更に伴う営業アプローチの好機を逃しません。
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 font-medium">
                  ※ B2B営業・役員人事アラート
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/80 dark:border-slate-800 hover:border-amber-400/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center font-bold text-xs mb-3 border border-amber-200/80 dark:border-amber-800">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                    倒産・解散・本店移転追跡
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    破産・清算・解散登記をリアルタイム捕捉。売掛金の焦げ付きを未然に回避し、契約更新や請求書送付先変更にも即時対応できます。
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 font-medium">
                  ※ 与信管理・債権保全
                </div>
              </div>
            </div>

            {/* Interactive Timeline Mockup Preview */}
            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                  <span>検知タイムラインの表示イメージ（管理画面）</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">毎朝8:00 自動メール配信</span>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">インボイス失効警告</span>
                      <span className="font-bold text-slate-900 dark:text-white">株式会社〇〇商事</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      国税庁適格請求書公表サイトにて登録取消が公表されました。仕入税額控除の対象外となるリスクがあります。
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      変更前: 登録済 (T10100...) ➔ <strong className="text-rose-600">変更後: 登録取消 (失効)</strong>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">本日 07:45</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">代表者変更</span>
                      <span className="font-bold text-slate-900 dark:text-white">株式会社△△製作所</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      金融庁EDINET臨時報告書にて代表取締役社長の交代が公表されました。
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      変更前: 田中 太郎 (前社長) ➔ <strong className="text-emerald-600">変更後: 佐藤 一郎 (新代表取締役社長就任)</strong>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">昨日 16:20</span>
                </div>
              </div>
            </div>

            {/* CTA Box */}
            <div className="p-5 sm:p-6 rounded-xl bg-gradient-to-r from-[#1B4F8A]/5 via-blue-50/50 to-emerald-50/50 dark:from-blue-950/20 dark:via-slate-900/40 dark:to-emerald-950/20 border border-blue-200/60 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  今すぐ取引先の自動見守りを開始しませんか？
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  無料アカウントで最大100社まで即日監視登録可能。クレジットカード登録は一切不要です。
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
                  <span>{isLoggedIn ? "見守り管理ダッシュボードを開く" : "無料で100社を見守り登録する"}</span>
                </button>

                <Link
                  href={`/${locale}/watchlist`}
                  className="inline-flex items-center gap-1 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs whitespace-nowrap"
                >
                  <span>機能の詳細</span>
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
                インボイス制度（適格請求書等保存方式）における一括照会の重要性
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                2023年10月1日より施行されたインボイス制度において、買い手側（発注企業）が消費税の仕入税額控除を受けるためには、
                原則として売り手側（受注企業・外注先）から交付された「適格請求書（インボイス）」の保存が義務付けられています。
                取引先のインボイス登録番号（T番号）が無効であったり、偽装・失効していた場合、発注元企業が消費税分（8%または10%）を自社負担することになります。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                  <span>経理業務・月次決算の効率化</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  国税庁の公式公表サイトは1件ごとの手動照会が基本となるため、毎月数十〜数百件の請求書を手作業で確認するのは大きな業務負担です。
                  Kigyou-listの一括照会ツールを活用すれば、月末・月初の一括処理を数秒で完了できます。
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>税務調査のエビデンス保存</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  照会結果をCSV出力することで、請求書受領時点での適格事業者ステータスを確実に記録。
                  後日の税務調査時における仕入税額控除の適用根拠資料としてそのまま保管・活用いただけます。
                </p>
              </div>
            </div>

            {/* Legal Disclaimer */}
            <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <strong className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                【免責事項・照会データに関する留意事項】
              </strong>
              本ツールにおける照会結果は、国税庁法人番号公表サイトおよび適格請求書発行事業者公表Web-APIの公表データに基づき機械的に表示している客観的事実です。
              特定の企業の信用状態、健全性、または取引の安全性を直接保証・評価するものではありません。
              重要な取引契約や確定申告に際しては、必要に応じて公式公表サイトの最新情報も合わせてご確認ください。
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
