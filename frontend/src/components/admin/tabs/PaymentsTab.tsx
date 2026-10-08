"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CreditCard, Search, Download, RefreshCcw, Loader2, ExternalLink } from "lucide-react";
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

  const totalRevenue = useMemo(() => {
    return payments
      .filter((p) => p.status === "succeeded" || p.status === "completed")
      .reduce((sum, p) => sum + (Number(p.amount_jpy) || 0), 0);
  }, [payments]);

  const totalLines = useMemo(() => {
    return payments
      .filter((p) => p.status === "succeeded" || p.status === "completed")
      .reduce((sum, p) => sum + (Number(p.lines_added) || 0), 0);
  }, [payments]);

  const handleExportCSV = () => {
    if (payments.length === 0) return;
    const headers = ["Payment ID", "Email", "Pack", "Amount (JPY)", "Lines Added", "Status", "Date", "IP"];
    const rows = filteredPayments.map((p) => [
      `"${p.id}"`,
      `"${p.user_email}"`,
      `"${p.pack_id}"`,
      p.amount_jpy,
      p.lines_added,
      `"${p.status}"`,
      `"${parseUTCDate(p.created_at).toLocaleString("ja-JP")}"`,
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
        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40">
          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
            累計決済売上 (Stripe)
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            ¥{totalRevenue.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40">
          <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 block mb-1">
            付与完了CSVクレジット
          </span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
            +{totalLines.toLocaleString()} <span className="text-xs font-semibold">行</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500 block mb-1">
            決済処理件数
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {payments.length} <span className="text-xs font-semibold text-slate-400">件</span>
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
            Stripe 経由のプラン契約および従量追加枠の購入記録
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
              <th className="px-4 py-3 text-right">インボイス</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && paginatedPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  読み込み中...
                </td>
              </tr>
            ) : paginatedPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  該当する決済履歴はありません。
                </td>
              </tr>
            ) : (
              paginatedPayments.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {pay.user_email}
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
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                    {pay.pack_id === "10k"
                      ? "CSV 10k行パック"
                      : pay.pack_id === "50k"
                      ? "CSV 50k行パック"
                      : pay.pack_id === "100k"
                      ? "CSV 100k行パック"
                      : pay.pack_id}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +{pay.lines_added.toLocaleString()} 行
                  </td>
                  <td className="px-4 py-3 font-mono font-black text-slate-900 dark:text-white">
                    ¥{pay.amount_jpy.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        pay.status === "succeeded" || pay.status === "completed"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {pay.status === "succeeded" || pay.status === "completed" ? "完了" : pay.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {pay.invoice_url ? (
                      <a
                        href={`/api/stripe/invoice?id=${pay.id}&email=${encodeURIComponent(adminEmail)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <span>領収書</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">未発行</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400">
            {filteredPayments.length} 件中 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredPayments.length)} 件を表示
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold disabled:opacity-40 cursor-pointer"
            >
              前へ
            </button>
            <span className="px-3 py-1.5 font-bold text-slate-700 dark:text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold disabled:opacity-40 cursor-pointer"
            >
              次へ
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
