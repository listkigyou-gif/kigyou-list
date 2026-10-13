"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, ShieldCheck, RefreshCcw, Loader2, Plus, Search, Trash2, AlertCircle } from "lucide-react";
import { parseUTCDate } from "@/lib/dateUtils";
import { useAdminToast } from "../AdminToast";

interface OptOutItem {
  id: number;
  user_id: string;
  corporate_number: string;
  company_name: string | null;
  campaign_id: string | null;
  domain: string | null;
  email: string | null;
  reason: string;
  created_at: string;
}

interface OptOutAdminTabProps {
  adminEmail: string;
  getAdminHeaders: () => Record<string, string>;
}

export const OptOutAdminTab: React.FC<OptOutAdminTabProps> = ({
  adminEmail,
  getAdminHeaders,
}) => {
  const toast = useAdminToast();
  const [optOuts, setOptOuts] = useState<OptOutItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCorpNumber, setNewCorpNumber] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newReason, setNewReason] = useState("特定電子メール法・受信拒否通知");
  const [submitting, setSubmitting] = useState(false);

  const fetchOptOuts = async (query = searchQuery) => {
    setLoading(true);
    try {
      const url = query ? `/api/admin/opt-outs?q=${encodeURIComponent(query)}` : `/api/admin/opt-outs`;
      const res = await fetch(url, { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        setOptOuts(data.optOuts || []);
        setTotalCount(data.total || 0);
      } else {
        toast.error("配信停止リストの取得に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptOuts();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOptOuts(searchQuery);
  };

  const handleCreateOptOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCorpNumber && !newDomain && !newEmail) {
      toast.error("法人番号、ドメイン、またはメールアドレスのいずれかを入力してください。");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/opt-outs", {
        method: "POST",
        headers: {
          ...getAdminHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          corporate_number: newCorpNumber,
          company_name: newCompanyName,
          domain: newDomain,
          email: newEmail,
          reason: newReason,
        }),
      });

      if (res.ok) {
        toast.success("配信停止リストに追加しました。");
        setShowAddModal(false);
        setNewCorpNumber("");
        setNewCompanyName("");
        setNewDomain("");
        setNewEmail("");
        fetchOptOuts();
      } else {
        const err = await res.json();
        toast.error(err.error || "登録に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOptOut = async (id: number) => {
    if (!confirm("本当にこの企業の配信停止制限を解除しますか？（営業送信対象に復帰します）")) return;

    try {
      const res = await fetch(`/api/admin/opt-outs?id=${id}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      });

      if (res.ok) {
        toast.success("配信停止レコードを削除しました。");
        fetchOptOuts();
      } else {
        toast.error("削除に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#1C2128] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-200/80 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              オプトアウト（特定電子メール法・フォーム営業除外）管理
            </h2>
            <p className="text-xs text-slate-500">
              フォーム営業およびAI Sales Agentの自動配信から除外するブラックリスト（受信拒否企業）を一元管理します
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#1B4F8A] hover:bg-[#143D6C] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新規除外先を追加</span>
          </button>
          <button
            onClick={() => fetchOptOuts()}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Search & Counter Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white dark:bg-[#1C2128] border border-slate-200/90 dark:border-slate-800 p-4 rounded-xl">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="法人番号、企業名、ドメイン、メールで検索..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-900 text-white dark:bg-slate-700 text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            検索
          </button>
        </form>

        <span className="text-xs font-bold text-slate-500 self-center sm:self-auto">
          登録総数: <strong className="text-slate-800 dark:text-slate-200 font-mono">{totalCount}</strong> 件
        </span>
      </div>

      {/* List Table */}
      <div className="bg-white dark:bg-[#1C2128] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-4">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-rose-600" />
            <span className="text-xs text-slate-400">リストを読み込み中...</span>
          </div>
        ) : optOuts.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            オプトアウト登録されている企業はありません。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">法人番号</th>
                  <th className="px-4 py-3">企業名</th>
                  <th className="px-4 py-3">対象ドメイン / メール</th>
                  <th className="px-4 py-3">登録理由</th>
                  <th className="px-4 py-3">登録者</th>
                  <th className="px-4 py-3">登録日時 (JST)</th>
                  <th className="px-4 py-3 text-right">解除</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {optOuts.map((item) => {
                  const createdJst = parseUTCDate(item.created_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {item.corporate_number || "-"}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {item.company_name || "-"}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {item.domain || item.email || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px] max-w-xs truncate" title={item.reason}>
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/80 text-[10px]">
                          {item.reason}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                        {item.user_id}
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                        {createdJst}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteOptOut(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                          title="除外制限を解除する"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                配信停止（オプトアウト）先の手動追加
              </h3>
            </div>

            <form onSubmit={handleCreateOptOut} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">法人番号 (13桁)</label>
                <input
                  type="text"
                  value={newCorpNumber}
                  onChange={(e) => setNewCorpNumber(e.target.value)}
                  placeholder="例: 1234567890123"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">企業名</label>
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="例: 株式会社サンプル"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Webサイトドメイン</label>
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="例: sample-corp.co.jp"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">メールアドレス</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="例: info@sample-corp.co.jp"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">登録理由 / 経緯</label>
                <input
                  type="text"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="特定電子メール法に基づく受信拒否要請"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-bold cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>登録する</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
