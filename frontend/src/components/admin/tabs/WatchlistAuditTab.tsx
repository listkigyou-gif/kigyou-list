"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Activity, Search, RefreshCcw, Loader2, ExternalLink, Download, Users, Building2, ShieldCheck } from "lucide-react";
import { parseUTCDate } from "@/lib/dateUtils";
import { useAdminToast } from "../AdminToast";
import { UserWatchlistModal } from "../UserWatchlistModal";

interface WatchlistUserSummary {
  user_email: string;
  plan: string;
  subscription_status?: string;
  watchlist_count: number;
  registration_ip?: string | null;
  last_login_ip?: string | null;
  last_login_at?: string | null;
  updated_at: string;
}

interface WatchlistAuditTabProps {
  adminEmail: string;
  getAdminHeaders: () => Record<string, string>;
}

export const WatchlistAuditTab: React.FC<WatchlistAuditTabProps> = ({
  adminEmail,
  getAdminHeaders,
}) => {
  const toast = useAdminToast();
  const [users, setUsers] = useState<WatchlistUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [watchedOnly, setWatchedOnly] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const [inspectEmail, setInspectEmail] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        toast.error("企業監視データの取得に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const totalWatchedCount = useMemo(() => {
    return users.reduce((sum, u) => sum + (Number(u.watchlist_count) || 0), 0);
  }, [users]);

  const activeUsersCount = useMemo(() => {
    return users.filter(u => (Number(u.watchlist_count) || 0) > 0).length;
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (watchedOnly && (u.watchlist_count || 0) === 0) return false;
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return u.user_email.toLowerCase().includes(q) || (u.plan || "").toLowerCase().includes(q);
    });
  }, [users, watchedOnly, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#151B22] p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">総監視企業数 (システム全体)</span>
            <Activity className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
              {totalWatchedCount.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-semibold">社</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#151B22] p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">企業監視中のユーザー数</span>
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
              {activeUsersCount.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-semibold">アカウント</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#151B22] p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">リアルタイム検知エンジン</span>
            <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              稼働中 (PostgreSQL + R2)
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-[#151B22] p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ユーザーメールで検索..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={watchedOnly}
              onChange={(e) => {
                setWatchedOnly(e.target.checked);
                setCurrentPage(1);
              }}
              className="rounded border-slate-300 text-[#1B4F8A] focus:ring-[#1B4F8A]"
            />
            <span>監視中のユーザーのみ表示</span>
          </label>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="最新情報に更新"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Users Watchlist Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#151B22]">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">ユーザー (Email)</th>
              <th className="px-4 py-3">契約プラン</th>
              <th className="px-4 py-3 text-center">監視登録企業数</th>
              <th className="px-4 py-3">登録 / 最終接続IP</th>
              <th className="px-4 py-3">最終アクティビティ</th>
              <th className="px-4 py-3 text-right">企業一覧</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  読み込み中...
                </td>
              </tr>
            ) : paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  該当する企業監視データはありません。
                </td>
              </tr>
            ) : (
              paginatedUsers.map((u) => (
                <tr key={u.user_email} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {u.user_email}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      u.plan === "pro"
                        ? "bg-blue-50 text-[#1B4F8A] border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                        : u.plan === "business"
                        ? "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800"
                        : u.plan === "enterprise"
                        ? "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
                        : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                    }`}>
                      {u.plan || "free"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setInspectEmail(u.user_email)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs hover:shadow-xs"
                    >
                      <Activity className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                      <span className="font-mono text-sm">{(u.watchlist_count || 0).toLocaleString()}</span>
                      <span className="text-[10px] font-medium text-slate-500">社</span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5 font-mono text-[11px]">
                      {u.registration_ip && (
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                          <span className="text-[9px] px-1 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-sans">登録</span>
                          <span>{u.registration_ip}</span>
                        </div>
                      )}
                      {u.last_login_ip && u.last_login_ip !== u.registration_ip && (
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[10px]">
                          <span className="text-[9px] px-1 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded font-sans">接続</span>
                          <span>{u.last_login_ip}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                    {parseUTCDate(u.updated_at).toLocaleString("ja-JP", {
                      timeZone: "Asia/Tokyo",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setInspectEmail(u.user_email)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#1B4F8A] dark:text-blue-400 font-bold rounded-lg transition-colors cursor-pointer text-xs inline-flex items-center gap-1"
                    >
                      <span>監視企業一覧</span>
                      <ExternalLink className="w-3 h-3" />
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
            <span>全 {filteredUsers.length} 件中 {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredUsers.length)} 件表示</span>
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

      {/* Inspect Modal */}
      {inspectEmail && (
        <UserWatchlistModal
          isOpen={Boolean(inspectEmail)}
          onClose={() => setInspectEmail(null)}
          userEmail={inspectEmail}
          getAdminHeaders={getAdminHeaders}
        />
      )}
    </div>
  );
};
