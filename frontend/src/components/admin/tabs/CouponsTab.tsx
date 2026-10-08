"use client";

import React, { useState, useEffect } from "react";
import { Ticket, Plus, Loader2, RefreshCcw } from "lucide-react";
import { parseUTCDate } from "@/lib/dateUtils";
import { useAdminToast } from "../AdminToast";

interface Coupon {
  code: string;
  discount_percent: number;
  expires_at: string;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

interface CouponsTabProps {
  adminEmail: string;
  getAdminHeaders: () => Record<string, string>;
}

export const CouponsTab: React.FC<CouponsTabProps> = ({
  adminEmail,
  getAdminHeaders,
}) => {
  const toast = useAdminToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // New Coupon Form
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState("50");
  const [newMaxUses, setNewMaxUses] = useState("10");
  const [newDaysValid, setNewDaysValid] = useState("30");
  const [creating, setCreating] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coupon/admin", { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      } else {
        toast.error("クーポン一覧の取得に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/coupon/admin", {
        method: "POST",
        headers: { ...getAdminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode.trim().toUpperCase(),
          discount_percent: Number(newDiscount),
          max_uses: Number(newMaxUses),
          days_valid: Number(newDaysValid),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "クーポンを作成しました。");
        setNewCode("");
        fetchCoupons();
      } else {
        toast.error(data.error || "クーポンの作成に失敗しました。");
      }
    } catch {
      toast.error("通信エラーが発生しました。");
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs animate-in fade-in duration-200">
      {/* Create Coupon Form */}
      <div className="mb-8 p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-500" />
          <span>新規プロモーションクーポンの発行</span>
        </h3>

        <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              クーポンコード (英数字)
            </label>
            <input
              required
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              type="text"
              placeholder="例: SPECIAL50"
              className="w-full bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono uppercase font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              割引率 (%)
            </label>
            <input
              required
              value={newDiscount}
              onChange={(e) => setNewDiscount(e.target.value)}
              type="number"
              min="1"
              max="100"
              className="w-full bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              最大利用回数
            </label>
            <input
              required
              value={newMaxUses}
              onChange={(e) => setNewMaxUses(e.target.value)}
              type="number"
              min="1"
              className="w-full bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              有効期間 (日数)
            </label>
            <input
              required
              value={newDaysValid}
              onChange={(e) => setNewDaysValid(e.target.value)}
              type="number"
              min="1"
              className="w-full bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="sm:col-span-2 md:col-span-4 flex justify-end mt-1">
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>クーポンを発行する</span>
            </button>
          </div>
        </form>
      </div>

      {/* Coupons List Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Ticket className="w-4 h-4 text-amber-500" />
            <span>発行済みクーポン一覧</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            全 {coupons.length} 件のプロモーションコード
          </p>
        </div>

        <button
          onClick={fetchCoupons}
          disabled={loading}
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="再読み込み"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">クーポンコード</th>
              <th className="px-4 py-3">割引率</th>
              <th className="px-4 py-3">利用回数 / 上限</th>
              <th className="px-4 py-3">有効期限 (JST)</th>
              <th className="px-4 py-3 text-right">ステータス</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && coupons.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  読み込み中...
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  クーポンはまだ発行されていません。
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => {
                const isExpired = parseUTCDate(coupon.expires_at) < new Date();
                const isMaxed = coupon.used_count >= coupon.max_uses;
                const isValid = !isExpired && !isMaxed && coupon.is_active;

                return (
                  <tr key={coupon.code} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-black text-primary dark:text-secondary text-sm">
                      {coupon.code}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {coupon.discount_percent}% OFF
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className={isMaxed ? "text-rose-500 font-bold" : "text-slate-800 dark:text-slate-200"}>
                        {coupon.used_count}
                      </span>{" "}
                      / {coupon.max_uses}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                      <span className={isExpired ? "text-rose-500 font-bold" : ""}>
                        {parseUTCDate(coupon.expires_at).toLocaleDateString("ja-JP", {
                          timeZone: "Asia/Tokyo",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isValid ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold rounded-full">
                          有効
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold rounded-full">
                          {isExpired ? "期限切れ" : isMaxed ? "上限到達" : "無効"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
