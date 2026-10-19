"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Terminal, RefreshCcw, Loader2, KeyRound, ShieldAlert, ShieldCheck, 
  Trash2, Search, Filter, AlertTriangle, CheckCircle2, Copy, Check, Clock, Globe
} from "lucide-react";
import { parseUTCDate } from "@/lib/dateUtils";
import { useAdminToast } from "../AdminToast";

interface ApiKeyItem {
  id: string;
  user_email: string;
  api_key_preview: string;
  status: "active" | "revoked" | "suspended";
  created_at: string;
  last_used_at?: string | null;
  last_ip?: string | null;
  last_user_agent?: string | null;
  revoked_at?: string | null;
  revoked_by?: string | null;
  revoked_reason?: string | null;
  plan?: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "revoked">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Status Modal (Revoke / Activate)
  const [statusModalKey, setStatusModalKey] = useState<ApiKeyItem | null>(null);
  const [targetNextStatus, setTargetNextStatus] = useState<"active" | "revoked" | "suspended">("revoked");
  const [statusReason, setStatusReason] = useState("");
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Hard Delete state
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);

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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpdateStatus = async () => {
    if (!statusModalKey) return;
    setSubmittingStatus(true);
    try {
      const res = await fetch("/api/admin/apikeys", {
        method: "POST",
        headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          keyId: statusModalKey.id,
          status: targetNextStatus,
          targetEmail: statusModalKey.user_email,
          keyPreview: statusModalKey.api_key_preview,
          reason: statusReason.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "APIキーのステータスを更新しました。");
        setStatusModalKey(null);
        setStatusReason("");
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

  const handleHardDelete = async (key: ApiKeyItem) => {
    const confirmMsg = `【危険】APIキーをシステムから完全に削除しますか？\n対象: ${key.user_email} (${key.api_key_preview})\n\n※この操作はデータベースから物理削除され、復元できません。`;
    if (!confirm(confirmMsg)) return;

    setDeletingKeyId(key.id);
    try {
      const res = await fetch(
        `/api/admin/apikeys?keyId=${encodeURIComponent(key.id)}&targetEmail=${encodeURIComponent(key.user_email)}&keyPreview=${encodeURIComponent(key.api_key_preview)}`,
        {
          method: "DELETE",
          headers: getAdminHeaders(),
        }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "APIキーを完全に削除しました。");
        fetchApiKeys();
      } else {
        toast.error(data.error || "削除に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    } finally {
      setDeletingKeyId(null);
    }
  };

  // Filtered Keys
  const filteredKeys = useMemo(() => {
    return apiKeys.filter((k) => {
      // Status filter
      if (statusFilter === "active" && k.status !== "active") return false;
      if (statusFilter === "revoked" && k.status === "active") return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchEmail = k.user_email.toLowerCase().includes(q);
        const matchKey = (k.api_key_preview || "").toLowerCase().includes(q);
        const matchReason = (k.revoked_reason || "").toLowerCase().includes(q);
        if (!matchEmail && !matchKey && !matchReason) return false;
      }

      return true;
    });
  }, [apiKeys, statusFilter, searchQuery]);

  const activeCount = apiKeys.filter((k) => k.status === "active").length;
  const revokedCount = apiKeys.filter((k) => k.status !== "active").length;

  return (
    <section className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
            <span>B2B APIキー管理・接続ログ</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            外部システム連携用APIキーのアクティブ状態監視、強制無効化および監査ログの管理
          </p>
        </div>

        <button
          onClick={fetchApiKeys}
          disabled={loading}
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-bold"
          title="最新情報に更新"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>再読込</span>
        </button>
      </div>

      {/* KPI Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">総発行APIキー数</div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{apiKeys.length} <span className="text-xs font-normal text-slate-500">件</span></div>
          </div>
          <KeyRound className="w-6 h-6 text-slate-400" />
        </div>

        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">稼働中 (Active)</div>
            <div className="text-xl font-black text-emerald-800 dark:text-emerald-300 mt-1">{activeCount} <span className="text-xs font-normal text-emerald-600">件</span></div>
          </div>
          <ShieldCheck className="w-6 h-6 text-emerald-500" />
        </div>

        <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase">無効化・履歴 (Revoked)</div>
            <div className="text-xl font-black text-rose-800 dark:text-rose-300 mt-1">{revokedCount} <span className="text-xs font-normal text-rose-600">件</span></div>
          </div>
          <ShieldAlert className="w-6 h-6 text-rose-500" />
        </div>
      </div>

      {/* Toolbar: Filters and Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
        {/* Tabs */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === "all" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs" : "hover:text-slate-900"
            }`}
          >
            すべて ({apiKeys.length})
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === "active" ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs" : "hover:text-slate-900"
            }`}
          >
            稼働中 ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter("revoked")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === "revoked" ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-2xs" : "hover:text-slate-900"
            }`}
          >
            無効化・履歴 ({revokedCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="メールアドレス、キープレビュー、理由で検索..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">クライアント (User Email)</th>
              <th className="px-4 py-3">プラン</th>
              <th className="px-4 py-3">APIキー (プレビュー)</th>
              <th className="px-4 py-3">作成日時 (JST)</th>
              <th className="px-4 py-3">最終利用 / 接続IP</th>
              <th className="px-4 py-3">ステータス・監査事由</th>
              <th className="px-4 py-3 text-right">管理者操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && apiKeys.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1B4F8A]" />
                  読み込み中...
                </td>
              </tr>
            ) : filteredKeys.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  該当するAPIキーは見つかりませんでした。
                </td>
              </tr>
            ) : (
              filteredKeys.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                  {/* Email */}
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      {k.user_email}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: {k.id}
                    </span>
                  </td>

                  {/* Plan Badge */}
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      k.plan === "enterprise" 
                        ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300"
                        : k.plan === "business"
                        ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                        : k.plan === "pro"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {k.plan || "free"}
                    </span>
                  </td>

                  {/* Key Preview with Copy */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                      <span>kigyou_live_...{k.api_key_preview.replace(/^\.\.\./, "")}</span>
                      <button
                        onClick={() => handleCopy(`kigyou_live_...${k.api_key_preview.replace(/^\.\.\./, "")}`, k.id)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
                        title="プレビュー文字列をコピー"
                      >
                        {copiedId === k.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </td>

                  {/* Created At */}
                  <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                    {parseUTCDate(k.created_at).toLocaleString("ja-JP", {
                      timeZone: "Asia/Tokyo",
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  {/* Last Used & IP */}
                  <td className="px-4 py-3">
                    {k.last_used_at ? (
                      <div>
                        <div className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                          {parseUTCDate(k.last_used_at).toLocaleString("ja-JP", {
                            timeZone: "Asia/Tokyo",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" />
                          <span>{k.last_ip || "IP不明"}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">未利用 (Unused)</span>
                    )}
                  </td>

                  {/* Status & Revocation Audit */}
                  <td className="px-4 py-3">
                    {k.status === "active" ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold rounded-full text-[10px] inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> 有効 (Active)
                      </span>
                    ) : (
                      <div>
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold rounded-full text-[10px] inline-flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> 無効化済み (Revoked)
                        </span>
                        {k.revoked_by && (
                          <div className="text-[10px] text-slate-500 mt-1">
                            実行者: <strong className="text-slate-700 dark:text-slate-300">{k.revoked_by === "user" ? "クライアント本人" : "管理者"}</strong>
                          </div>
                        )}
                        {k.revoked_reason && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]" title={k.revoked_reason}>
                            事由: {k.revoked_reason}
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {k.status === "active" ? (
                        <button
                          onClick={() => {
                            setStatusModalKey(k);
                            setTargetNextStatus("revoked");
                            setStatusReason("");
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800"
                        >
                          強制無効化
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setStatusModalKey(k);
                              setTargetNextStatus("active");
                              setStatusReason("");
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
                          >
                            再有効化
                          </button>
                          <button
                            onClick={() => handleHardDelete(k)}
                            disabled={deletingKeyId === k.id}
                            className="p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700"
                            title="データベースから完全削除"
                          >
                            {deletingKeyId === k.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Status Modal (Admin Revoke / Reactivate with Audit Log) */}
      {statusModalKey && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${targetNextStatus === "active" ? "text-emerald-500" : "text-amber-500"}`} />
              <span>
                {targetNextStatus === "active" ? "APIキーの再有効化" : "APIキーの強制無効化"}
              </span>
            </h3>

            <p className="text-xs text-slate-500 mb-4">
              対象クライアント: <strong className="text-slate-900 dark:text-white font-mono">{statusModalKey.user_email}</strong><br />
              キープレビュー: <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">kigyou_live_...{statusModalKey.api_key_preview.replace(/^\.\.\./, "")}</span>
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                変更理由（操作監査ログに記録されます）
              </label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder={
                  targetNextStatus === "active"
                    ? "例: 顧客からの再開要請を確認、セキュリティ検証済み"
                    : "例: 規約違反の疑い、顧客からの緊急無効化要請、料金未払いなど..."
                }
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStatusModalKey(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={submittingStatus}
                onClick={handleUpdateStatus}
                className={`px-4 py-2 rounded-xl font-bold text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 text-white ${
                  targetNextStatus === "active" 
                    ? "bg-emerald-600 hover:bg-emerald-700" 
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {submittingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {targetNextStatus === "active" ? "再有効化を実行" : "強制無効化を実行"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
