"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
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
  const { locale } = useLanguage();
  
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

  const d = locale === 'en' ? {
    history: "Export History",
    downloadBtn: "CSV Download",
    remainingQuota: "Quota: <strong>{remaining}</strong> rows",
    purchaseSuccessMsg: "Thank you for your purchase! +{amount} rows CSV download quota added.",
    realStripeSuccessMsg: "Payment successful! CSV quota has been updated.",
    readyToExport: "Ready to export data.",
    verifyingQuota: "Verifying remaining quota...",
    verifyFailed: "Verification failed. Please try again.",
    exportingData: "Exporting data...",
    bgProcessStarted: "Background process started...",
    asyncAlert: "The export count exceeds 5,000 items, so we have started a background task.\nYou can retrieve it from the 'Export History' tab at the bottom of the dashboard once completed. (Job ID: {jobId})",
    downloading: "Downloading...",
    exportComplete: "Export completed!",
    retry: "Please try again.",
    failMessage: "Failed: {message}",
    onlyPaidNotice: "Additional packages can only be purchased by customers on a paid plan (PRO or higher). Please register for a paid plan first.",
    purchaseError: "An error occurred while processing the purchase request.",
    confirmTitle: "Confirm CSV Export",
    confirmDesc: "You are about to export <strong class=\"text-slate-800 dark:text-slate-200\">{count}</strong> company records matching the current filters.<br />This operation will deduct <strong class=\"text-slate-800 dark:text-slate-200\">{count}</strong> rows of export quota from your account.",
    cancel: "Cancel",
    execute: "Export Now",
    upgradeToPaidTitle: "Paid Plan Required",
    upgradeToPaidDesc: "Additional packages can only be purchased by customers on a paid plan (PRO or higher). Please upgrade to a paid plan first.",
    viewPlans: "View & Change Paid Plans",
    agreeTerms: "I agree to the Terms of Service and Act on Specified Commercial Transactions disclosures.",
    terms: "Terms of Service",
    tokushoho: "Act on Specified Commercial Transactions",
    secureNotice: "Secure encrypted payments are processed via Stripe",
    packs: {
      "10k": {
        title: "10,000 Rows Pack",
        desc: "Entry pack for casual use",
        price: "14,800 JPY",
        btn: "Select"
      },
      "50k": {
        title: "50,000 Rows Pack",
        desc: "1 pack is 49,800 JPY (Save 24,200 JPY)",
        badge: "★ Popular - 32% OFF",
        price: "49,800 JPY",
        btn: "Pay Now"
      },
      "100k": {
        title: "100,000 Rows Pack",
        desc: "Best value for large-scale analysis & cold calls",
        price: "79,800 JPY",
        btn: "Select"
      }
    }
  } : {
    history: "エクスポート履歴",
    downloadBtn: "CSVダウンロード",
    remainingQuota: "容量残高: <strong>{remaining}</strong> 行",
    purchaseSuccessMsg: "ご購入ありがとうございます！+{amount} 行 CSVダウンロード容量が追加されました。",
    realStripeSuccessMsg: "決済が完了しました！CSV容量が追加されました。",
    readyToExport: "データをエクスポートする準備が整いました。",
    verifyingQuota: "残容量を検証中...",
    verifyFailed: "検証に失敗しました。再試行してください。",
    exportingData: "データをエクスポート中...",
    bgProcessStarted: "バックグラウンド処理を開始...",
    asyncAlert: "エクスポート件数が 5,000 件を超えているため、バックグラウンド処理を開始しました。\n完了後、ページ下部の「ダウンロード履歴」から取得できます。（ジョブID: {jobId}）",
    downloading: "ダウンロード中...",
    exportComplete: "エクスポートが完了しました！",
    retry: "再試行してください。",
    failMessage: "失敗: {message}",
    onlyPaidNotice: "追加パッケージの購入は、PROプラン以上の有料プランをご契約中のお客様のみご利用いただけます。先に有料プランへのご登録をお願いいたします。",
    purchaseError: "購入リクエストの処理中にエラーが発生しました。",
    confirmTitle: "CSVエクスポートの確認",
    confirmDesc: "現在の検索条件に合致する <strong class=\"text-slate-850 dark:text-slate-200\">{count}</strong> 件の企業データをエクスポートします。<br />この操作により、アカウントから <strong class=\"text-slate-850 dark:text-slate-200\">{count}</strong> 行分のエクスポート容量が差し引かれます。",
    cancel: "キャンセル",
    execute: "エクスポート実行",
    upgradeToPaidTitle: "有料プランのご契約が必要",
    upgradeToPaidDesc: "追加パッケージのご購入は、PROプラン以上の有料プランをご契約中のお客様のみとなっております。お手数ですが、先に有料プランへのアップグレードをご検討ください。",
    viewPlans: "有料プランを確認・変更する",
    agreeTerms: "利用規約 および 特定商取引法に基づく表記 に同意します。",
    terms: "利用規約",
    tokushoho: "特定商取引法に基づく表記",
    secureNotice: "Stripe社による暗号化された安全な決済処理が施されます",
    packs: {
      "10k": {
        title: "10,000 行パック",
        desc: "気軽に使えるエントリー枠",
        price: "14,800円",
        btn: "選択する"
      },
      "50k": {
        title: "50,000 行パック",
        desc: "1回あたり49,800円 (24,200円お得)",
        badge: "★ 一番人気・32%OFF",
        price: "49,800円",
        btn: "決済する"
      },
      "100k": {
        title: "100,000 行パック",
        desc: "大規模な分析やテレアポに最安値",
        price: "79,800円",
        btn: "選択する"
      }
    }
  };

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
              setPurchaseSuccess(d.purchaseSuccessMsg.replace("{amount}", parseInt(amount, 10).toLocaleString()));
              fetchQuotaData();
            }
          } catch (e) {
            console.error("Simulation webhook failed", e);
          }
        } else {
          // If real Stripe checkout session success
          setPurchaseSuccess(d.realStripeSuccessMsg);
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
  }, [isLoggedIn, user, fetchQuotaData, d.purchaseSuccessMsg, d.realStripeSuccessMsg]);

  // Download Trigger Handler
  const handleExportClick = async () => {
    if (!isLoggedIn) {
      setAuthModalOpen(true);
      return;
    }

    if (totalCount <= 0) return;

    setLoading(true);
    setStatusMessage(d.verifyingQuota);

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
      setStatusMessage(d.verifyFailed);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Perform actual export API POST
  const executeExport = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setStatusMessage(d.exportingData);

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

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        setLoading(false);
        
        if (result.isAsync) {
          setStatusMessage(d.bgProcessStarted);
          alert(d.asyncAlert.replace("{jobId}", result.jobId));
          fetchQuotaData();
          setStatusMessage(null);
        } else {
          setStatusMessage(d.downloading);
          const a = document.createElement("a");
          a.href = result.downloadUrl;
          document.body.appendChild(a);
          a.click();
          a.remove();

          setStatusMessage(d.exportComplete);
          fetchQuotaData();
          setTimeout(() => setStatusMessage(null), 4000);
        }
        return;
      }

    } catch (e: any) {
      console.error("Export failed", e);
      setLoading(false);
      setStatusMessage(d.failMessage.replace("{message}", e.message || d.retry));
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Stripe Checkout redirection handler
  const handlePurchasePack = async (packId: string) => {
    if (!user?.email) return;
    if (user?.role === "free" || user?.role === "trial") {
      alert(d.onlyPaidNotice);
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
          window.location.href = data.url;
        } else {
          throw new Error("Redirection URL is missing");
        }
      } else {
        throw new Error("Redirection API failed");
      }
    } catch (e) {
      console.error(e);
      setStripeLoading(null);
      alert(d.purchaseError);
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
            <p className="text-[10px] mt-0.5 opacity-80">{d.readyToExport}</p>
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
            href={`/${locale}/dashboard?tab=exports`}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 active:scale-[0.98]"
          >
            <History className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>{d.history}</span>
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
          {statusMessage || d.downloadBtn}
        </button>
      </div>

      {/* Quota overview details if logged in */}
      {isLoggedIn && quota && (
        <span 
          className="text-[10px] mt-1 text-slate-400 dark:text-slate-500"
          dangerouslySetInnerHTML={{ __html: d.remainingQuota.replace("{remaining}", quota.remaining.toLocaleString()) }}
        />
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
                {d.confirmTitle}
              </h4>
              
              <p 
                className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: d.confirmDesc.replace(/{count}/g, totalCount.toLocaleString()) }}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/50 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700/80 dark:border-slate-700 rounded-xl transition-all"
                >
                  {d.cancel}
                </button>
                <button
                  onClick={executeExport}
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-xl shadow-md shadow-emerald-500/10 active:scale-[0.98] transition-all"
                >
                  {d.execute}
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

            {/* Premium Package Options */}
            {user?.role === "free" || user?.role === "trial" ? (
              <div className="flex flex-col gap-4 text-center my-6">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-250/50 text-amber-800 dark:bg-[#201515]/20 dark:border-rose-900/30 dark:text-rose-400 text-xs leading-relaxed text-left font-medium">
                  {d.upgradeToPaidDesc}
                </div>
                <Link
                  href={`/${locale}/pricing`}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-md shadow-emerald-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  <span>{d.viewPlans}</span>
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
                    <Link href={`/${locale}/terms`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-450 hover:underline font-bold">{d.terms}</Link>
                    {locale === 'en' ? ' and ' : ' および '}
                    <Link href={`/${locale}/tokushoho`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold">{d.tokushoho}</Link>
                    {locale === 'en' ? ' disclosures to proceed.' : ' に同意します。'}
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
                        {d.packs["10k"].title}
                      </h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">{d.packs["10k"].desc}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-slate-900 dark:text-white text-sm">{d.packs["10k"].price}</div>
                    <button
                      onClick={() => handlePurchasePack("10k")}
                      disabled={!!stripeLoading || !agreeBuyTerms}
                      className="mt-1.5 px-3 py-1 font-bold text-[10px] text-emerald-600 bg-white border border-slate-200 hover:border-emerald-300 rounded-lg transition-all flex items-center gap-1 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {stripeLoading === "10k" ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          {d.packs["10k"].btn}
                          <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
 
                {/* Option 2: 50k Pack (RECOMMENDED BEST VALUE) */}
                <div className="border-2 border-emerald-500/80 dark:border-emerald-600/80 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02] relative shadow-md shadow-emerald-500/5">
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-emerald-500 text-[8px] font-black text-white uppercase tracking-wider shadow">
                    {d.packs["50k"].badge}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Coins className="w-4.5 h-4.5 text-emerald-500" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-xs text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                        {d.packs["50k"].title}
                      </h5>
                      <p className="text-[10px] text-emerald-650 dark:text-emerald-450 font-semibold mt-0.5">{d.packs["50k"].desc}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-slate-900 dark:text-white text-sm">{d.packs["50k"].price}</div>
                    <button
                      onClick={() => handlePurchasePack("50k")}
                      disabled={!!stripeLoading || !agreeBuyTerms}
                      className="mt-1.5 px-3 py-1 font-black text-[10px] text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-lg shadow-sm transition-all flex items-center gap-1 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {stripeLoading === "50k" ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          {d.packs["50k"].btn}
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
                        {d.packs["100k"].title}
                      </h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">{d.packs["100k"].desc}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-slate-900 dark:text-white text-sm">{d.packs["100k"].price}</div>
                    <button
                      onClick={() => handlePurchasePack("100k")}
                      disabled={!!stripeLoading || !agreeBuyTerms}
                      className="mt-1.5 px-3 py-1 font-bold text-[10px] text-emerald-650 bg-white border border-slate-200 hover:border-emerald-300 rounded-lg transition-all flex items-center gap-1 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {stripeLoading === "100k" ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          {d.packs["100k"].btn}
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
              <span>{d.secureNotice}</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
