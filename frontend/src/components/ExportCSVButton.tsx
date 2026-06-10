"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { 
  Download, Loader2, CreditCard, Coins, CheckCircle2, 
  AlertTriangle, X, ArrowRight, History
} from "lucide-react";

interface ExportCSVButtonProps {
  totalCount: number;
  keyword: string;
  filters: any;
}

export const ExportCSVButton: React.FC<ExportCSVButtonProps> = ({ 
  totalCount, 
  keyword, 
  filters 
}) => {
  const { user, isLoggedIn, setAuthModalOpen } = useAuth();
  
  // Quota states
  const [quota, setQuota] = useState<{
    monthly_base_allowance: number;
    monthly_base_used: number;
    purchased_add_on_balance: number;
    remaining: number;
  } | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [stripeLoading, setStripeLoading] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [agreeBuyTerms, setAgreeBuyTerms] = useState(false);

  // Fetch quota data
  const fetchQuotaData = useCallback(async () => {
    if (!isLoggedIn || !user?.email) return;
    try {
      const res = await fetch(`/api/export/quota-check?email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        setQuota(data.quota);
      }
    } catch (e) {
      console.error("Failed to fetch user quota", e);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    fetchQuotaData();
  }, [fetchQuotaData]);

  // Listen to Stripe success url redirects
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeSuccess = params.get("stripe_success") === "true";
    const amount = params.get("amount");
    const emailParam = params.get("email");

    if (stripeSuccess && isLoggedIn && user?.email) {
      // If it is a simulation success redirect, credit the DB first
      const processSimulationCredit = async () => {
        if (amount && emailParam && emailParam === user.email) {
          try {
            const res = await fetch("/api/stripe/webhook", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                simulated: true,
                email: user.email,
                amount: parseInt(amount, 10)
              })
            });
            if (res.ok) {
              setPurchaseSuccess(`ご購入ありがとうございます！+${parseInt(amount, 10).toLocaleString()} 行 status CSVダウンロード容量が追加されました。`);
              fetchQuotaData();
            }
          } catch (e) {
            console.error("Simulation webhook failed", e);
          }
        } else {
          // If real Stripe checkout session success
          setPurchaseSuccess("決済が完了しました！CSV容量が追加されました。");
          fetchQuotaData();
        }

        // Clean up URL query parameters to avoid double trigger on refresh
        const cleanUrl = window.location.pathname + window.location.search
          .replace(/[?&]stripe_success=true/, "")
          .replace(/[?&]pack=[^&]*/, "")
          .replace(/[?&]amount=[^&]*/, "")
          .replace(/[?&]email=[^&]*/, "")
          .replace(/[?&]session_id=[^&]*/, "");
        window.history.replaceState(window.history.state, document.title, cleanUrl);
      };
      
      processSimulationCredit();
    }
  }, [isLoggedIn, user, fetchQuotaData]);

  // Download Trigger Handler
  const handleExportClick = async () => {
    if (!isLoggedIn) {
      setAuthModalOpen(true);
      return;
    }

    if (totalCount <= 0) return;

    setLoading(true);
    setStatusMessage("残容量を検証中...");

    try {
      const res = await fetch(`/api/export/quota-check?email=${encodeURIComponent(user?.email || "")}`);
      if (res.ok) {
        const data = await res.json();
        setQuota(data.quota);
        const remaining = data.quota.remaining;

        setLoading(false);
        setStatusMessage(null);

        if (remaining < totalCount) {
          setShowBuyModal(true);
        } else {
          setShowConfirmModal(true);
        }
      } else {
        throw new Error("Quota check request failed");
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
      setStatusMessage("検証に失敗しました。再試行してください。");
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Perform actual export API POST
  const executeExport = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setStatusMessage("データをエクスポート中...");

    try {
      const response = await fetch("/api/export/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email,
          keyword,
          filters,
          totalCount
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        if (errData.error === "insufficient_quota") {
          setLoading(false);
          setStatusMessage(null);
          setShowBuyModal(true);
          return;
        }
        throw new Error(errData.error || "Export failed");
      }

      // Check if it was processed as Background Task (Mechanism B) or Synchronous Zip download (Mechanism A)
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        setLoading(false);
        
        if (result.isAsync) {
          setStatusMessage("バックグラウンド処理を開始...");
          // Show success modal or toast for background jobs
          alert(`エクスポート件数が 5,000 件を超えているため、バックグラウンド処理を開始しました。\n完了後、ページ下部の「ダウンロード履歴」から取得できます。（ジョブID: ${result.jobId}）`);
          fetchQuotaData();
          setStatusMessage(null);
        } else {
          setStatusMessage("ダウンロード中...");
          const a = document.createElement("a");
          a.href = result.downloadUrl;
          document.body.appendChild(a);
          a.click();
          a.remove();

          setStatusMessage("エクスポートが完了しました！");
          fetchQuotaData();
          setTimeout(() => setStatusMessage(null), 4000);
        }
        return;
      }

    } catch (e: any) {
      console.error("Export failed", e);
      setLoading(false);
      setStatusMessage(`失敗: ${e.message || "再試行してください。"}`);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Stripe Checkout redirection handler
  const handlePurchasePack = async (packId: string) => {
    if (!user?.email) return;
    if (user?.role === "free" || user?.role === "trial") {
      alert("追加パッケージの購入は、PROプラン以上の有料プランをご契約中のお客様のみご利用いただけます。先に有料プランへのご登録をお願いいたします。");
      return;
    }
    setStripeLoading(packId);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          packId
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url; // Redirect to Stripe checkout page or Simulator success redirect
        } else {
          throw new Error("Redirection URL is missing");
        }
      } else {
        throw new Error("Redirection API failed");
      }
    } catch (e) {
      console.error(e);
      setStripeLoading(null);
      alert("購入リクエストの処理中にエラーが発生しました。");
    }
  };

  return (
    <div className="relative flex flex-col items-end">
      
      {/* Dynamic Success Purchase Alert banner */}
      {purchaseSuccess && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-[#1B2C24] dark:text-emerald-400 dark:border-emerald-900 px-5 py-4 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 max-w-md">
          <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
          <div className="text-xs">
            <p className="font-extrabold">{purchaseSuccess}</p>
            <p className="text-[10px] mt-0.5 opacity-80">データをエクスポートする準備が整いました。</p>
          </div>
          <button 
            onClick={() => setPurchaseSuccess(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Actions container with Export History link and CSV Export button */}
      <div className="flex items-center gap-2">
        {isLoggedIn && (
          <Link
            href="/dashboard?tab=exports"
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 active:scale-[0.98]"
          >
            <History className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>エクスポート履歴</span>
          </Link>
        )}
        <button
          onClick={handleExportClick}
          disabled={loading || totalCount <= 0}
          className={`px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 border border-emerald-500/10 rounded-xl shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center gap-2 shrink-0 ${(loading || totalCount <= 0) ? "opacity-50 cursor-not-allowed active:scale-100" : ""
            }`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {statusMessage || "CSVダウンロード"}
        </button>
      </div>

      {/* Quota overview details if logged in */}
      {isLoggedIn && quota && (
        <span className="text-[10px] mt-1 text-slate-400 dark:text-slate-500">
          容量残高: <strong className="text-slate-700 dark:text-slate-300">{quota.remaining.toLocaleString()}</strong> 行
        </span>
      )}


      {/* CONFIRM MODAL (Popup Confirmation Dialog before export) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full relative animate-in zoom-in-95 duration-250">
            <button 
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-[#162720] border border-emerald-200/50 dark:border-emerald-900/50 flex items-center justify-center mx-auto mb-4">
                <Download className="w-6 h-6 text-emerald-500" />
              </div>

              <h4 className="font-extrabold text-slate-900 dark:text-white text-base mb-2">
                CSVエクスポートの確認
              </h4>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                現在の検索条件に合致する <strong className="text-slate-800 dark:text-slate-200">{totalCount.toLocaleString()}</strong> 件の企業データをエクスポートします。<br />
                この操作により、アカウントから <strong className="text-slate-800 dark:text-slate-200">{totalCount.toLocaleString()}</strong> 行分のエクスポート容量が差し引かれます。
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/50 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700/80 dark:border-slate-700 rounded-xl transition-all"
                >
                  キャンセル
                </button>
                <button
                  onClick={executeExport}
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-xl shadow-md shadow-emerald-500/10 active:scale-[0.98] transition-all"
                >
                  エクスポート実行
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREMIUM BUY MODAL (Interactive Stripe purchase dialog) */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full relative animate-in zoom-in-95 duration-250">
            <button 
              onClick={() => setShowBuyModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Heade            {/* Premium Package Options */}
            {user?.role === "free" || user?.role === "trial" ? (
              <div className="flex flex-col gap-4 text-center my-6">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-250/50 text-amber-800 dark:bg-[#201515]/20 dark:border-rose-900/30 dark:text-rose-400 text-xs leading-relaxed text-left font-medium">
                  追加パッケージのご購入は、<strong>PROプラン以上の有料プラン</strong>をご契約中のお客様のみとなっております。
                  お手数ですが、先に有料プランへのアップグレードをご検討ください。
                </div>
                <Link
                  href="/pricing"
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-md shadow-emerald-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  <span>有料プランを確認・変更する</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5 mb-6">
                
                {/* Terms agreement checkbox */}
                <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/10 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <input
                    type="checkbox"
                    id="agree-buy-terms"
                    checked={agreeBuyTerms}
                    onChange={(e) => setAgreeBuyTerms(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="agree-buy-terms" className="text-[10px] text-slate-500 leading-normal cursor-pointer selection:bg-transparent">
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-450 hover:underline font-bold">利用規約</a>
                    および
                    <a href="/tokushoho" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold">特定商取引法に基づく表記</a>
                    に同意します。
                  </label>
                </div>
                
                {/* Option 1: 10k Pack */}
                <div className="border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all bg-slate-50/50 dark:bg-slate-800/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center shrink-0">
                      <Coins className="w-4.5 h-4.5 text-emerald-500" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-xs text-slate-850 dark:text-slate-200">
                        10,000 行パック
                      </h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">気軽に使えるエントリー枠</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-slate-900 dark:text-white text-sm">14,800円</div>
                    <button
                      onClick={() => handlePurchasePack("10k")}
                      disabled={!!stripeLoading || !agreeBuyTerms}
                      className="mt-1.5 px-3 py-1 font-bold text-[10px] text-emerald-600 bg-white border border-slate-200 hover:border-emerald-300 rounded-lg transition-all flex items-center gap-1 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {stripeLoading === "10k" ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          選択する
                          <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
 
                {/* Option 2: 50k Pack (RECOMMENDED BEST VALUE) */}
                <div className="border-2 border-emerald-500/80 dark:border-emerald-600/80 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02] relative shadow-md shadow-emerald-500/5">
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-emerald-500 text-[8px] font-black text-white uppercase tracking-wider shadow">
                    ★ 一番人気・32%OFF
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Coins className="w-4.5 h-4.5 text-emerald-500" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-xs text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                        50,000 行パック
                      </h5>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-450 font-semibold mt-0.5">1回あたり49,800円 (24,200円お得)</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-slate-900 dark:text-white text-sm">49,800円</div>
                    <button
                      onClick={() => handlePurchasePack("50k")}
                      disabled={!!stripeLoading || !agreeBuyTerms}
                      className="mt-1.5 px-3 py-1 font-black text-[10px] text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-lg shadow-sm transition-all flex items-center gap-1 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {stripeLoading === "50k" ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          決済する
                          <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
 
                {/* Option 3: 100k Pack */}
                <div className="border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all bg-slate-50/50 dark:bg-slate-800/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center shrink-0">
                      <Coins className="w-4.5 h-4.5 text-emerald-500" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-xs text-slate-850 dark:text-slate-200">
                        100,000 行パック
                      </h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">大規模な分析やテレアポに最安値</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-slate-900 dark:text-white text-sm">79,800円</div>
                    <button
                      onClick={() => handlePurchasePack("100k")}
                      disabled={!!stripeLoading || !agreeBuyTerms}
                      className="mt-1.5 px-3 py-1 font-bold text-[10px] text-emerald-600 bg-white border border-slate-200 hover:border-emerald-300 rounded-lg transition-all flex items-center gap-1 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {stripeLoading === "100k" ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          選択する
                          <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* Footer secure notification */}
            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-850 py-3 rounded-2xl">
              <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Stripe社による暗号化された安全な決済処理が施されます</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
