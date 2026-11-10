"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { 
  Download, Loader2, CreditCard, Coins, CheckCircle2, 
  AlertTriangle, X, ArrowRight, History, Send, Zap, Clock
} from "lucide-react";
import { trackSignUpIntent } from "@/lib/gtag";

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
  
  // UI & Count states
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [stripeLoading, setStripeLoading] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [agreeBuyTerms, setAgreeBuyTerms] = useState(false);

  // Dynamic export count selection
  const [actualTotalCount, setActualTotalCount] = useState<number>(totalCount);
  const [isCappedCount, setIsCappedCount] = useState<boolean>(false);
  const [selectedExportCount, setSelectedExportCount] = useState<number>(Math.min(totalCount > 0 ? totalCount : 2000, 2000));
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customInputValue, setCustomInputValue] = useState<string>("");

  const d = locale === 'vi' ? {
    history: "Lịch sử xuất file",
    downloadBtn: "Tải xuống CSV",
    remainingQuota: "Hạn ngạch: <strong>{remaining}</strong> dòng",
    purchaseSuccessMsg: "Cảm ơn bạn đã mua hàng! Đã thêm +{amount} dòng hạn ngạch tải xuống CSV.",
    realStripeSuccessMsg: "Thanh toán thành công! Hạn ngạch CSV đã được cập nhật.",
    readyToExport: "Sẵn sàng xuất dữ liệu.",
    verifyingQuota: "Đang xác minh hạn ngạch & dữ liệu...",
    verifyFailed: "Xác minh thất bại. Vui lòng thử lại.",
    exportingData: "Đang xuất dữ liệu...",
    bgProcessStarted: "Tiến trình chạy ngầm đã bắt đầu...",
    asyncAlert: "Số lượng xuất vượt quá 5.000 dòng, hệ thống đã bắt đầu xử lý ngầm an toàn.\nBạn có thể tải xuống từ tab 'Lịch sử xuất file' ở phía dưới cùng bảng điều khiển sau khi hoàn thành. (Mã tiến trình: {jobId})",
    downloading: "Đang tải xuống...",
    exportComplete: "Xuất dữ liệu hoàn thành!",
    retry: "Vui lòng thử lại.",
    failMessage: "Thất bại: {message}",
    onlyPaidNotice: "Các gói hạn ngạch bổ sung chỉ có thể được mua bởi tài khoản gói trả phí (từ gói PRO trở lên). Vui lòng đăng ký gói trả phí trước.",
    purchaseError: "Đã xảy ra lỗi trong quá trình xử lý yêu cầu mua hàng.",
    confirmTitle: "Xác nhận & Chọn số lượng xuất CSV",
    matchingFound: "Doanh nghiệp tìm thấy",
    currentQuota: "Hạn ngạch tài khoản",
    cappedNotice: "(Tối đa đo lường 100.000)",
    selectCountLabel: "Chọn số lượng xuất:",
    customCountLabel: "Tùy chỉnh số lượng",
    allRows: "Tất cả ({count} dòng)",
    instantMode: "Tải tức thì (File ZIP sẵn sàng trong vài giây)",
    asyncMode: "Xử lý ngầm an toàn (Tự động hoàn thành trong 30-60 giây và lưu tại Lịch sử tải về)",
    deductNotice: "Thao tác này sẽ trừ <strong>{count}</strong> dòng. (Số dư sau khi tải: <strong>{after}</strong> dòng)",
    insufficientWarning: "Hạn ngạch của bạn không đủ (còn thiếu {shortage} dòng). Vui lòng giảm số lượng hoặc mua thêm gói.",
    buyQuotaBtn: "Mua thêm gói hạn ngạch",
    cancel: "Hủy bỏ",
    execute: "Xuất {count} dòng",
    upgradeToPaidTitle: "Yêu cầu tài khoản trả phí",
    upgradeToPaidDesc: "Các gói mua thêm chỉ có thể được áp dụng đối với tài khoản gói trả phí (từ PRO trở lên). Vui lòng nâng cấp trước.",
    viewPlans: "Xem & Thay đổi gói trả phí",
    agreeTerms: "Tôi đồng ý với Điều khoản dịch vụ và các tiết lộ Giao dịch thương mại đặc định.",
    terms: "Điều khoản dịch vụ",
    tokushoho: "Luật giao dịch thương mại đặc định",
    secureNotice: "Thanh toán mã hóa bảo mật được xử lý qua Stripe",
    packs: {
      "10k": {
        title: "Gói 10.000 dòng",
        desc: "Gói cơ bản cho nhu cầu nhỏ",
        price: "14.800 JPY",
        btn: "Chọn"
      },
      "50k": {
        title: "Gói 50.000 dòng",
        desc: "Gói tiêu chuẩn tối ưu chi phí",
        badge: "★ Phổ biến nhất - Tiết kiệm 32%",
        price: "49.800 JPY",
        btn: "Chọn"
      },
      "100k": {
        title: "Gói 100.000 dòng",
        desc: "Gói doanh nghiệp tải lượng lớn",
        price: "79.800 JPY",
        btn: "Chọn"
      }
    }
  } : locale === 'en' ? {
    history: "Export History",
    downloadBtn: "CSV Download",
    remainingQuota: "Quota: <strong>{remaining}</strong> rows",
    purchaseSuccessMsg: "Thank you for your purchase! +{amount} rows CSV download quota added.",
    realStripeSuccessMsg: "Payment successful! CSV quota has been updated.",
    readyToExport: "Ready to export data.",
    verifyingQuota: "Verifying quota & matching data...",
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
    confirmTitle: "Confirm CSV Export & Choose Quantity",
    matchingFound: "Matching companies",
    currentQuota: "Remaining quota",
    cappedNotice: "(Measured up to 100,000)",
    selectCountLabel: "Select export quantity:",
    customCountLabel: "Custom amount",
    allRows: "All ({count} rows)",
    instantMode: "Instant ZIP download (starts in a few seconds)",
    asyncMode: "Safe background task (processed in 30-60s, available in Export History)",
    deductNotice: "Will deduct <strong>{count}</strong> rows. (Balance after: <strong>{after}</strong> rows)",
    insufficientWarning: "Insufficient quota (short by {shortage} rows). Please adjust quantity or purchase an add-on pack.",
    buyQuotaBtn: "Purchase Add-on Quota",
    cancel: "Cancel",
    execute: "Export {count} rows",
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
    verifyingQuota: "残容量および該当データを確認中...",
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
    confirmTitle: "CSVエクスポートの確認・件数指定",
    matchingFound: "検索該当件数",
    currentQuota: "保有エクスポート容量",
    cappedNotice: "（上限10万件まで計測）",
    selectCountLabel: "エクスポート件数の指定:",
    customCountLabel: "件数を直接指定",
    allRows: "全件（{count} 件）",
    instantMode: "即時ZIPダウンロード（数秒でブラウザから直接保存されます）",
    asyncMode: "バックグラウンド処理（サーバー側で安全に自動生成し、完了後に「ダウンロード履歴」から取得できます）",
    deductNotice: "この操作により、アカウントから <strong>{count}</strong> 行分が差し引かれます。（実行後の残高: <strong>{after}</strong> 行）",
    insufficientWarning: "保有容量が不足しています（不足: {shortage} 行）。件数を減らすか、容量を追加購入してください。",
    buyQuotaBtn: "容量パックを追加購入する",
    cancel: "キャンセル",
    execute: "{count} 件をエクスポート実行",
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
    if (!isLoggedIn || !user?.email) return null;
    try {
      const res = await fetch(`/api/export/quota-check?email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        setQuota(data.quota);
        return data.quota;
      }
    } catch (e) {
      console.error("Failed to fetch user quota", e);
    }
    return null;
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
          setPurchaseSuccess(d.realStripeSuccessMsg);
          fetchQuotaData();
        }

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

  // Download Trigger Handler: checks quota and fetches accurate matching count
  const handleExportClick = async () => {
    if (!isLoggedIn) {
      trackSignUpIntent("export_csv_guest");
      setAuthModalOpen(true);
      return;
    }

    if (totalCount <= 0) return;

    setLoading(true);
    setStatusMessage(d.verifyingQuota);

    try {
      // Run quota check and accurate matching count in parallel
      const [fetchedQuota, countRes] = await Promise.all([
        fetchQuotaData(),
        fetch("/api/export/count", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword, filters })
        }).then(r => r.ok ? r.json() : { total: totalCount, isCapped: false }).catch(() => ({ total: totalCount, isCapped: false }))
      ]);

      const accurateCount = (countRes && typeof countRes.total === "number" && countRes.total > 0)
        ? countRes.total 
        : Math.max(totalCount, 1);

      setActualTotalCount(accurateCount);
      setIsCappedCount(!!countRes?.isCapped);

      const userRemaining = fetchedQuota ? fetchedQuota.remaining : (quota?.remaining || 0);

      // Intelligent default selection:
      // If matching count <= 2000, select all matching
      // If matching count > 2000, select 2,000 (standard page limit) or capped by quota
      let initialCount = Math.min(accurateCount, 2000);
      if (initialCount <= 0) initialCount = Math.min(accurateCount, 500);
      
      setSelectedExportCount(initialCount);
      setIsCustomMode(false);
      setCustomInputValue("");

      setLoading(false);
      setStatusMessage(null);
      setShowConfirmModal(true);

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
          totalCount: selectedExportCount // Strict user-chosen limit
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

  // Quick preset options calculation based on actualTotalCount
  const presets = [500, 1000, 2000, 5000, 10000].filter(val => actualTotalCount >= val);
  const remainingQuota = quota?.remaining || 0;
  const isShortOfQuota = selectedExportCount > remainingQuota;
  const quotaAfterExport = Math.max(0, remainingQuota - selectedExportCount);

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
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-white hover:bg-slate-50 border border-slate-300 dark:bg-slate-800 dark:border-slate-700 rounded-lg transition-all shadow-2xs flex items-center gap-1.5 shrink-0 active:scale-[0.98]"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>{d.history}</span>
          </Link>
        )}
        <button
          onClick={handleExportClick}
          disabled={loading || totalCount <= 0}
          className={`px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs active:scale-[0.98] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${(loading || totalCount <= 0) ? "opacity-50 cursor-not-allowed active:scale-100" : ""
            }`}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
          ) : (
            <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
          )}
          <span>{statusMessage || d.downloadBtn}</span>
          {!isLoggedIn && (
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold px-1.5 py-0.5 rounded-sm">
              {locale === 'ja' ? '毎日20件無料' : locale === 'vi' ? '20 lượt/ngày free' : '20 free/day'}
            </span>
          )}
        </button>
      </div>

      {/* Quota overview details if logged in */}
      {isLoggedIn && quota && (
        <span 
          className="text-[10px] mt-1 text-slate-400 dark:text-slate-500"
          dangerouslySetInnerHTML={{ __html: d.remainingQuota.replace("{remaining}", quota.remaining.toLocaleString()) }}
        />
      )}

      {/* CONFIRM MODAL: Choose Export Quantity & Confirm */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200/90 dark:bg-[#151B22] dark:border-slate-800 rounded-2xl p-6 shadow-xl max-w-lg w-full relative animate-in zoom-in-95 duration-150">
            <button 
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg [font-feature-settings:'palt']">
                    {d.confirmTitle}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {locale === 'ja' ? '出力件数を選択してエクスポートを実行します' : locale === 'vi' ? 'Chọn số lượng dòng cần tải về và xác nhận' : 'Select export count and download'}
                  </p>
                </div>
              </div>

              {/* Stats Bar: Search Hits & Current Quota */}
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0D1117] border border-slate-200/80 dark:border-slate-800 text-left">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{d.matchingFound}</div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5">
                    {actualTotalCount.toLocaleString()} <span className="text-xs font-normal text-slate-500">件</span>
                  </div>
                  {isCappedCount && (
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">{d.cappedNotice}</div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0D1117] border border-slate-200/80 dark:border-slate-800 text-left">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{d.currentQuota}</div>
                  <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
                    {remainingQuota.toLocaleString()} <span className="text-xs font-normal text-slate-500">行</span>
                  </div>
                </div>
              </div>

              {/* Quantity Selector Section */}
              <div className="mb-4 text-left">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {d.selectCountLabel}
                </label>

                {/* Preset Pills */}
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setSelectedExportCount(preset);
                        setIsCustomMode(false);
                        setCustomInputValue("");
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !isCustomMode && selectedExportCount === preset
                          ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-2xs"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-[#0D1117] dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800"
                      }`}
                    >
                      {preset.toLocaleString()} 件
                    </button>
                  ))}

                  {/* All matching rows option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedExportCount(actualTotalCount);
                      setIsCustomMode(false);
                      setCustomInputValue("");
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !isCustomMode && selectedExportCount === actualTotalCount
                        ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-2xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-[#0D1117] dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800"
                    }`}
                  >
                    {d.allRows.replace("{count}", actualTotalCount.toLocaleString())}
                  </button>

                  {/* Custom mode toggle pill */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomMode(true);
                      if (!customInputValue) {
                        setCustomInputValue(String(selectedExportCount));
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isCustomMode
                        ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-2xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-[#0D1117] dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800"
                    }`}
                  >
                    {d.customCountLabel}
                  </button>
                </div>

                {/* Custom Input Field (shown when custom mode is active) */}
                {isCustomMode && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-500">{locale === 'ja' ? '出力件数:' : locale === 'vi' ? 'Số lượng:' : 'Rows:'}</span>
                    <input
                      type="number"
                      min={1}
                      max={actualTotalCount}
                      value={customInputValue}
                      onChange={(e) => {
                        const valStr = e.target.value;
                        setCustomInputValue(valStr);
                        const valNum = parseInt(valStr, 10);
                        if (!isNaN(valNum) && valNum > 0) {
                          setSelectedExportCount(Math.min(valNum, actualTotalCount));
                        }
                      }}
                      className="w-28 px-2.5 py-1 text-xs font-bold bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white tabular-nums focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      placeholder={`1〜${actualTotalCount.toLocaleString()}`}
                    />
                    <span className="text-xs text-slate-500">{locale === 'ja' ? '件' : locale === 'vi' ? 'dòng' : 'rows'}</span>
                    <span className="text-[10px] text-slate-400 ml-auto">
                      {locale === 'ja' ? `(最大: ${actualTotalCount.toLocaleString()}件)` : `(Max: ${actualTotalCount.toLocaleString()})`}
                    </span>
                  </div>
                )}
              </div>

              {/* Processing Mode Indicator (Instant vs Background) */}
              <div className="mb-4 text-left">
                {selectedExportCount <= 5000 ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60">
                    <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-[11px] leading-snug">{d.instantMode}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-blue-800 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-200/80 dark:border-blue-800/60">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-[11px] leading-snug">{d.asyncMode}</span>
                  </div>
                )}
              </div>

              {/* Quota Deduction Statement */}
              <div className="mb-4 text-left text-[11px] text-slate-600 dark:text-slate-400">
                <p 
                  dangerouslySetInnerHTML={{ 
                    __html: d.deductNotice
                      .replace("{count}", selectedExportCount.toLocaleString())
                      .replace("{after}", quotaAfterExport.toLocaleString()) 
                  }} 
                />
              </div>

              {/* Insufficient Quota Warning & Buy Callout */}
              {isShortOfQuota && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-left">
                  <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300 text-xs font-semibold mb-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <span>{d.insufficientWarning.replace("{shortage}", (selectedExportCount - remainingQuota).toLocaleString())}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirmModal(false);
                      setShowBuyModal(true);
                    }}
                    className="w-full py-2 px-3 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>{d.buyQuotaBtn}</span>
                  </button>
                </div>
              )}

              {/* DFY Form Outreach Cross-Sell Notice */}
              <div className="mb-5 p-3 rounded-xl bg-slate-50/80 dark:bg-[#0D1117] border border-slate-200/90 dark:border-slate-800 text-left">
                <div className="flex items-center gap-1.5 text-[#1B4F8A] dark:text-blue-400 font-semibold text-xs mb-1">
                  <Send className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                  <span>{locale === 'ja' ? '手動送信の手間をゼロにする代行プラン' : locale === 'vi' ? 'Dịch vụ gửi form trọn gói (Không cần tự gõ)' : 'Done-For-You Outreach Service available'}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-2 [font-feature-settings:'palt']">
                  {locale === 'ja'
                    ? 'CSVをダウンロードして自社で入力する代わりに、専任チームがこの企業群へ代行送信することも可能です。'
                    : locale === 'vi'
                    ? 'Thay vì tải CSV về tự nhập thủ công, đội ngũ chuyên viên có thể gửi trực tiếp vào form của các công ty này.'
                    : 'Instead of manually submitting forms, our team can deliver your pitch directly.'}
                </p>
                <Link
                  href={`/${locale}/form-marketing`}
                  onClick={() => setShowConfirmModal(false)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline"
                >
                  <span>{locale === 'ja' ? 'フォーム自動営業の詳細・料金を見る →' : locale === 'vi' ? 'Xem chi tiết dịch vụ gửi Form tự động →' : 'View Automated Form DM Details →'}</span>
                </Link>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 h-10 px-4 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 dark:text-slate-300 dark:bg-[#151B22] dark:border-slate-700 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  {d.cancel}
                </button>
                <button
                  type="button"
                  onClick={executeExport}
                  disabled={isShortOfQuota || selectedExportCount <= 0}
                  className="flex-1 h-10 px-4 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  <span>{d.execute.replace("{count}", selectedExportCount.toLocaleString())}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREMIUM BUY MODAL (Interactive Stripe purchase dialog) */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200/90 dark:bg-[#151B22] dark:border-slate-800 rounded-2xl p-6 shadow-xl max-w-md w-full relative animate-in zoom-in-95 duration-150">
            <button 
              onClick={() => setShowBuyModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Form Outreach Alternative */}
            <div className="mb-4 p-3 rounded-xl bg-slate-50/80 dark:bg-[#0D1117] border border-slate-200/90 dark:border-slate-800 text-left flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-[#1B4F8A] dark:text-blue-400 font-semibold text-xs">
                  <Send className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                  <span>{locale === 'ja' ? 'リスト購入不要！フォーム自動営業（セルフ配信）' : locale === 'vi' ? 'Không cần mua data! Tự động gửi Form tiếp cận' : 'No data purchase needed! Automated Form Outreach'}</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {locale === 'ja' ? '絞り込んだターゲット企業へ完全自動で配信。1通5.9円〜' : locale === 'vi' ? 'Tự động tiếp cận danh sách đã lọc, chỉ từ 5.9 JPY/form' : 'Automated outreach to filtered lists from 5.9 JPY/form'}
                </p>
              </div>
              <Link
                href={`/${locale}/form-marketing`}
                onClick={() => setShowBuyModal(false)}
                className="shrink-0 px-3 py-1.5 text-[11px] font-semibold text-white bg-[#1B4F8A] hover:bg-[#143D6C] rounded-lg transition-colors shadow-2xs"
              >
                {locale === 'ja' ? '自動配信プラン' : locale === 'vi' ? 'Gói gửi tự động' : 'View Plan'}
              </Link>
            </div>

            <div className="flex flex-col gap-3.5 mb-6">
              
              {/* Terms agreement checkbox */}
              <div className="flex items-start gap-2 bg-slate-50/80 dark:bg-[#0D1117] p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="agree-buy-terms"
                  checked={agreeBuyTerms}
                  onChange={(e) => setAgreeBuyTerms(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 mt-0.5 cursor-pointer"
                />
                <label htmlFor="agree-buy-terms" className="text-[10px] text-slate-500 leading-normal cursor-pointer selection:bg-transparent">
                  <Link href={`/${locale}/terms`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-450 hover:underline font-bold">{d.terms}</Link>
                  {locale === 'en' ? ' and ' : locale === 'vi' ? ' và ' : ' および '}
                  <Link href={`/${locale}/tokushoho`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold">{d.tokushoho}</Link>
                  {locale === 'en' ? ' disclosures to proceed.' : locale === 'vi' ? ' để tiếp tục.' : ' に同意します。'}
                </label>
              </div>
              
              {/* Option 1: 10k Pack */}
              <div className="border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-3.5 flex items-center justify-between gap-4 transition-colors bg-white dark:bg-[#151B22]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center shrink-0">
                    <Coins className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-slate-150">
                      {d.packs["10k"].title}
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">{d.packs["10k"].desc}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold tabular-nums text-slate-900 dark:text-white text-sm">{d.packs["10k"].price}</div>
                  <button
                    onClick={() => handlePurchasePack("10k")}
                    disabled={!!stripeLoading || !agreeBuyTerms}
                    className="mt-1.5 px-3 py-1 font-semibold text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
              <div className="border-2 border-emerald-600/80 dark:border-emerald-500/80 rounded-xl p-3.5 flex items-center justify-between gap-4 transition-colors bg-emerald-50/20 dark:bg-emerald-950/10 relative shadow-2xs">
                <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-md bg-emerald-600 text-[9px] font-bold text-white uppercase tracking-wider shadow-2xs">
                  {d.packs["50k"].badge}
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100/60 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                    <Coins className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-slate-150 flex items-center gap-1.5">
                      {d.packs["50k"].title}
                    </h5>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">{d.packs["50k"].desc}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold tabular-nums text-slate-900 dark:text-white text-sm">{d.packs["50k"].price}</div>
                  <button
                    onClick={() => handlePurchasePack("50k")}
                    disabled={!!stripeLoading || !agreeBuyTerms}
                    className="mt-1.5 px-3 py-1 font-semibold text-[10px] text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
              <div className="border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-3.5 flex items-center justify-between gap-4 transition-colors bg-white dark:bg-[#151B22]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center shrink-0">
                    <Coins className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-slate-150">
                      {d.packs["100k"].title}
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">{d.packs["100k"].desc}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold tabular-nums text-slate-900 dark:text-white text-sm">{d.packs["100k"].price}</div>
                  <button
                    onClick={() => handlePurchasePack("100k")}
                    disabled={!!stripeLoading || !agreeBuyTerms}
                    className="mt-1.5 px-3 py-1 font-semibold text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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

            {/* Footer secure notification */}
            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50/80 dark:bg-[#0D1117] py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{d.secureNotice}</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
