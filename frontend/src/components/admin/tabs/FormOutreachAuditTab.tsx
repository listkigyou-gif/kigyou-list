"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Send, Search, RefreshCcw, Loader2, Download, CheckCircle2, XCircle, Clock, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { parseUTCDate } from "@/lib/dateUtils";
import { useAdminToast } from "../AdminToast";

interface FormCampaignAuditView {
  id: string;
  user_email: string;
  name: string;
  sender_company?: string | null;
  sender_name?: string | null;
  subject?: string | null;
  target_count: number;
  sent_count: number;
  success_count: number;
  skipped_count: number;
  status: "draft" | "pending_approval" | "approved" | "processing" | "completed" | "rejected" | "cancelled";
  runner_mode?: "server" | "local";
  report_file_url?: string | null;
  created_at: string;
}

interface FormOutreachAuditTabProps {
  adminEmail: string;
  getAdminHeaders: () => Record<string, string>;
}

export const FormOutreachAuditTab: React.FC<FormOutreachAuditTabProps> = ({
  adminEmail,
  getAdminHeaders,
}) => {
  const toast = useAdminToast();
  const [campaigns, setCampaigns] = useState<FormCampaignAuditView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/form-campaigns?status=all", {
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      } else {
        toast.error("フォーム営業配信履歴の取得に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const totalSuccessCount = useMemo(() => {
    return campaigns.reduce((sum, c) => sum + (Number(c.success_count) || 0), 0);
  }, [campaigns]);

  const totalSkippedCount = useMemo(() => {
    return campaigns.reduce((sum, c) => sum + (Number(c.skipped_count) || 0), 0);
  }, [campaigns]);

  const totalTargetCount = useMemo(() => {
    return campaigns.reduce((sum, c) => sum + (Number(c.target_count) || 0), 0);
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        c.user_email.toLowerCase().includes(q) ||
        (c.name || "").toLowerCase().includes(q) ||
        (c.sender_company || "").toLowerCase().includes(q) ||
        (c.id || "").toLowerCase().includes(q)
      );
    });
  }, [campaigns, statusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredCampaigns.length / pageSize) || 1;
  const paginatedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCampaigns.slice(start, start + pageSize);
  }, [filteredCampaigns, currentPage, pageSize]);

  const handleDownloadReport = async (camp: FormCampaignAuditView) => {
    if (camp.report_file_url) {
      window.open(camp.report_file_url, "_blank");
      return;
    }
    try {
      toast.info("レポートCSVを生成中...");
      const res = await fetch(`/api/admin/form-campaigns/${camp.id}/export`, {
        headers: getAdminHeaders(),
      });
      if (!res.ok) {
        toast.error("レポートの出力に失敗しました。");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `form_campaign_${camp.id}_report_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("配信レポートCSVを出力しました。");
    } catch {
      toast.error("ダウンロード中にエラーが発生しました。");
    }
  };

  const getStatusBadge = (status: FormCampaignAuditView["status"]) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            配信完了
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
            自動配信中
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300">
            承認済・待機
          </span>
        );
      case "pending_approval":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Clock className="w-3 h-3" />
            審査中
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400">
            <XCircle className="w-3 h-3 text-rose-600" />
            却下・返還済
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#151B22] p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">総配信キャンペーン数</div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white tabular-nums">
            {campaigns.length.toLocaleString()} <span className="text-xs font-normal text-slate-400">件</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#151B22] p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">総アプローチ対象企業</div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white tabular-nums">
            {totalTargetCount.toLocaleString()} <span className="text-xs font-normal text-slate-400">社</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#151B22] p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">送信成功（到達完了）</div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {totalSuccessCount.toLocaleString()} <span className="text-xs font-normal text-slate-400">社</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#151B22] p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">スキップ・枠自動返還</div>
          <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 tabular-nums">
            {totalSkippedCount.toLocaleString()} <span className="text-xs font-normal text-slate-400">社</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-[#151B22] p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ユーザー / キャンペーン名 / 送信元..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
          >
            <option value="all">全ステータス</option>
            <option value="completed">配信完了のみ</option>
            <option value="processing">配信中のみ</option>
            <option value="approved">承認済</option>
            <option value="pending_approval">審査中</option>
            <option value="rejected">却下</option>
          </select>
        </div>

        <button
          onClick={fetchCampaigns}
          disabled={loading}
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="最新情報に更新"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#151B22]">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">ユーザー (Email)</th>
              <th className="px-4 py-3">キャンペーン名 / 送信元</th>
              <th className="px-4 py-3 text-center">対象数</th>
              <th className="px-4 py-3 text-center">成功数</th>
              <th className="px-4 py-3 text-center">スキップ数</th>
              <th className="px-4 py-3">ステータス</th>
              <th className="px-4 py-3">配信日時</th>
              <th className="px-4 py-3 text-right">結果CSV出力</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && paginatedCampaigns.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  読み込み中...
                </td>
              </tr>
            ) : paginatedCampaigns.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  該当するフォーム営業配信履歴はありません。
                </td>
              </tr>
            ) : (
              paginatedCampaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {camp.user_email}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900 dark:text-white max-w-[200px] truncate" title={camp.name}>
                      {camp.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                      {camp.sender_company || camp.sender_name || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                    {camp.target_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {(camp.success_count || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-slate-400">
                    {(camp.skipped_count || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(camp.status)}
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                    {parseUTCDate(camp.created_at).toLocaleString("ja-JP", {
                      timeZone: "Asia/Tokyo",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDownloadReport(camp)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#1B4F8A] dark:text-blue-400 font-bold rounded-lg transition-colors cursor-pointer text-xs inline-flex items-center gap-1.5 shadow-2xs"
                      title="送信成功・失敗企業一覧CSVをダウンロード"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>結果CSV</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>全 {filteredCampaigns.length} 件中 {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredCampaigns.length)} 件表示</span>
            <div className="flex gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                前へ
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                次へ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
