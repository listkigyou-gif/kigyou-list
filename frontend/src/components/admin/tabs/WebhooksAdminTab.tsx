"use client";

import React, { useState, useEffect } from "react";
import { Radio, RefreshCcw, Loader2, CheckCircle2, AlertTriangle, Power, PowerOff, ShieldAlert, ArrowUpRight } from "lucide-react";
import { parseUTCDate } from "@/lib/dateUtils";
import { useAdminToast } from "../AdminToast";

interface WebhookItem {
  id: number;
  user_email: string;
  webhook_url: string;
  filter_events: string | null;
  filter_prefecture: string | null;
  is_active: number;
  failure_count: number;
  created_at: string;
  last_dispatched_at: string | null;
}

interface WebhookStats {
  total: number;
  active: number;
  failures: number;
}

interface WebhooksAdminTabProps {
  adminEmail: string;
  getAdminHeaders: () => Record<string, string>;
}

export const WebhooksAdminTab: React.FC<WebhooksAdminTabProps> = ({
  adminEmail,
  getAdminHeaders,
}) => {
  const toast = useAdminToast();
  const [subscriptions, setSubscriptions] = useState<WebhookItem[]>([]);
  const [stats, setStats] = useState<WebhookStats>({ total: 0, active: 0, failures: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/webhooks", { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
        if (data.stats) setStats(data.stats);
      } else {
        toast.error("Webhook一覧の取得に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const toggleWebhookActive = async (id: number, currentActive: number) => {
    setUpdatingId(id);
    try {
      const nextActive = currentActive === 1 ? 0 : 1;
      const res = await fetch("/api/admin/webhooks", {
        method: "PATCH",
        headers: {
          ...getAdminHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, is_active: nextActive }),
      });

      if (res.ok) {
        toast.success(`Webhookを${nextActive === 1 ? "有効化" : "停止"}しました。`);
        fetchWebhooks();
      } else {
        toast.error("更新に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    } finally {
      setUpdatingId(null);
    }
  };

  const resetFailures = async (id: number) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/webhooks", {
        method: "PATCH",
        headers: {
          ...getAdminHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, reset_failures: true }),
      });

      if (res.ok) {
        toast.success("エラー回数をリセットし、再有効化しました。");
        fetchWebhooks();
      } else {
        toast.error("リセットに失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Stats Cards */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#1C2128] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 border border-blue-200/80 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Webhook購読・AI Agent配信管理
            </h2>
            <p className="text-xs text-slate-500">
              外部AI Sales AgentやCRMへのイベントプッシュ（HMAC SHA-256署名）の稼働状況を監視します
            </p>
          </div>
        </div>

        <button
          onClick={fetchWebhooks}
          disabled={loading}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>最新の情報に更新</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1C2128] border border-slate-200/90 dark:border-slate-800 p-4 rounded-xl flex flex-col gap-1">
          <span className="text-[11px] font-bold text-slate-400">総 Webhook サブスクリプション</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.total} 件</span>
        </div>
        <div className="bg-white dark:bg-[#1C2128] border border-slate-200/90 dark:border-slate-800 p-4 rounded-xl flex flex-col gap-1">
          <span className="text-[11px] font-bold text-emerald-500">正常稼働中</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.active} 件</span>
        </div>
        <div className="bg-white dark:bg-[#1C2128] border border-slate-200/90 dark:border-slate-800 p-4 rounded-xl flex flex-col gap-1">
          <span className="text-[11px] font-bold text-rose-500">エラー発生総数</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.failures} 回</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1C2128] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            登録済みWebhook一覧 ({subscriptions.length}件)
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#1B4F8A]" />
            <span className="text-xs text-slate-400">Webhook設定を読み込み中...</span>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            現在登録されているWebhook購読はありません。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">ID / ユーザー</th>
                  <th className="px-4 py-3">配信先 URL</th>
                  <th className="px-4 py-3">受信イベント</th>
                  <th className="px-4 py-3">地域絞り込み</th>
                  <th className="px-4 py-3">ステータス</th>
                  <th className="px-4 py-3">失敗回数</th>
                  <th className="px-4 py-3">最終送信日時</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {subscriptions.map((sub) => {
                  const isUpdating = updatingId === sub.id;
                  const lastSent = sub.last_dispatched_at 
                    ? parseUTCDate(sub.last_dispatched_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
                    : "未送信";

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="px-4 py-3">
                        <span className="font-mono text-slate-400 text-[10px] block">#{sub.id}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{sub.user_email}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] max-w-xs truncate" title={sub.webhook_url}>
                        <a
                          href={sub.webhook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                        >
                          {sub.webhook_url}
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        {sub.filter_events || "all_signals"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {sub.filter_prefecture || "全47都道府県"}
                      </td>
                      <td className="px-4 py-3">
                        {sub.is_active === 1 ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 text-[9px] font-bold">
                            稼働中
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 text-[9px] font-bold">
                            停止中
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {sub.failure_count > 0 ? (
                          <span className="text-rose-600 font-bold font-mono">
                            {sub.failure_count} 回
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                        {lastSent}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {sub.failure_count > 0 && (
                            <button
                              onClick={() => resetFailures(sub.id)}
                              disabled={isUpdating}
                              className="px-2.5 py-1 text-[10px] font-bold text-amber-600 border border-amber-200 hover:bg-amber-50 dark:border-amber-900/40 rounded-lg transition-all cursor-pointer"
                              title="エラー回数をリセットして再開"
                            >
                              リセット
                            </button>
                          )}
                          <button
                            onClick={() => toggleWebhookActive(sub.id, sub.is_active)}
                            disabled={isUpdating}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer border ${
                              sub.is_active === 1
                                ? "text-rose-600 border-rose-200 hover:bg-rose-50"
                                : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            }`}
                          >
                            {isUpdating ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : sub.is_active === 1 ? (
                              "停止"
                            ) : (
                              "有効化"
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
