"use client";

import React, { useState, useEffect } from "react";
import { Building2, RefreshCcw, Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { useAdminToast } from "../AdminToast";

interface PartnerItem {
  user_email: string;
  company_name?: string | null;
  logo_url?: string | null;
  is_featured_partner: boolean;
  website?: string | null;
}

interface PartnersTabProps {
  adminEmail: string;
  getAdminHeaders: () => Record<string, string>;
}

export const PartnersTab: React.FC<PartnersTabProps> = ({
  adminEmail,
  getAdminHeaders,
}) => {
  const toast = useAdminToast();
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/partners", { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPartners(data.partners || []);
      } else {
        toast.error("パートナー一覧の取得に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleToggleFeatured = async (targetEmail: string, currentFeatured: boolean) => {
    try {
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail, isFeatured: !currentFeatured }),
      });
      const data = await res.json();
      if (res.ok) {
        setPartners((prev) =>
          prev.map((p) =>
            p.user_email === targetEmail ? { ...p, is_featured_partner: !currentFeatured } : p
          )
        );
        toast.success(data.message || "掲載ステータスを更新しました。");
      } else {
        toast.error(data.error || "更新に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    }
  };

  return (
    <section className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <span>パートナーロゴ管理</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            トップページに掲載するパートナー企業・導入事例ロゴの審査と公開設定
          </p>
        </div>

        <button
          onClick={fetchPartners}
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
              <th className="px-4 py-3">企業名 / メール</th>
              <th className="px-4 py-3">ロゴプレビュー</th>
              <th className="px-4 py-3">トップページ掲載</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && partners.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  読み込み中...
                </td>
              </tr>
            ) : partners.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                  パートナー企業はまだ登録されていません。
                </td>
              </tr>
            ) : (
              partners.map((p) => (
                <tr key={p.user_email} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 align-middle">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {p.company_name || "(会社名未設定)"}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {p.user_email}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    {p.logo_url ? (
                      <div className="w-20 h-10 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center overflow-hidden">
                        <img
                          src={p.logo_url}
                          alt={p.company_name || "Logo"}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">未設定</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    {p.is_featured_partner ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold rounded-full text-[10px] inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 掲載中
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-bold rounded-full text-[10px] inline-flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> 非掲載
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-middle text-right">
                    <button
                      onClick={() => handleToggleFeatured(p.user_email, p.is_featured_partner)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        p.is_featured_partner
                          ? "bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
                      }`}
                    >
                      {p.is_featured_partner ? "掲載を停止" : "掲載を承認"}
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
