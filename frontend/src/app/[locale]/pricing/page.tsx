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
  HelpCircle, Coins, ArrowRight, Loader2, Star, Clock, ChevronRight
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
  
  const [mounted, setMounted] = useState(false);
  const discountType = "campaign";
  const [showCheckoutModal, setShowCheckoutModal] = useState<PlanDetails | null>(null);
  const [showPackCheckoutModal, setShowPackCheckoutModal] = useState<PackDetails | null>(null);

  const packs: PackDetails[] = [
    {
      id: "10k",
      name: isEn ? "10,000 Row Add-on Pack" : "10,000 行追加パック",
      price: 14800,
      allowance: 10000,
      description: isEn ? "For users who need incremental quota" : "必要な分だけ少しずつ追加したい方向け",
      recommended: false
    },
    {
      id: "50k",
      name: isEn ? "50,000 Row Add-on Pack" : "50,000 行追加パック",
      price: 49800,
      allowance: 50000,
      description: isEn ? "Save approx 32%. Most popular tier." : "1回あたり約32%お得な一番人気のボリューム枠",
      recommended: true
    },
    {
      id: "100k",
      name: isEn ? "100,000 Row Add-on Pack" : "100,000 行追加パック",
      price: 79800,
      allowance: 100000,
      description: isEn ? "Best price rate, ideal for large exports" : "大量リストの抽出に最適な最安値レート",
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
    setMounted(true);
    if (isLoggedIn && user?.email) {
      setEmailInput(user.email);
    }
  }, [isLoggedIn, user?.email]);

  const plans: PlanDetails[] = [
    {
      id: "free",
      name: isEn ? "FREE Plan" : "FREEプラン",
      listPrice: 0,
      campaignPrice: 0,
      referralPrice: 0,
      quota: isEn ? "20 items / day" : "20 件 / 日",
      quotaNum: 20,
      description: isEn ? "Perfect for testing usability" : "まずは使い勝手を試してみたい方に最適",
      features: isEn ? [
        "20 CSV exports per day",
        "View FAX & key shareholders (after login)",
        "View intent signals (after login)"
      ] : [
        "毎日 20 件の CSV ダウンロード枠",
        "FAX番号 & 主要株主情報の閲覧 (ログイン後)",
        "詳細シグナル閲覧 (ログイン後)"
      ]
    },
    {
      id: "pro",
      name: isEn ? "PRO Plan" : "PROプラン",
      listPrice: 4200,
      campaignPrice: 2900,
      referralPrice: 2100,
      quota: isEn ? "2,000 rows / month" : "2,000 行 / 月",
      quotaNum: 2000,
      description: isEn ? "Ideal for sole proprietors & salespeople running outreach" : "テレアポ・DM営業を始めたい個人事業主や営業マンに最適",
      features: isEn ? [
        "2,000 CSV downloads per month",
        "Email address disclosure",
        "ABM Kanban CRM board",
        "Filter by email/phone availability"
      ] : [
        "毎月 2,000 件の CSV ダウンロード枠",
        "メールアドレスの開示",
        "ABM かんばん営業管理 CRM ボード",
        "連絡先情報（電話・メール）の有無での絞り込み"
      ]
    },
    {
      id: "business",
      name: isEn ? "BUSINESS Plan" : "BUSINESSプラン",
      listPrice: 14000,
      campaignPrice: 9800,
      referralPrice: 7000,
      quota: isEn ? "10,000 rows / month" : "10,000 行 / 月",
      quotaNum: 10000,
      description: isEn ? "Standard team plan with background exports via Mechanism B" : "Mechanism B による大量エクスポートを可能にする標準チーム枠",
      features: isEn ? [
        "10,000 CSV downloads per month",
        "Mechanism B background bulk downloads",
        "Supports bulk downloads over 10,000 items",
        "API integration (Key issuance & syncing)",
        "Priority customer support"
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
      name: isEn ? "ENTERPRISE Plan" : "ENTERPRISEプラン",
      listPrice: 42000,
      campaignPrice: 29000,
      referralPrice: 21000,
      quota: isEn ? "40,000 rows / month" : "40,000 行 / 月",
      quotaNum: 40000,
      description: isEn ? "Premium organizational plan with dedicated engineer support" : "専任サポートと月4万件のデータ抽出を可能にする最上位の組織向け枠",
      recommended: false,
      features: isEn ? [
        "40,000 CSV downloads per month",
        "API integration (Key issuance & syncing)",
        "Dedicated integration & engineer support",
        "Dedicated account manager"
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
        alert(errData.error || (isEn ? "Failed to create checkout." : "チェックアウトの作成に失敗しました。"));
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(isEn ? "Failed to acquire checkout URL." : "チェックアウトURLの取得に失敗しました。");
      }
    } catch (err) {
      console.error(err);
      alert(isEn ? "A communication error occurred." : "通信中にエラーが発生しました。");
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
        alert(errData.error || (isEn ? "Failed to create checkout." : "チェックアウトの作成に失敗しました。"));
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(isEn ? "Failed to acquire checkout URL." : "チェックアウトURLの取得に失敗しました。");
      }
    } catch (err) {
      console.error(err);
      alert(isEn ? "A communication error occurred." : "通信中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
        <Footer />
      </div>
    );
  }

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

        <div className="absolute top-0 right-1/4 -translate-y-1/2 w-80 h-80 bg-primary/3 rounded-full blur-3xl pointer-events-none" />
        
        {/* Main Title Section */}
        <section className="text-center max-w-4xl mx-auto flex flex-col gap-4">
          <span className="text-[10px] font-black text-primary dark:text-secondary uppercase tracking-widest bg-primary/10 dark:bg-secondary/10 px-3 py-1 rounded-full w-fit mx-auto">
            {t.pricing.tagline}
          </span>
          <h1 className="text-[clamp(16px,4.3vw,40px)] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            <span className="block whitespace-nowrap">
              {t.pricing.title1}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent px-1">
                {t.pricing.title2}
              </span>
              {t.pricing.title3}
            </span>
            <span className="block whitespace-nowrap mt-1.5 sm:mt-2.5">
              {t.pricing.title4}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
            {t.pricing.desc}
          </p>
        </section>

        {/* Month-End Countdown urgence timer */}
        <section className="max-w-4xl mx-auto w-full">
          <CountdownTimer />
        </section>

        <section className="flex flex-col items-center gap-4">
          <div className="p-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl flex items-center gap-1.5 shadow-inner relative z-10 text-xs font-black text-slate-900 dark:text-white px-4 py-2.5">
            <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{t.pricing.campaignApplied}</span>
          </div>
          
          {appliedCoupon ? (
            <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-250/50 px-3.5 py-2 rounded-xl dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-300 max-w-md text-center leading-relaxed font-bold">
              🎉 <strong>{t.pricing.couponAppliedTitle}</strong> {t.pricing.couponAppliedDesc}
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 text-center max-w-md leading-relaxed">
              {t.pricing.campaignNotice}
            </p>
          )}

          {/* Coupon Input Area */}
          <div className="mt-4 flex flex-col items-center w-full max-w-xs relative z-10">
            <div className="flex w-full relative">
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
                className="w-full text-xs px-4 py-2.5 rounded-l-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1C2128] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={verifyCouponCode}
                disabled={verifyingCoupon || !couponInput.trim() || couponInput === appliedCoupon}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold rounded-r-xl transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {verifyingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t.pricing.couponApplyBtn}
              </button>
            </div>
            {couponError && <p className="text-[10px] text-rose-500 mt-2 font-bold">{couponError}</p>}
            {appliedCoupon && couponDiscount && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-450 mt-2 font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> {t.pricing.couponSuccess.replace("{discount}", String(couponDiscount))}
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
                className={`rounded-3xl border flex flex-col justify-between transition-all duration-300 relative ${
                  plan.recommended
                    ? "bg-white border-primary shadow-xl shadow-slate-200/60 dark:bg-[#1C2128] dark:border-secondary dark:shadow-none scale-100 md:scale-[1.03] z-10"
                    : "bg-white border-slate-200 hover:border-slate-300 dark:bg-[#151B22] dark:border-slate-800 dark:hover:border-slate-700 shadow-sm"
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-[9px] font-black text-white uppercase tracking-widest shadow-md flex items-center gap-1 border border-white/10">
                    <Star className="w-2.5 h-2.5 fill-white" />
                    {t.pricing.bestValue}
                  </div>
                )}

                {/* Plan Header */}
                <div className="p-6 sm:p-8 flex flex-col border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {plan.name}
                  </span>
                  <div className="mt-3 flex items-baseline gap-2 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      {plan.id === "free" ? (isEn ? "Free" : "無料") : `¥${currentPrice.toLocaleString()}`}
                    </span>
                    {plan.id !== "free" && <span className="text-xs text-slate-400 font-bold">/ {t.pricing.month}</span>}
                  </div>

                  {plan.id !== "free" ? (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="line-through text-slate-400 font-semibold">
                        ¥{listPrice.toLocaleString()}
                      </span>
                      <span className="font-extrabold text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-450 text-[10px]">
                        {savingsPercent}% OFF
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-450 font-extrabold text-[10px] bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 px-2 py-0.5 rounded w-fit">
                      {t.pricing.initialCost}
                    </div>
                  )}

                  <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed min-h-[40px]">
                    {plan.description}
                  </p>

                  <div className="mt-5 p-3.5 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{t.pricing.exportQuota}</span>
                    <strong className="text-xs font-black text-primary dark:text-secondary flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      {plan.quota}
                    </strong>
                  </div>
                </div>

                {/* Plan Features */}
                <div className="p-6 sm:p-8 flex-grow flex flex-col gap-4">
                  <h5 className="text-[10px] font-black text-slate-400 tracking-wider uppercase">
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
                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          )}
                          <span className={`leading-relaxed flex flex-wrap items-center gap-1.5 ${isComingSoon ? "text-slate-400 dark:text-slate-500" : ""}`}>
                            {cleanFeature}
                            {isComingSoon && (
                              <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-550 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
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
                <div className="p-6 sm:p-8 pt-0 mt-auto">
                  <button
                    onClick={() => handleCheckoutClick(plan)}
                    disabled={plan.id === "free" && isLoggedIn}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 ${
                      plan.id === "free" && isLoggedIn
                        ? "bg-slate-50 text-slate-400 border border-slate-200 dark:bg-slate-900/10 dark:border-slate-800 dark:text-slate-500 cursor-default shadow-none"
                        : plan.recommended
                        ? "bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white shadow-primary/10 cursor-pointer"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/80 dark:text-slate-200 cursor-pointer"
                    }`}
                  >
                    <span>
                      {plan.id === "free" 
                        ? (isLoggedIn ? t.pricing.applyBtnFreeLoggedIn : t.pricing.applyBtnFreeNotLoggedIn) 
                        : t.pricing.applyBtnPaid}
                    </span>
                    {!(plan.id === "free" && isLoggedIn) && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-[9px] text-slate-400 text-center block mt-2 opacity-80">
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
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-450 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-1 rounded-full w-fit mx-auto border border-emerald-100 dark:border-emerald-900/40">
              {t.pricing.packTag}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t.pricing.packTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-455 leading-relaxed">
              {t.pricing.packDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch w-full mt-4">
            {packs.map((pack) => (
              <div 
                key={pack.id}
                className={`rounded-3xl border p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative ${
                  pack.recommended
                    ? "bg-white border-emerald-500 shadow-xl shadow-slate-200/60 dark:bg-[#1C2128] dark:border-emerald-600 dark:shadow-none scale-100 md:scale-[1.02] z-10"
                    : "bg-white border-slate-200 hover:border-slate-300 dark:bg-[#151B22] dark:border-slate-800 dark:hover:border-slate-700 shadow-sm"
                }`}
              >
                {pack.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-[8px] font-black text-white uppercase tracking-widest shadow-md flex items-center gap-1 border border-white/10">
                    <Coins className="w-2.5 h-2.5 fill-white" />
                    {t.pricing.packBestValue}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {pack.name}
                    </span>
                    {pack.recommended && (
                      <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/40">
                        {t.pricing.packRecommend}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      ¥{pack.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">/ {t.pricing.packPricingSuffix}</span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed min-h-[36px]">
                    {pack.description}
                  </p>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center justify-between mt-2">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{t.pricing.exportQuota}</span>
                    <strong className="text-xs font-black text-emerald-600 dark:text-emerald-450 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      +{pack.allowance.toLocaleString()} 行
                    </strong>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => handlePackCheckoutClick(pack)}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer ${
                      pack.recommended
                        ? "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-500/10"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/80 dark:text-slate-200"
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
          <div className="bg-slate-50 border border-slate-200 dark:bg-slate-800/10 dark:border-slate-800 rounded-3xl p-5 md:p-6 flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-455 mt-2 max-w-7xl mx-auto w-full">
            <h5 className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1 text-[11px]">
              <Info className="w-4 h-4 text-emerald-500 shrink-0" />
              {t.pricing.packNoticeTitle}
            </h5>
            <ul className="list-disc list-inside flex flex-col gap-1.5 text-[11px] leading-relaxed pl-1">
              <li>{t.pricing.packNoticeItem1}</li>
              <li>{t.pricing.packNoticeItem2}</li>
              <li>{t.pricing.packNoticeItem3}</li>
            </ul>
          </div>
        </section>

        {/* Competitors Price Comparison Table */}
        <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm max-w-7xl mx-auto w-full flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-secondary/3 rounded-full blur-3xl pointer-events-none" />
          
          <div className="text-center md:text-left relative flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{t.pricing.comparisonTag}</span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {t.pricing.comparisonTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              {t.pricing.comparisonDesc}
            </p>
          </div>

          <div className="overflow-x-auto relative">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 rounded-l-xl">{t.pricing.compHeaderItem}</th>
                  <th className="py-3 px-4">{t.pricing.compHeaderOtherM}</th>
                  <th className="py-3 px-4">{t.pricing.compHeaderOtherB}</th>
                  <th className="py-3 px-4 bg-primary/5 dark:bg-secondary/5 text-primary dark:text-secondary font-black rounded-r-xl">{t.pricing.compHeaderOurPro}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-[#151B22]">
                  <td className="py-4 px-4 font-bold text-slate-850 dark:text-slate-200">{t.pricing.compRowPrice}</td>
                  <td className="py-4 px-4">¥30,000 〜 ¥100,000</td>
                  <td className="py-4 px-4">¥9,800 〜 ¥29,800</td>
                  <td className="py-4 px-4 bg-primary/3 dark:bg-secondary/3 font-black text-rose-500">
                    {t.pricing.compRowPriceCampaign}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-[#151B22]">
                  <td className="py-4 px-4 font-bold text-slate-850 dark:text-slate-200">{t.pricing.compRowPriceUnit}</td>
                  <td className="py-4 px-4">¥20 〜 ¥60</td>
                  <td className="py-4 px-4">¥30 〜 ¥100</td>
                  <td className="py-4 px-4 bg-primary/3 dark:bg-secondary/3 font-black text-slate-900 dark:text-white">
                    {t.pricing.compRowPriceUnitValue}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-[#151B22]">
                  <td className="py-4 px-4 font-bold text-slate-850 dark:text-slate-200">{t.pricing.compRowInitial}</td>
                  <td className="py-4 px-4">¥100,000 ({isEn ? "On Contract" : "契約時のみ"})</td>
                  <td className="py-4 px-4">¥0</td>
                  <td className="py-4 px-4 bg-primary/3 dark:bg-secondary/3 font-semibold text-emerald-600 dark:text-emerald-450">
                    {t.pricing.compRowInitialValue}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-[#151B22]">
                  <td className="py-4 px-4 font-bold text-slate-850 dark:text-slate-200">{t.pricing.compRowInitial}</td>
                  <td className="py-4 px-4">{isEn ? "Expensive" : "高機能だが維持費が高価"}</td>
                  <td className="py-4 px-4">{isEn ? "Free but limited" : "無料枠があるが件数制限"}</td>
                  <td className="py-4 px-4 bg-primary/3 dark:bg-secondary/3 font-semibold text-slate-900 dark:text-white">
                    {t.pricing.compRowFeaturesValue}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2 bg-rose-50/30 border border-rose-200/40 rounded-2xl p-4 text-[10px] text-slate-500 leading-relaxed dark:bg-[#201515]/20 dark:border-rose-900/30">
            <Info className="w-5 h-5 text-rose-500 shrink-0" />
            <span>
              {t.pricing.compNotice}
            </span>
          </div>
        </section>

        {/* FAQs */}
        <section className="max-w-7xl mx-auto w-full flex flex-col gap-6">
          <div className="text-center">
            <HelpCircle className="w-8 h-8 text-primary dark:text-secondary mx-auto mb-2" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{t.pricing.faqTitle}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            <div className="p-5 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl flex flex-col gap-2">
              <h5 className="font-extrabold text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {t.pricing.faqQ1}
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.pricing.faqA1}
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl flex flex-col gap-2">
              <h5 className="font-extrabold text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {t.pricing.faqQ2}
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.pricing.faqA2}
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl flex flex-col gap-2">
              <h5 className="font-extrabold text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {t.pricing.faqQ3}
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.pricing.faqA3}
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl flex flex-col gap-2">
              <h5 className="font-extrabold text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {t.pricing.faqQ4}
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.pricing.faqA4}
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl flex flex-col gap-2">
              <h5 className="font-extrabold text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {t.pricing.faqQ5}
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.pricing.faqA5}
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl flex flex-col gap-2">
              <h5 className="font-extrabold text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {t.pricing.faqQ6}
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.pricing.faqA6}
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl flex flex-col gap-2">
              <h5 className="font-extrabold text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {t.pricing.faqQ7}
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.pricing.faqA7}
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl flex flex-col gap-2">
              <h5 className="font-extrabold text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {t.pricing.faqQ8}
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.pricing.faqA8}
              </p>
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
          
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 flex flex-col gap-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-primary/10 text-primary dark:bg-secondary/10 dark:text-secondary rounded-2xl flex items-center justify-center mx-auto shadow-sm animate-pulse">
              <CreditCard className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                {t.pricing.checkoutModalTitle}
              </h3>
              <p className="text-xs text-slate-500">
                {isEn ? "Please confirm your subscription details to proceed." : "お選びいただいたプランの内容をご確認の上、登録を完了してください。"}
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="flex flex-col gap-3 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  {isEn ? "Selected Package" : "選択したパッケージ"}
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-700 dark:text-slate-200">{showCheckoutModal.name}</span>
                    <span className="text-rose-500">
                      {showCheckoutModal.listPrice > 0 ? (
                        <span className="flex items-center gap-1.5 flex-wrap justify-end">
                          <span className="line-through text-slate-400 font-normal">
                            ¥{showCheckoutModal.listPrice.toLocaleString()}
                          </span>
                          <span className="bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-[10px] px-1.5 py-0.5 rounded font-black shrink-0">
                            {appliedCoupon && couponDiscount ? couponDiscount : 30}% OFF
                          </span>
                          <span className="font-extrabold text-rose-500">
                            = ¥{(appliedCoupon && couponDiscount ? Math.floor(showCheckoutModal.listPrice * (1 - couponDiscount / 100)) : showCheckoutModal.campaignPrice).toLocaleString()} / {isEn ? "mo" : "月"}
                          </span>
                        </span>
                      ) : (
                        <span>¥0 / {isEn ? "mo" : "月"}</span>
                      )}
                    </span>
                  </div>
                  {appliedCoupon && (
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 mt-1 flex justify-between items-center border-t border-slate-100 dark:border-slate-800/50 pt-1.5">
                      <span>{isEn ? `Coupon active: ${appliedCoupon}` : `適用中のクーポン: ${appliedCoupon}`}</span>
                      <span>-{couponDiscount}% OFF</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  {t.pricing.couponPlaceholder.replace("（お持ちの場合）", "").replace(" (if you have one)", "")}
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  disabled={isLoggedIn && !!user?.email}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200/80 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              <div className="flex items-start gap-2 mt-1 mb-2 bg-slate-50/50 dark:bg-slate-800/10 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                <input
                  type="checkbox"
                  id="agree-subscribe-terms"
                  required
                  className="rounded border-slate-300 text-primary focus:ring-primary h-3.5 w-3.5 mt-0.5 cursor-pointer"
                />
                <label htmlFor="agree-subscribe-terms" className="text-[10px] text-slate-500 leading-normal cursor-pointer selection:bg-transparent">
                  {isEn ? (
                    <>
                      I agree to the <a href={`/${locale}/terms`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">Terms of Service</a> and <a href={`/${locale}/tokushoho`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">Act on Specified Commercial Transactions</a>.
                    </>
                  ) : (
                    <>
                      <a href={`/${locale}/terms`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">利用規約</a>および<a href={`/${locale}/tokushoho`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">特定商取引法に基づく表記</a>に同意します。
                    </>
                  )}
                </label>
              </div>

              <div className="mt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <>
                      {t.pricing.checkoutModalConfirm}
                      <ArrowRight className="w-4.5 h-4.5" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(null)}
                  className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {isEn ? "Back" : "戻る"}
                </button>
              </div>
            </form>

            <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400 bg-slate-50 dark:bg-slate-850 py-2.5 rounded-xl">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{isEn ? "Try free membership first." : "現在ご登録は無料でお試しいただけます。"}</span>
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
          
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 flex flex-col gap-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450 rounded-2xl flex items-center justify-center mx-auto shadow-sm animate-pulse">
              <CreditCard className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                {isEn ? "Add Quota Package" : "容量の追加購入を完了する"}
              </h3>
              <p className="text-xs text-slate-500">
                {isEn ? "Verify your add-on selections and complete your checkout." : "お選びいただいた追加パッケージの内容をご確認の上、購入を完了してください。"}
              </p>
            </div>

            <form onSubmit={handlePackSubscribe} className="flex flex-col gap-3 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  {isEn ? "Selected Package" : "選択したパッケージ"}
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-200">{showPackCheckoutModal.name}</span>
                  <span className="text-emerald-650 dark:text-emerald-400 font-extrabold">
                    ¥{showPackCheckoutModal.price.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  {t.pricing.couponPlaceholder.replace("（お持ちの場合）", "").replace(" (if you have one)", "")}
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  disabled={isLoggedIn && !!user?.email}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200/80 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              <div className="flex items-start gap-2 mt-1 mb-2 bg-slate-50/50 dark:bg-slate-800/10 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                <input
                  type="checkbox"
                  id="agree-pack-terms"
                  required
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 mt-0.5 cursor-pointer"
                />
                <label htmlFor="agree-pack-terms" className="text-[10px] text-slate-500 leading-normal cursor-pointer selection:bg-transparent">
                  {isEn ? (
                    <>
                      I agree to the <a href={`/${locale}/terms`} target="_blank" rel="noopener noreferrer" className="text-emerald-650 dark:text-emerald-400 hover:underline font-bold">Terms of Service</a> and <a href={`/${locale}/tokushoho`} target="_blank" rel="noopener noreferrer" className="text-emerald-650 dark:text-emerald-450 hover:underline font-bold">Act on Specified Commercial Transactions</a>.
                    </>
                  ) : (
                    <>
                      <a href={`/${locale}/terms`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold">利用規約</a>および<a href={`/${locale}/tokushoho`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold">特定商取引法に基づく表記</a>に同意します。
                    </>
                  )}
                </label>
              </div>

              <div className="mt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <>
                      {isEn ? "Complete Purchase" : "購入手続きを完了する"}
                      <ArrowRight className="w-4.5 h-4.5" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPackCheckoutModal(null)}
                  className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {isEn ? "Back" : "戻る"}
                </button>
              </div>
            </form>

            <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400 bg-slate-50 dark:bg-slate-850 py-2.5 rounded-xl">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{isEn ? "Secure checkout encrypted via Stripe." : "Stripe社による暗号化された安全な決済処理が施されます"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
