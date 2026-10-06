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
  Database, Send, ChevronDown, Target, BarChart3, FileText, Zap, CheckCircle2,
  Users, Building2
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

  const [pricingTab, setPricingTab] = useState<"data" | "form">("data");
  const [openFormFaq, setOpenFormFaq] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab");
      const hash = window.location.hash;
      if (tabParam === "form" || hash.includes("form") || hash.includes("pricing-form")) {
        setPricingTab("form");
      }
    }
  }, []);

  const handleTabChange = (tab: "data" | "form") => {
    setPricingTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState(null, "", url.toString());
    }
  };

  const formFaqs = [
    {
      q: isEn
        ? "Is contact form outreach compliant with Japanese anti-spam regulations?"
        : isVi
        ? "Gửi Form DM có vi phạm luật chống spam hay luật Tokushoho tại Nhật không?"
        : "問い合わせフォーム営業は特定商取引法などの法律上問題ありませんか？",
      a: isEn
        ? "Yes, fully compliant with Japanese laws. Every message contains complete sender corporate disclosure and an explicit opt-out notice. Additionally, our AI automatically filters out forms with anti-sales disclaimers."
        : isVi
        ? "Hoàn toàn hợp pháp và tuân thủ đúng Luật giao dịch thương mại đặc định (特定商取引法) của Nhật Bản. Mỗi thông điệp gửi đi đều ghi rõ thông tin pháp nhân người gửi và câu hướng dẫn từ chối nhận tin (Opt-out). Đặc biệt, hệ thống AI của chúng tôi tự động quét và bỏ qua các công ty có ghi chú 'Cấm chào hàng' (営業お断り)."
        : "はい、法令を遵守した設計を行っております。送信文面には特定商取引法に基づく発信者情報（会社名・担当者名・連絡先）および送信停止（オプトアウト）案内を必ず明記します。また、当社のAIシステムにより「営業目的の連絡お断り」と明記されている企業を自動除外するため、クレームリスクを最小化しています。"
    },
    {
      q: isEn
        ? "How does this compare to Cold Email and Telesales?"
        : isVi
        ? "Điểm khác biệt lớn nhất so với Telesales và Cold Email là gì?"
        : "テレアポやメール営業（メルマガ）と何が違うのですか？",
      a: isEn
        ? "Unlike general info@ inboxes that get flooded with spam, corporate contact forms are designated inquiry channels actively monitored by executives and managers, resulting in 50%-90% read rates."
        : isVi
        ? "Email gửi hòm thư chung (info@) thường bị lễ tân bỏ qua hoặc rơi vào mục Spam. Ngược lại, Form liên hệ trên website là kênh đón khách hàng nên luôn được Ban Giám đốc, Trưởng phòng Kinh doanh hoặc CSKH kiểm tra kỹ lưỡng. Tỷ lệ mở thực tế đạt 50% - 90%, mang lại số lượng cuộc hẹn cao gấp nhiều lần."
        : "メルマガや代表メール（info@宛）はスパムフィルターや受付で埋もれがちですが、Webサイトのお問い合わせフォームは【見込み客からの連絡窓口】であるため、社内の担当部署や決裁者（役員・部長クラス）が必ず目を通します。そのため閲覧率が50%〜90%と圧倒的に高く、アポイント獲得単価を大幅に削減できます。"
    },
    {
      q: isEn
        ? "What if we don't have a Japanese outreach script prepared?"
        : isVi
        ? "Chúng tôi chưa có kịch bản chào hàng tiếng Nhật chuẩn thì có được hỗ trợ không?"
        : "文面がまだ完成していないのですが、どうすればよいですか？",
      a: isEn
        ? "Our dashboard provides pre-built Japanese business etiquette (Keigo) templates. All submitted scripts undergo compliance verification prior to dispatch."
        : isVi
        ? "Trong trang quản trị (Dashboard) có sẵn thư viện mẫu kịch bản Kính ngữ (Keigo) chuẩn theo từng ngành nghề. Bạn chỉ cần điền tên sản phẩm là có thể kích hoạt. Ngoài ra, đội ngũ quản trị sẽ rà soát tuân thủ luật Tokushoho và từ khóa cấm trước khi hệ thống bắt đầu phát hành."
        : "管理画面内に日本のビジネスマナーに対応した「業種別テンプレート」を複数ご用意しております。自社のサービス概要や会社名を当てはめるだけで、誰でも効果的なアプローチ文面を簡単に作成いただけます。また、作成された文面は配信開始前に運営スタッフが特定商取引法やNGワードの事前審査を行いますので、安心してご利用いただけます。"
    },
    {
      q: isEn
        ? "How can we verify the delivery proof and logs?"
        : isVi
        ? "Sau khi gửi xong, báo cáo kết quả được cung cấp như thế nào?"
        : "送信結果やレポートはどのように確認できますか？",
      a: isEn
        ? "Live progress updates are shown directly on your dashboard. Upon completion, download full CSV reports containing corporate numbers, company names, form URLs, exact timestamps, and delivery logs."
        : isVi
        ? "Ngay khi bắt đầu gửi, tiến độ sẽ cập nhật trực tiếp trên Dashboard. Khi hoàn tất, bạn có thể tải về file Excel/CSV chi tiết gồm: Tên doanh nghiệp, Mã số thuế, Thời gian gửi, URL form và trạng thái gửi thành công."
        : "配信開始後、管理画面のダッシュボード上でリアルタイムに送信進捗が反映されます。配信完了後は、送信企業名、法人番号、送信日時、対象フォームURL、送信ステータスを記載した詳細なエクセル/CSVレポートをワンクリックでダウンロード可能です。"
    }
  ];

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
            <button
              type="button"
              onClick={() => handleTabChange("data")}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                pricingTab === "data"
                  ? "bg-white dark:bg-[#1C2128] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-750"
              }`}
            >
              <Database className={`w-4 h-4 ${pricingTab === "data" ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
              <span>{isEn ? "Corporate Data & CSV" : isVi ? "Dữ liệu & Xuất CSV" : "企業データ・CSV抽出"}</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("form")}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                pricingTab === "form"
                  ? "bg-white dark:bg-[#1C2128] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-750"
              }`}
            >
              <Send className={`w-4 h-4 ${pricingTab === "form" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
              <span>{isEn ? "Form Outreach" : isVi ? "Gửi Form Tiếp Cận" : "フォーム営業 (配信)"}</span>
            </button>
          </div>
        </section>

        {/* ======================================================== */}
        {/* ================== DATA & CSV PRICING TAB ============== */}
        {/* ======================================================== */}
        {pricingTab === "data" && (
          <>
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
                  <button
                    type="button"
                    onClick={() => handleTabChange("form")}
                    className="px-6 py-3 rounded-xl font-bold text-xs text-slate-900 bg-white hover:bg-slate-100 shadow-md transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                  >
                    <span>{isEn ? "View Form Outreach Plans" : isVi ? "Xem Bảng Giá Gửi Form" : "フォーム営業プランを見る"}</span>
                    <ArrowRight className="w-4 h-4 text-indigo-600" />
                  </button>
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
      </>
    )}

    {/* ======================================================== */}
    {/* =================== FORM OUTREACH TAB ================== */}
    {/* ======================================================== */}
    {pricingTab === "form" && (
      <div className="flex flex-col gap-12 w-full animate-in fade-in duration-300">
        {/* Form DM Hero / Value Prop Banner */}
        <section className="max-w-5xl mx-auto w-full">
          <div className="p-7 sm:p-9 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-indigo-900/60">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-black uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isEn ? "SELF-SERVE OUTBOUND SAAS" : isVi ? "NỀN TẢNG TIẾP CẬN TỰ ĐỘNG B2B" : "セルフサービス型 フォーム営業"}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mb-2 tracking-tight">
                {isEn ? "Automated Contact Form Outreach SaaS" : isVi ? "Nền Tảng Tự Động Gửi Form Marketing" : "問い合わせフォーム営業配信プラットフォーム"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-350 leading-relaxed max-w-2xl">
                {isEn
                  ? "Zero setup fee, zero monthly commitments. Filter hyper-targeted prospects from our 5M+ database and dispatch your pitch directly to verified corporate contact forms starting at 20 JPY/form."
                  : isVi
                  ? "Không phí khởi tạo, không phí duy trì. Lọc khách hàng từ 5 triệu doanh nghiệp và tự động gửi thông điệp chào hàng vào Form liên hệ ngay trên hệ thống (chỉ từ 20 JPY/form)."
                  : "初期費用・月額固定費0円。自社でリストを精査し、手動でフォーム送信する工数はもう不要。500万社DBからターゲットを抽出し、管理画面から自社の営業文面を即時オンライン配信（1件20円〜）。"}
              </p>
            </div>
            <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
              <LocaleLink
                href="/dashboard?tab=formCampaigns"
                className="px-6 py-3.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] flex items-center gap-2"
              >
                <span>{isEn ? "Create Campaign in Dashboard" : isVi ? "Tạo chiến dịch trên Dashboard" : "管理画面でキャンペーン作成"}</span>
                <ArrowRight className="w-4 h-4" />
              </LocaleLink>
            </div>
          </div>
        </section>

        {/* Form DM 3 Pricing Cards */}
        <section className="max-w-6xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold mb-3">
              <Coins className="w-3.5 h-3.5" />
              <span>{isEn ? "Pay-As-You-Go Volume Plans" : isVi ? "Bảng Giá Gửi Form Minh Bạch" : "送信ボリューム別プラン（都度課金）"}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
              {isEn ? "Select Your Outreach Volume" : isVi ? "Chọn Quy Mô Gửi Phù Hợp" : "成果に直結する配信プラン"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {isEn ? "Pure pay-per-delivery. Free targeting, free template library, AI disclaimer skipping included." : isVi ? "Chỉ tính phí trên số form gửi thành công. Miễn phí lọc đối tượng, kịch bản mẫu và thuật toán AI bỏ qua cấm quảng cáo." : "初期費用・月額固定費ゼロ。送信完了件数に応じた完全都度課金制。ターゲット抽出も管理画面から即時行えます。"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {/* 1,000 Plan */}
            <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {isEn ? "Starter (1,000 Forms)" : isVi ? "Gói Starter 1.000 Form" : "1,000 件プラン"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                  {isEn ? "Ideal for testing product-market fit" : isVi ? "Thử nghiệm phản hồi thị trường" : "まずは効果検証・テスト送信に最適"}
                </p>

                <div className="flex items-baseline gap-1.5 mb-1.5">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">¥28,000</span>
                  <span className="text-xs text-slate-400">({isEn ? "excl. tax" : isVi ? "chưa VAT" : "税抜"})</span>
                </div>
                <div className="text-xs text-slate-500 font-semibold mb-6">
                  {isEn ? "Unit rate: 28 JPY / form" : isVi ? "Đơn giá: 28 JPY / form" : "単価: 28円 / 送信完了"}
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-350 border-t border-slate-100 dark:border-slate-800 pt-5">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isEn ? "5M+ target list filtering" : isVi ? "Lọc tệp khách hàng từ 5M DB" : "ターゲット企業リスト抽出"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isEn ? "AI anti-sales disclaimer skip" : isVi ? "AI quét bỏ qua form cấm quảng cáo" : "AI営業お断り自動除外"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isEn ? "Industry templates library" : isVi ? "Thư viện mẫu kịch bản chuẩn Keigo" : "業種別テンプレート活用"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isEn ? "Pre-dispatch compliance check" : isVi ? "Kiểm duyệt tuân thủ Tokushoho" : "運営による事前法令・NGワード審査"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isEn ? "Realtime logs & CSV report" : isVi ? "Báo cáo CSV và theo dõi trực tiếp" : "リアルタイム進捗 ＆ CSVレポート"}</span>
                  </li>
                </ul>
              </div>

              <LocaleLink
                href="/dashboard?tab=formCampaigns"
                className="mt-8 w-full py-3 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-center transition-colors block active:scale-[0.98]"
              >
                {isEn ? "Configure Starter" : isVi ? "Cấu hình gói 1.000 Form" : "このプランで配信設定する"}
              </LocaleLink>
            </div>

            {/* 3,000 Plan (RECOMMENDED) */}
            <div className="bg-white dark:bg-[#1C2128] border-2 border-indigo-600 dark:border-indigo-500 rounded-2xl p-6 sm:p-7 shadow-lg shadow-indigo-500/10 flex flex-col justify-between relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs whitespace-nowrap">
                {isEn ? "★ MOST POPULAR & BEST VALUE" : isVi ? "★ Phổ biến & Tối ưu nhất" : "★ 一番人気・推奨プラン"}
              </div>

              <div>
                <h4 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-1">
                  {isEn ? "Standard (3,000 Forms)" : isVi ? "Gói Standard 3.000 Form" : "3,000 件プラン"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                  {isEn ? "Optimal for scalable lead generation" : isVi ? "Đạt lượng chuyển đổi cuộc hẹn ổn định" : "本格的なリード獲得・商談創出に"}
                </p>

                <div className="flex items-baseline gap-1.5 mb-1.5">
                  <span className="text-3xl font-black text-indigo-700 dark:text-indigo-300">¥69,000</span>
                  <span className="text-xs text-slate-400">({isEn ? "excl. tax" : isVi ? "chưa VAT" : "税抜"})</span>
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-6">
                  {isEn ? "Unit rate: 23 JPY / form (Save 18%)" : isVi ? "Đơn giá: 23 JPY / form (Tiết kiệm 18%)" : "単価: 23円 / 送信完了 (約18%お得)"}
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-350 border-t border-slate-100 dark:border-slate-800 pt-5">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isEn ? "5M+ target list filtering" : isVi ? "Lọc tệp khách hàng từ 5M DB" : "ターゲット企業リスト抽出"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isEn ? "AI anti-sales disclaimer skip" : isVi ? "AI quét bỏ qua form cấm quảng cáo" : "AI営業お断り自動除外"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      {isEn ? "Dynamic placeholder tags ({company_name})" : isVi ? "Tự động chèn {company_name}, {address}" : "企業名・住所などの自動差し込みタグ対応"}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isEn ? "Priority 2-hour compliance check" : isVi ? "Ưu tiên kiểm duyệt trong 2 giờ" : "優先スピード審査（最短2時間）"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isEn ? "Realtime logs & CSV report" : isVi ? "Báo cáo CSV và theo dõi trực tiếp" : "リアルタイム進捗 ＆ CSVレポート"}</span>
                  </li>
                </ul>
              </div>

              <LocaleLink
                href="/dashboard?tab=formCampaigns"
                className="mt-8 w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/20 text-center transition-all block active:scale-[0.98]"
              >
                {isEn ? "Launch Standard" : isVi ? "Bắt đầu với gói 3.000 Form" : "このプランで今すぐ始める"}
              </LocaleLink>
            </div>

            {/* 5,000+ Plan */}
            <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {isEn ? "Enterprise (5,000 Forms)" : isVi ? "Gói Enterprise 5.000 Form" : "5,000 件プラン"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                  {isEn ? "Maximum appointment pipeline volume" : isVi ? "Quy mô lớn, chi phí trên mỗi form rẻ nhất" : "大量アプローチで商談数を最大化"}
                </p>

                <div className="flex items-baseline gap-1.5 mb-1.5">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">¥99,000</span>
                  <span className="text-xs text-slate-400">({isEn ? "excl. tax" : isVi ? "chưa VAT" : "税抜"})</span>
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-6">
                  {isEn ? "Unit rate: 19.8 JPY / form (Best rate)" : isVi ? "Đơn giá: 19.8 JPY / form (Tốt nhất)" : "単価: 19.8円 / 送信完了 (最安値レート)"}
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-350 border-t border-slate-100 dark:border-slate-800 pt-5">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isEn ? "5M+ target list filtering" : isVi ? "Lọc tệp khách hàng từ 5M DB" : "ターゲット企業リスト抽出"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isEn ? "AI anti-sales disclaimer skip" : isVi ? "AI quét bỏ qua form cấm quảng cáo" : "AI営業お断り自動除外"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isEn ? "Advanced filter & tags" : isVi ? "Hỗ trợ tùy biến nâng cao" : "自動差し込みタグ＆高度な除外設定"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isEn ? "Priority scheduling & staggered dispatch" : isVi ? "Chia lịch gửi tối ưu theo ngày" : "最優先審査 ＆ 分割配信スケジュール対応"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isEn ? "Realtime logs & CSV report" : isVi ? "Báo cáo CSV và theo dõi trực tiếp" : "リアルタイム進捗 ＆ CSVレポート"}</span>
                  </li>
                </ul>
              </div>

              <LocaleLink
                href="/dashboard?tab=formCampaigns"
                className="mt-8 w-full py-3 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-center transition-colors block active:scale-[0.98]"
              >
                {isEn ? "Configure 5,000 Forms" : isVi ? "Cấu hình gói 5.000 Form" : "このプランで配信設定する"}
              </LocaleLink>
            </div>
          </div>

          {/* Large Volume / Enterprise Notice */}
          <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
            <p>
              {isEn
                ? "※ 10,000+ volume, custom list delivery, or API integrations are also available."
                : isVi
                ? "※ Các nhu cầu gửi từ 10.000 form trở lên, gửi theo danh sách riêng hoặc tích hợp API vui lòng liên hệ tư vấn."
                : "※ 10,000件以上の大口配信、貴社保有ハウスリストへの配信代行、API連携などのご相談も承っております。"}
            </p>
            <LocaleLink href="/contact" className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold inline-flex items-center gap-1">
              <span>{isEn ? "Inquire about Enterprise / Bulk Outreach" : isVi ? "Liên hệ tư vấn gói Doanh nghiệp lớn" : "大口・エンタープライズ配信のご相談はこちら"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </LocaleLink>
          </div>
        </section>

        {/* 4-Step Process Section */}
        <section className="max-w-5xl mx-auto w-full py-4">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {isEn ? "How It Works: 4 Simple Steps" : isVi ? "Quy Trình 4 Bước Đơn Giản" : "配信開始までのカンタン4ステップ"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEn ? "Launch your outreach campaign completely self-serve in minutes." : isVi ? "Thiết lập và khởi chạy chiến dịch hoàn toàn trực tuyến trong vài phút." : "管理画面からオンライン完結。最短即日でターゲット企業へのアプローチを開始できます。"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-mono font-bold text-xs flex items-center justify-center">01</div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{isEn ? "Target Filtering" : isVi ? "Lọc đối tượng" : "ターゲット抽出"}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{isEn ? "Filter target companies from 5M+ database by industry, capital, and headcount." : isVi ? "Lọc doanh nghiệp mục tiêu theo ngành nghề, vốn, nhân sự từ hệ thống." : "500万社DBから業種・資本金・従業員数・地域でアプローチ先を絞り込み。"}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-mono font-bold text-xs flex items-center justify-center">02</div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{isEn ? "Pitch Template" : isVi ? "Soạn kịch bản" : "営業文面の作成"}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{isEn ? "Choose from Keigo templates or input your customized pitch copy." : isVi ? "Dùng mẫu kịch bản kính ngữ có sẵn hoặc nhập nội dung tùy chỉnh của bạn." : "業種別テンプレートを活用し、自社サービスの特徴を当てはめて作成。"}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-mono font-bold text-xs flex items-center justify-center">03</div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{isEn ? "Review & Payment" : isVi ? "Thanh toán & Duyệt" : "決済＆事前審査"}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{isEn ? "Online credit card payment and fast Tokushoho compliance review by staff." : isVi ? "Thanh toán trực tuyến và đội ngũ duyệt tuân thủ Tokushoho trong 2-4h." : "カード決済完了後、運営スタッフが特商法表記とNGワードを迅速審査。"}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-mono font-bold text-xs flex items-center justify-center">04</div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{isEn ? "Dispatch & CSV Logs" : isVi ? "Gửi & Tải báo cáo" : "自動配信＆レポート"}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{isEn ? "Automated delivery runs with AI skips; download complete CSV logs anytime." : isVi ? "Hệ thống tự động gửi form và cho phép tải file báo cáo CSV bất cứ lúc nào." : "AI除外を適用して自動配信。完了後は送信証跡CSVを即座にダウンロード。"}</p>
            </div>
          </div>
        </section>

        {/* 4 Core Features / Safeguards */}
        <section className="max-w-5xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {isEn ? "Why Choose Kigyou-list Form Outreach" : isVi ? "4 Lợi Thế Vượt Trội Của Hệ Thống" : "Kigyou-list が選ばれる4つの強み"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEn ? "Ensuring high response rates with legal compliance safeguards." : isVi ? "Đảm bảo tỷ lệ phản hồi cao song hành với bảo vệ thương hiệu tuyệt đối." : "高い反響率と法令遵守の両立を支えるセルフサービステクノロジー。"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 flex items-start gap-4 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {isEn ? "AI Anti-Sales Disclaimer Detector" : isVi ? "AI Bỏ qua Form Cấm Chào Hàng" : "AI「営業お断り」自動検知・除外フィルター"}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isEn ? "Scans page DOM for anti-sales keywords before submitting to prevent complaints." : isVi ? "Tự động phát hiện các ghi chú cấm quảng cáo trên trang để bỏ qua, ngăn ngừa khiếu nại." : "「営業目的の連絡はお断り」等の文言をAIが検知。該当企業を自動スキップしブランド価値を守ります。"}
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 flex items-start gap-4 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {isEn ? "Pre-Dispatch Compliance Review" : isVi ? "Duyệt Kịch Bản Tuân Thủ Tokushoho" : "運営スタッフによる事前法令・NGワード審査"}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isEn ? "Human verification of Tokushoho sender disclosure and opt-out clauses within 2-4 hours." : isVi ? "Đội ngũ chuyên trách kiểm tra thông tin pháp nhân và câu từ chối nhận tin trong 2-4 giờ." : "特定商取引法に基づく発信者情報やオプトアウト表記を専任スタッフが迅速に事前確認（最短2時間）。"}
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 flex items-start gap-4 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {isEn ? "Hyper-Targeting from 5M+ Companies" : isVi ? "Nhắm Chọn Chuẩn Xác Từ 5M+ Công Ty" : "500万社DBから高精度ターゲティング"}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isEn ? "Filter by industry code, capital, employee size, and hiring signals." : isVi ? "Lọc theo mã ngành JSIC, quy mô vốn, nhân viên và các tín hiệu tuyển dụng." : "JSIC業界分類、資本金、従業員数、都道府県などの条件で真の見込み客だけを抽出。"}
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 flex items-start gap-4 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {isEn ? "Live Dashboard & CSV Audit Logs" : isVi ? "Báo Cáo Minh Bạch & File CSV" : "リアルタイム管理画面 & CSV証跡レポート"}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isEn ? "Track delivery status live and export complete CSV audit files with timestamps and URLs." : isVi ? "Theo dõi tiến độ trực tiếp và xuất file báo cáo đầy đủ link form, thời điểm gửi." : "送信進捗をダッシュボードで確認。完了後は送信先URLや日時を網羅したCSVをダウンロード可能。"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Form Outreach FAQs */}
        <section className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-6">
            <HelpCircle className="w-7 h-7 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {isEn ? "Frequently Asked Questions (Form Outreach)" : isVi ? "Câu Hỏi Thường Gặp (Form Outreach)" : "フォーム営業に関するよくあるご質問"}
            </h3>
          </div>

          <div className="space-y-3">
            {formFaqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-5 bg-white border border-slate-200/80 dark:bg-[#161B22] dark:border-slate-800 rounded-2xl shadow-xs"
              >
                <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-start gap-2.5 mb-2">
                  <span className="w-5 h-5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono mt-0.5">Q</span>
                  <span>{faq.q}</span>
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7.5">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom Form DM CTA */}
        <section className="max-w-5xl mx-auto w-full">
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 sm:p-10 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="space-y-2 max-w-xl">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full w-fit mx-auto md:mx-0 block">
                {isEn ? "READY TO LAUNCH" : isVi ? "BẮT ĐẦU NGAY" : "最短即日オンライン配信"}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {isEn ? "Start Your Form Outreach Campaign" : isVi ? "Khởi Tạo Chiến Dịch Tiếp Cận B2B Ngay" : "自社の営業文面を管理画面で即時配信"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {isEn
                  ? "Zero setup fees. Filter prospects and create your campaign draft in dashboard right now."
                  : isVi
                  ? "Không phí khởi tạo. Chọn tệp khách hàng và lên kịch bản nháp trên Dashboard ngay bây giờ."
                  : "初期費用ゼロ。管理画面から500万社DBを絞り込み、下書き文面を作成してお試しいただけます。"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <LocaleLink
                href="/dashboard?tab=formCampaigns"
                className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <span>{isEn ? "Go to Form DM Dashboard" : isVi ? "Đến Dashboard Gửi Form" : "管理画面でキャンペーン作成"}</span>
                <ArrowRight className="w-4 h-4" />
              </LocaleLink>
              <button
                type="button"
                onClick={() => handleTabChange("data")}
                className="w-full sm:w-auto px-5 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isEn ? "View Data Plans" : isVi ? "Xem bảng giá Dữ liệu" : "企業データプランを見る"}</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    )}
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
