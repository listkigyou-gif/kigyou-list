"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  ShieldAlert, ShieldCheck, Ban, Plus, Trash2, RefreshCcw, 
  Search, Loader2, Clock, Globe, Mail, AlertTriangle, CheckCircle2, Zap, Bot 
} from "lucide-react";
import { parseUTCDate } from "@/lib/dateUtils";
import { useAdminToast } from "../AdminToast";

interface BlacklistAdminView {
  id: number;
  type: "ip" | "email_domain" | "email";
  target: string;
  reason: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  is_expired: boolean;
  remaining_text: string;
}

interface SecurityTabProps {
  adminEmail: string;
  getAdminHeaders: () => Record<string, string>;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
  adminEmail,
  getAdminHeaders,
}) => {
  const toast = useAdminToast();
  const [items, setItems] = useState<BlacklistAdminView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [target, setTarget] = useState("");
  const [type, setType] = useState<"ip" | "email_domain" | "email">("ip");
  const [durationHours, setDurationHours] = useState<number>(48);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchBlacklists = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blacklists", { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        setItems(data.blacklists || []);
      } else {
        toast.error("遮断リストの取得に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklists();
  }, []);

  // Update default duration when type changes
  const handleTypeChange = (newType: "ip" | "email_domain" | "email") => {
    setType(newType);
    if (newType === "ip") {
      setDurationHours(48); // 48h recommended for IPs
    } else {
      setDurationHours(0); // Permanent for email domains
    }
  };

  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTarget = target.trim();
    if (!cleanTarget) {
      toast.error("遮断対象（IPまたはドメイン）を入力してください。");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/blacklists", {
        method: "POST",
        headers: {
          ...getAdminHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          target: cleanTarget,
          durationHours,
          reason: reason.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast.success(`「${cleanTarget}」を遮断リストに登録しました。`);
        setTarget("");
        setReason("");
        fetchBlacklists();
      } else {
        const err = await res.json();
        toast.error(err.error || "遮断ルールの追加に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, targetName: string) => {
    if (!confirm(`「${targetName}」の遮断を解除してもよろしいですか？`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/blacklists?id=${id}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      });

      if (res.ok) {
        toast.success(`「${targetName}」の遮断を解除しました。`);
        setItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        toast.error("遮断解除に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    }
  };

  // Metrics
  const activeIpCount = useMemo(() => {
    return items.filter((i) => i.type === "ip" && !i.is_expired).length;
  }, [items]);

  const activeDomainCount = useMemo(() => {
    return items.filter((i) => i.type === "email_domain" && !i.is_expired).length;
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.target.toLowerCase().includes(term) ||
        (item.reason && item.reason.toLowerCase().includes(term))
    );
  }, [items, searchTerm]);

  return (
    <section className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs animate-in fade-in duration-200">
      {/* Top summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Active IPs */}
        <div className="p-4 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
              一時遮断中IP (48h / 動的制限)
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono">
            {activeIpCount} <span className="text-xs font-semibold text-amber-600">件</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            48時間後に自動解除（正当ユーザー誤遮断防止）
          </div>
        </div>

        {/* Permanent Domains */}
        <div className="p-4 rounded-lg bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300">
              永久遮断ドメイン (不正メール)
            </span>
            <Ban className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-400 font-mono">
            {activeDomainCount} <span className="text-xs font-semibold text-rose-600">件</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            使い捨て・詐欺メール（全ゲートウェイ永久遮断）
          </div>
        </div>

        {/* Total Rules */}
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500">
              登録ルール総数
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {items.length} <span className="text-xs font-semibold text-slate-400">件</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            リアルタイム Edge & API 高速遮断エンジン
          </div>
        </div>
      </div>

      {/* Quick Add Block Form */}
      <div className="mb-8 p-5 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <Plus className="w-4 h-4 text-primary" />
          <span>新規遮断ルールの追加</span>
        </h3>

        <form onSubmit={handleAddBlacklist} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Target */}
          <div className="md:col-span-4">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              遮断対象 (IP / CIDR / ドメイン) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder={type === "ip" ? "例: 8.216.49.100 または 8.216.49.0/24" : "例: gmaiilllld.com"}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
            />
          </div>

          {/* Type */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              種別
            </label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as any)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ip">IPアドレス / CIDR</option>
              <option value="email_domain">メール・ドメイン</option>
              <option value="email">特定メールアドレス</option>
            </select>
          </div>

          {/* Duration */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              遮断期間
            </label>
            <select
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value={48}>48時間 (推奨 - 一時的ブロック)</option>
              <option value={168}>7日間 (1週間)</option>
              <option value={720}>30日間 (1ヶ月)</option>
              <option value={0}>無期限 (永久ブロック - ドメイン向け)</option>
            </select>
          </div>

          {/* Reason */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              理由 (メモ)
            </label>
            <input
              type="text"
              placeholder="例: カード不正 (Jack last)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Submit */}
          <div className="md:col-span-1">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 shadow-xs cursor-pointer"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "遮断"}
            </button>
          </div>
        </form>
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <span>不正アクセス・遮断ルール一覧</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            認証・決済・CSV出力・ページ閲覧の全アクセスに対して即時適用されます
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="IP / ドメイン / 理由検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 w-48 sm:w-60"
            />
          </div>

          <button
            onClick={fetchBlacklists}
            disabled={loading}
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="再読み込み"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200/90 dark:border-slate-800">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">遮断対象 (Target)</th>
              <th className="px-4 py-3">種別</th>
              <th className="px-4 py-3">遮断理由</th>
              <th className="px-4 py-3">登録日時</th>
              <th className="px-4 py-3">有効期限 / 残り時間</th>
              <th className="px-4 py-3">ステータス</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  読み込み中...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  該当する遮断ルールはありません。
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr 
                  key={item.id} 
                  className={`transition-colors ${
                    item.is_expired
                      ? "opacity-60 bg-slate-50/40 dark:bg-slate-900/40"
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                  }`}
                >
                  <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      {item.type === "ip" ? (
                        <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      ) : (
                        <Mail className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      )}
                      <span>{item.target}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {item.type === "ip" ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        IPアドレス
                      </span>
                    ) : item.type === "email_domain" ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        ドメイン
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200">
                        メール
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[240px]" title={item.reason || ""}>
                    <div className="flex flex-col gap-1">
                      {item.created_by === "system_guard" || item.reason?.toLowerCase().includes("auto-ban") ? (
                        <span className="w-fit px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-50 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 flex items-center gap-1">
                          <Bot className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                          <span>自動検知 (Auto-Ban)</span>
                        </span>
                      ) : (
                        <span className="w-fit px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          管理者手動
                        </span>
                      )}
                      <span className="truncate text-xs font-medium">{item.reason || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-[11px]">
                    {parseUTCDate(item.created_at).toLocaleString("ja-JP", {
                      timeZone: "Asia/Tokyo",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {item.is_expired ? (
                      <span className="text-slate-400 line-through text-[11px]">
                        期限切れ (自動解除)
                      </span>
                    ) : item.expires_at ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono">
                        {item.remaining_text}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        永久 (無期限)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.is_expired ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        解除済
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        遮断中
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(item.id, item.target)}
                      className="px-2.5 py-1 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                      title="遮断を解除する"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>解除</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
