"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CreditCard, Search, Download, RefreshCcw, Loader2, ExternalLink, ShieldCheck, AlertCircle } from "lucide-react";
import { parseUTCDate } from "@/lib/dateUtils";
import { useAdminToast } from "../AdminToast";

interface PaymentAdminView {
  id: string;
  user_email: string;
  pack_id: string;
  amount_jpy: number;
  lines_added: number;
  status: string;
  invoice_url: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  refunded_at?: string | null;
  created_at: string;
}

interface PaymentsTabProps {
  adminEmail: string;
  getAdminHeaders: () => Record<string, string>;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({
  adminEmail,
  getAdminHeaders,
}) => {
  const toast = useAdminToast();
  const [payments, setPayments] = useState<PaymentAdminView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payments", { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
      } else {
        toast.error("決済履歴の取得に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Net Revenue (Active/Completed payments only)
  const netRevenue = useMemo(() => {
    return payments
      .filter((p) => p.status === "succeeded" || p.status === "completed")
      .reduce((sum, p) => sum + (Number(p.amount_jpy) || 0), 0);
  }, [payments]);

  // Refunded Revenue
  const refundedRevenue = useMemo(() => {
    return payments
      .filter((p) => p.status === "refunded")
      .reduce((sum, p) => sum + (Number(p.amount_jpy) || 0), 0);
  }, [payments]);

  // Gross Total Processed
  const grossRevenue = useMemo(() => {
    return payments.reduce((sum, p) => sum + (Number(p.amount_jpy) || 0), 0);
  }, [payments]);

  // Net Valid Credits
  const netLines = useMemo(() => {
    return payments
      .filter((p) => p.status === "succeeded" || p.status === "completed")
      .reduce((sum, p) => sum + (Number(p.lines_added) || 0), 0);
  }, [payments]);

  // Revoked Credits
  const refundedLines = useMemo(() => {
    return payments
      .filter((p) => p.status === "refunded")
      .reduce((sum, p) => sum + (Number(p.lines_added) || 0), 0);
  }, [payments]);

  const completedCount = useMemo(() => {
    return payments.filter((p) => p.status === "succeeded" || p.status === "completed").length;
  }, [payments]);

  const refundedCount = useMemo(() => {
    return payments.filter((p) => p.status === "refunded").length;
  }, [payments]);

  const handleExportCSV = () => {
    if (payments.length === 0) return;
    const headers = ["Payment ID", "Email", "Pack", "Amount (JPY)", "Lines Added", "Status", "Date", "Refunded At", "IP"];
    const rows = filteredPayments.map((p) => [
      `"${p.id}"`,
      `"${p.user_email}"`,
      `"${p.pack_id}"`,
      p.amount_jpy,
      p.lines_added,
      `"${p.status}"`,
      `"${parseUTCDate(p.created_at).toLocaleString("ja-JP")}"`,
      p.refunded_at ? `"${parseUTCDate(p.refunded_at).toLocaleString("ja-JP")}"` : '""',
      `"${p.ip_address || ""}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `kigyou_payments_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("決済履歴のCSVを出力しました。");
  };

  const filteredPayments = useMemo(() => {
    if (!searchTerm.trim()) return payments;
    const term = searchTerm.toLowerCase();
    return payments.filter(
      (p) =>
        p.user_email.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term) ||
        p.pack_id.toLowerCase().includes(term)
    );
  }, [payments, searchTerm]);

  const totalPages = Math.ceil(filteredPayments.length / pageSize) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  return (
    <section className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs animate-in fade-in duration-200">
      {/* Top summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Net Revenue */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              累計純売上 (Net Revenue)
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            ¥{netRevenue.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>総決済: ¥{grossRevenue.toLocaleString()}</span>
            {refundedRevenue > 0 && (
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                返金済: -¥{refundedRevenue.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Valid Credits */}
        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300">
              有効付与CSVクレジット
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
              実質残枠
            </span>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
            +{netLines.toLocaleString()} <span className="text-xs font-semibold">行</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>全付与: +{(netLines + refundedLines).toLocaleString()}行</span>
            {refundedLines > 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                失効: -{refundedLines.toLocaleString()}行
              </span>
            )}
          </div>
        </div>

        {/* Payments Count */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500">
              決済・インボイス件数
            </span>
            <span className="text-[10px] text-slate-400">全体</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {payments.length} <span className="text-xs font-semibold text-slate-400">件</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span className="text-emerald-600 font-medium">完了: {completedCount}件</span>
            {refundedCount > 0 && (
              <span className="text-amber-600 font-medium">返金済: {refundedCount}件</span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-500" />
            <span>決済・インボイス履歴</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Stripe 経由のプラン契約・従量購入記録および適格請求書（インボイス / 返金明細）の発行管理
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="メール / 決済ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 w-48 sm:w-60"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="CSVダウンロード"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            CSV
          </button>

          <button
            onClick={fetchPayments}
            disabled={loading}
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="再読み込み"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">購入者 (Email)</th>
              <th className="px-4 py-3">決済ID / 日時</th>
              <th className="px-4 py-3">購入パック</th>
              <th className="px-4 py-3">付与クレジット</th>
              <th className="px-4 py-3">金額 (JPY)</th>
              <th className="px-4 py-3">ステータス</th>
              <th className="px-4 py-3">決済IP</th>
              <th className="px-4 py-3 text-right">インボイス</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && paginatedPayments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  読み込み中...
                </td>
              </tr>
            ) : paginatedPayments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  該当する決済履歴はありません。
                </td>
              </tr>
            ) : (
              paginatedPayments.map((pay) => {
                const isRefunded = pay.status === "refunded";
                return (
                  <tr 
                    key={pay.id} 
                    className={`transition-colors ${
                      isRefunded 
                        ? "bg-rose-50/20 dark:bg-rose-950/10 hover:bg-rose-50/40 dark:hover:bg-rose-950/20" 
                        : "hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        {isRefunded && <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        <span>{pay.user_email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200 max-w-[140px] truncate" title={pay.id}>
                        {pay.id}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {parseUTCDate(pay.created_at).toLocaleString("ja-JP", {
                          timeZone: "Asia/Tokyo",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      {isRefunded && pay.refunded_at && (
                        <div className="text-[9px] text-rose-600 dark:text-rose-400 font-medium">
                          返金: {parseUTCDate(pay.refunded_at).toLocaleString("ja-JP", {
                            timeZone: "Asia/Tokyo",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                      {pay.pack_id === "10k"
                        ? "CSV 10k行パック"
                        : pay.pack_id === "50k"
                        ? "CSV 50k行パック"
                        : pay.pack_id === "100k"
                        ? "CSV 100k行パック"
                        : pay.pack_id === "pro"
                        ? "Proプラン (月額)"
                        : pay.pack_id === "business"
                        ? "Businessプラン"
                        : pay.pack_id === "enterprise"
                        ? "Enterpriseプラン"
                        : pay.pack_id}
                    </td>
                    <td className="px-4 py-3">
                      {isRefunded ? (
                        <div>
                          <span className="line-through text-slate-400 font-mono text-[11px]">
                            +{pay.lines_added.toLocaleString()} 行
                          </span>
                          <span className="ml-1.5 px-1 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            失効
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          +{pay.lines_added.toLocaleString()} 行
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isRefunded ? (
                        <div>
                          <div className="font-mono text-slate-400 line-through text-[11px]">
                            ¥{pay.amount_jpy.toLocaleString()}
                          </div>
                          <div className="font-mono text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            -¥{pay.amount_jpy.toLocaleString()} (返金)
                          </div>
                        </div>
                      ) : (
                        <span className="font-mono font-black text-slate-900 dark:text-white">
                          ¥{pay.amount_jpy.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isRefunded ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          全額返金済
                        </span>
                      ) : pay.status === "succeeded" || pay.status === "completed" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          完了
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {pay.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {pay.ip_address ? (
                        <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {pay.ip_address}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {pay.invoice_url ? (
                        <a
                          href={`/api/stripe/invoice?id=${pay.id}&email=${encodeURIComponent(adminEmail)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-2.5 py-1 font-bold rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] ${
                            isRefunded
                              ? "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                              : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          }`}
                          title={isRefunded ? "返金済・無効インボイス（VOID証明書）を表示" : "領収書を表示"}
                        >
                          <span>{isRefunded ? "返金済(無効)" : "領収書"}</span>
                          <ExternalLink className={`w-3 h-3 ${isRefunded ? "text-rose-500" : "text-slate-400"}`} />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">未発行</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between mt-4 text-xs text-slate-500 dark:text-slate-400">
        <div>
          全 {filteredPayments.length} 件中 {filteredPayments.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{" "}
          {Math.min(currentPage * pageSize, filteredPayments.length)} 件を表示
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            前へ
          </button>
          <span className="font-mono">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            次へ
          </button>
        </div>
      </div>
    </section>
  );
};
