"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CountdownTimer } from "@/components/CountdownTimer";
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
  
  const [mounted, setMounted] = useState(false);
  const discountType = "campaign";
  const [showCheckoutModal, setShowCheckoutModal] = useState<PlanDetails | null>(null);
  const [showPackCheckoutModal, setShowPackCheckoutModal] = useState<PackDetails | null>(null);

  const packs: PackDetails[] = [
    {
      id: "10k",
      name: "10,000 行追加パック",
      price: 14800,
      allowance: 10000,
      description: "必要な分だけ少しずつ追加したい方向け",
      recommended: false
    },
    {
      id: "50k",
      name: "50,000 行追加パック",
      price: 49800,
      allowance: 50000,
      description: "1回あたり約32%お得な一番人気のボリューム枠",
      recommended: true
    },
    {
      id: "100k",
      name: "100,000 行追加パック",
      price: 79800,
      allowance: 100000,
      description: "大量リストの抽出に最適な最安値レート",
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
      name: "FREEプラン",
      listPrice: 0,
      campaignPrice: 0,
      referralPrice: 0,
      quota: "20 件 / 日",
      quotaNum: 20,
      description: "まずは使い勝手を試してみたい方に最適",
      features: [
        "毎日 20 件の CSV ダウンロード枠",
        "FAX番号 & 主要株主情報の閲覧 (ログイン後)",
        "詳細シグナル閲覧 (ログイン後)"
      ]
    },
    {
      id: "pro",
      name: "PROプラン",
      listPrice: 4200,
      campaignPrice: 2900,
      referralPrice: 2100,
      quota: "2,000 行 / 月",
      quotaNum: 2000,
      description: "テレアポ・DM営業を始めたい個人事業主や営業マンに最適",
      features: [
        "毎月 2,000 件の CSV ダウンロード枠",
        "メールアドレスの開示",
        "ABM かんばん営業管理 CRM ボード",
        "連絡先情報（電話・メール）の有無での絞り込み"
      ]
    },
    {
      id: "business",
      name: "BUSINESSプラン",
      listPrice: 14000,
      campaignPrice: 9800,
      referralPrice: 7000,
      quota: "10,000 行 / 月",
      quotaNum: 10000,
      description: "Mechanism B による大量エクスポートを可能にする標準チーム枠",
      features: [
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
      name: "ENTERPRISEプラン",
      listPrice: 42000,
      campaignPrice: 29000,
      referralPrice: 21000,
      quota: "40,000 行 / 月",
      quotaNum: 40000,
      description: "専任サポートと月4万件のデータ抽出を可能にする最上位の組織向け枠",
      recommended: false,
      features: [
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
      setCouponError("クーポンコードの認証中にエラーが発生しました。");
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
        alert(errData.error || "チェックアウトの作成に失敗しました。");
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("チェックアウトURLの取得に失敗しました。");
      }
    } catch (err) {
      console.error(err);
      alert("通信中にエラーが発生しました。");
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
      alert("追加パッケージの購入は、PROプラン以上の有料プランをご契約中のお客様のみご利用いただけます。先に有料プランへのご登録をお願いいたします。");
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
        alert(errData.error || "チェックアウトの作成に失敗しました。");
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("チェックアウトURLの取得に失敗しました。");
      }
    } catch (err) {
      console.error(err);
      alert("通信中にエラーが発生しました。");
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
        "name": "ホーム",
        "item": "https://kigyoulist.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "料金プラン",
        "item": "https://kigyoulist.com/pricing"
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
          <Link href="/" className="hover:text-primary transition-colors">ホーム</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200" aria-current="page">料金プラン</span>
        </nav>

        <div className="absolute top-0 right-1/4 -translate-y-1/2 w-80 h-80 bg-primary/3 rounded-full blur-3xl pointer-events-none" />
        
        {/* Main Title Section */}
        <section className="text-center max-w-4xl mx-auto flex flex-col gap-4">
          <span className="text-[10px] font-black text-primary dark:text-secondary uppercase tracking-widest bg-primary/10 dark:bg-secondary/10 px-3 py-1 rounded-full w-fit mx-auto">
            SIMPLE, PREMIUM PRICING
          </span>
          <h1 className="text-[clamp(16px,4.3vw,40px)] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            <span className="block whitespace-nowrap">
              圧倒的な
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                コストパフォーマンス
              </span>
              で、
            </span>
            <span className="block whitespace-nowrap mt-1.5 sm:mt-2.5">
              鮮度の高いアプローチデータをスマートに獲得
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
            他社サービスは月額3万円〜10万円が標準ですが、Kigyou-listは無駄なコストを徹底削減し、高品質な企業シグナルを驚きの低価格で提供します。
          </p>
        </section>

        {/* Month-End Countdown urgence timer */}
        <section className="max-w-4xl mx-auto w-full">
          <CountdownTimer />
        </section>

        <section className="flex flex-col items-center gap-4">
          <div className="p-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl flex items-center gap-1.5 shadow-inner relative z-10 text-xs font-black text-slate-900 dark:text-white px-4 py-2.5">
            <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
            <span>今月のキャンペーン価格 (30% OFF) 適用中</span>
          </div>
          
          {appliedCoupon ? (
            <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-250/50 px-3.5 py-2 rounded-xl dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-300 max-w-md text-center leading-relaxed font-bold">
              🎉 <strong>最大割引クーポンを適用しました！</strong> クーポン割引が適用されたため、キャンペーン割引は一時的に無効化されています。
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 text-center max-w-md leading-relaxed">
              ⏰ 今月ご登録いただくと、<strong>初月はキャンペーン特別価格（30%OFF）</strong>が適用されます。次回の自動更新時（2ヶ月目以降）からは通常価格でのご請求となりますので、あらかじめご了承ください。
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
                placeholder="クーポンコード（お持ちの場合）" 
                className="w-full text-xs px-4 py-2.5 rounded-l-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1C2128] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={verifyCouponCode}
                disabled={verifyingCoupon || !couponInput.trim() || couponInput === appliedCoupon}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold rounded-r-xl transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {verifyingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "適用する"}
              </button>
            </div>
            {couponError && <p className="text-[10px] text-rose-500 mt-2 font-bold">{couponError}</p>}
            {appliedCoupon && couponDiscount && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2 font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> クーポン（{couponDiscount}% OFF）が適用されました！
              </p>
            )}
          </div>
        </section>

        {/* Pricing Cards Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch max-w-7xl mx-auto w-full relative z-10">
          {plans.map((plan) => {
            const listPrice = plan.listPrice;
            
            // Determine active discount scenario
            let savingsPercent = 30;
            let currentPrice = plan.campaignPrice;
            
            // If coupon applied, override
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
                {/* Floating Recommended Tag */}
                {plan.recommended && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-[9px] font-black text-white uppercase tracking-widest shadow-md flex items-center gap-1 border border-white/10">
                    <Star className="w-2.5 h-2.5 fill-white" />
                    ★ 一番人気・ベストバリュー
                  </div>
                )}

                {/* Plan Header */}
                <div className="p-6 sm:p-8 flex flex-col border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {plan.name}
                  </span>
                  <div className="mt-3 flex items-baseline gap-2 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      {plan.id === "free" ? "無料" : `¥${currentPrice.toLocaleString()}`}
                    </span>
                    {plan.id !== "free" && <span className="text-xs text-slate-400 font-bold">/ 月 (税込)</span>}
                  </div>

                  {/* Savings & List Price comparison */}
                  {plan.id !== "free" ? (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="line-through text-slate-400 font-semibold">
                        ¥{listPrice.toLocaleString()}
                      </span>
                      <span className="font-extrabold text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400 text-[10px]">
                        {savingsPercent}% お得
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-450 font-extrabold text-[10px] bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 px-2 py-0.5 rounded w-fit">
                      初期費用 ¥0
                    </div>
                  )}

                  <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed min-h-[40px]">
                    {plan.description}
                  </p>

                  <div className="mt-5 p-3.5 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">エクスポート枠</span>
                    <strong className="text-xs font-black text-primary dark:text-secondary flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      {plan.quota}
                    </strong>
                  </div>
                </div>

                {/* Plan Features */}
                <div className="p-6 sm:p-8 flex-grow flex flex-col gap-4">
                  <h5 className="text-[10px] font-black text-slate-400 tracking-wider uppercase">
                    含まれる機能：
                  </h5>
                  <ul className="flex flex-col gap-3">
                    {plan.features.map((feature, idx) => {
                      const isComingSoon = feature.includes("(開発中)") || feature.includes("（開発中）");
                      const cleanFeature = feature.replace(/\s*[\(（]開発中[\)）]/, "");
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
                                開発中
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
                        ? (isLoggedIn ? "適用中" : "無料で試してみる") 
                        : "このプランを申し込む"}
                    </span>
                    {!(plan.id === "free" && isLoggedIn) && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-[9px] text-slate-400 text-center block mt-2 opacity-80">
                    {plan.id === "free" 
                      ? "※ クレジットカード登録は不要です。"
                      : "※ 無料会員登録後、お好みのプランをお選びください。"}
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
              SPOT PURCHASE / ADD-ON
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              追加ダウンロード容量（買い切り）
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
              月額プランのダウンロード枠を使い切った場合や、必要な時に必要な分だけリストを取得したい方向けの単発購入パッケージです。
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
                    ★ 一番人気・32%お得
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {pack.name}
                    </span>
                    {pack.recommended && (
                      <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/40">
                        おすすめ
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      ¥{pack.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">/ 買い切り</span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed min-h-[36px]">
                    {pack.description}
                  </p>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center justify-between mt-2">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">エクスポート枠</span>
                    <strong className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
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
                    <span>このパッケージを購入する</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Guidelines / Notices */}
          <div className="bg-slate-50 border border-slate-200 dark:bg-slate-800/10 dark:border-slate-800 rounded-3xl p-5 md:p-6 flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-450 mt-2 max-w-7xl mx-auto w-full">
            <h5 className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1 text-[11px]">
              <Info className="w-4 h-4 text-emerald-500 shrink-0" />
              追加パッケージ（買い切り）に関する重要事項
            </h5>
            <ul className="list-disc list-inside flex flex-col gap-1.5 text-[11px] leading-relaxed pl-1">
              <li><strong>有料プランのご契約が必要</strong>: 追加パッケージは、PROプラン以上の有料プラン（PRO/BUSINESS/ENTERPRISE）をご契約中のお客様のみご購入いただけます。FREEプランのお客様はご購入いただけません。</li>
              <li><strong>有効期限なし</strong>: 追加されたダウンロード容量には有効期限がありません。月額プランの容量のように月末に消滅することはなく、翌月以降も無期限で引き継がれ、いつでもご利用いただけます。</li>
              <li><strong>容量の消費順序</strong>: 月額プランをご契約中の場合、毎月付与される月額の基本枠から優先して消費されます。基本枠を使い切った後、自動的にこの追加容量から消費が開始されます。</li>
            </ul>
          </div>
        </section>

        {/* Competitors Price Comparison Table (The "No Dumping" Proof) */}
        <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm max-w-7xl mx-auto w-full flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-secondary/3 rounded-full blur-3xl pointer-events-none" />
          
          <div className="text-center md:text-left relative flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">PRICE COMPARISON</span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              市場価格調査：Kigyou-list と競合他社の料金比較
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              当社は徹底した自動化により維持費を削減しているため、リスト取得単価・初期費用ともに業界最安水準を実現できております。競合他社の通常パッケージを基準に置いて設計しております。
            </p>
          </div>

          <div className="overflow-x-auto relative">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 rounded-l-xl">機能 / 料金比較項目</th>
                  <th className="py-3 px-4">他社 M社</th>
                  <th className="py-3 px-4">他社 B社</th>
                  <th className="py-3 px-4 bg-primary/5 dark:bg-secondary/5 text-primary dark:text-secondary font-black rounded-r-xl">Kigyou-list (PRO)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-[#151B22]">
                  <td className="py-4 px-4 font-bold text-slate-850 dark:text-slate-200">月額利用料</td>
                  <td className="py-4 px-4">¥30,000 〜 ¥100,000</td>
                  <td className="py-4 px-4">¥9,800 〜 ¥29,800</td>
                  <td className="py-4 px-4 bg-primary/3 dark:bg-secondary/3 font-black text-rose-500">
                    ¥2,900 (キャンペーン価格)
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-[#151B22]">
                  <td className="py-4 px-4 font-bold text-slate-850 dark:text-slate-200">CSV出力単価 (1件あたり)</td>
                  <td className="py-4 px-4">¥20 〜 ¥60</td>
                  <td className="py-4 px-4">¥30 〜 ¥100</td>
                  <td className="py-4 px-4 bg-primary/3 dark:bg-secondary/3 font-black text-slate-900 dark:text-white">
                    約 ¥1.45 (業界トップクラス)
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-[#151B22]">
                  <td className="py-4 px-4 font-bold text-slate-850 dark:text-slate-200">初期費用</td>
                  <td className="py-4 px-4">¥100,000 (契約時のみ)</td>
                  <td className="py-4 px-4">¥0</td>
                  <td className="py-4 px-4 bg-primary/3 dark:bg-secondary/3 font-semibold text-emerald-600 dark:text-emerald-400">
                    ¥0 (完全無料)
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-[#151B22]">
                  <td className="py-4 px-4 font-bold text-slate-850 dark:text-slate-200">主な強みと特徴</td>
                  <td className="py-4 px-4">高機能だが維持費が高価</td>
                  <td className="py-4 px-4">無料枠があるが件数制限</td>
                  <td className="py-4 px-4 bg-primary/3 dark:bg-secondary/3 font-semibold text-slate-900 dark:text-white">
                    求人・助成金シグナル連携 & CRM
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2 bg-rose-50/30 border border-rose-200/40 rounded-2xl p-4 text-[10px] text-slate-500 leading-relaxed dark:bg-[#201515]/20 dark:border-rose-900/30">
            <Info className="w-5 h-5 text-rose-500 shrink-0" />
            <span>
              ※ 調査データは2026年5月時点の各社公開プランに基づく概算比較です。当社は「通常パッケージ」を市場価格と同一水準に置きつつ、オンライン集客特化による広告費ゼロ化により、お客様へのダイレクトな30%OFF還元キャンペーンを恒常化することに成功しております。
            </span>
          </div>
        </section>

        {/* FAQs */}
        <section className="max-w-7xl mx-auto w-full flex flex-col gap-6">
          <div className="text-center">
            <HelpCircle className="w-8 h-8 text-primary dark:text-secondary mx-auto mb-2" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">よくあるご質問 (FAQ)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            <div className="p-5 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl flex flex-col gap-2">
              <h5 className="font-extrabold text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                キャンペーン終了後は通常価格に戻りますか？
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                はい。キャンペーン価格が適用されるのは初回お申し込み時の最初の1ヶ月分（初月）のみとなり、2ヶ月目以降の自動更新時は通常価格でのご請求となります。ただし、一度ご解約された後でも、キャンペーン期間中であれば再契約時に再度キャンペーン価格でのお申し込みが可能です。
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl flex flex-col gap-2">
              <h5 className="font-extrabold text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                ダウンロード枠を使い切った後、再度契約やプラン変更はできますか？
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                はい、いつでも何回でも可能です！ダウンロード件数を使い切った後でも、同じプランを再契約（チャージ）して枠をリセットしたり、別のプランへ即時変更したりすることが当ページから自由に行えます。
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl flex flex-col gap-2">
              <h5 className="font-extrabold text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                月の途中でプランをアップグレード・変更した場合は？
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                プランの変更（アップグレード・ダウングレード・再契約）は即時に反映され、その日から新プランの1ヶ月間の利用期間が新しくスタートします。変更後は、当月のダウンロード使用数がリセットされ、新しいご利用期間（契約サイクル）の開始日が本日の日付に再設定されます。これにより、新しいプランの月間枠（例：BUSINESSプランなら10,000行）が即座にご利用可能になります。
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl flex flex-col gap-2">
              <h5 className="font-extrabold text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                プランを変更した際、旧プランの使い切れなかった残りの枠はどうなりますか？
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                旧プランで使い切れなかった残りのダウンロード枠は消滅しません。残りの枠は、無期限でご利用いただける「追加容量枠」へと自動的に引き継がれ、蓄積されます。新しいプランの月間枠と並行して、無駄なくすべてご利用いただけます。（※有料プランから無料（FREE）プランへ移行または解約された場合は、この追加容量枠は一時的にロック（凍結）されご利用いただけなくなりますが、再びいずれかの有料プランをご契約いただいた時点で自動的にロックが解除され、再度ご利用いただけるようになります）
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl flex flex-col gap-2">
              <h5 className="font-extrabold text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                使わなかった月間枠は翌月に繰り越し（自動的に追加容量枠に合算）されますか？
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                いいえ。毎月の自動更新時（定期的な請求タイミング）には、使い切れなかった当月の基本枠は翌月へ繰り越しされず、リセットされます。月間基本枠は期間内に計画的にご利用いただきますようお願いいたします。繰り越し（追加容量枠への移行・蓄積）が行われるのは、お客様が能動的にプランを変更（アップグレード・ダウングレード・再契約）されたタイミングのみとなります。
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl flex flex-col gap-2">
              <h5 className="font-extrabold text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                初回登録時に料金は発生しますか？
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                無料会員登録は完全無料です。有料プランへの移行は登録後のマイページから行えます。決済にはクレジットカードをご用意ください。なお、キャンペーン価格は登録いただいた月から即時適用されます。
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl flex flex-col gap-2">
              <h5 className="font-extrabold text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                API連携機能はどのプランで利用できますか？また追加料金は発生しますか？
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                API連携機能は「BUSINESSプラン」および「ENTERPRISEプラン」をご契約中のお客様であれば、追加料金なし（月額料金内）でご利用いただけます。FREEプラン、PROプランのお客様はご利用いただけません。
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl flex flex-col gap-2">
              <h5 className="font-extrabold text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                API経由でのデータ取得時、ダウンロード枠（クォータ）はどのように消費されますか？
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                APIから取得（レスポンスとして返却）された企業情報またはシグナルのデータ件数1件につき、1ダウンロード枠がリアルタイムに消費されます。検索結果が0件だった場合、枠は消費されません。
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
                購読を完了する
              </h3>
              <p className="text-xs text-slate-500">
                お選びいただいたプランの内容をご確認の上、登録を完了してください。
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="flex flex-col gap-3 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  選択したパッケージ
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-200">{showCheckoutModal.name}</span>
                  <span className="text-rose-500">
                    ¥{showCheckoutModal.campaignPrice.toLocaleString()} / 月
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  登録するメールアドレス
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
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">利用規約</a>
                  および
                  <a href="/tokushoho" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">特定商取引法に基づく表記</a>
                  に同意します。
                </label>
              </div>

              <div className="mt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <>
                      購読手続きを完了する
                      <ArrowRight className="w-4.5 h-4.5" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(null)}
                  className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  戻る
                </button>
              </div>
            </form>

            <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400 bg-slate-50 dark:bg-slate-850 py-2.5 rounded-xl">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>現在ご登録は無料でお試しいただけます。</span>
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
                容量の追加購入を完了する
              </h3>
              <p className="text-xs text-slate-500">
                お選びいただいた追加パッケージの内容をご確認の上、購入を完了してください。
              </p>
            </div>

            <form onSubmit={handlePackSubscribe} className="flex flex-col gap-3 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  選択したパッケージ
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
                  登録するメールアドレス
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
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold">利用規約</a>
                  および
                  <a href="/tokushoho" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold">特定商取引法に基づく表記</a>
                  に同意します。
                </label>
              </div>

              <div className="mt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <>
                      購入手続きを完了する
                      <ArrowRight className="w-4.5 h-4.5" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPackCheckoutModal(null)}
                  className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  戻る
                </button>
              </div>
            </form>

            <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400 bg-slate-50 dark:bg-slate-850 py-2.5 rounded-xl">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Stripe社による暗号化された安全な決済処理が施されます</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
