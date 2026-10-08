"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Download, Search, Filter, RefreshCcw, Loader2, ExternalLink } from "lucide-react";
import { parseUTCDate } from "@/lib/dateUtils";
import { useAdminToast } from "../AdminToast";

interface ExportJobAdminView {
  id: string;
  user_email: string;
  status: "pending" | "processing" | "completed" | "failed";
  filters_json: string | null;
  records_count: number;
  file_path: string | null;
  error_message: string | null;
  created_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
}

interface ExportsTabProps {
  adminEmail: string;
  getAdminHeaders: () => Record<string, string>;
}

export const ExportsTab: React.FC<ExportsTabProps> = ({
  adminEmail,
  getAdminHeaders,
}) => {
  const toast = useAdminToast();
  const [jobs, setJobs] = useState<ExportJobAdminView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/exports", { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      } else {
        toast.error("CSV出力ジョブ一覧の取得に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (statusFilter !== "all" && job.status !== statusFilter) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        job.user_email?.toLowerCase().includes(term) ||
        job.id?.toLowerCase().includes(term) ||
        job.filters_json?.toLowerCase().includes(term)
      );
    });
  }, [jobs, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredJobs.length / pageSize) || 1;
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, currentPage, pageSize]);

  return (
    <section className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs animate-in fade-in duration-200">
      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-500" />
            <span>CSV出力履歴・ジョブ管理</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            全 {jobs.length} 件のデータ出力キュー
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none text-slate-700 dark:text-slate-300 focus:outline-none font-semibold cursor-pointer"
            >
              <option value="all">すべてのステータス</option>
              <option value="completed">完了</option>
              <option value="processing">処理中</option>
              <option value="pending">待機中</option>
              <option value="failed">失敗</option>
            </select>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ユーザー / ジョブID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 w-48 sm:w-60"
            />
          </div>

          <button
            onClick={fetchJobs}
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
              <th className="px-4 py-3">実行日時 (JST)</th>
              <th className="px-4 py-3">出力ユーザー</th>
              <th className="px-4 py-3">件数</th>
              <th className="px-4 py-3 min-w-[240px]">適用検索条件</th>
              <th className="px-4 py-3">ステータス</th>
              <th className="px-4 py-3 text-right">ファイル</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && paginatedJobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  読み込み中...
                </td>
              </tr>
            ) : paginatedJobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  該当するCSV出力ジョブはありません。
                </td>
              </tr>
            ) : (
              paginatedJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                    {parseUTCDate(job.created_at).toLocaleString("ja-JP", {
                      timeZone: "Asia/Tokyo",
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {job.user_email}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-primary dark:text-secondary">
                    {job.records_count.toLocaleString()} 件
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-normal min-w-[240px]">
                    {formatFilters(job.filters_json)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        job.status === "completed"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : job.status === "failed"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      }`}
                    >
                      {job.status === "completed"
                        ? "出力完了"
                        : job.status === "failed"
                        ? "失敗"
                        : job.status === "processing"
                        ? "処理中"
                        : "待機中"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {job.file_path && job.status === "completed" ? (
                      <a
                        href={job.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3 text-slate-400" />
                        <span>DL</span>
                      </a>
                    ) : job.error_message ? (
                      <span className="text-rose-500 text-[10px] truncate max-w-[150px] inline-block" title={job.error_message}>
                        {job.error_message}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">生成中</span>
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
            {filteredJobs.length} 件中 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredJobs.length)} 件を表示
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

const formatFilters = (filtersJson: string | null) => {
  if (!filtersJson) return "条件指定なし (全件)";
  try {
    const f = JSON.parse(filtersJson);
    const parts: string[] = [];
    if (f.query) parts.push(`キーワード: ${f.query}`);
    if (f.pref) parts.push(`地域: ${f.pref}`);
    if (f.industry_code) parts.push(`業種: ${f.industry_code}`);
    if (f.has_hiring) parts.push("求人あり");
    if (f.has_subsidy) parts.push("助成金あり");
    if (f.has_bidding) parts.push("入札あり");
    return parts.join(", ") || "デフォルト検索";
  } catch {
    return filtersJson;
  }
};
