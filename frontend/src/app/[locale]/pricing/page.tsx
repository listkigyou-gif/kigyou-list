"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useLanguage } from "@/context/LanguageContext";
import { LocaleLink } from "@/components/LocaleLink";
import { 
  Check, Info, Sparkles, ShieldCheck, CreditCard, 
  HelpCircle, Coins, ArrowRight, Loader2, Star, Clock, ChevronRight,
  Database, Send
} from "lucide-react";

interface PlanDetails {
  id: "free" | "pro" | "business" | "enterprise";
  name: string;
  listPrice: number;
  campaignPrice: number;
  referralPrice: number;
  quota: string;
  quotaNum: number;
  description: string;
  features: string[];
  recommended?: boolean;
}

interface PackDetails {
  id: "10k" | "50k" | "100k";
  name: string;
  price: number;
  allowance: number;
  description: string;
  recommended?: boolean;
}

export default function PricingPage() {
  const { isLoggedIn, user, setAuthModalOpen } = useAuth();
  const { locale, t } = useLanguage();
  const isEn = locale === "en";
  const isVi = locale === "vi";
  
  const discountType = "campaign";
  const [showCheckoutModal, setShowCheckoutModal] = useState<PlanDetails | null>(null);
  const [showPackCheckoutModal, setShowPackCheckoutModal] = useState<PackDetails | null>(null);

  const packs: PackDetails[] = [
    {
      id: "10k",
      name: isEn ? "10,000 Row Add-on Pack" : isVi ? "Gói bổ sung 10.000 dòng" : "10,000 行追加パック",
      price: 14800,
      allowance: 10000,
      description: isEn ? "For users who need incremental quota" : isVi ? "Dành cho người dùng cần thêm hạn ngạch nhỏ giọt" : "必要な分だけ少しずつ追加したい方向け",
      recommended: false
    },
    {
      id: "50k",
      name: isEn ? "50,000 Row Add-on Pack" : isVi ? "Gói bổ sung 50.000 dòng" : "50,000 行追加パック",
      price: 49800,
      allowance: 50000,
      description: isEn ? "Save approx 32%. Most popular tier." : isVi ? "Tiết kiệm khoảng 32%. Gói phổ biến nhất." : "1回あたり約32%お得な一番人気のボリューム枠",
      recommended: true
    },
    {
      id: "100k",
      name: isEn ? "100,000 Row Add-on Pack" : isVi ? "Gói bổ sung 100.000 dòng" : "100,000 行追加パック",
      price: 79800,
      allowance: 100000,
      description: isEn ? "Best price rate, ideal for large exports" : isVi ? "Mức giá tốt nhất, lý tưởng cho xuất dữ liệu lớn" : "大量リストの抽出に最適な最安値レート",
      recommended: false
    }
  ];

  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Coupon states
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);

  useEffect(() => {
    if (isLoggedIn && user?.email) {
      setEmailInput(user.email);
    }
  }, [isLoggedIn, user?.email]);

  const plans: PlanDetails[] = [
    {
      id: "free",
      name: isEn ? "FREE Plan" : isVi ? "Gói FREE" : "FREEプラン",
      listPrice: 0,
      campaignPrice: 0,
      referralPrice: 0,
      quota: isEn ? "20 items / day" : isVi ? "20 dòng / ngày" : "20 件 / 日",
      quotaNum: 20,
      description: isEn ? "Perfect for testing usability" : isVi ? "Lý tưởng để kiểm tra thử tính năng của hệ thống" : "まずは使い勝手を試してみたい方に最適",
      features: isEn ? [
        "20 CSV exports per day",
        "View FAX & key shareholders (after login)",
        "View intent signals (after login)"
      ] : isVi ? [
        "Tải xuống tối đa 20 dòng CSV mỗi ngày",
        "Xem số FAX & cổ đông lớn (sau khi đăng nhập)",
        "Xem chi tiết tín hiệu nhu cầu (sau khi đăng nhập)"
      ] : [
        "毎日 20 件の CSV ダウンロード枠",
        "FAX番号 & 主要株主情報の閲覧 (ログイン後)",
        "詳細シグナル閲覧 (ログイン後)"
      ]
    },
    {
      id: "pro",
      name: isEn ? "PRO Plan" : isVi ? "Gói PRO" : "PROプラン",
      listPrice: 4200,
      campaignPrice: 2900,
      referralPrice: 2100,
      quota: isEn ? "2,000 rows / month" : isVi ? "2.000 dòng / tháng" : "2,000 行 / 月",
      quotaNum: 2000,
      description: isEn ? "Ideal for sole proprietors & salespeople running outreach" : isVi ? "Lý tưởng cho cá nhân kinh doanh & nhân viên bán hàng tiếp cận khách hàng" : "テレアポ・DM営業を始めたい個人事業主や営業マンに最適",
      features: isEn ? [
        "2,000 CSV downloads per month",
        "Email address disclosure",
        "ABM Kanban CRM board",
        "Filter by email/phone availability"
      ] : isVi ? [
        "Tải xuống 2.000 dòng CSV mỗi tháng",
        "Mở khóa địa chỉ email doanh nghiệp",
        "Bảng quản lý phễu CRM Kanban ABM",
        "Lọc theo sự tồn tại của email/số điện thoại"
      ] : [
        "毎月 2,000 件の CSV ダウンロード枠",
        "メールアドレスの開示",
        "ABM かんばん営業管理 CRM ボード",
        "連絡先情報（電話・メール）の有無での絞り込み"
      ]
    },
    {
      id: "business",
      name: isEn ? "BUSINESS Plan" : isVi ? "Gói BUSINESS" : "BUSINESSプラン",
      listPrice: 14000,
      campaignPrice: 9800,
      referralPrice: 7000,
      quota: isEn ? "10,000 rows / month" : isVi ? "10.000 dòng / tháng" : "10,000 行 / 月",
      quotaNum: 10000,
      description: isEn ? "Standard team plan with background exports via Mechanism B" : isVi ? "Gói chuẩn cho nhóm, hỗ trợ xuất hàng loạt chạy ngầm qua Mechanism B" : "Mechanism B による大量エクスポートを可能にする標準チーム枠",
      features: isEn ? [
        "10,000 CSV downloads per month",
        "Mechanism B background bulk downloads",
        "Supports bulk downloads over 10,000 items",
        "API integration (Key issuance & syncing)",
        "Priority customer support"
      ] : isVi ? [
        "Tải xuống 10.000 dòng CSV mỗi tháng",
        "Tải xuống hàng loạt chạy ngầm qua Mechanism B",
        "Hỗ trợ tải xuống số lượng lớn hơn 10.000 dòng",
        "Tích hợp API (Cấp khóa API & đồng bộ hóa)",
        "Ưu tiên hỗ trợ khách hàng"
      ] : [
        "毎月 10,000 件の CSV ダウンロード枠",
        "Mechanism B バックグラウンド一括ダウンロード",
        "10,000件超の大量データダウンロード対応",
        "API連携 (API Key 発行・外部データ連携)",
        "優先カスタマーサポート"
      ],
      recommended: true
    },
    {
      id: "enterprise",
      name: isEn ? "ENTERPRISE Plan" : isVi ? "Gói ENTERPRISE" : "ENTERPRISEプラン",
      listPrice: 42000,
      campaignPrice: 29000,
      referralPrice: 21000,
      quota: isEn ? "40,000 rows / month" : isVi ? "40.000 dòng / tháng" : "40,000 行 / 月",
      quotaNum: 40000,
      description: isEn ? "Premium organizational plan with dedicated engineer support" : isVi ? "Gói cao cấp cho doanh nghiệp lớn với hỗ trợ kỹ thuật và kỹ sư riêng" : "専任サポートと月4万件のデータ抽出を可能にする最上位の組織向け枠",
      recommended: false,
      features: isEn ? [
        "40,000 CSV downloads per month",
        "API integration (Key issuance & syncing)",
        "Dedicated integration & engineer support",
        "Dedicated account manager"
      ] : isVi ? [
        "Tải xuống 40.000 dòng CSV mỗi tháng",
        "Tích hợp API (Cấp khóa API & đồng bộ hóa)",
        "Hỗ trợ tích hợp & Kỹ sư kỹ thuật chuyên trách",
        "Quản lý tài khoản chuyên trách"
      ] : [
        "毎月 40,000 件の CSV ダウンロード枠",
        "API連携 (API Key 発行・外部データ連携)",
        "専用インテグレーション・エンジニアサポート",
        "専任アカウントマネージャー配属"
      ]
    }
  ];

  const handleCheckoutClick = (plan: PlanDetails) => {
    if (plan.id === "free") {
      if (!isLoggedIn) {
        setAuthModalOpen(true);
      }
      return;
    }
    if (!isLoggedIn) {
      setAuthModalOpen(true);
      return;
    }
    setShowCheckoutModal(plan);
  };

  const verifyCouponCode = async () => {
    if (!couponInput.trim() || !user?.email) {
      if (!user?.email) setAuthModalOpen(true);
      return;
    }
    setVerifyingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupon/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim(), email: user.email })
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon(couponInput.trim());
        setCouponDiscount(data.discount_percent);
      } else {
        setCouponError(data.error);
        setAppliedCoupon(null);
        setCouponDiscount(null);
      }
    } catch {
      setCouponError(t.pricing.couponInvalid);
    } finally {
      setVerifyingCoupon(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCheckoutModal) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          planId: showCheckoutModal.id,
          discountType,
          couponCode: appliedCoupon || undefined,
          couponDiscount: couponDiscount || undefined
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || (isEn ? "Failed to create checkout." : isVi ? "Không thể tạo phiên thanh toán." : "チェックアウトの作成に失敗しました。"));
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(isEn ? "Failed to acquire checkout URL." : isVi ? "Không thể lấy URL thanh toán." : "チェックアウトURLの取得に失敗しました。");
      }
    } catch (err) {
      console.error(err);
      alert(isEn ? "A communication error occurred." : isVi ? "Đã xảy ra lỗi kết nối." : "通信中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  const handlePackCheckoutClick = (pack: PackDetails) => {
    if (!isLoggedIn) {
      setAuthModalOpen(true);
      return;
    }
    if (user?.role === "free" || user?.role === "trial") {
      alert(t.pricing.packWarning);
      return;
    }
    setShowPackCheckoutModal(pack);
  };

  const handlePackSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPackCheckoutModal) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          packId: showPackCheckoutModal.id
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || (isEn ? "Failed to create checkout." : isVi ? "Không thể tạo phiên thanh toán." : "チェックアウトの作成に失敗しました。"));
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(isEn ? "Failed to acquire checkout URL." : isVi ? "Không thể lấy URL thanh toán." : "チェックアウトURLの取得に失敗しました。");
      }
    } catch (err) {
      console.error(err);
      alert(isEn ? "A communication error occurred." : isVi ? "Đã xảy ra lỗi kết nối." : "通信中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };


  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": t.pricing.breadcrumbsHome,
        "item": `https://kigyoulist.com/${locale}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": t.pricing.breadcrumbsPricing,
        "item": `https://kigyoulist.com/${locale}/pricing`
      }
    ]
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8 relative">
        {/* Visual Breadcrumbs */}
        <nav className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
          <LocaleLink href="/" className="hover:text-primary transition-colors">{t.pricing.breadcrumbsHome}</LocaleLink>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200" aria-current="page">{t.pricing.breadcrumbsPricing}</span>
        </nav>

        {/* Main Title Section */}
        <section className="text-center max-w-4xl mx-auto flex flex-col gap-3">
          <span className="text-[11px] font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 px-3 py-1 rounded-full w-fit mx-auto">
            {t.pricing.tagline}
          </span>
          <h1 className="text-[clamp(18px,4vw,36px)] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            <span className="block whitespace-nowrap">
              {t.pricing.title1}
              <span className="text-[#1B4F8A] dark:text-blue-400 px-1 font-extrabold">
                {t.pricing.title2}
              </span>
              {t.pricing.title3}
            </span>
            <span className="block whitespace-nowrap mt-1.5 sm:mt-2">
              {t.pricing.title4}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
            {t.pricing.desc}
          </p>
        </section>

        {/* Service Type Switcher Tabs */}
        <section className="max-w-xl mx-auto w-full">
          <div className="p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl flex items-center gap-1 border border-slate-300/60 dark:border-slate-700/60 shadow-inner">
            <div className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-center bg-white dark:bg-[#1C2128] text-slate-900 dark:text-white shadow-xs flex items-center justify-center gap-2">
              <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{isEn ? "Corporate Data & CSV" : isVi ? "Dữ liệu & Xuất CSV" : "企業データ・CSV抽出"}</span>
            </div>
            <LocaleLink
              href="/form-marketing#pricing"
              className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-2 hover:bg-white/50 dark:hover:bg-slate-750"
            >
              <Send className="w-4 h-4 text-indigo-500" />
              <span>{isEn ? "Form Outreach" : isVi ? "Gửi Form Tiếp Cận" : "フォーム営業 (配信)"}</span>
              <span className="text-[9px] px-1 py-0.2 rounded font-extrabold bg-indigo-600 text-white">NEW</span>
            </LocaleLink>
          </div>
        </section>

        {/* Month-End Countdown urgence timer */}
        <section className="max-w-4xl mx-auto w-full">
          <CountdownTimer />
        </section>

        {/* Form Outreach Service SaaS Callout in Pricing */}
        <section className="max-w-5xl mx-auto w-full">
          <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-indigo-900/60">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-black uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isEn ? "SELF-SERVE OUTBOUND SAAS" : isVi ? "NỀN TẢNG TIẾP CẬN TỰ ĐỘNG" : "セルフサービス型 フォーム営業"}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mb-2">
                {isEn ? "Automated Contact Form Outreach SaaS" : isVi ? "Tự Động Gửi Form Marketing Trực Tuyến" : "問い合わせフォーム営業配信プラットフォーム"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-350 leading-relaxed max-w-2xl">
                {isEn
                  ? "Looking to pitch decision-makers directly? Filter hyper-targeted prospects from our 5M+ database and dispatch your pitch directly to verified corporate contact forms starting at 20 JPY/form."
                  : isVi
                  ? "Muốn chào hàng trực tiếp đến ban lãnh đạo công ty? Lọc tệp khách hàng từ 5 triệu doanh nghiệp và tự động gửi thông điệp chào hàng vào Form liên hệ ngay trên hệ thống (chỉ từ 20 JPY/form)."
                  : "自社でリストを精査し、手動でフォーム送信する工数はもう不要。500万社DBからターゲットを抽出し、管理画面から自社の営業文面を即時オンライン配信（1件20円〜）。"}
              </p>
            </div>
            <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
              <LocaleLink
                href="/form-marketing#pricing"
                className="px-6 py-3 rounded-xl font-bold text-xs text-slate-900 bg-white hover:bg-slate-100 shadow-md transition-all active:scale-[0.98] flex items-center gap-2"
              >
                <span>{isEn ? "View Form Outreach Plans" : isVi ? "Xem Bảng Giá Gửi Form" : "フォーム営業プランを見る"}</span>
                <ArrowRight className="w-4 h-4 text-indigo-600" />
              </LocaleLink>
            </div>
          </div>
        </section>

        <section className="flex flex-col items-center gap-4">
          <div className="p-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 px-4 py-2 shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{t.pricing.campaignApplied}</span>
          </div>
          
          {appliedCoupon ? (
            <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-300 max-w-md text-center leading-relaxed font-bold">
              🎉 <strong>{t.pricing.couponAppliedTitle}</strong> {t.pricing.couponAppliedDesc}
            </p>
          ) : (
            <p className="text-xs text-slate-500 text-center max-w-md leading-relaxed">
              {t.pricing.campaignNotice}
            </p>
          )}

          {/* Coupon Input Area */}
          <div className="mt-3 flex flex-col items-center w-full max-w-xs relative z-10">
            <div className="flex w-full relative shadow-xs">
              <input 
                type="text" 
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value);
                  if (appliedCoupon && e.target.value !== appliedCoupon) {
                    setAppliedCoupon(null);
                    setCouponDiscount(null);
                  }
                }}
                placeholder={t.pricing.couponPlaceholder}
                className="w-full text-xs px-3.5 py-2.5 rounded-l-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161B22] text-slate-800 dark:text-slate-200 outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A]"
              />
              <button
                onClick={verifyCouponCode}
                disabled={verifyingCoupon || !couponInput.trim() || couponInput === appliedCoupon}
                className="px-4 py-2.5 bg-[#1B4F8A] hover:bg-[#153e6d] text-white text-xs font-bold rounded-r-xl transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                {verifyingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t.pricing.couponApplyBtn}
              </button>
            </div>
            {couponError && <p className="text-[11px] text-rose-500 mt-2 font-medium">{couponError}</p>}
            {appliedCoupon && couponDiscount && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> {t.pricing.couponSuccess.replace("{discount}", String(couponDiscount))}
              </p>
            )}
          </div>
        </section>

        {/* Pricing Cards Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch max-w-7xl mx-auto w-full relative z-10">
          {plans.map((plan) => {
            const listPrice = plan.listPrice;
            let savingsPercent = 30;
            let currentPrice = plan.campaignPrice;
            
            if (appliedCoupon && couponDiscount) {
              savingsPercent = couponDiscount;
              currentPrice = Math.floor(listPrice * (1 - couponDiscount / 100));
            }
            
            return (
              <div 
                key={plan.id}
                className={`rounded-2xl border flex flex-col justify-between transition-all duration-200 relative ${
                  plan.recommended
                    ? "bg-white border-2 border-[#1B4F8A] shadow-md dark:bg-[#161B22] dark:border-blue-500 z-10"
                    : "bg-white border border-slate-200/80 hover:border-slate-300 dark:bg-[#161B22] dark:border-slate-800 dark:hover:border-slate-700 shadow-xs"
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-[#1B4F8A] text-[10px] font-bold text-white uppercase tracking-wider shadow-xs flex items-center gap-1.5 border border-white/20">
                    <Star className="w-2.5 h-2.5 fill-white" />
                    {t.pricing.bestValue}
                  </div>
                )}

                {/* Plan Header */}
                <div className="p-6 sm:p-7 flex flex-col border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {plan.name}
                  </span>
                  <div className="mt-3 flex items-baseline gap-2 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-mono font-bold text-slate-900 dark:text-white tracking-tight">
                      {plan.id === "free" ? (isEn ? "Free" : isVi ? "Miễn phí" : "無料") : `¥${currentPrice.toLocaleString()}`}
                    </span>
                    {plan.id !== "free" && <span className="text-xs text-slate-500 font-medium">/ {t.pricing.month}</span>}
                  </div>

                  {plan.id !== "free" ? (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="line-through text-slate-400 font-mono">
                        ¥{listPrice.toLocaleString()}
                      </span>
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400 text-[10px]">
                        {savingsPercent}% OFF
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-emerald-700 dark:text-emerald-400 font-bold text-[10px] bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/50 px-2 py-0.5 rounded w-fit">
                      {t.pricing.initialCost}
                    </div>
                  )}

                  <p className="mt-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed min-h-[40px]">
                    {plan.description}
                  </p>

                  <div className="mt-5 p-3 bg-slate-50 dark:bg-[#0D1117] rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{t.pricing.exportQuota}</span>
                    <strong className="text-xs font-mono font-bold text-[#1B4F8A] dark:text-blue-400 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5" />
                      {plan.quota}
                    </strong>
                  </div>
                </div>

                {/* Plan Features */}
                <div className="p-6 sm:p-7 flex-grow flex flex-col gap-4">
                  <h5 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    {t.pricing.featuresTitle}
                  </h5>
                  <ul className="flex flex-col gap-3">
                    {plan.features.map((feature, idx) => {
                      const isComingSoon = feature.includes("(開発中)") || feature.includes("（開発中）") || feature.includes("(In Dev)");
                      const cleanFeature = feature.replace(/\s*[\(（](開発中|In Dev)[\)）]/, "");
                      return (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                          {isComingSoon ? (
                            <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          ) : (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          )}
                          <span className={`leading-relaxed flex flex-wrap items-center gap-1.5 ${isComingSoon ? "text-slate-400 dark:text-slate-500" : ""}`}>
                            {cleanFeature}
                            {isComingSoon && (
                              <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                {t.pricing.comingSoon}
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Action CTA */}
                <div className="p-6 sm:p-7 pt-0 mt-auto">
                  <button
                    onClick={() => handleCheckoutClick(plan)}
                    disabled={plan.id === "free" && isLoggedIn}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                      plan.id === "free" && isLoggedIn
                        ? "bg-slate-50 text-slate-400 border border-slate-200 dark:bg-slate-900/10 dark:border-slate-800 dark:text-slate-500 cursor-default shadow-none"
                        : plan.recommended
                        ? "bg-[#1B4F8A] hover:bg-[#153e6d] text-white shadow-sm shadow-[#1B4F8A]/20 cursor-pointer active:scale-[0.99]"
                        : plan.id === "pro"
                        ? "bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 shadow-xs cursor-pointer active:scale-[0.99]"
                        : "border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-[#161B22] dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs cursor-pointer active:scale-[0.99]"
                    }`}
                  >
                    <span>
                      {plan.id === "free" 
                        ? (isLoggedIn ? t.pricing.applyBtnFreeLoggedIn : t.pricing.applyBtnFreeNotLoggedIn) 
                        : t.pricing.applyBtnPaid}
                    </span>
                    {!(plan.id === "free" && isLoggedIn) && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-[10px] text-slate-400 text-center block mt-2">
                    {plan.id === "free" 
                      ? t.pricing.noticeFree
                      : t.pricing.noticePaid}
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        {/* Additional Quota Packs (One-time Purchase) */}
        <section className="flex flex-col gap-6 max-w-7xl mx-auto w-full relative">
          <div className="text-center flex flex-col gap-2 max-w-2xl mx-auto">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-1 rounded-full w-fit mx-auto border border-emerald-200/60 dark:border-emerald-900/40">
              {t.pricing.packTag}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t.pricing.packTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.pricing.packDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch w-full mt-4">
            {packs.map((pack) => (
              <div 
                key={pack.id}
                className={`rounded-2xl border p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 relative ${
                  pack.recommended
                    ? "bg-white border-2 border-emerald-600 shadow-sm dark:bg-[#161B22] dark:border-emerald-500 z-10"
                    : "bg-white border border-slate-200/80 hover:border-slate-300 dark:bg-[#161B22] dark:border-slate-800 dark:hover:border-slate-700 shadow-xs"
                }`}
              >
                {pack.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-emerald-700 text-[9px] font-bold text-white uppercase tracking-wider shadow-xs flex items-center gap-1 border border-white/20">
                    <Coins className="w-2.5 h-2.5 fill-white" />
                    {t.pricing.packBestValue}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {pack.name}
                    </span>
                    {pack.recommended && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-900/40">
                        {t.pricing.packRecommend}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-mono font-bold text-slate-900 dark:text-white tracking-tight">
                      ¥{pack.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ {t.pricing.packPricingSuffix}</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed min-h-[36px]">
                    {pack.description}
                  </p>

                  <div className="p-3 bg-slate-50 dark:bg-[#0D1117] rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between mt-2">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{t.pricing.exportQuota}</span>
                    <strong className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5" />
                      +{pack.allowance.toLocaleString()} 行
                    </strong>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => handlePackCheckoutClick(pack)}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99] ${
                      pack.recommended
                        ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm shadow-emerald-700/20"
                        : "border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-[#161B22] dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs"
                    }`}
                  >
                    <span>{t.pricing.packBuyBtn}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Guidelines / Notices */}
          <div className="bg-slate-50 border border-slate-200/80 dark:bg-[#12161E] dark:border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col gap-2 text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-7xl mx-auto w-full">
            <h5 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-1 text-xs">
              <Info className="w-4 h-4 text-emerald-600 shrink-0" />
              {t.pricing.packNoticeTitle}
            </h5>
            <ul className="list-disc list-inside flex flex-col gap-1.5 text-xs leading-relaxed pl-1">
              <li>{t.pricing.packNoticeItem1}</li>
              <li>{t.pricing.packNoticeItem2}</li>
              <li>{t.pricing.packNoticeItem3}</li>
            </ul>
          </div>
        </section>

        {/* Competitors Price Comparison Table */}
        <section className="bg-white border border-slate-200/80 dark:bg-[#161B22] dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-xs max-w-7xl mx-auto w-full flex flex-col gap-6 relative">
          <div className="text-center md:text-left relative flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider">{t.pricing.comparisonTag}</span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t.pricing.comparisonTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              {t.pricing.comparisonDesc}
            </p>
          </div>

          <div className="overflow-x-auto relative">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 rounded-l-xl">{t.pricing.compHeaderItem}</th>
                  <th className="py-3.5 px-4">{t.pricing.compHeaderOtherM}</th>
                  <th className="py-3.5 px-4">{t.pricing.compHeaderOtherB}</th>
                  <th className="py-3.5 px-5 bg-blue-100/70 dark:bg-blue-950/60 text-[#1B4F8A] dark:text-blue-300 font-bold border-l border-r border-t border-blue-200/80 dark:border-blue-900/60 rounded-t-xl">{t.pricing.compHeaderOurPro}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300 font-normal">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-[#12161E]">
                  <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">{t.pricing.compRowPrice}</td>
                  <td className="py-4 px-4 font-mono">¥30,000 〜 ¥100,000</td>
                  <td className="py-4 px-4 font-mono">¥9,800 〜 ¥29,800</td>
                  <td className="py-4 px-5 bg-blue-50/60 dark:bg-blue-950/20 font-mono font-bold text-rose-600 dark:text-rose-400 border-l border-r border-blue-200/60 dark:border-blue-900/40">
                    {t.pricing.compRowPriceCampaign}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-[#12161E]">
                  <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">{t.pricing.compRowPriceUnit}</td>
                  <td className="py-4 px-4 font-mono">¥20 〜 ¥60</td>
                  <td className="py-4 px-4 font-mono">¥30 〜 ¥100</td>
                  <td className="py-4 px-5 bg-blue-50/60 dark:bg-blue-950/20 font-mono font-bold text-slate-900 dark:text-white border-l border-r border-blue-200/60 dark:border-blue-900/40">
                    {t.pricing.compRowPriceUnitValue}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-[#12161E]">
                  <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">{t.pricing.compRowInitial}</td>
                  <td className="py-4 px-4 font-mono">¥100,000 ({isEn ? "On Contract" : isVi ? "Khi ký hợp đồng" : "契約時のみ"})</td>
                  <td className="py-4 px-4 font-mono">¥0</td>
                  <td className="py-4 px-5 bg-blue-50/60 dark:bg-blue-950/20 font-bold text-emerald-700 dark:text-emerald-400 border-l border-r border-blue-200/60 dark:border-blue-900/40">
                    {t.pricing.compRowInitialValue}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-[#12161E]">
                  <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">{t.pricing.compRowFeatures}</td>
                  <td className="py-4 px-4">{isEn ? "Expensive" : isVi ? "Tính năng cao nhưng duy trì đắt" : "高機能だが維持費が高価"}</td>
                  <td className="py-4 px-4">{isEn ? "Free but limited" : isVi ? "Có gói miễn phí nhưng giới hạn" : "無料枠があるが件数制限"}</td>
                  <td className="py-4 px-5 bg-blue-50/60 dark:bg-blue-950/20 font-semibold text-slate-900 dark:text-white border-l border-r border-b border-blue-200/60 dark:border-blue-900/40 rounded-b-xl">
                    {t.pricing.compRowFeaturesValue}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-600 dark:text-slate-400 dark:bg-[#12161E] dark:border-slate-800">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              {t.pricing.compNotice}
            </span>
          </div>
        </section>

        {/* FAQs */}
        <section className="max-w-7xl mx-auto w-full flex flex-col gap-6">
          <div className="text-center">
            <HelpCircle className="w-7 h-7 text-[#1B4F8A] dark:text-blue-400 mx-auto mb-2" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.pricing.faqTitle}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="p-5 bg-white border border-slate-200/80 hover:border-slate-300 dark:bg-[#161B22] dark:border-slate-800 dark:hover:border-slate-700 rounded-2xl flex flex-col gap-2.5 shadow-xs transition-colors">
              <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-lg bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono mt-0.5">Q</span>
                <span>{t.pricing.faqQ1}</span>
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7.5">
                {t.pricing.faqA1}
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200/80 hover:border-slate-300 dark:bg-[#161B22] dark:border-slate-800 dark:hover:border-slate-700 rounded-2xl flex flex-col gap-2.5 shadow-xs transition-colors">
              <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-lg bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono mt-0.5">Q</span>
                <span>{t.pricing.faqQ2}</span>
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7.5">
                {t.pricing.faqA2}
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200/80 hover:border-slate-300 dark:bg-[#161B22] dark:border-slate-800 dark:hover:border-slate-700 rounded-2xl flex flex-col gap-2.5 shadow-xs transition-colors">
              <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-lg bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono mt-0.5">Q</span>
                <span>{t.pricing.faqQ3}</span>
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7.5">
                {t.pricing.faqA3}
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200/80 hover:border-slate-300 dark:bg-[#161B22] dark:border-slate-800 dark:hover:border-slate-700 rounded-2xl flex flex-col gap-2.5 shadow-xs transition-colors">
              <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-lg bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono mt-0.5">Q</span>
                <span>{t.pricing.faqQ4}</span>
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7.5">
                {t.pricing.faqA4}
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200/80 hover:border-slate-300 dark:bg-[#161B22] dark:border-slate-800 dark:hover:border-slate-700 rounded-2xl flex flex-col gap-2.5 shadow-xs transition-colors">
              <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-lg bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono mt-0.5">Q</span>
                <span>{t.pricing.faqQ5}</span>
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7.5">
                {t.pricing.faqA5}
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200/80 hover:border-slate-300 dark:bg-[#161B22] dark:border-slate-800 dark:hover:border-slate-700 rounded-2xl flex flex-col gap-2.5 shadow-xs transition-colors">
              <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-lg bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono mt-0.5">Q</span>
                <span>{t.pricing.faqQ6}</span>
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7.5">
                {t.pricing.faqA6}
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200/80 hover:border-slate-300 dark:bg-[#161B22] dark:border-slate-800 dark:hover:border-slate-700 rounded-2xl flex flex-col gap-2.5 shadow-xs transition-colors">
              <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-lg bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono mt-0.5">Q</span>
                <span>{t.pricing.faqQ7}</span>
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7.5">
                {t.pricing.faqA7}
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200/80 hover:border-slate-300 dark:bg-[#161B22] dark:border-slate-800 dark:hover:border-slate-700 rounded-2xl flex flex-col gap-2.5 shadow-xs transition-colors">
              <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-lg bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono mt-0.5">Q</span>
                <span>{t.pricing.faqQ8}</span>
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7.5">
                {t.pricing.faqA8}
              </p>
            </div>
          </div>
        </section>

        {/* Bottom High-Converting CTA Banner */}
        <section className="max-w-7xl mx-auto w-full mt-4">
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 sm:p-12 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="space-y-3 max-w-xl">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full w-fit mx-auto md:mx-0 block">
                {isEn ? "START NOW FOR FREE" : isVi ? "BẮT ĐẦU HOÀN TOÀN MIỄN PHÍ" : "まずは無料プランからスタート"}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                {isEn 
                  ? "Supercharge your B2B sales outreach today."
                  : isVi 
                  ? "Nâng tầm hiệu suất bán hàng B2B của bạn ngay hôm nay."
                  : "鮮度の高い法人データで、営業アプローチを加速しましょう。"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {isEn 
                  ? "Register in 10 seconds. Enjoy 20 daily free CSV downloads without entering credit card details."
                  : isVi 
                  ? "Đăng ký chỉ mất 10 giây. Trải nghiệm 20 lượt tải CSV miễn phí mỗi ngày không cần thẻ tín dụng."
                  : "クレジットカード不要、10秒で無料登録。毎日20件の無料ダウンロード枠で今すぐお試しいただけます。"}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <LocaleLink
                href="/auth/register"
                className="w-full sm:w-auto px-6 py-3.5 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <span>{isEn ? "Create Free Account (10s)" : isVi ? "Đăng ký miễn phí (10 giây)" : "無料会員登録 (10秒)"}</span>
                <ArrowRight className="w-4 h-4" />
              </LocaleLink>
              <LocaleLink
                href="/contact"
                className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isEn ? "Contact Sales" : isVi ? "Liên hệ tư vấn" : "お問い合わせ・ご相談"}</span>
              </LocaleLink>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Checkout Simulator Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowCheckoutModal(null)}
          />
          
          <div className="relative w-full max-w-sm bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-2xl z-10 flex flex-col gap-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-11 h-11 bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/40 dark:text-blue-300 rounded-xl flex items-center justify-center mx-auto border border-blue-100 dark:border-blue-900/40">
              <CreditCard className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                {t.pricing.checkoutModalTitle}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isEn ? "Please confirm your subscription details to proceed." : isVi ? "Vui lòng xác nhận chi tiết đăng ký để tiếp tục." : "お選びいただいたプランの内容をご確認の上、登録を完了してください。"}
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="flex flex-col gap-3 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {isEn ? "Selected Package" : isVi ? "Gói đã chọn" : "選択したパッケージ"}
                </label>
                <div className="p-3 bg-slate-50 dark:bg-[#0D1117] rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-800 dark:text-slate-200">{showCheckoutModal.name}</span>
                    <span className="text-rose-600 font-mono">
                      {showCheckoutModal.listPrice > 0 ? (
                        <span className="flex items-center gap-1.5 flex-wrap justify-end">
                          <span className="line-through text-slate-400 font-normal">
                            ¥{showCheckoutModal.listPrice.toLocaleString()}
                          </span>
                          <span className="bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0">
                            {appliedCoupon && couponDiscount ? couponDiscount : 30}% OFF
                          </span>
                          <span className="font-bold text-rose-600">
                            = ¥{(appliedCoupon && couponDiscount ? Math.floor(showCheckoutModal.listPrice * (1 - couponDiscount / 100)) : showCheckoutModal.campaignPrice).toLocaleString()} / {isEn ? "mo" : isVi ? "tháng" : "月"}
                          </span>
                        </span>
                      ) : (
                        <span>¥0 / {isEn ? "mo" : isVi ? "tháng" : "月"}</span>
                      )}
                    </span>
                  </div>
                  {appliedCoupon && (
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex justify-between items-center border-t border-slate-200/60 dark:border-slate-800 pt-1.5">
                      <span>{isEn ? `Coupon active: ${appliedCoupon}` : isVi ? `Đã áp dụng mã: ${appliedCoupon}` : `適用中のクーポン: ${appliedCoupon}`}</span>
                      <span className="font-mono">-{couponDiscount}% OFF</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {t.pricing.couponPlaceholder.replace("（お持ちの場合）", "").replace(" (if you have one)", "")}
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  disabled={isLoggedIn && !!user?.email}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-slate-200/80 focus:outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A] dark:bg-[#0D1117] dark:border-slate-700 dark:text-white"
                />
              </div>

              <div className="flex items-start gap-2 mt-1 mb-2 bg-slate-50 dark:bg-[#0D1117] p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="agree-subscribe-terms"
                  required
                  className="rounded border-slate-300 text-[#1B4F8A] focus:ring-[#1B4F8A] h-3.5 w-3.5 mt-0.5 cursor-pointer"
                />
                <label htmlFor="agree-subscribe-terms" className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal cursor-pointer selection:bg-transparent">
                  {isEn ? (
                    <>
                      I agree to the <a href={`/${locale}/terms`} target="_blank" rel="noopener noreferrer" className="text-[#1B4F8A] dark:text-blue-400 hover:underline font-bold">Terms of Service</a> and <a href={`/${locale}/tokushoho`} target="_blank" rel="noopener noreferrer" className="text-[#1B4F8A] dark:text-blue-400 hover:underline font-bold">Act on Specified Commercial Transactions</a>.
                    </>
                  ) : isVi ? (
                    <>
                      Tôi đồng ý với <a href={`/${locale}/terms`} target="_blank" rel="noopener noreferrer" className="text-[#1B4F8A] dark:text-blue-400 hover:underline font-bold">Điều khoản dịch vụ</a> và <a href={`/${locale}/tokushoho`} target="_blank" rel="noopener noreferrer" className="text-[#1B4F8A] dark:text-blue-400 hover:underline font-bold">Luật giao dịch thương mại đặc định</a>.
                    </>
                  ) : (
                    <>
                      <a href={`/${locale}/terms`} target="_blank" rel="noopener noreferrer" className="text-[#1B4F8A] dark:text-blue-400 hover:underline font-bold">利用規約</a>および<a href={`/${locale}/tokushoho`} target="_blank" rel="noopener noreferrer" className="text-[#1B4F8A] dark:text-blue-400 hover:underline font-bold">特定商取引法に基づく表記</a>に同意します。
                    </>
                  )}
                </label>
              </div>

              <div className="mt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#153e6d] rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {t.pricing.checkoutModalConfirm}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(null)}
                  className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {isEn ? "Back" : isVi ? "Quay lại" : "戻る"}
                </button>
              </div>
            </form>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 bg-slate-50 dark:bg-[#0D1117] py-2 rounded-xl border border-slate-200/50 dark:border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{isEn ? "Try free membership first." : isVi ? "Bạn có thể đăng ký thử gói miễn phí trước." : "現在ご登録は無料でお試しいただけます。"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Pack Checkout Simulator Modal */}
      {showPackCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowPackCheckoutModal(null)}
          />
          
          <div className="relative w-full max-w-sm bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-2xl z-10 flex flex-col gap-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-11 h-11 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-900/40">
              <CreditCard className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                {isEn ? "Add Quota Package" : isVi ? "Mua thêm gói dung lượng" : "容量の追加購入を完了する"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isEn ? "Verify your add-on selections and complete your checkout." : isVi ? "Vui lòng xác nhận gói bổ sung đã chọn và hoàn tất thanh toán." : "お選びいただいた追加パッケージの内容をご確認の上、購入を完了してください。"}
              </p>
            </div>

            <form onSubmit={handlePackSubscribe} className="flex flex-col gap-3 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {isEn ? "Selected Package" : isVi ? "Gói bổ sung đã chọn" : "選択したパッケージ"}
                </label>
                <div className="p-3 bg-slate-50 dark:bg-[#0D1117] rounded-xl border border-slate-200/80 dark:border-slate-800 flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800 dark:text-slate-200">{showPackCheckoutModal.name}</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                    ¥{showPackCheckoutModal.price.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {t.pricing.couponPlaceholder.replace("（お持ちの場合）", "").replace(" (if you have one)", "")}
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  disabled={isLoggedIn && !!user?.email}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-slate-200/80 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 dark:bg-[#0D1117] dark:border-slate-700 dark:text-white"
                />
              </div>

              <div className="flex items-start gap-2 mt-1 mb-2 bg-slate-50 dark:bg-[#0D1117] p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="agree-pack-terms"
                  required
                  className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 h-3.5 w-3.5 mt-0.5 cursor-pointer"
                />
                <label htmlFor="agree-pack-terms" className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal cursor-pointer selection:bg-transparent">
                  {isEn ? (
                    <>
                      I agree to the <a href={`/${locale}/terms`} target="_blank" rel="noopener noreferrer" className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold">Terms of Service</a> and <a href={`/${locale}/tokushoho`} target="_blank" rel="noopener noreferrer" className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold">Act on Specified Commercial Transactions</a>.
                    </>
                  ) : isVi ? (
                    <>
                      Tôi đồng ý với <a href={`/${locale}/terms`} target="_blank" rel="noopener noreferrer" className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold">Điều khoản dịch vụ</a> và <a href={`/${locale}/tokushoho`} target="_blank" rel="noopener noreferrer" className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold">Luật giao dịch thương mại đặc định</a>.
                    </>
                  ) : (
                    <>
                      <a href={`/${locale}/terms`} target="_blank" rel="noopener noreferrer" className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold">利用規約</a>および<a href={`/${locale}/tokushoho`} target="_blank" rel="noopener noreferrer" className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold">特定商取引法に基づく表記</a>に同意します。
                    </>
                  )}
                </label>
              </div>

              <div className="mt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {isEn ? "Complete Purchase" : isVi ? "Hoàn tất mua hàng" : "購入手続きを完了する"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPackCheckoutModal(null)}
                  className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {isEn ? "Back" : isVi ? "Quay lại" : "戻る"}
                </button>
              </div>
            </form>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 bg-slate-50 dark:bg-[#0D1117] py-2 rounded-xl border border-slate-200/50 dark:border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{isEn ? "Secure checkout encrypted via Stripe." : isVi ? "Thanh toán an toàn được mã hóa qua Stripe." : "Stripe社による暗号化された安全な決済処理が施されます"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
