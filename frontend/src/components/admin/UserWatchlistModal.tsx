"use client";

import React, { useState, useEffect } from "react";
import { X, ExternalLink, Download, Loader2, Building2, MapPin, Calendar, Activity } from "lucide-react";
import { parseUTCDate } from "@/lib/dateUtils";

interface WatchedCompanyDetail {
  corporate_number: string;
  watched_since: string;
  company_name?: string | null;
  prefecture_name?: string | null;
  city_name?: string | null;
  representative_name?: string | null;
  primary_industry?: string | null;
  phone_number?: string | null;
  website_url?: string | null;
  status?: string | null;
}

interface UserWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  getAdminHeaders: () => Record<string, string>;
}

export const UserWatchlistModal: React.FC<UserWatchlistModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  getAdminHeaders,
}) => {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<WatchedCompanyDetail[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !userEmail) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/admin/users/watchlist?email=${encodeURIComponent(userEmail)}`, {
      headers: getAdminHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success) {
          setCompanies(data.companies || []);
        } else {
          setError(data.error || "データの取得に失敗しました");
        }
      })
      .catch((err) => {
        if (isMounted) setError("通信エラーが発生しました");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, userEmail, getAdminHeaders]);

  if (!isOpen) return null;

  const handleExportCSV = () => {
    if (companies.length === 0) return;
    const headers = ["Corporate Number", "Company Name", "Prefecture", "City", "Industry", "Status", "Watched Since"];
    const rows = companies.map((c) => [
      `"${c.corporate_number}"`,
      `"${(c.company_name || "").replace(/"/g, '""')}"`,
      `"${c.prefecture_name || ""}"`,
      `"${c.city_name || ""}"`,
      `"${c.primary_industry || ""}"`,
      `"${c.status || ""}"`,
      `"${parseUTCDate(c.watched_since).toLocaleString("ja-JP")}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `watchlist_${userEmail}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-center text-[#1B4F8A] dark:text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>企業監視リスト詳細</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {companies.length} 社登録中
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {userEmail}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={loading || companies.length === 0}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV出力</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-[#1B4F8A]" />
              <span className="text-xs font-medium">企業リストを読み込み中...</span>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-rose-500 text-xs font-medium">
              {error}
            </div>
          ) : companies.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              このユーザーが監視リストに登録している企業はありません。
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-800">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">法人番号</th>
                    <th className="px-4 py-2.5">企業名</th>
                    <th className="px-4 py-2.5">所在地</th>
                    <th className="px-4 py-2.5">業種</th>
                    <th className="px-4 py-2.5">ステータス</th>
                    <th className="px-4 py-2.5">監視開始日時</th>
                    <th className="px-4 py-2.5 text-right">企業ページ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {companies.map((c) => (
                    <tr key={c.corporate_number} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 font-semibold">
                        {c.corporate_number}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {c.company_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {c.prefecture_name || ""}{c.city_name || ""}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {c.primary_industry || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          c.status === "active" || !c.status
                            ? "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                            : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                        }`}>
                          {c.status || "存続"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {parseUTCDate(c.watched_since).toLocaleString("ja-JP", {
                          timeZone: "Asia/Tokyo",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={`/ja/company/${c.corporate_number}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#1B4F8A] hover:underline dark:text-blue-400 font-semibold"
                        >
                          <span>確認</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/40 dark:bg-slate-900/20">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
