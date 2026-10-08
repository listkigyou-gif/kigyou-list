"use client";

import React, { useState, useEffect, useMemo } from "react";
import { History, Search, Filter, RefreshCcw, Download, Loader2, Copy, Check } from "lucide-react";
import { parseUTCDate } from "@/lib/dateUtils";
import { useAdminToast } from "../AdminToast";

interface AdminActionLog {
  id: string;
  admin_email: string;
  action_type: string;
  target_identifier: string;
  details_json: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface AuditLogsTabProps {
  adminEmail: string;
  getAdminHeaders: () => Record<string, string>;
}

export const AuditLogsTab: React.FC<AuditLogsTabProps> = ({
  adminEmail,
  getAdminHeaders,
}) => {
  const toast = useAdminToast();
  const [logs, setLogs] = useState<AdminActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/logs", { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      } else {
        toast.error("操作ログの取得に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Timestamp (JST)", "Admin Email", "Action Type", "Target Identifier", "Details", "IP Address"];
    const rows = filteredLogs.map((l) => [
      `"${parseUTCDate(l.created_at).toLocaleString("ja-JP")}"`,
      `"${l.admin_email}"`,
      `"${l.action_type}"`,
      `"${l.target_identifier}"`,
      `"${(l.details_json || "").replace(/"/g, '""')}"`,
      `"${l.ip_address || ""}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `kigyou_audit_logs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("監査ログのCSVを出力しました。");
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== "all" && log.action_type !== actionFilter) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        log.admin_email?.toLowerCase().includes(term) ||
        log.target_identifier?.toLowerCase().includes(term) ||
        log.details_json?.toLowerCase().includes(term) ||
        log.action_type?.toLowerCase().includes(term)
      );
    });
  }, [logs, searchTerm, actionFilter]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  return (
    <section className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs animate-in fade-in duration-200">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <span>管理者操作ログ (Audit Logs)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            全 {logs.length} 件の管理操作記録
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none text-slate-700 dark:text-slate-300 focus:outline-none font-semibold cursor-pointer"
            >
              <option value="all">すべての操作種別</option>
              <option value="UPDATE_USER_PLAN">プラン変更</option>
              <option value="UPDATE_USER_QUOTA">CSVクォータ変更</option>
              <option value="UPDATE_USER_FORM_CREDITS">フォーム営業枠変更</option>
              <option value="CREATE_COUPON">クーポン作成</option>
              <option value="HIDE_COMPANY">企業非公開</option>
              <option value="UNHIDE_COMPANY">企業再公開</option>
              <option value="RESOLVE_INQUIRY">問い合わせ対応</option>
              <option value="APPROVE_PARTNER_LOGO">ロゴ掲載承認</option>
              <option value="REJECT_PARTNER_LOGO">ロゴ掲載停止</option>
              <option value="REVOKE_API_KEY">APIキー無効化</option>
              <option value="ACTIVATE_API_KEY">APIキー有効化</option>
            </select>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="管理者 / 対象 / 詳細で検索..."
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
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="再読み込み"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">実行日時 (JST)</th>
              <th className="px-4 py-3">実行者 (Admin)</th>
              <th className="px-4 py-3">操作種別</th>
              <th className="px-4 py-3">操作対象 (Target)</th>
              <th className="px-4 py-3 min-w-[280px]">変更内容 (Details)</th>
              <th className="px-4 py-3">接続元 (IP / UA)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  読み込み中...
                </td>
              </tr>
            ) : paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  該当する操作ログはありません。
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 align-top font-mono text-slate-700 dark:text-slate-300">
                    {parseUTCDate(log.created_at).toLocaleString("ja-JP", {
                      timeZone: "Asia/Tokyo",
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 align-top font-semibold text-slate-800 dark:text-slate-200">
                    {log.admin_email}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadgeColor(log.action_type)}`}>
                      {getActionLabel(log.action_type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top font-mono font-bold text-slate-800 dark:text-slate-200">
                    {log.target_identifier}
                  </td>
                  <td className="px-4 py-3 align-top whitespace-normal min-w-[280px]">
                    {formatLogDetails(log)}
                  </td>
                  <td className="px-4 py-3 align-top font-mono text-[11px] text-slate-500">
                    <div>{log.ip_address || "---"}</div>
                    <UserAgentCell userAgent={log.user_agent} />
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
            {filteredLogs.length} 件中 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredLogs.length)} 件を表示
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

const UserAgentCell: React.FC<{ userAgent?: string | null }> = ({ userAgent }) => {
  const [copied, setCopied] = useState(false);
  if (!userAgent) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(userAgent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn("Failed to copy user agent", e);
    }
  };

  return (
    <div onClick={handleCopy} className="relative group cursor-pointer max-w-[150px] truncate hover:text-primary transition-colors">
      <span className="text-[10px] text-slate-400 block truncate">{userAgent}</span>
      <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block z-50 bg-slate-900 text-white text-[10px] rounded-lg p-2 shadow-xl max-w-xs break-all whitespace-normal border border-slate-700 pointer-events-none">
        <div className="font-bold text-[9px] text-slate-400 mb-0.5">{copied ? "✓ コピーしました" : "クリックでコピー"}</div>
        <div>{userAgent}</div>
      </div>
    </div>
  );
};

const formatLogDetails = (log: AdminActionLog) => {
  if (!log.details_json) return <span className="text-slate-400">---</span>;
  try {
    const details = JSON.parse(log.details_json);
    switch (log.action_type) {
      case "UPDATE_USER_PLAN":
        return (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-400 uppercase">{details.oldPlan}</span>
            <span className="text-slate-400">➜</span>
            <span className="font-bold text-primary dark:text-secondary uppercase">{details.newPlan}</span>
          </div>
        );
      case "UPDATE_USER_QUOTA":
        return (
          <div className="flex flex-col gap-0.5 text-xs text-slate-600 dark:text-slate-300 font-mono">
            <div>CSV月間枠: {details.oldAllowance} ➜ <strong className="text-primary">{details.newAllowance}</strong></div>
            <div>CSV追加枠: {details.oldAddOn} ➜ <strong className="text-emerald-600">+{details.newAddOn}</strong></div>
          </div>
        );
      case "UPDATE_USER_FORM_CREDITS":
        return (
          <div className="flex flex-col gap-0.5 text-xs text-slate-600 dark:text-slate-300 font-mono">
            <div>フォーム配信残高: {details.oldBalance} ➜ <strong className="text-indigo-600 dark:text-indigo-400">{details.newBalance} 件</strong></div>
            {details.addCredits && <div className="text-emerald-600 font-bold">付与: +{details.addCredits} 件</div>}
          </div>
        );
      case "CREATE_COUPON":
        return (
          <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap gap-x-2">
            <span>割引: <strong>{details.discountPercent}%</strong></span>
            <span>上限: <strong>{details.maxUses}回</strong></span>
            <span>有効: <strong>{details.daysValid}日</strong></span>
          </div>
        );
      case "HIDE_COMPANY":
        return <span className="text-xs text-rose-600 font-semibold">企業非公開化 ({details.reason || "申請対応"})</span>;
      case "UNHIDE_COMPANY":
        return <span className="text-xs text-emerald-600 font-semibold">企業情報の再公開</span>;
      case "RESOLVE_INQUIRY":
        return <span className="text-xs text-slate-500">問い合わせ解決済み</span>;
      case "APPROVE_PARTNER_LOGO":
        return <span className="text-xs text-emerald-600 font-semibold">パートナーロゴ掲載承認</span>;
      case "REJECT_PARTNER_LOGO":
        return <span className="text-xs text-rose-600 font-semibold">パートナーロゴ掲載停止</span>;
      case "REVOKE_API_KEY":
        return <span className="text-xs text-rose-600 font-semibold">APIキー無効化: {details.keyPreview}</span>;
      case "ACTIVATE_API_KEY":
        return <span className="text-xs text-emerald-600 font-semibold">APIキー有効化: {details.keyPreview}</span>;
      default:
        return <span className="text-xs font-mono text-slate-500">{log.details_json}</span>;
    }
  } catch {
    return <span className="text-xs font-mono text-slate-400">{log.details_json}</span>;
  }
};

const getActionLabel = (type: string) => {
  switch (type) {
    case "UPDATE_USER_PLAN": return "プラン変更";
    case "UPDATE_USER_QUOTA": return "CSV枠変更";
    case "UPDATE_USER_FORM_CREDITS": return "フォーム営業枠変更";
    case "CREATE_COUPON": return "クーポン作成";
    case "HIDE_COMPANY": return "企業非公開";
    case "UNHIDE_COMPANY": return "企業再公開";
    case "RESOLVE_INQUIRY": return "問い合わせ対応";
    case "APPROVE_PARTNER_LOGO": return "ロゴ掲載承認";
    case "REJECT_PARTNER_LOGO": return "ロゴ掲載停止";
    case "REVOKE_API_KEY": return "APIキー無効化";
    case "ACTIVATE_API_KEY": return "APIキー有効化";
    default: return type;
  }
};

const getActionBadgeColor = (type: string) => {
  switch (type) {
    case "UPDATE_USER_PLAN":
      return "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-300";
    case "UPDATE_USER_QUOTA":
      return "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:border-cyan-900 dark:text-cyan-300";
    case "UPDATE_USER_FORM_CREDITS":
      return "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-300";
    case "CREATE_COUPON":
      return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300";
    case "HIDE_COMPANY":
    case "REVOKE_API_KEY":
    case "REJECT_PARTNER_LOGO":
      return "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300";
    case "UNHIDE_COMPANY":
    case "ACTIVATE_API_KEY":
    case "APPROVE_PARTNER_LOGO":
      return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300";
    default:
      return "bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-300";
  }
};
