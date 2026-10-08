"use client";

import React, { useState, useEffect } from "react";
import { Terminal, RefreshCcw, Loader2, KeyRound, ShieldAlert, ShieldCheck } from "lucide-react";
import { parseUTCDate } from "@/lib/dateUtils";
import { useAdminToast } from "../AdminToast";

interface ApiKeyItem {
  id: string;
  user_email: string;
  key_preview: string;
  status: "active" | "revoked";
  created_at: string;
  last_used_at?: string | null;
}

interface ApiKeysTabProps {
  adminEmail: string;
  getAdminHeaders: () => Record<string, string>;
}

export const ApiKeysTab: React.FC<ApiKeysTabProps> = ({
  adminEmail,
  getAdminHeaders,
}) => {
  const toast = useAdminToast();
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Status Modal
  const [statusModalKey, setStatusModalKey] = useState<ApiKeyItem | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const fetchApiKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/apikeys", { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.apiKeys || []);
      } else {
        toast.error("APIキー一覧の取得に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleUpdateStatus = async () => {
    if (!statusModalKey) return;
    const nextStatus = statusModalKey.status === "active" ? "revoked" : "active";
    setSubmittingStatus(true);
    try {
      const res = await fetch("/api/admin/apikeys", {
        method: "POST",
        headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          keyId: statusModalKey.id,
          status: nextStatus,
          targetEmail: statusModalKey.user_email,
          keyPreview: statusModalKey.key_preview,
          reason: statusReason.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "APIキーのステータスを更新しました。");
        setStatusModalKey(null);
        fetchApiKeys();
      } else {
        toast.error(data.error || "更新に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    } finally {
      setSubmittingStatus(false);
    }
  };

  return (
    <section className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <span>B2B APIキー管理</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            外部システム連携用APIキーの発行・無効化状態の管理
          </p>
        </div>

        <button
          onClick={fetchApiKeys}
          disabled={loading}
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="再読み込み"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">発行先 (User Email)</th>
              <th className="px-4 py-3">APIキー (プレビュー)</th>
              <th className="px-4 py-3">作成日時 (JST)</th>
              <th className="px-4 py-3">ステータス</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && apiKeys.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  読み込み中...
                </td>
              </tr>
            ) : apiKeys.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  発行済みのAPIキーはありません。
                </td>
              </tr>
            ) : (
              apiKeys.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {k.user_email}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                    {k.key_preview || "••••••••••••••••"}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {parseUTCDate(k.created_at).toLocaleString("ja-JP", {
                      timeZone: "Asia/Tokyo",
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {k.status === "active" ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold rounded-full text-[10px] inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> 有効 (Active)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold rounded-full text-[10px] inline-flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> 無効化済み (Revoked)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setStatusModalKey(k);
                        setStatusReason("");
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        k.status === "active"
                          ? "bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
                      }`}
                    >
                      {k.status === "active" ? "無効化する" : "再有効化する"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Status Modal */}
      {statusModalKey && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              APIキーのステータス変更
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              対象: <span className="font-mono font-bold">{statusModalKey.user_email}</span> ({statusModalKey.key_preview})
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                変更理由（監査ログに記録されます）
              </label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="例: クライアントからの要請、セキュリティ上の漏洩懸念など..."
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStatusModalKey(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={submittingStatus}
                onClick={handleUpdateStatus}
                className={`px-4 py-2 rounded-xl font-bold text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 text-white ${
                  statusModalKey.status === "active" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {submittingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {statusModalKey.status === "active" ? "無効化を実行" : "再有効化を実行"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
