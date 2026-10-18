"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useLanguage } from "@/context/LanguageContext";
import { LocaleLink } from "@/components/LocaleLink";
import { 
  Check, Info, ShieldCheck, CreditCard, 
  HelpCircle, Coins, ArrowRight, Loader2, Star, Clock, ChevronRight,
  Database, Send, Target, BarChart3, FileText, CheckCircle2,
  Building2, Minus, Receipt, Lock, Banknote, BadgePercent,
  Phone, Mail, Calculator, Copy, FileCheck, TrendingUp, Sliders
} from "lucide-react";
import { trackBeginCheckout } from "@/lib/gtag";

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

interface FormPlanDetails {
  id: "form_1k" | "form_3k" | "form_5k";
  name: string;
  count: number;
  listPrice: number;
  campaignPrice: number;
  unitPrice: number;
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
  const [showFormCheckoutModal, setShowFormCheckoutModal] = useState<FormPlanDetails | null>(null);

  const formPlans: FormPlanDetails[] = [
    {
      id: "form_1k",
      name: isEn ? "Starter (1,000 Forms)" : isVi ? "Gói Starter 1.000 Form" : "1,000 件プラン",
      count: 1000,
      listPrice: 28000,
      campaignPrice: 8400,
      unitPrice: 8.4,
      description: isEn ? "Ideal for testing product-market fit" : isVi ? "Thử nghiệm phản hồi thị trường" : "まずは効果検証・テスト送信に最適",
      recommended: false
    },
    {
      id: "form_3k",
      name: isEn ? "Standard (3,000 Forms)" : isVi ? "Gói Standard 3.000 Form" : "3,000 件プラン",
      count: 3000,
      listPrice: 69000,
      campaignPrice: 20700,
      unitPrice: 6.9,
      description: isEn ? "Optimal for scalable lead generation" : isVi ? "Đạt lượng chuyển đổi cuộc hẹn ổn định" : "本格的なリード獲得・商談創出に",
      recommended: true
    },
    {
      id: "form_5k",
      name: isEn ? "Enterprise (5,000 Forms)" : isVi ? "Gói Enterprise 5.000 Form" : "5,000 件プラン",
      count: 5000,
      listPrice: 99000,
      campaignPrice: 29700,
      unitPrice: 5.9,
      description: isEn ? "Maximum appointment pipeline volume" : isVi ? "Quy mô lớn, chi phí trên mỗi form rẻ nhất" : "大量アプローチで商談数を最大化",
      recommended: false
    }
  ];

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

  // Outreach ROI Simulator state
  const [simVolume, setSimVolume] = useState<number>(3000);
  const [simCvr, setSimCvr] = useState<number>(0.8);
  const [activeTemplateTab, setActiveTemplateTab] = useState<string>("it_saas");
  const [copiedTemplate, setCopiedTemplate] = useState<boolean>(false);

  const getSimPricing = (vol: number) => {
    switch (vol) {
      case 1000:
        return { listPrice: 28000, campaignPrice: 8400, taxIncl: 9240, unitRate: 8.4, plan: formPlans[0] };
      case 3000:
        return { listPrice: 69000, campaignPrice: 20700, taxIncl: 22770, unitRate: 6.9, plan: formPlans[1] };
      case 5000:
        return { listPrice: 99000, campaignPrice: 29700, taxIncl: 32670, unitRate: 5.9, plan: formPlans[2] };
      case 10000:
      default:
        return { listPrice: 180000, campaignPrice: 54000, taxIncl: 59400, unitRate: 5.4, plan: null };
    }
  };

  const outreachTemplates = [
    {
      id: "it_saas",
      name: isEn ? "IT / Cloud / SaaS" : isVi ? "CNTT / Điện toán đám mây / SaaS" : "IT・SaaS・クラウド導入",
      tag: "SaaS・DX推進",
      subject: "【業務効率化のご提案】貴社業務の工数削減を支援するソリューションのご案内",
      body: `突然のご連絡にて大変恐縮でございます。
TQC株式会社の営業担当でございます。

貴社の事業展開をWebサイトにて拝見し、特に業務運営の効率化やDX推進において、お役に立てる可能性が高いと存じ、ご連絡差し上げました。

現在、多くの同業企業様において、
・手作業による事務処理工数の増大
・複数ツール併用によるデータ連携の不備
といった課題が顕在化しております。

弊社が提供するソリューションでは、導入初月より現場の作業工数を平均42%削減し、月額コストも従来比で大幅に抑制することが可能です。

まずは15分ほど、オンラインにて貴社の現状課題をお伺いし、他社様の成功事例をご共有できれば幸甚に存じます。

ご多忙の折、誠に恐れ入りますが、ご興味をお持ちいただけましたら本メールまたは下記よりご都合のよろしい日程をご指定いただけますと幸いです。

▼ オンライン日程調整URL
https://kigyoulist.com/contact

--------------------------------------------------
※特定商取引法に基づく表記
送信事業者：TQC株式会社
所在地：〒171-0022 東京都豊島区南池袋1-16-15
お問い合わせ：info@kigyoulist.com
配信停止をご希望の場合は、大変お手数ですが本返信にて「配信停止」とご返信くださいますようお願い申し上げます。
--------------------------------------------------`
    },
    {
      id: "hr_recruiting",
      name: isEn ? "Recruitment / HR / Dispatch" : isVi ? "Tuyển dụng / Nhân sự / Phái cử" : "採用・人材紹介・派遣",
      tag: "中途・即戦力採用",
      subject: "【即戦力人材のご提案】貴社事業拡大に伴う中途採用支援のご案内",
      body: `突然のご連絡にて大変恐礼申し上げます。
人材ソリューション事業部でございます。

貴社が現在、事業拡大に伴い積極的な採用活動を展開されていることを拝見し、貴社の求める人物像に合致する即戦力人材のご紹介が可能ではないかと考え、ご連絡いたしました。

昨今の人材採用市場では、
・求人媒体の掲載費が高騰しているにもかかわらず応募が集まらない
・面談後の辞退やミスマッチが多い
といったお悩みを多数伺っております。

弊社では、業界特化型の独自データベースより、貴社の求める要件にピンポイントで合致する候補者を完全成功報酬型にてご紹介しております。初期費用・月額費用は一切発生いたしません。

もし現在、急募ポジションや採用難航職種がございましたら、求人要件のヒアリングと候補者リストのサンプル提示（無料）をさせていただければ幸いです。

ご多用のところ恐縮ですが、ご検討のほど何卒よろしくお願い申し上げます。

--------------------------------------------------
※特定商取引法に基づく表記
送信事業者：TQC株式会社
所在地：〒171-0022 東京都豊島区南池袋1-16-15
お問い合わせ：info@kigyoulist.com
配信停止をご希望の場合は、本メール宛に「配信不要」とご返信をお願い申し上げます。
--------------------------------------------------`
    },
    {
      id: "consulting_ma",
      name: isEn ? "Consulting / M&A / Professional" : isVi ? "Tư vấn / M&A / Dịch vụ Luật - Thuế" : "士業・M&A・経営コンサル",
      tag: "事業承継・財務改善",
      subject: "【経営課題のご相談】貴社業界における事業承継・提携戦略に関する情報提供",
      body: `突然の不躾なご連絡を深くお詫び申し上げます。
経営戦略コンサルティング部門の担当者でございます。

貴社の長年にわたる堅実な事業展開および業界内での高い実績を拝見し、代表者様または経営企画のご担当者様に向けて、今後の事業拡大および資本提携・事業承継に関する最新動向をお届けしたく、ご連絡差し上げました。

現在、貴社業界におきましては、後継者問題の解決やシナジー創出を目的とした友好的な提携・M&Aの動きが急速に活発化しております。

弊社では、貴社の企業価値を最大限に評価する優良企業とのマッチング実績を多数有しており、完全秘密保持のもとで無料の企業価値簡易試算を実施しております。

ご多用の折、急ぎのご判断を求めるものでは一切ございません。今後の経営戦略の一つの選択肢として、業界動向レポート（PDF）をお送りすることも可能です。

少しでもご関心がございましたら、ご返信を賜れますと幸甚に存じます。

--------------------------------------------------
※特定商取引法に基づく表記
送信事業者：TQC株式会社
所在地：〒171-0022 東京都豊島区南池袋1-16-15
お問い合わせ：info@kigyoulist.com
配信停止をご希望の場合は、「案内不要」とご一報ください。
--------------------------------------------------`
    },
    {
      id: "manufacturing",
      name: isEn ? "Manufacturing / OEM / Contract" : isVi ? "Sản xuất / OEM / Gia công ủy thác" : "製造・受託開発・OEM",
      tag: "試作・量産コスト削減",
      subject: "【加工技術・短納期対応のご提案】精密部品試作および調達コスト適正化のご案内",
      body: `突然のご連絡にて失礼いたします。
技術営業部でございます。

貴社が開発・製造されている高付加価値製品を拝見し、弊社の加工設備およびサプライチェーンを活用することで、部品調達のリードタイム短縮およびコスト削減に寄与できると考え、ご連絡いたしました。

弊社では、
・小ロット・試作品の最短3日出荷対応
・量産時における金型費用の30%抑制
・難削材や特殊加工への柔軟な技術対応
を強みとしており、大手メーカー様から精密機器メーカー様まで多数のお取引実績がございます。

現在ご検討中の図面や、既存調達先でのコスト・納期にご課題がございましたら、相見積もりだけでも迅速に対応させていただきます。

ご担当部署の皆様にご共有いただけますと幸いです。何卒よろしくお願い申し上げます。

--------------------------------------------------
※特定商取引法に基づく表記
送信事業者：TQC株式会社
所在地：〒171-0022 東京都豊島区南池袋1-16-15
お問い合わせ：info@kigyoulist.com
配信停止をご希望の場合は、「不要」とご返信をお願い申し上げます。
--------------------------------------------------`
    }
  ];

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
        "20 CSV exports per day (50 for verified business)",
        "Full access to contact & sales intent filters",
        "View company profiles, FAX, shareholders & signals"
      ] : isVi ? [
        "Tải xuống 20 dòng CSV mỗi ngày (50 dòng nếu định danh doanh nghiệp)",
        "Mở toàn bộ bộ lọc kênh liên hệ & tín hiệu kinh doanh",
        "Xem toàn bộ chi tiết doanh nghiệp, số FAX & cổ đông"
      ] : [
        "毎日 20 件の CSV ダウンロード枠 (企業認証で50件/日)",
        "全検索条件・営業シグナル・連絡先絞り込みの利用",
        "企業詳細プロフィール・FAX・主要株主の閲覧"
      ]
    },
    {
      id: "pro",
      name: isEn ? "PRO Plan" : isVi ? "Gói PRO" : "PROプラン",
      listPrice: 4200,
      campaignPrice: 1260,
      referralPrice: 2100,
      quota: isEn ? "2,000 rows / month" : isVi ? "2.000 dòng / tháng" : "2,000 行 / 月",
      quotaNum: 2000,
      description: isEn ? "Ideal for sole proprietors & salespeople running outreach" : isVi ? "Lý tưởng cho cá nhân kinh doanh & nhân viên bán hàng tiếp cận khách hàng" : "テレアポ・DM営業を始めたい個人事業主や営業マンに最適",
      features: isEn ? [
        "2,000 CSV downloads per month",
        "API integration (Key issuance & CRM/ERP syncing)",
        "Email address disclosure",
        "ABM Kanban CRM board",
        "Filter by email/phone availability"
      ] : isVi ? [
        "Tải xuống 2.000 dòng CSV mỗi tháng",
        "Tích hợp API (Cấp khóa API & đồng bộ CRM/ERP)",
        "Mở khóa địa chỉ email doanh nghiệp",
        "Bảng quản lý phễu CRM Kanban ABM",
        "Lọc theo sự tồn tại của email/số điện thoại"
      ] : [
        "毎月 2,000 件の CSV ダウンロード枠",
        "API連携 (API Key 発行・外部CRM/ERP連携)",
        "メールアドレスの開示",
        "ABM かんばん営業管理 CRM ボード",
        "連絡先情報（電話・メール）の有無での絞り込み"
      ]
    },
    {
      id: "business",
      name: isEn ? "BUSINESS Plan" : isVi ? "Gói BUSINESS" : "BUSINESSプラン",
      listPrice: 14000,
      campaignPrice: 4200,
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
      campaignPrice: 12600,
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
    trackBeginCheckout(plan.id, plan.name, plan.campaignPrice || plan.listPrice);
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
    setShowPackCheckoutModal(pack);
    trackBeginCheckout(pack.id, pack.name, pack.price);
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

  const handleFormCheckoutClick = (plan: FormPlanDetails) => {
    if (!isLoggedIn) {
      setAuthModalOpen(true);
      return;
    }
    setShowFormCheckoutModal(plan);
    trackBeginCheckout(plan.id, plan.name, plan.campaignPrice || plan.listPrice);
  };

  const handleFormSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showFormCheckoutModal) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          formPlanId: showFormCheckoutModal.id
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
        <section className="text-center max-w-4xl mx-auto flex flex-col gap-3" style={{ fontFeatureSettings: '"palt"' }}>
          <span className="text-[11px] font-bold text-[#1B4F8A] dark:text-blue-300 uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 px-3 py-1 rounded-md w-fit mx-auto">
            {t.pricing.tagline}
          </span>
          <h1 className="text-[clamp(20px,4vw,36px)] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
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
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto font-normal">
            {t.pricing.desc}
          </p>
        </section>

        {/* Service Type Switcher Tabs */}
        <section className="max-w-xl mx-auto w-full">
          <div className="p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg flex items-center gap-1 border border-slate-200/90 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              onClick={() => handleTabChange("data")}
              className={`flex-1 py-2 px-4 rounded-md font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                pricingTab === "data"
                  ? "bg-white dark:bg-[#151B22] text-[#1B4F8A] dark:text-blue-400 shadow-2xs border border-slate-200/80 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Database className={`w-4 h-4 ${pricingTab === "data" ? "text-[#1B4F8A] dark:text-blue-400" : "text-slate-400"}`} />
              <span>{isEn ? "Corporate Data & CSV" : isVi ? "Dữ liệu & Xuất CSV" : "企業データ・CSV抽出"}</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("form")}
              className={`flex-1 py-2 px-4 rounded-md font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                pricingTab === "form"
                  ? "bg-white dark:bg-[#151B22] text-[#1B4F8A] dark:text-blue-400 shadow-2xs border border-slate-200/80 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Send className={`w-4 h-4 ${pricingTab === "form" ? "text-[#1B4F8A] dark:text-blue-400" : "text-slate-400"}`} />
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

            {/* Campaign Discount Announcement & Coupon */}
            <section className="flex flex-col items-center gap-3.5">
              <div className="p-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 rounded-lg flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 px-4 py-2 shadow-2xs">
                <BadgePercent className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400 shrink-0" />
                <span>{t.pricing.campaignApplied}</span>
              </div>
              
              {appliedCoupon ? (
                <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-lg dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-300 max-w-md text-center leading-relaxed font-bold">
                  ✓ <strong>{t.pricing.couponAppliedTitle}</strong> {t.pricing.couponAppliedDesc}
                </p>
              ) : (
                <p className="text-xs text-slate-500 text-center max-w-md leading-relaxed">
                  {t.pricing.campaignNotice}
                </p>
              )}

              {/* Coupon Input Area */}
              <div className="mt-1 flex flex-col items-center w-full max-w-xs relative z-10">
                <div className="flex w-full relative shadow-2xs">
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
                    className="w-full text-xs px-3.5 py-2.5 rounded-l-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151B22] text-slate-800 dark:text-slate-200 outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A]"
                  />
                  <button
                    onClick={verifyCouponCode}
                    disabled={verifyingCoupon || !couponInput.trim() || couponInput === appliedCoupon}
                    className="px-4 py-2.5 bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold rounded-r-lg transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
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
            let savingsPercent = 70;
            let currentPrice = plan.campaignPrice;
            
            if (appliedCoupon && couponDiscount) {
              savingsPercent = couponDiscount;
              currentPrice = Math.floor(listPrice * (1 - couponDiscount / 100));
            }

            const currentPriceWithTax = Math.floor(currentPrice * 1.1);
            const listPriceWithTax = Math.floor(listPrice * 1.1);
            
            return (
              <div 
                key={plan.id}
                className={`rounded-xl border flex flex-col justify-between transition-all duration-200 relative ${
                  plan.recommended
                    ? "bg-white border-2 border-[#1B4F8A] shadow-xs dark:bg-[#151B22] dark:border-blue-500 z-10"
                    : "bg-white border border-slate-200/90 hover:border-slate-300 dark:bg-[#151B22] dark:border-slate-800 dark:hover:border-slate-700 shadow-2xs"
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-md bg-[#1B4F8A] text-[10px] font-bold text-white uppercase tracking-wider shadow-2xs flex items-center gap-1.5 border border-white/20 whitespace-nowrap">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                    {t.pricing.bestValue}
                  </div>
                )}

                {/* Plan Header */}
                <div className="p-5 sm:p-6 flex flex-col border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {plan.name}
                  </span>
                  
                  {/* Price display with Tax specification (総額表示義務対応) */}
                  <div className="mt-2.5 flex items-baseline gap-2 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums font-mono">
                      {plan.id === "free" ? (isEn ? "Free" : isVi ? "Miễn phí" : "無料") : `¥${currentPrice.toLocaleString()}`}
                    </span>
                    {plan.id !== "free" && (
                      <span className="text-xs text-rose-600 font-bold">
                        / {isEn ? "1st mo" : isVi ? "tháng đầu" : "初月"}
                        <span className="text-[10px] font-normal text-slate-400 ml-1">({isEn ? "excl. tax" : isVi ? "chưa VAT" : "税抜"})</span>
                      </span>
                    )}
                  </div>

                  {plan.id !== "free" ? (
                    <div className="mt-1.5 flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="line-through text-slate-400 tabular-nums font-mono">
                          ¥{listPrice.toLocaleString()}
                        </span>
                        <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400 text-[10px] tabular-nums font-mono">
                          {savingsPercent}% OFF
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums font-mono">
                        <span className="text-slate-600 dark:text-slate-300 font-semibold">
                          {isEn ? `Incl. Tax: ¥${currentPriceWithTax.toLocaleString()}` : isVi ? `Đã gồm thuế: ¥${currentPriceWithTax.toLocaleString()}` : `税込 ¥${currentPriceWithTax.toLocaleString()} / 初月`}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {isEn 
                            ? `2nd mo+: ¥${listPrice.toLocaleString()} (incl. tax ¥${listPriceWithTax.toLocaleString()})/mo` 
                            : isVi 
                            ? `Từ tháng 2: ¥${listPrice.toLocaleString()} (gồm thuế ¥${listPriceWithTax.toLocaleString()})/tháng` 
                            : `2ヶ月目以降: ¥${listPrice.toLocaleString()}（税込 ¥${listPriceWithTax.toLocaleString()}）/月`}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold text-[10px] bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/50 px-2 py-0.5 rounded w-fit">
                      {t.pricing.initialCost}
                    </div>
                  )}

                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed min-h-[38px] font-normal" style={{ fontFeatureSettings: '"palt"' }}>
                    {plan.description}
                  </p>

                  <div className="mt-4 p-2.5 bg-slate-50 dark:bg-[#0D1117] rounded-lg border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{t.pricing.exportQuota}</span>
                    <strong className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 flex items-center gap-1.5 tabular-nums font-mono">
                      <Coins className="w-3.5 h-3.5" />
                      {plan.quota}
                    </strong>
                  </div>
                </div>

                {/* Plan Features */}
                <div className="p-5 sm:p-6 flex-grow flex flex-col gap-3.5">
                  <h5 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    {t.pricing.featuresTitle}
                  </h5>
                  <ul className="flex flex-col gap-2.5">
                    {plan.features.map((feature, idx) => {
                      const isComingSoon = feature.includes("(開発中)") || feature.includes("（開発中）") || feature.includes("(In Dev)");
                      const cleanFeature = feature.replace(/\s*[\(（](開発中|In Dev)[\)）]/, "");
                      return (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                          {isComingSoon ? (
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          )}
                          <span className={`leading-relaxed flex flex-wrap items-center gap-1.5 ${isComingSoon ? "text-slate-400 dark:text-slate-500" : ""}`} style={{ fontFeatureSettings: '"palt"' }}>
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
                <div className="p-5 sm:p-6 pt-0 mt-auto">
                  <button
                    onClick={() => handleCheckoutClick(plan)}
                    disabled={plan.id === "free" && isLoggedIn}
                    className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                      plan.id === "free" && isLoggedIn
                        ? "bg-slate-50 text-slate-400 border border-slate-200 dark:bg-slate-900/10 dark:border-slate-800 dark:text-slate-500 cursor-default shadow-none"
                        : plan.recommended
                        ? "bg-[#1B4F8A] hover:bg-[#143D6C] text-white shadow-2xs cursor-pointer active:scale-[0.99]"
                        : plan.id === "pro"
                        ? "bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 shadow-2xs cursor-pointer active:scale-[0.99]"
                        : "border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-[#151B22] dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs cursor-pointer active:scale-[0.99]"
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

        {/* ======================================================== */}
        {/* === FEATURE COMPARISON MATRIX (稟議書・機能詳細比較表) ==== */}
        {/* ======================================================== */}
        <section className="bg-white border border-slate-200/90 dark:bg-[#151B22] dark:border-slate-800 rounded-xl p-6 md:p-8 shadow-xs max-w-7xl mx-auto w-full flex flex-col gap-6 relative" style={{ fontFeatureSettings: '"palt"' }}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
            <div>
              <span className="text-[11px] font-bold text-[#1B4F8A] dark:text-blue-300 uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 px-2.5 py-0.5 rounded-md inline-block mb-2">
                {isEn ? "DETAILED FEATURE MATRIX" : isVi ? "MA TRẬN TÍNH NĂNG CHI TIẾT" : "詳細機能比較・稟議用マトリクス"}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isEn ? "Full Feature Matrix by Plan" : isVi ? "Bảng So Sánh Chi Tiết Tính Năng 4 Gói" : "全プラン機能詳細対照表"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isEn 
                  ? "Compare data attributes, export mechanisms, API access, and enterprise SLAs." 
                  : isVi 
                  ? "Đối chiếu chi tiết trường dữ liệu, hạn ngạch xuất CSV ngầm Mechanism B, tích hợp API và hỗ trợ kỹ thuật." 
                  : "社内稟議や比較検討にご活用いただける詳細比較表です。全項目の対応可否をご確認いただけます。"}
              </p>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-3">
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> ● : {isEn ? "Included" : isVi ? "Hỗ trợ" : "標準対応"}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-slate-400">
                <Minus className="w-3.5 h-3.5" /> : {isEn ? "Not included" : isVi ? "Không" : "非対応"}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto relative -mx-2 sm:mx-0">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 min-w-[220px] rounded-l-lg">{isEn ? "Category / Feature" : isVi ? "Hạng mục / Tính năng" : "機能・比較項目"}</th>
                  <th className="py-3 px-3 text-center min-w-[100px]">FREE</th>
                  <th className="py-3 px-3 text-center min-w-[120px]">PRO</th>
                  <th className="py-3 px-3 text-center min-w-[130px] bg-blue-50/80 dark:bg-blue-950/60 text-[#1B4F8A] dark:text-blue-300 border-x border-blue-200/80 dark:border-blue-900/60 font-extrabold">
                    BUSINESS ★
                  </th>
                  <th className="py-3 px-3 text-center min-w-[130px] rounded-r-lg">ENTERPRISE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300">
                {/* Category 1: 企業データ検索・閲覧 */}
                <tr className="bg-slate-50/70 dark:bg-slate-900/30">
                  <td colSpan={5} className="py-2.5 px-4 font-bold text-slate-900 dark:text-white text-[11px] tracking-wider uppercase flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-[#1B4F8A]" />
                    <span>{isEn ? "1. Corporate Data & Filtering" : isVi ? "1. Tra cứu & Trường dữ liệu" : "1. 企業データ検索・閲覧機能"}</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/40 dark:hover:bg-[#12161E]">
                  <td className="py-3 px-4 font-medium">{isEn ? "5M+ Companies Full Database Search" : isVi ? "Tìm kiếm toàn bộ 5M+ doanh nghiệp" : "500万社データベース全件検索（業種・地域・資本金・従業員数・売上高）"}</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-200/60 dark:border-blue-900/40">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                </tr>
                <tr className="hover:bg-slate-50/40 dark:hover:bg-[#12161E]">
                  <td className="py-3 px-4 font-medium">{isEn ? "Company profile, Address, Representative & Establishment" : isVi ? "Hồ sơ công ty, Đại diện pháp luật, Đăng ký kinh doanh" : "企業詳細プロフィール・代表者名・登記住所・設立年月"}</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-200/60 dark:border-blue-900/40">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                </tr>
                <tr className="hover:bg-slate-50/40 dark:hover:bg-[#12161E]">
                  <td className="py-3 px-4 font-medium">{isEn ? "Phone number & Official Website URL" : isVi ? "Số điện thoại đại diện & Link Website chính thức" : "代表電話番号・公式WebサイトURL"}</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-200/60 dark:border-blue-900/40">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                </tr>
                <tr className="hover:bg-slate-50/40 dark:hover:bg-[#12161E]">
                  <td className="py-3 px-4 font-medium">{isEn ? "FAX number & Major Shareholders" : isVi ? "Số FAX & Danh sách cổ đông chính" : "FAX番号・大株主構成（要無料会員登録）"}</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-200/60 dark:border-blue-900/40">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                </tr>
                <tr className="hover:bg-slate-50/40 dark:hover:bg-[#12161E]">
                  <td className="py-3 px-4 font-medium">{isEn ? "Sales Intent Signals (Hiring, Subsidies, Bidding, Awards, Patents)" : isVi ? "Tín hiệu kinh doanh (Tuyển dụng, Trợ cấp, Đấu thầu, Bằng sáng chế)" : "営業活動シグナル連携（求人活動・国の補助金受給・入札実績・特許・表彰）"}</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-200/60 dark:border-blue-900/40">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                </tr>
                <tr className="hover:bg-slate-50/40 dark:hover:bg-[#12161E]">
                  <td className="py-3 px-4 font-medium">{isEn ? "Corporate Email Address Disclosure" : isVi ? "Mở khóa địa chỉ email doanh nghiệp" : "企業の開示メールアドレス閲覧"}</td>
                  <td className="py-3 px-3 text-center text-slate-300 dark:text-slate-600"><Minus className="w-3.5 h-3.5 mx-auto" /></td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-200/60 dark:border-blue-900/40">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                </tr>
                <tr className="hover:bg-slate-50/40 dark:hover:bg-[#12161E]">
                  <td className="py-3 px-4 font-medium">{isEn ? "Filter by Contact Availability (Email / Phone)" : isVi ? "Lọc theo sự tồn tại của Email / Số điện thoại" : "連絡先（メール・電話）有無での絞り込み検索"}</td>
                  <td className="py-3 px-3 text-center text-slate-300 dark:text-slate-600"><Minus className="w-3.5 h-3.5 mx-auto" /></td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-200/60 dark:border-blue-900/40">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                </tr>

                {/* Category 2: データ抽出・CSVエクスポート */}
                <tr className="bg-slate-50/70 dark:bg-slate-900/30">
                  <td colSpan={5} className="py-2.5 px-4 font-bold text-slate-900 dark:text-white text-[11px] tracking-wider uppercase flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#1B4F8A]" />
                    <span>{isEn ? "2. Data Export & CSV Quota" : isVi ? "2. Hạn ngạch & Xuất CSV" : "2. データ抽出・CSVエクスポート"}</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/40 dark:hover:bg-[#12161E]">
                  <td className="py-3 px-4 font-medium">{isEn ? "Monthly CSV Download Quota" : isVi ? "Hạn ngạch tải CSV hàng tháng" : "月間 CSV ダウンロード枠"}</td>
                  <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200 tabular-nums">20件/日 (認証50件)</td>
                  <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200 tabular-nums">2,000 件 / 月</td>
                  <td className="py-3 px-3 text-center font-bold text-[#1B4F8A] dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-200/60 dark:border-blue-900/40 tabular-nums">
                    10,000 件 / 月
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200 tabular-nums">40,000 件 / 月</td>
                </tr>
                <tr className="hover:bg-slate-50/40 dark:hover:bg-[#12161E]">
                  <td className="py-3 px-4 font-medium">{isEn ? "Mechanism B Background Bulk Export (>10,000 items)" : isVi ? "Mechanism B tải ngầm dữ liệu lớn (>10.000 dòng)" : "Mechanism B バックグラウンド一括ダウンロード（1万件超の大量抽出）"}</td>
                  <td className="py-3 px-3 text-center text-slate-300 dark:text-slate-600"><Minus className="w-3.5 h-3.5 mx-auto" /></td>
                  <td className="py-3 px-3 text-center text-slate-300 dark:text-slate-600"><Minus className="w-3.5 h-3.5 mx-auto" /></td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-200/60 dark:border-blue-900/40">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                </tr>
                <tr className="hover:bg-slate-50/40 dark:hover:bg-[#12161E]">
                  <td className="py-3 px-4 font-medium">{isEn ? "Right to purchase Non-expiring Add-on Quota Packs" : isVi ? "Quyền mua các gói bổ sung không hết hạn (Add-on)" : "無期限引き継ぎ追加容量パックの購入権"}</td>
                  <td className="py-3 px-3 text-center text-slate-300 dark:text-slate-600"><Minus className="w-3.5 h-3.5 mx-auto" /></td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-200/60 dark:border-blue-900/40">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                </tr>

                {/* Category 3: 営業管理 & システム連携 */}
                <tr className="bg-slate-50/70 dark:bg-slate-900/30">
                  <td colSpan={5} className="py-2.5 px-4 font-bold text-slate-900 dark:text-white text-[11px] tracking-wider uppercase flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[#1B4F8A]" />
                    <span>{isEn ? "3. Sales CRM & API Integration" : isVi ? "3. Quản lý CRM & Tích hợp API" : "3. 営業管理 ＆ システム連携"}</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/40 dark:hover:bg-[#12161E]">
                  <td className="py-3 px-4 font-medium">{isEn ? "ABM Kanban CRM Pipeline Management" : isVi ? "Bảng quản lý quy trình ABM Kanban" : "ABM かんばん営業管理ボード"}</td>
                  <td className="py-3 px-3 text-center text-slate-500 font-medium">簡易版</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">● (無制限)</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-200/60 dark:border-blue-900/40">● (無制限)</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">● (無制限)</td>
                </tr>
                <tr className="hover:bg-slate-50/40 dark:hover:bg-[#12161E]">
                  <td className="py-3 px-4 font-medium">{isEn ? "MyList Bookmark Storage Capacity" : isVi ? "Dung lượng lưu trữ MyList" : "マイリスト保存企業枠"}</td>
                  <td className="py-3 px-3 text-center text-slate-600 font-mono tabular-nums">100社</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">無制限</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-200/60 dark:border-blue-900/40">無制限</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">無制限</td>
                </tr>
                <tr className="hover:bg-slate-50/40 dark:hover:bg-[#12161E]">
                  <td className="py-3 px-4 font-medium">{isEn ? "REST API Access (API Key, CRM/ERP Integration)" : isVi ? "Tích hợp REST API (Cấp API Key, kết nối CRM/ERP)" : "REST API連携（API Key 発行・外部CRM/ERP自動同期）"}</td>
                  <td className="py-3 px-3 text-center text-slate-300 dark:text-slate-600"><Minus className="w-3.5 h-3.5 mx-auto" /></td>
                  <td className="py-3 px-3 text-center text-slate-300 dark:text-slate-600"><Minus className="w-3.5 h-3.5 mx-auto" /></td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-200/60 dark:border-blue-900/40">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                </tr>

                {/* Category 4: サポート・契約・決済 */}
                <tr className="bg-slate-50/70 dark:bg-slate-900/30">
                  <td colSpan={5} className="py-2.5 px-4 font-bold text-slate-900 dark:text-white text-[11px] tracking-wider uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1B4F8A]" />
                    <span>{isEn ? "4. Compliance, Invoicing & Support" : isVi ? "4. Tuân thủ, Hóa đơn & Hỗ trợ" : "4. サポート・契約・お支払い"}</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/40 dark:hover:bg-[#12161E]">
                  <td className="py-3 px-4 font-medium">{isEn ? "Japanese Qualified Invoice Compliance (適格請求書発行事業者)" : isVi ? "Hóa đơn điện tử hợp lệ theo luật Nhật Bản (Invoice)" : "インボイス制度対応（適格請求書・領収書即時発行）"}</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-200/60 dark:border-blue-900/40">●</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                </tr>
                <tr className="hover:bg-slate-50/40 dark:hover:bg-[#12161E]">
                  <td className="py-3 px-4 font-medium">{isEn ? "Customer Support SLA" : isVi ? "Mức độ hỗ trợ kỹ thuật" : "カスタマーサポート窓口"}</td>
                  <td className="py-3 px-3 text-center text-slate-500">メール対応</td>
                  <td className="py-3 px-3 text-center text-slate-700 dark:text-slate-300">優先メール対応</td>
                  <td className="py-3 px-3 text-center font-bold text-[#1B4F8A] dark:text-blue-300 bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-200/60 dark:border-blue-900/40">
                    最優先対応
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-100">専任エンジニア配属</td>
                </tr>
                <tr className="hover:bg-slate-50/40 dark:hover:bg-[#12161E]">
                  <td className="py-3 px-4 font-medium">{isEn ? "Corporate Monthly Invoicing / Bank Transfer" : isVi ? "Thanh toán theo hóa đơn cuối tháng / Chuyển khoản" : "請求書払い（月末締め翌月末払い・銀行振込）"}</td>
                  <td className="py-3 px-3 text-center text-slate-300 dark:text-slate-600"><Minus className="w-3.5 h-3.5 mx-auto" /></td>
                  <td className="py-3 px-3 text-center text-slate-300 dark:text-slate-600"><Minus className="w-3.5 h-3.5 mx-auto" /></td>
                  <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400 bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-200/60 dark:border-blue-900/40">個別相談可</td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">●</td>
                </tr>
                <tr className="hover:bg-slate-50/40 dark:hover:bg-[#12161E]">
                  <td className="py-3 px-4 font-medium">{isEn ? "Contract Lock-in / Minimum Period" : isVi ? "Ràng buộc thời hạn hợp đồng tối thiểu" : "最低契約期間の縛り・違約金"}</td>
                  <td className="py-3 px-3 text-center font-semibold text-emerald-600">なし</td>
                  <td className="py-3 px-3 text-center font-semibold text-emerald-600">なし</td>
                  <td className="py-3 px-3 text-center font-semibold text-emerald-600 bg-blue-50/30 dark:bg-blue-950/10 border-x border-blue-200/60 dark:border-blue-900/40">なし</td>
                  <td className="py-3 px-3 text-center font-semibold text-emerald-600">なし (個別協議可)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Additional Quota Packs (One-time Purchase) */}
        <section className="flex flex-col gap-6 max-w-7xl mx-auto w-full relative" style={{ fontFeatureSettings: '"palt"' }}>
          <div className="text-center flex flex-col gap-2 max-w-2xl mx-auto">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/30 px-3 py-0.5 rounded-md w-fit mx-auto border border-emerald-200/80 dark:border-emerald-900/60">
              {t.pricing.packTag}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t.pricing.packTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              {t.pricing.packDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch w-full mt-2">
            {packs.map((pack) => {
              const packPriceWithTax = Math.floor(pack.price * 1.1);
              return (
                <div 
                  key={pack.id}
                  className={`rounded-xl border p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 relative ${
                    pack.recommended
                      ? "bg-white border-2 border-[#1B4F8A] shadow-xs dark:bg-[#151B22] dark:border-blue-500 z-10"
                      : "bg-white border border-slate-200/90 hover:border-slate-300 dark:bg-[#151B22] dark:border-slate-800 dark:hover:border-slate-700 shadow-2xs"
                  }`}
                >
                  {pack.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-md bg-[#1B4F8A] text-[10px] font-bold text-white uppercase tracking-wider shadow-2xs flex items-center gap-1.5 border border-white/20 whitespace-nowrap">
                      <Coins className="w-3 h-3 fill-white" />
                      {t.pricing.packBestValue}
                    </div>
                  )}

                  <div className="flex flex-col gap-3.5">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {pack.name}
                      </span>
                      {pack.recommended && (
                        <span className="text-[10px] font-bold text-[#1B4F8A] bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/40">
                          {t.pricing.packRecommend}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-0.5 mt-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums font-mono">
                          ¥{pack.price.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400 font-normal">
                          ({isEn ? "excl. tax" : isVi ? "chưa VAT" : "税抜"})
                        </span>
                        <span className="text-xs text-slate-500 font-medium">/ {t.pricing.packPricingSuffix}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums font-mono">
                        {isEn ? `Incl. Tax: ¥${packPriceWithTax.toLocaleString()}` : isVi ? `Đã gồm thuế: ¥${packPriceWithTax.toLocaleString()}` : `税込 ¥${packPriceWithTax.toLocaleString()}`}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed min-h-[36px] font-normal">
                      {pack.description}
                    </p>

                    <div className="p-2.5 bg-slate-50 dark:bg-[#0D1117] rounded-lg border border-slate-200/80 dark:border-slate-800 flex items-center justify-between mt-1">
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{t.pricing.exportQuota}</span>
                      <strong className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 flex items-center gap-1.5 tabular-nums font-mono">
                        <Coins className="w-3.5 h-3.5" />
                        +{pack.allowance.toLocaleString()} 行
                      </strong>
                    </div>
                  </div>

                  <div className="mt-5">
                    <button
                      onClick={() => handlePackCheckoutClick(pack)}
                      className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99] ${
                        pack.recommended
                          ? "bg-[#1B4F8A] hover:bg-[#143D6C] text-white shadow-2xs"
                          : "border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-[#151B22] dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs"
                      }`}
                    >
                      <span>{t.pricing.packBuyBtn}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Guidelines / Notices */}
          <div className="bg-slate-50 border border-slate-200/90 dark:bg-[#12161E] dark:border-slate-800 rounded-xl p-5 md:p-6 flex flex-col gap-2 text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-7xl mx-auto w-full">
            <h5 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-1 text-xs">
              <Info className="w-4 h-4 text-[#1B4F8A] shrink-0" />
              {t.pricing.packNoticeTitle}
            </h5>
            <ul className="list-disc list-inside flex flex-col gap-1.5 text-xs leading-relaxed pl-1 font-normal">
              <li>{t.pricing.packNoticeItem1}</li>
              <li>{t.pricing.packNoticeItem2}</li>
              <li>{t.pricing.packNoticeItem3}</li>
            </ul>
          </div>
        </section>

        {/* Competitors Price Comparison Table */}
        <section className="bg-white border border-slate-200/90 dark:bg-[#151B22] dark:border-slate-800 rounded-xl p-6 md:p-8 shadow-xs max-w-7xl mx-auto w-full flex flex-col gap-6 relative" style={{ fontFeatureSettings: '"palt"' }}>
          <div className="text-center md:text-left relative flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-[#1B4F8A] dark:text-blue-300 uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 px-2.5 py-0.5 rounded-md w-fit">{t.pricing.comparisonTag}</span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t.pricing.comparisonTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed font-normal">
              {t.pricing.comparisonDesc}
            </p>
          </div>

          <div className="overflow-x-auto relative">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 rounded-l-lg">{t.pricing.compHeaderItem}</th>
                  <th className="py-3.5 px-4">{t.pricing.compHeaderOtherM}</th>
                  <th className="py-3.5 px-4">{t.pricing.compHeaderOtherB}</th>
                  <th className="py-3.5 px-5 bg-blue-100/70 dark:bg-blue-950/60 text-[#1B4F8A] dark:text-blue-300 font-bold border-l border-r border-t border-blue-200/80 dark:border-blue-900/60 rounded-t-lg">{t.pricing.compHeaderOurPro}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300 font-normal">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-[#12161E]">
                  <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">{t.pricing.compRowPrice}</td>
                  <td className="py-4 px-4 tabular-nums font-mono">¥30,000 〜 ¥100,000</td>
                  <td className="py-4 px-4 tabular-nums font-mono">¥9,800 〜 ¥29,800</td>
                  <td className="py-4 px-5 bg-blue-50/60 dark:bg-blue-950/20 border-l border-r border-blue-200/60 dark:border-blue-900/40">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-sm text-rose-600 dark:text-rose-400 tabular-nums font-mono">
                          {isEn ? "1st mo ¥1,260 (tax incl. ¥1,386)" : isVi ? "Tháng đầu ¥1.260 (gồm thuế ¥1.386)" : "初月 ¥1,260 (税込 ¥1,386)"}
                        </span>
                        <span className="bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 text-[10px] font-bold px-1.5 py-0.5 rounded tabular-nums font-mono">
                          70% OFF
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tabular-nums font-mono">
                        {isEn ? "(2nd mo+: ¥4,200 / tax incl. ¥4,620/mo)" : isVi ? "(Từ tháng 2: ¥4.200 / gồm thuế ¥4.620/tháng)" : "（2ヶ月目以降: 通常 ¥4,200 / 税込 ¥4,620/月）"}
                      </span>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-[#12161E]">
                  <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">{t.pricing.compRowPriceUnit}</td>
                  <td className="py-4 px-4 tabular-nums font-mono">¥20 〜 ¥60</td>
                  <td className="py-4 px-4 tabular-nums font-mono">¥30 〜 ¥100</td>
                  <td className="py-4 px-5 bg-blue-50/60 dark:bg-blue-950/20 border-l border-r border-blue-200/60 dark:border-blue-900/40">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white tabular-nums font-mono">
                          {isEn ? "1st mo ~¥0.63 / row" : isVi ? "Tháng đầu ~¥0.63 / dòng" : "初月 約 ¥0.63 / 件"}
                        </span>
                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {isEn ? "Industry Best" : isVi ? "Rẻ nhất thị trường" : "業界最安クラス"}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tabular-nums font-mono">
                        {isEn ? "(Regular: ~¥2.1 / row)" : isVi ? "(Giá gốc: ~¥2.1 / dòng)" : "（通常: 約 ¥2.1 / 件）"}
                      </span>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-[#12161E]">
                  <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">{t.pricing.compRowInitial}</td>
                  <td className="py-4 px-4 tabular-nums font-mono">¥100,000 ({isEn ? "On Contract" : isVi ? "Khi ký hợp đồng" : "契約時のみ"})</td>
                  <td className="py-4 px-4 tabular-nums font-mono">¥0</td>
                  <td className="py-4 px-5 bg-blue-50/60 dark:bg-blue-950/20 font-bold text-emerald-700 dark:text-emerald-400 border-l border-r border-blue-200/60 dark:border-blue-900/40">
                    {t.pricing.compRowInitialValue}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-[#12161E]">
                  <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">{t.pricing.compRowFeatures}</td>
                  <td className="py-4 px-4">{isEn ? "Expensive" : isVi ? "Tính năng cao nhưng duy trì đắt" : "高機能だが維持費が高価"}</td>
                  <td className="py-4 px-4">{isEn ? "Free but limited" : isVi ? "Có gói miễn phí nhưng giới hạn" : "無料枠があるが件数制限"}</td>
                  <td className="py-4 px-5 bg-blue-50/60 dark:bg-blue-950/20 font-semibold text-slate-900 dark:text-white border-l border-r border-b border-blue-200/60 dark:border-blue-900/40 rounded-b-lg">
                    {t.pricing.compRowFeaturesValue}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-lg p-3 text-xs text-slate-600 dark:text-slate-400 dark:bg-[#12161E] dark:border-slate-800">
            <Info className="w-4 h-4 text-[#1B4F8A] shrink-0" />
            <span>
              {t.pricing.compNotice}
            </span>
          </div>
        </section>

        {/* ======================================================== */}
        {/* ============ CORPORATE TRUST & PAYMENT BADGES ========== */}
        {/* ======================================================== */}
        <section className="max-w-7xl mx-auto w-full" style={{ fontFeatureSettings: '"palt"' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 sm:p-6 bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                <Receipt className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {isEn ? "Qualified Invoice Issuer" : isVi ? "Hóa Đơn Thuế Hợp Lệ" : "インボイス制度対応"}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  {isEn ? "Registered Invoice documents with T-Number issued instantly." : isVi ? "Hỗ trợ xuất hóa đơn điện tử đủ điều kiện khấu trừ thuế đầu vào." : "適格登録番号記載の請求書・領収書を即時発行可能。"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                <Building2 className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {isEn ? "Monthly Corporate Billing" : isVi ? "Hóa Đơn Trả Sau & Chuyển Khoản" : "請求書払い・銀行振込対応"}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  {isEn ? "Corporate end-of-month bank transfers available for teams." : isVi ? "Hỗ trợ thanh toán gộp cuối tháng cho phòng mua sắm doanh nghiệp." : "法人様向け月末締め翌月末払い（掛け払い）ご相談可。"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-900/50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {isEn ? "Zero Contract Lock-in" : isVi ? "Không Ràng Buộc Hạn Hợp Đồng" : "最低契約期間の縛りなし"}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  {isEn ? "Change plans or cancel online anytime with zero cancellation fees." : isVi ? "Chuyển gói hoặc hủy bất cứ lúc nào trong Dashboard, không phạt hủy." : "管理画面から1クリックで即時解約・変更可能。違約金ゼロ。"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                <Lock className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {isEn ? "APPI Privacy & SSL Security" : isVi ? "Bảo Mật APPI Chuẩn Nhật" : "万全のセキュリティ体制"}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  {isEn ? "256-bit SSL encryption strictly compliant with Japanese APPI laws." : isVi ? "Mã hóa 256-bit SSL, tuân thủ Luật bảo vệ thông tin cá nhân Nhật Bản." : "SSL暗号化通信 ＆ 個人情報保護法に基づく厳格なデータ管理。"}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="max-w-7xl mx-auto w-full flex flex-col gap-6">
          <div className="text-center">
            <HelpCircle className="w-6 h-6 text-[#1B4F8A] dark:text-blue-400 mx-auto mb-1.5" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.pricing.faqTitle}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-1">
            <div className="p-4 sm:p-5 bg-white border border-slate-200/80 hover:border-slate-300 dark:bg-[#161B22] dark:border-slate-800 dark:hover:border-slate-700 rounded-lg flex flex-col gap-2 shadow-2xs transition-colors">
              <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">Q</span>
                <span>{t.pricing.faqQ1}</span>
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7.5 font-normal">
                {t.pricing.faqA1}
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white border border-slate-200/80 hover:border-slate-300 dark:bg-[#161B22] dark:border-slate-800 dark:hover:border-slate-700 rounded-lg flex flex-col gap-2 shadow-2xs transition-colors">
              <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">Q</span>
                <span>{t.pricing.faqQ2}</span>
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7.5 font-normal">
                {t.pricing.faqA2}
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white border border-slate-200/80 hover:border-slate-300 dark:bg-[#161B22] dark:border-slate-800 dark:hover:border-slate-700 rounded-lg flex flex-col gap-2 shadow-2xs transition-colors">
              <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">Q</span>
                <span>{t.pricing.faqQ3}</span>
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7.5 font-normal">
                {t.pricing.faqA3}
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white border border-slate-200/80 hover:border-slate-300 dark:bg-[#161B22] dark:border-slate-800 dark:hover:border-slate-700 rounded-lg flex flex-col gap-2 shadow-2xs transition-colors">
              <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">Q</span>
                <span>{t.pricing.faqQ4}</span>
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7.5 font-normal">
                {t.pricing.faqA4}
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white border border-slate-200/80 hover:border-slate-300 dark:bg-[#161B22] dark:border-slate-800 dark:hover:border-slate-700 rounded-lg flex flex-col gap-2 shadow-2xs transition-colors">
              <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">Q</span>
                <span>{t.pricing.faqQ5}</span>
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7.5 font-normal">
                {t.pricing.faqA5}
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white border border-slate-200/80 hover:border-slate-300 dark:bg-[#161B22] dark:border-slate-800 dark:hover:border-slate-700 rounded-lg flex flex-col gap-2 shadow-2xs transition-colors">
              <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">Q</span>
                <span>{t.pricing.faqQ6}</span>
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7.5 font-normal">
                {t.pricing.faqA6}
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white border border-slate-200/80 hover:border-slate-300 dark:bg-[#161B22] dark:border-slate-800 dark:hover:border-slate-700 rounded-lg flex flex-col gap-2 shadow-2xs transition-colors">
              <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">Q</span>
                <span>{t.pricing.faqQ7}</span>
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7.5 font-normal">
                {t.pricing.faqA7}
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white border border-slate-200/80 hover:border-slate-300 dark:bg-[#161B22] dark:border-slate-800 dark:hover:border-slate-700 rounded-lg flex flex-col gap-2 shadow-2xs transition-colors">
              <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">Q</span>
                <span>{t.pricing.faqQ8}</span>
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7.5 font-normal">
                {t.pricing.faqA8}
              </p>
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
        <section className="max-w-5xl mx-auto w-full" style={{ fontFeatureSettings: '"palt"' }}>
          <div className="p-6 sm:p-8 rounded-xl bg-white border border-slate-200/90 dark:bg-[#151B22] dark:border-slate-800 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-l-4 border-l-[#1B4F8A]">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-[#1B4F8A] border border-blue-200/70 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50 text-[11px] font-bold tracking-wider mb-2.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                <span>{isEn ? "SELF-SERVE OUTBOUND SAAS" : isVi ? "NỀN TẢNG TIẾP CẬN TỰ ĐỘNG B2B" : "セルフサービス型 フォーム営業"}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2 tracking-tight text-slate-900 dark:text-white">
                {isEn ? "Automated Contact Form Outreach SaaS" : isVi ? "Nền Tảng Tự Động Gửi Form Marketing" : "問い合わせフォーム営業配信プラットフォーム"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-normal">
                {isEn
                  ? "Zero setup fee, zero monthly commitments. Filter hyper-targeted prospects from our 5M+ database and dispatch your pitch directly to verified corporate contact forms starting at 5.9 JPY/form (First-time Special)."
                  : isVi
                  ? "Không phí khởi tạo, không phí duy trì. Lọc khách hàng từ 5 triệu doanh nghiệp và tự động gửi thông điệp chào hàng vào Form liên hệ ngay trên hệ thống (chỉ từ 5.9 JPY/form)."
                  : "初期費用・月額固定費0円。自社でリストを精査し、手動でフォーム送信する工数はもう不要。500万社DBからターゲットを抽出し、管理画面から自社の営業文面を即時オンライン配信（初回限定 1件5.9円〜）。"}
              </p>

              {/* 3 Quick Value Badges */}
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#0D1117] px-2.5 py-1 rounded-md border border-slate-200/70 dark:border-slate-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{isEn ? "Zero Setup & Monthly Fee" : isVi ? "Không phí ban đầu / duy trì" : "初期費用・月額固定費 0円"}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#0D1117] px-2.5 py-1 rounded-md border border-slate-200/70 dark:border-slate-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{isEn ? "Free 5M+ Target Extraction" : isVi ? "Lọc tệp từ 5M+ DN miễn phí" : "500万社DBから抽出無料"}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#0D1117] px-2.5 py-1 rounded-md border border-slate-200/70 dark:border-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400 shrink-0" />
                  <span>{isEn ? "AI Anti-Sales Auto Skip" : isVi ? "AI quét bỏ qua cấm chào hàng" : "AI営業お断り自動除外"}</span>
                </span>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-center md:items-end gap-2 w-full md:w-auto">
              <LocaleLink
                href="/dashboard?tab=formCampaigns"
                className="w-full md:w-auto px-6 py-3 rounded-lg font-bold text-xs text-white bg-[#1B4F8A] hover:bg-[#143D6C] shadow-2xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isEn ? "Create Campaign in Dashboard" : isVi ? "Tạo chiến dịch trên Dashboard" : "管理画面でキャンペーン作成"}</span>
                <ArrowRight className="w-4 h-4" />
              </LocaleLink>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 text-center md:text-right font-normal">
                {isEn ? "※ Same-day dispatch · Online setup in 1 min" : isVi ? "※ Gửi ngay trong ngày · Cài đặt trực tuyến 1 phút" : "※ 最短即日配信対応・オンライン完結"}
              </span>
            </div>
          </div>
        </section>

        {/* Month-End Countdown urgence timer for Form DM */}
        <section className="max-w-4xl mx-auto w-full">
          <CountdownTimer />
        </section>

        <section className="flex flex-col items-center gap-2">
          <div className="p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 rounded-lg flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 px-4 py-2 shadow-2xs">
            <BadgePercent className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400 shrink-0" />
            <span>{isEn ? "New Customer Special: 70% OFF First Purchase Applied" : isVi ? "Ưu đãi khách hàng mới: Giảm 70% lần đầu" : "新規限定・初回70%OFFキャンペーン適用中"}</span>
          </div>
          <p className="text-xs text-slate-500 text-center max-w-md leading-relaxed">
            {isEn 
              ? "First-time buyers get 70% OFF on all outreach volume tiers. Secure Stripe checkout." 
              : isVi 
              ? "Ưu đãi dành riêng cho lần mua đầu tiên: Giảm trực tiếp 70% toàn bộ các gói gửi Form. Thanh toán bảo mật qua Stripe." 
              : "初回ご購入限定で全ボリューム枠に70%割引が自動適用されています。Stripe決済で即時配信枠チャージ完了。"}
          </p>
        </section>

        {/* Form DM 3 Pricing Cards */}
        <section className="max-w-6xl mx-auto w-full" style={{ fontFeatureSettings: '"palt"' }}>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#1B4F8A] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 text-[11px] font-bold mb-3">
              <Coins className="w-3.5 h-3.5" />
              <span>{isEn ? "Pay-As-You-Go Volume Plans" : isVi ? "Bảng Giá Gửi Form Minh Bạch" : "送信ボリューム別プラン（都度課金）"}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              {isEn ? "Select Your Outreach Volume" : isVi ? "Chọn Quy Mô Gửi Phù Hợp" : "成果に直結する配信プラン"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal">
              {isEn ? "Pure pay-per-delivery. Free targeting, free template library, AI disclaimer skipping included." : isVi ? "Chỉ tính phí trên số form gửi thành công. Miễn phí lọc đối tượng, kịch bản mẫu và thuật toán AI bỏ qua cấm quảng cáo." : "初期費用・月額固定費ゼロ。送信完了件数に応じた完全都度課金制。ターゲット抽出も管理画面から即時行えます。"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {/* 1,000 Plan */}
            <div className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-2xs flex flex-col justify-between">
              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {isEn ? "Starter (1,000 Forms)" : isVi ? "Gói Starter 1.000 Form" : "1,000 件プラン"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 font-normal">
                  {isEn ? "Ideal for testing product-market fit" : isVi ? "Thử nghiệm phản hồi thị trường" : "まずは効果検証・テスト送信に最適"}
                </p>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">¥8,400</span>
                  <span className="text-xs text-slate-400">({isEn ? "excl. tax" : isVi ? "chưa VAT" : "税抜"})</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="line-through text-slate-400 font-mono text-xs tabular-nums">¥28,000</span>
                  <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400 text-[10px] tabular-nums font-mono">
                    初回 70% OFF
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums font-mono mb-2">
                  <span>税込 ¥9,240</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold mb-6 tabular-nums font-mono">
                  {isEn ? "Unit rate: 8.4 JPY / form (tax incl. 9.24 JPY)" : isVi ? "Đơn giá: 8.4 JPY / form (gồm thuế 9.24 JPY)" : "単価: 8.4円（税込 9.24円）/ 送信完了"}
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-5">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isEn ? "5M+ target list filtering" : isVi ? "Lọc tệp khách hàng từ 5M DB" : "ターゲット企業リスト抽出"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isEn ? "AI anti-sales disclaimer skip" : isVi ? "AI quét bỏ qua form cấm quảng cáo" : "AI営業お断り自動除外"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isEn ? "Industry templates library" : isVi ? "Thư viện mẫu kịch bản chuẩn Keigo" : "業種別テンプレート活用"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isEn ? "Pre-dispatch compliance check" : isVi ? "Kiểm duyệt tuân thủ Tokushoho" : "運営による事前法令・NGワード審査"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isEn ? "Realtime logs & CSV report" : isVi ? "Báo cáo CSV và theo dõi trực tiếp" : "リアルタイム進捗 ＆ CSVレポート"}</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleFormCheckoutClick(formPlans[0])}
                className="mt-8 w-full py-2.5 rounded-lg font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-center transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <CreditCard className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span>{isEn ? "Pay with Stripe (1,000 Forms)" : isVi ? "Thanh toán Stripe (1.000 Form)" : "Stripe決済で1,000件枠を購入"}</span>
              </button>
            </div>

            {/* 3,000 Plan (RECOMMENDED) */}
            <div className="bg-white dark:bg-[#151B22] border-2 border-[#1B4F8A] rounded-xl p-6 sm:p-7 shadow-xs flex flex-col justify-between relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-md bg-[#1B4F8A] text-white text-[10px] font-bold tracking-wider shadow-2xs whitespace-nowrap flex items-center gap-1.5 border border-white/20">
                <CheckCircle2 className="w-3 h-3 text-white" />
                <span>{isEn ? "MOST POPULAR & BEST VALUE" : isVi ? "Phổ biến & Tối ưu nhất" : "一番人気・推奨プラン"}</span>
              </div>

              <div>
                <h4 className="text-base sm:text-lg font-bold text-[#1B4F8A] dark:text-blue-400 mb-1">
                  {isEn ? "Standard (3,000 Forms)" : isVi ? "Gói Standard 3.000 Form" : "3,000 件プラン"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 font-normal">
                  {isEn ? "Optimal for scalable lead generation" : isVi ? "Đạt lượng chuyển đổi cuộc hẹn ổn định" : "本格的なリード獲得・商談創出に"}
                </p>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-bold font-mono tabular-nums text-[#1B4F8A] dark:text-blue-300">¥20,700</span>
                  <span className="text-xs text-slate-400">({isEn ? "excl. tax" : isVi ? "chưa VAT" : "税抜"})</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="line-through text-slate-400 font-mono text-xs tabular-nums">¥69,000</span>
                  <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400 text-[10px] tabular-nums font-mono">
                    初回 70% OFF
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums font-mono mb-2">
                  <span>税込 ¥22,770</span>
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-6 tabular-nums font-mono">
                  {isEn ? "Unit rate: 6.9 JPY / form (tax incl. 7.59 JPY)" : isVi ? "Đơn giá: 6.9 JPY / form (gồm thuế 7.59 JPY)" : "単価: 6.9円（税込 7.59円）/ 送信完了 (業界最安級)"}
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-5">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isEn ? "5M+ target list filtering" : isVi ? "Lọc tệp khách hàng từ 5M DB" : "ターゲット企業リスト抽出"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isEn ? "AI anti-sales disclaimer skip" : isVi ? "AI quét bỏ qua form cấm quảng cáo" : "AI営業お断り自動除外"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      {isEn ? "Dynamic placeholder tags ({company_name})" : isVi ? "Tự động chèn {company_name}, {address}" : "企業名・住所などの自動差し込みタグ対応"}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isEn ? "Priority 2-hour compliance check" : isVi ? "Ưu tiên kiểm duyệt trong 2 giờ" : "優先スピード審査（最短2時間）"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isEn ? "Realtime logs & CSV report" : isVi ? "Báo cáo CSV và theo dõi trực tiếp" : "リアルタイム進捗 ＆ CSVレポート"}</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleFormCheckoutClick(formPlans[1])}
                className="mt-8 w-full py-3 rounded-lg font-bold text-xs text-white bg-[#1B4F8A] hover:bg-[#143D6C] shadow-2xs text-center transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isEn ? "Pay with Stripe (3,000 Forms)" : isVi ? "Thanh toán Stripe (3.000 Form)" : "Stripe決済で3,000件枠を購入"}</span>
              </button>
            </div>

            {/* 5,000+ Plan */}
            <div className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-2xs flex flex-col justify-between">
              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {isEn ? "Enterprise (5,000 Forms)" : isVi ? "Gói Enterprise 5.000 Form" : "5,000 件プラン"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 font-normal">
                  {isEn ? "Maximum appointment pipeline volume" : isVi ? "Quy mô lớn, chi phí trên mỗi form rẻ nhất" : "大量アプローチで商談数を最大化"}
                </p>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">¥29,700</span>
                  <span className="text-xs text-slate-400">({isEn ? "excl. tax" : isVi ? "chưa VAT" : "税抜"})</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="line-through text-slate-400 font-mono text-xs tabular-nums">¥99,000</span>
                  <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400 text-[10px] tabular-nums font-mono">
                    初回 70% OFF
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums font-mono mb-2">
                  <span>税込 ¥32,670</span>
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-6 tabular-nums font-mono">
                  {isEn ? "Unit rate: 5.9 JPY / form (tax incl. 6.49 JPY)" : isVi ? "Đơn giá: 5.9 JPY / form (gồm thuế 6.49 JPY)" : "単価: 5.9円（税込 6.49円）/ 送信完了 (最安値レート)"}
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-5">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isEn ? "5M+ target list filtering" : isVi ? "Lọc tệp khách hàng từ 5M DB" : "ターゲット企業リスト抽出"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isEn ? "AI anti-sales disclaimer skip" : isVi ? "AI quét bỏ qua form cấm quảng cáo" : "AI営業お断り自動除外"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isEn ? "Advanced filter & tags" : isVi ? "Hỗ trợ tùy biến nâng cao" : "自動差し込みタグ＆高度な除外設定"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isEn ? "Priority scheduling & staggered dispatch" : isVi ? "Chia lịch gửi tối ưu theo ngày" : "最優先審査 ＆ 分割配信スケジュール対応"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isEn ? "Realtime logs & CSV report" : isVi ? "Báo cáo CSV và theo dõi trực tiếp" : "リアルタイム進捗 ＆ CSVレポート"}</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleFormCheckoutClick(formPlans[2])}
                className="mt-8 w-full py-2.5 rounded-lg font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-center transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <CreditCard className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span>{isEn ? "Pay with Stripe (5,000 Forms)" : isVi ? "Thanh toán Stripe (5.000 Form)" : "Stripe決済で5,000件枠を購入"}</span>
              </button>
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
            <LocaleLink href="/contact" className="text-[#1B4F8A] dark:text-blue-400 hover:underline font-bold inline-flex items-center gap-1">
              <span>{isEn ? "Inquire about Enterprise / Bulk Outreach" : isVi ? "Liên hệ tư vấn gói Doanh nghiệp lớn" : "大口・エンタープライズ配信のご相談はこちら"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </LocaleLink>
          </div>
        </section>

        {/* ======================================================== */}
        {/* SECTION: Interactive Appointment & ROI Simulator */}
        {/* ======================================================== */}
        <section className="bg-white border border-slate-200/90 dark:bg-[#151B22] dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-xs max-w-5xl mx-auto w-full flex flex-col gap-6" style={{ fontFeatureSettings: '"palt"' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#1B4F8A] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 text-[11px] font-bold mb-2">
                <Calculator className="w-3.5 h-3.5" />
                <span>{isEn ? "Interactive Outreach ROI Simulator" : isVi ? "Công cụ Mô phỏng Hiệu quả Đầu tư ROI" : "商談獲得シミュレーター（効果試算）"}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isEn ? "Estimate Appointments & Cost per Meeting" : isVi ? "Dự toán Số Cuộc hẹn & Chi phí CPA" : "配信ボリューム別の商談獲得見込と獲得単価"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-normal">
                {isEn 
                  ? "Select target delivery volume and expected conversion rate to simulate ROI before purchasing."
                  : isVi 
                  ? "Chọn quy mô số lượng form và tỷ lệ phản hồi mong muốn để tính toán hiệu quả và chi phí trên mỗi cuộc hẹn."
                  : "配信件数と想定反響率（CVR）を選択すると、獲得できる商談数や1アポイントあたりの推定コストを即時試算できます。"}
              </p>
            </div>
            <div className="px-3 py-1.5 bg-slate-50 dark:bg-[#0D1117] rounded-lg border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
              {isEn ? "Based on real B2B benchmarks" : isVi ? "Dựa trên dữ liệu thực tế B2B" : "※ 弊社B2B配信実績に基づく統計値"}
            </div>
          </div>

          {/* Controls: Volume & CVR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Volume selector */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>{isEn ? "1. Select Outreach Volume" : isVi ? "1. Chọn số lượng form tiếp cận" : "1. 配信件数（ボリューム）を選択"}</span>
                <span className="text-xs font-mono font-bold text-[#1B4F8A] dark:text-blue-400">{simVolume.toLocaleString()} 件</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1000, 3000, 5000, 10000].map((vol) => (
                  <button
                    key={vol}
                    type="button"
                    onClick={() => setSimVolume(vol)}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-bold font-mono transition-all border cursor-pointer ${
                      simVolume === vol
                        ? "bg-[#1B4F8A] text-white border-[#1B4F8A] shadow-2xs"
                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 dark:bg-[#12161E] dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800"
                    }`}
                  >
                    {vol.toLocaleString()}件
                    {vol === 3000 && <span className="block text-[9px] font-sans font-normal opacity-90">{isEn ? "Popular" : isVi ? "Phổ biến" : "推奨"}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* CVR selector */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>{isEn ? "2. Target Response Rate (CVR)" : isVi ? "2. Tỷ lệ phản hồi / Đặt hẹn dự kiến (CVR)" : "2. 想定アポイント獲得率（CVR）"}</span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{simCvr}%</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 0.3, label: isEn ? "Conservative" : isVi ? "Thận trọng" : "慎重 (0.3%)" },
                  { val: 0.8, label: isEn ? "Standard" : isVi ? "Trung bình" : "標準 (0.8%)" },
                  { val: 1.5, label: isEn ? "Optimized" : isVi ? "Tối ưu cao" : "最適化 (1.5%)" }
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setSimCvr(item.val)}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      simCvr === item.val
                        ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 dark:bg-[#12161E] dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800"
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Calculation Output Cards */}
          {(() => {
            const pricing = getSimPricing(simVolume);
            const appointments = Math.max(1, Math.round((simVolume * simCvr) / 100));
            const cpa = Math.round(pricing.taxIncl / appointments);
            const telesalesBenchmark = appointments * 20000;
            const savings = Math.max(0, telesalesBenchmark - pricing.taxIncl);

            return (
              <div className="flex flex-col gap-4 mt-2">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0D1117] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {isEn ? "Total Price (Incl. Tax)" : isVi ? "Tổng chi phí (gồm thuế)" : "配信費用（税込総額）"}
                    </span>
                    <div className="mt-2">
                      <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums font-mono">
                        ¥{pricing.taxIncl.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-400 tabular-nums font-mono">
                        (税抜 ¥{pricing.campaignPrice.toLocaleString()} / {pricing.unitRate}円/件)
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-[#1B4F8A] dark:text-blue-300 uppercase tracking-wider flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      {isEn ? "Estimated Appointments" : isVi ? "Số cuộc hẹn dự kiến" : "商談獲得見込数"}
                    </span>
                    <div className="mt-2">
                      <div className="text-2xl sm:text-3xl font-extrabold text-[#1B4F8A] dark:text-blue-400 tabular-nums font-mono">
                        {appointments} <span className="text-xs font-normal">件</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {isEn ? `CVR ${simCvr}% estimated` : isVi ? `Ước tính CVR ${simCvr}%` : `反響率 ${simCvr}% 基準`}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {isEn ? "Estimated CPA / Meeting" : isVi ? "Chi phí trên 1 cuộc hẹn" : "1商談あたりの獲得コスト"}
                    </span>
                    <div className="mt-2">
                      <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums font-mono">
                        ¥{cpa.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-emerald-600/90 dark:text-emerald-400/80 font-medium">
                        {isEn ? "Industry lowest level" : isVi ? "Tiết kiệm hơn Telesales" : "テレアポの約1/10"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0D1117] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {isEn ? "Saved vs Telesales Outsource" : isVi ? "Tiết kiệm so với thuê Telesales" : "テレアポ代行比の削減額"}
                    </span>
                    <div className="mt-2">
                      <div className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums font-mono">
                        -¥{savings.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {isEn ? "(Benchmark: ¥20k / appointment)" : isVi ? "(So với mức ¥20.000 / hẹn)" : "※ アポ単価2万円換算との比較"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-900/30 mt-1">
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    {pricing.plan ? (
                      <>
                        <strong className="text-slate-900 dark:text-white font-bold">{pricing.plan.name}</strong>
                        {" "}(¥{pricing.campaignPrice.toLocaleString()} 税抜) でこの効果を今すぐ検証できます。
                      </>
                    ) : (
                      <>
                        <strong className="text-slate-900 dark:text-white font-bold">10,000件以上の大口配信</strong>
                        {" "}は特別ボリュームディスカウントにて即日対応可能です。
                      </>
                    )}
                  </span>
                  {pricing.plan ? (
                    <button
                      type="button"
                      onClick={() => handleFormCheckoutClick(pricing.plan)}
                      className="px-4 py-2 rounded-lg font-bold text-xs text-white bg-[#1B4F8A] hover:bg-[#143D6C] shadow-2xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <span>このプランで試す</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <LocaleLink
                      href="/contact"
                      className="px-4 py-2 rounded-lg font-bold text-xs text-white bg-[#1B4F8A] hover:bg-[#143D6C] shadow-2xs transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <span>大口相談窓口へ</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </LocaleLink>
                  )}
                </div>
              </div>
            );
          })()}
        </section>

        {/* ======================================================== */}
        {/* SECTION: B2B Outreach Channel Comparison Matrix */}
        {/* ======================================================== */}
        <section className="bg-white border border-slate-200/90 dark:bg-[#151B22] dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-xs max-w-5xl mx-auto w-full flex flex-col gap-6" style={{ fontFeatureSettings: '"palt"' }}>
          <div className="text-center md:text-left flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-[#1B4F8A] dark:text-blue-300 uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 px-2.5 py-0.5 rounded-md w-fit">
              {isEn ? "OUTREACH CHANNEL COMPARISON" : isVi ? "SO SÁNH CÁC KÊNH TIẾP CẬN B2B" : "営業アプローチ手法の比較"}
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isEn ? "Why Form Outreach Delivers Highest ROI" : isVi ? "Tại sao Form Outreach đạt hiệu quả ROI vượt trội?" : "フォーム営業が圧倒的なROIと商談化率を実現する理由"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed font-normal">
              {isEn
                ? "Comparing delivery rates, cost per meeting, setup speed, and complaint risk against Telesales and Cold Email."
                : isVi
                ? "So sánh chi tiết tỷ lệ tiếp cận người quyết định, chi phí cuộc hẹn, thời gian triển khai và rủi ro khiếu nại giữa Form DM, Telesales và Cold Email."
                : "社内稟議（稟議書）や営業予算策定の比較材料としてご活用ください。テレアポの受付ブロックやメールの迷惑メール判定を回避し、決裁者へダイレクトに届きます。"}
            </p>
          </div>

          <div className="overflow-x-auto relative">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 rounded-l-lg">{isEn ? "Comparison Items" : isVi ? "Tiêu chí so sánh" : "比較項目"}</th>
                  <th className="py-3.5 px-5 bg-blue-100/70 dark:bg-blue-950/60 text-[#1B4F8A] dark:text-blue-300 font-bold border-l border-r border-t border-blue-200/80 dark:border-blue-900/60 rounded-t-lg">
                    {isEn ? "Kigyou-list Form Outreach" : isVi ? "Kigyou-list Gửi Form" : "Kigyou-list フォーム営業"}
                  </th>
                  <th className="py-3.5 px-4">{isEn ? "Telesales Outsource" : isVi ? "Thuê ngoài Telesales" : "テレアポ代行"}</th>
                  <th className="py-3.5 px-4">{isEn ? "Cold Email / Mailer" : isVi ? "Gửi Email hàng loạt" : "コールドメール・メルマガ"}</th>
                  <th className="py-3.5 px-4 rounded-r-lg">{isEn ? "Postal Direct Mail" : isVi ? "Thư gửi bưu điện DM" : "郵送DM・手紙"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300 font-normal">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-[#12161E]">
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {isEn ? "Decision Maker Open Rate" : isVi ? "Tỷ lệ tiếp cận người quyết định" : "担当者・決裁者閲覧率"}
                  </td>
                  <td className="py-3.5 px-5 bg-blue-50/60 dark:bg-blue-950/20 border-l border-r border-blue-200/60 dark:border-blue-900/40 font-bold text-[#1B4F8A] dark:text-blue-300 tabular-nums font-mono">
                    50% 〜 90% <span className="text-[10px] font-sans font-normal text-slate-500 block">（問い合わせ窓口経由で直接届く）</span>
                  </td>
                  <td className="py-3.5 px-4 tabular-nums font-mono">
                    5% 〜 10% <span className="text-[10px] font-sans text-slate-400 block">（受付ブロック率90%以上）</span>
                  </td>
                  <td className="py-3.5 px-4 tabular-nums font-mono">
                    5% 〜 15% <span className="text-[10px] font-sans text-slate-400 block">（迷惑メールフォルダ直行多数）</span>
                  </td>
                  <td className="py-3.5 px-4 tabular-nums font-mono">
                    10% 〜 20% <span className="text-[10px] font-sans text-slate-400 block">（総務・アシスタントで破棄）</span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 dark:hover:bg-[#12161E]">
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {isEn ? "Unit Cost per Approach" : isVi ? "Đơn giá tiếp cận 1 doanh nghiệp" : "1件あたりアプローチ単価"}
                  </td>
                  <td className="py-3.5 px-5 bg-blue-50/60 dark:bg-blue-950/20 border-l border-r border-blue-200/60 dark:border-blue-900/40 font-bold text-emerald-600 dark:text-emerald-400 tabular-nums font-mono">
                    5.9円 〜 8.4円 <span className="text-[10px] font-sans font-normal text-slate-500 block">（完全都度課金・初期費用0円）</span>
                  </td>
                  <td className="py-3.5 px-4 tabular-nums font-mono">
                    150円 〜 300円 <span className="text-[10px] font-sans text-slate-400 block">（コール課金または月額固定）</span>
                  </td>
                  <td className="py-3.5 px-4 tabular-nums font-mono">
                    1円 〜 3円 <span className="text-[10px] font-sans text-slate-400 block">（※但しリスト購入費別途）</span>
                  </td>
                  <td className="py-3.5 px-4 tabular-nums font-mono">
                    80円 〜 150円 <span className="text-[10px] font-sans text-slate-400 block">（印刷代＋封入＋切手代）</span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 dark:hover:bg-[#12161E]">
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {isEn ? "Estimated Cost per Meeting (CPA)" : isVi ? "Ước tính chi phí trên 1 cuộc hẹn" : "1商談あたりの獲得コスト"}
                  </td>
                  <td className="py-3.5 px-5 bg-blue-50/60 dark:bg-blue-950/20 border-l border-r border-blue-200/60 dark:border-blue-900/40 font-bold text-[#1B4F8A] dark:text-blue-300 tabular-nums font-mono">
                    約 ¥1,500 〜 ¥3,500 <span className="text-[10px] font-sans font-normal text-emerald-600 dark:text-emerald-400 block">（最高効率・業界最安級）</span>
                  </td>
                  <td className="py-3.5 px-4 tabular-nums font-mono">
                    約 ¥15,000 〜 ¥30,000 <span className="text-[10px] font-sans text-slate-400 block">（アポ単価が高額）</span>
                  </td>
                  <td className="py-3.5 px-4 tabular-nums font-mono">
                    約 ¥8,000 〜 ¥18,000 <span className="text-[10px] font-sans text-slate-400 block">（反応率低下傾向）</span>
                  </td>
                  <td className="py-3.5 px-4 tabular-nums font-mono">
                    約 ¥25,000 〜 ¥50,000 <span className="text-[10px] font-sans text-slate-400 block">（回収ハードル高）</span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 dark:hover:bg-[#12161E]">
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {isEn ? "Lead Time to Launch" : isVi ? "Thời gian từ ký hợp đồng đến khi gửi" : "開始までのリードタイム"}
                  </td>
                  <td className="py-3.5 px-5 bg-blue-50/60 dark:bg-blue-950/20 border-l border-r border-blue-200/60 dark:border-blue-900/40 font-bold text-slate-900 dark:text-white">
                    最短即日〜24時間以内 <span className="text-[10px] font-sans font-normal text-slate-500 block">（オンライン完結・即時抽出）</span>
                  </td>
                  <td className="py-3.5 px-4">
                    2週間 〜 1ヶ月 <span className="text-[10px] text-slate-400 block">（契約・研修・スクリプト作成）</span>
                  </td>
                  <td className="py-3.5 px-4">
                    1週間 〜 2週間 <span className="text-[10px] text-slate-400 block">（SPF/DKIM設定・ドメイン育成）</span>
                  </td>
                  <td className="py-3.5 px-4">
                    2週間 〜 3週間 <span className="text-[10px] text-slate-400 block">（原稿作成・印刷・封入作業）</span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 dark:hover:bg-[#12161E]">
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {isEn ? "Target Prospect Database" : isVi ? "Nguồn danh sách doanh nghiệp" : "アプローチ先リスト"}
                  </td>
                  <td className="py-3.5 px-5 bg-blue-50/60 dark:bg-blue-950/20 border-l border-r border-blue-200/60 dark:border-blue-900/40 font-bold text-slate-900 dark:text-white">
                    500万社DBから完全無料抽出 <span className="text-[10px] font-sans font-normal text-slate-500 block">（業種・地域・資本金・求人条件）</span>
                  </td>
                  <td className="py-3.5 px-4">
                    リスト購入費別途 <span className="text-[10px] text-slate-400 block">（1件10〜30円が加算）</span>
                  </td>
                  <td className="py-3.5 px-4">
                    極めて限定的 <span className="text-[10px] text-slate-400 block">（保有率5〜10%・古くなりやすい）</span>
                  </td>
                  <td className="py-3.5 px-4">
                    登記情報のみ <span className="text-[10px] text-slate-400 block">（移転・不達リスクあり）</span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 dark:hover:bg-[#12161E]">
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {isEn ? "Legal Compliance & Safety" : isVi ? "Biện pháp phòng ngừa khiếu nại" : "クレーム防止・コンプライアンス"}
                  </td>
                  <td className="py-3.5 px-5 bg-blue-50/60 dark:bg-blue-950/20 border-l border-r border-blue-200/60 dark:border-blue-900/40 font-bold text-[#1B4F8A] dark:text-blue-300">
                    AIお断り除外 ＋ 特商法 ＋ 事前審査 <span className="text-[10px] font-sans font-normal text-slate-500 block">（4重のセーフガード完備）</span>
                  </td>
                  <td className="py-3.5 px-4">
                    オペレーターの質に依存 <span className="text-[10px] text-slate-400 block">（電話口でのトラブルリスク）</span>
                  </td>
                  <td className="py-3.5 px-4">
                    ドメインBANリスク <span className="text-[10px] text-slate-400 block">（特定電子メール法違反リスク）</span>
                  </td>
                  <td className="py-3.5 px-4">
                    低リスク <span className="text-[10px] text-slate-400 block">（無視される確率が高い）</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ======================================================== */}
        {/* SECTION: Compliance & Brand Trust Shield */}
        {/* ======================================================== */}
        <section className="bg-slate-50 border border-slate-200/90 dark:bg-[#12161E] dark:border-slate-800 rounded-xl p-6 sm:p-8 max-w-5xl mx-auto w-full flex flex-col gap-6" style={{ fontFeatureSettings: '"palt"' }}>
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 px-2.5 py-0.5 rounded-md w-fit mx-auto">
              {isEn ? "COMPLIANCE & BRAND SAFETY" : isVi ? "CAM KẾT PHÁP LÝ & AN TOÀN THƯƠNG HIỆU" : "法令遵守 ＆ ブランド保護体制"}
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
              {isEn ? "4-Layer Brand Protection System" : isVi ? "Hệ Thống 4 Lớp Bảo Vệ Uy Tín Doanh Nghiệp" : "企業価値を損なわないための4重のセーフガード"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed font-normal">
              {isEn
                ? "We strictly uphold Japanese commercial regulations to eliminate anti-solicitation conflicts and maintain trust."
                : isVi
                ? "Tuân thủ nghiêm ngặt Luật Giao dịch Thương mại Đặc định và triệt tiêu nguy cơ khiếu nại bằng công nghệ AI và nhân sự kiểm duyệt."
                : "「営業送信でクレームが発生しないか」という不安を解消。AI自動検知と専任スタッフによる事前目視審査を徹底しています。"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="p-5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 flex items-start gap-3.5 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1B4F8A] border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                01
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                  <span>AI「営業お断り」自動検知・除外</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  送信先企業のフォーム周辺テキストをAIがリアルタイム解析。「営業目的の送信禁止」「売り込み不可」と明記されている企業を自動判別して送信対象から除外します。
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 flex items-start gap-3.5 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1B4F8A] border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                02
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                  <span>特定商取引法に基づく発信者明記</span>
                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  特定商取引法（第16条・17条）に準拠し、貴社名・所在地・担当者名・問い合わせ窓口を文末に自動レイアウト。匿名送信によるトラブルを未然に防ぎます。
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 flex items-start gap-3.5 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1B4F8A] border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                03
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                  <span>オプトアウト（配信停止）文面の付与</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  「配信停止をご希望の場合は返信にてご連絡ください」等のオプトアウト文面を標準で挿入。相手方への礼節を尽くし、継続配信トラブルを防止します。
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 flex items-start gap-3.5 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1B4F8A] border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                04
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                  <span>運営スタッフによる目視事前審査</span>
                  <Clock className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400 shrink-0" />
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  配信ボタンを押した後、専任スタッフが文面の法令違反・NGワード・誤字脱字を最短2時間でチェック。ダブルチェックを通過した安全な案件のみを配信します。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* SECTION: Industry Keigo Templates Showcase */}
        {/* ======================================================== */}
        <section className="bg-white border border-slate-200/90 dark:bg-[#151B22] dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-xs max-w-5xl mx-auto w-full flex flex-col gap-6" style={{ fontFeatureSettings: '"palt"' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#1B4F8A] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 text-[11px] font-bold mb-2">
                <FileText className="w-3.5 h-3.5" />
                <span>{isEn ? "HIGH-CONVERTING TEMPLATES" : isVi ? "THƯ VIỆN KỊCH BẢN KÍNH NGỮ" : "業種別・高反響アプローチ文面テンプレート"}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isEn ? "Proven Outreach Pitch Copies" : isVi ? "Mẫu Kịch Bản Chuẩn Keigo Theo Từng Ngành" : "成果実証済みの営業文面テンプレートを無料開放"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-normal">
                {isEn
                  ? "Zero copywriter blocks. Professional, courteous Japanese Keigo templates ready to deploy."
                  : isVi
                  ? "Không lo tốn công soạn kịch bản. Các mẫu kính ngữ chuẩn Nhật Bản sẵn sàng tùy biến và áp dụng ngay."
                  : "「文面をどう書けばいいか分からない」を解消。業界ごとに反響の高かった定型フォーマットを管理画面ですぐに呼び出せます。"}
              </p>
            </div>
            <LocaleLink
              href="/dashboard?tab=formCampaigns"
              className="px-4 py-2 rounded-lg font-bold text-xs text-white bg-[#1B4F8A] hover:bg-[#143D6C] shadow-2xs transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>{isEn ? "Use in Dashboard" : isVi ? "Tạo chiến dịch ngay" : "管理画面で使う"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </LocaleLink>
          </div>

          {/* Template Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {outreachTemplates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setActiveTemplateTab(tpl.id)}
                className={`py-2 px-3.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  activeTemplateTab === tpl.id
                    ? "bg-[#1B4F8A] text-white border-[#1B4F8A] shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-[#12161E] dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800"
                }`}
              >
                <span>{tpl.name}</span>
                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-normal ${
                  activeTemplateTab === tpl.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                }`}>
                  {tpl.tag}
                </span>
              </button>
            ))}
          </div>

          {/* Active Template Display Box */}
          {(() => {
            const currentTpl = outreachTemplates.find(t => t.id === activeTemplateTab) || outreachTemplates[0];
            return (
              <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0D1117] p-5 sm:p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isEn ? "Subject" : isVi ? "Tiêu đề" : "件名"}:</span>
                    <strong className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{currentTpl.subject}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        navigator.clipboard.writeText(`${currentTpl.subject}\n\n${currentTpl.body}`);
                        setCopiedTemplate(true);
                        setTimeout(() => setCopiedTemplate(false), 2000);
                      }
                    }}
                    className="px-3 py-1.5 rounded-md text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-[#151B22] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                  >
                    {copiedTemplate ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">{isEn ? "Copied!" : isVi ? "Đã sao chép!" : "コピー完了"}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{isEn ? "Copy Pitch" : isVi ? "Sao chép" : "文面をコピー"}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed max-h-[300px] overflow-y-auto pr-2">
                  {currentTpl.body}
                </div>
              </div>
            );
          })()}
        </section>

        {/* 4-Step Process Section */}
        <section className="max-w-5xl mx-auto w-full py-4">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              {isEn ? "How It Works: 4 Simple Steps" : isVi ? "Quy Trình 4 Bước Đơn Giản" : "配信開始までのカンタン4ステップ"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEn ? "Launch your outreach campaign completely self-serve in minutes." : isVi ? "Thiết lập và khởi chạy chiến dịch hoàn toàn trực tuyến trong vài phút." : "管理画面からオンライン完結。最短即日でターゲット企業へのアプローチを開始できます。"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 flex flex-col gap-2 shadow-2xs">
              <div className="w-7 h-7 rounded-md bg-blue-50 text-[#1B4F8A] border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 font-mono font-bold text-xs flex items-center justify-center">01</div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{isEn ? "Target Filtering" : isVi ? "Lọc đối tượng" : "ターゲット抽出"}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{isEn ? "Filter target companies from 5M+ database by industry, capital, and headcount." : isVi ? "Lọc doanh nghiệp mục tiêu theo ngành nghề, vốn, nhân sự từ hệ thống." : "500万社DBから業種・資本金・従業員数・地域でアプローチ先を絞り込み。"}</p>
            </div>
            <div className="p-5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 flex flex-col gap-2 shadow-2xs">
              <div className="w-7 h-7 rounded-md bg-blue-50 text-[#1B4F8A] border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 font-mono font-bold text-xs flex items-center justify-center">02</div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{isEn ? "Pitch Template" : isVi ? "Soạn kịch bản" : "営業文面の作成"}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{isEn ? "Choose from Keigo templates or input your customized pitch copy." : isVi ? "Dùng mẫu kịch bản kính ngữ có sẵn hoặc nhập nội dung tùy chỉnh của bạn." : "業種別テンプレートを活用し、自社サービスの特徴を当てはめて作成。"}</p>
            </div>
            <div className="p-5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 flex flex-col gap-2 shadow-2xs">
              <div className="w-7 h-7 rounded-md bg-blue-50 text-[#1B4F8A] border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 font-mono font-bold text-xs flex items-center justify-center">03</div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{isEn ? "Review & Payment" : isVi ? "Thanh toán & Duyệt" : "決済＆事前審査"}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{isEn ? "Online credit card payment and fast Tokushoho compliance review by staff." : isVi ? "Thanh toán trực tuyến và đội ngũ duyệt tuân thủ Tokushoho trong 2-4h." : "カード決済完了後、運営スタッフが特商法表記とNGワードを迅速審査。"}</p>
            </div>
            <div className="p-5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 flex flex-col gap-2 shadow-2xs">
              <div className="w-7 h-7 rounded-md bg-blue-50 text-[#1B4F8A] border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 font-mono font-bold text-xs flex items-center justify-center">04</div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{isEn ? "Dispatch & CSV Logs" : isVi ? "Gửi & Tải báo cáo" : "自動配信＆レポート"}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{isEn ? "Automated delivery runs with AI skips; download complete CSV logs anytime." : isVi ? "Hệ thống tự động gửi form và cho phép tải file báo cáo CSV bất cứ lúc nào." : "AI除外を適用して自動配信。完了後は送信証跡CSVを即座にダウンロード。"}</p>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* SECTION: Corporate Trust & Payment Badges (Form Outreach) */}
        {/* ======================================================== */}
        <section className="bg-slate-50 border border-slate-200/90 dark:bg-[#12161E] dark:border-slate-800 rounded-xl p-6 sm:p-7 max-w-5xl mx-auto w-full" style={{ fontFeatureSettings: '"palt"' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1B4F8A] border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">インボイス制度対応</span>
                <span className="text-[11px] text-slate-500 leading-tight">適格請求書発行事業者<br /><span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">T7010401140954</span></span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1B4F8A] border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">即時領収書PDF発行</span>
                <span className="text-[11px] text-slate-500 leading-tight">Stripe決済完了後、管理画面から社名入りPDF領収書を即時発行</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1B4F8A] border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Banknote className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">請求書払い（Paid）対応</span>
                <span className="text-[11px] text-slate-500 leading-tight">法人向け月末締め翌月末払い・銀行振込のご相談も承ります</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1B4F8A] border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">APPI・個人情報保護準拠</span>
                <span className="text-[11px] text-slate-500 leading-tight">公開データのみを活用し、厳格なセキュリティ基準を遵守</span>
              </div>
            </div>
          </div>
        </section>

        {/* Form Outreach FAQs */}
        <section className="max-w-5xl mx-auto w-full">
          <div className="text-center mb-6">
            <HelpCircle className="w-7 h-7 text-[#1B4F8A] dark:text-blue-400 mx-auto mb-2" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {isEn ? "Frequently Asked Questions (Form Outreach)" : isVi ? "Câu Hỏi Thường Gặp (Form Outreach)" : "フォーム営業に関するよくあるご質問"}
            </h3>
          </div>

          <div className="space-y-3">
            {formFaqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-4.5 bg-white border border-slate-200/90 dark:bg-[#151B22] dark:border-slate-800 rounded-lg shadow-2xs"
              >
                <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-start gap-2.5 mb-2">
                  <span className="w-5 h-5 rounded-md bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/50 dark:text-blue-300 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono mt-0.5">Q</span>
                  <span>{faq.q}</span>
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7.5 font-normal">
                  {faq.a}
                </p>
              </div>
            ))}
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
          
          <div className="relative w-full max-w-sm bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 shadow-xl z-10 flex flex-col gap-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-10 h-10 bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/40 dark:text-blue-300 rounded-lg flex items-center justify-center mx-auto border border-blue-200/60 dark:border-blue-900/40">
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
                <div className="p-3 bg-slate-50 dark:bg-[#0D1117] rounded-lg border border-slate-200/90 dark:border-slate-800 flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-800 dark:text-slate-200">{showCheckoutModal.name}</span>
                    <span className="text-rose-600 font-mono">
                      {showCheckoutModal.listPrice > 0 ? (
                        <span className="flex items-center gap-1.5 flex-wrap justify-end">
                          <span className="line-through text-slate-400 font-normal">
                            ¥{showCheckoutModal.listPrice.toLocaleString()}
                          </span>
                          <span className="bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0">
                            {appliedCoupon && couponDiscount ? couponDiscount : 70}% OFF
                          </span>
                          <span className="font-bold text-rose-600">
                            = ¥{(appliedCoupon && couponDiscount ? Math.floor(showCheckoutModal.listPrice * (1 - couponDiscount / 100)) : showCheckoutModal.campaignPrice).toLocaleString()} / {isEn ? "1st mo" : isVi ? "tháng đầu" : "初月"}
                          </span>
                        </span>
                      ) : (
                        <span>¥0 / {isEn ? "mo" : isVi ? "tháng" : "月"}</span>
                      )}
                    </span>
                  </div>
                  {showCheckoutModal.listPrice > 0 && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 border-t border-slate-200/60 dark:border-slate-800 pt-1">
                      {isEn 
                        ? `※ 70% OFF applies to the 1st month for first-time subscribers. Renews at ¥${showCheckoutModal.listPrice.toLocaleString()}/mo from 2nd month.`
                        : isVi 
                        ? `※ Giảm 70% áp dụng cho tháng đầu tiên khi đăng ký mới. Tự động gia hạn ¥${showCheckoutModal.listPrice.toLocaleString()}/tháng từ tháng thứ 2.`
                        : `※ 新規登録限定で初月70%OFF！2ヶ月目以降は通常価格（¥${showCheckoutModal.listPrice.toLocaleString()}/月・税込）での自動更新となります。`}
                    </div>
                  )}
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
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg bg-white border border-slate-300 focus:outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A] dark:bg-[#0D1117] dark:border-slate-700 dark:text-white"
                />
              </div>

              <div className="flex items-start gap-2 mt-1 mb-2 bg-slate-50 dark:bg-[#0D1117] p-2.5 rounded-lg border border-slate-200/90 dark:border-slate-800">
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
                  className="w-full py-2.5 text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#163e6d] rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 bg-slate-50 dark:bg-[#0D1117] py-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
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
          
          <div className="relative w-full max-w-sm bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 shadow-xl z-10 flex flex-col gap-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-10 h-10 bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/40 dark:text-blue-300 rounded-lg flex items-center justify-center mx-auto border border-blue-200/60 dark:border-blue-900/40">
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
                <div className="p-3 bg-slate-50 dark:bg-[#0D1117] rounded-lg border border-slate-200/90 dark:border-slate-800 flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800 dark:text-slate-200">{showPackCheckoutModal.name}</span>
                  <span className="text-[#1B4F8A] dark:text-blue-300 font-mono font-bold">
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
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg bg-white border border-slate-300 focus:outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A] dark:bg-[#0D1117] dark:border-slate-700 dark:text-white"
                />
              </div>

              <div className="flex items-start gap-2 mt-1 mb-2 bg-slate-50 dark:bg-[#0D1117] p-2.5 rounded-lg border border-slate-200/90 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="agree-pack-terms"
                  required
                  className="rounded border-slate-300 text-[#1B4F8A] focus:ring-[#1B4F8A] h-3.5 w-3.5 mt-0.5 cursor-pointer"
                />
                <label htmlFor="agree-pack-terms" className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal cursor-pointer selection:bg-transparent">
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
                  className="w-full py-2.5 text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#163e6d] rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 bg-slate-50 dark:bg-[#0D1117] py-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{isEn ? "Secure checkout encrypted via Stripe." : isVi ? "Thanh toán an toàn được mã hóa qua Stripe." : "Stripe社による暗号化された安全な決済処理が施されます"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Form DM Checkout Simulator / Stripe Modal */}
      {showFormCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowFormCheckoutModal(null)}
          />
          
          <div className="relative w-full max-w-sm bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 shadow-xl z-10 flex flex-col gap-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-10 h-10 bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/40 dark:text-blue-300 rounded-lg flex items-center justify-center mx-auto border border-blue-200/60 dark:border-blue-900/40">
              <CreditCard className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                {isEn ? "Form Outreach Checkout" : isVi ? "Xác nhận thanh toán Form Outreach" : "フォーム営業 配信枠のお申し込み"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isEn ? "Review package details before proceeding to Stripe secure checkout." : isVi ? "Kiểm tra gói cước trước khi chuyển sang cổng thanh toán bảo mật Stripe." : "お申し込み内容をご確認の上、安全なStripe決済画面へお進みください。"}
              </p>
            </div>

            <form onSubmit={handleFormSubscribe} className="flex flex-col gap-3 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {isEn ? "Selected Package" : isVi ? "Gói đã chọn" : "選択したプラン"}
                </label>
                <div className="p-3 bg-slate-50 dark:bg-[#0D1117] rounded-lg border border-slate-200/90 dark:border-slate-800 flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-800 dark:text-slate-200">{showFormCheckoutModal.name}</span>
                    <span className="text-[#1B4F8A] dark:text-blue-300 font-mono">
                      ¥{showFormCheckoutModal.campaignPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="line-through">¥{showFormCheckoutModal.listPrice.toLocaleString()}</span>
                    <span className="font-bold text-rose-500">初回限定 70% OFF 適用</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 border-t border-slate-200/60 dark:border-slate-800 pt-1">
                    {isEn 
                      ? `※ 70% OFF applies to your 1st package purchase. Regular price (¥${showFormCheckoutModal.listPrice.toLocaleString()}) applies for subsequent orders.`
                      : isVi 
                      ? `※ Giảm 70% áp dụng cho đơn hàng đầu tiên. Các lần mua tiếp theo áp dụng giá gốc (¥${showFormCheckoutModal.listPrice.toLocaleString()}).`
                      : `※ 初回ご購入限定で70%OFF！2回目以降の追加購入は通常価格（¥${showFormCheckoutModal.listPrice.toLocaleString()}）となります。`}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 border-t border-slate-200/60 dark:border-slate-800 pt-1 flex justify-between">
                    <span>{isEn ? "Delivery Volume" : isVi ? "Số lượng Form" : "配信可能件数"}</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">+{showFormCheckoutModal.count.toLocaleString()} 件</strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {isEn ? "Billing Email" : isVi ? "Email nhận hóa đơn" : "請求先メールアドレス"}
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1117] text-slate-800 dark:text-slate-200 outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A]"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#1B4F8A] hover:bg-[#163e6d] text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{isEn ? "Connecting to Stripe..." : isVi ? "Đang kết nối Stripe..." : "Stripeに接続中..."}</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{isEn ? "Pay with Stripe (Secure)" : isVi ? "Thanh toán qua Stripe" : "Stripe決済画面へ進む"}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFormCheckoutModal(null)}
                  className="w-full py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs transition-colors cursor-pointer"
                >
                  {isEn ? "Cancel" : isVi ? "Hủy" : "キャンセル"}
                </button>
              </div>
            </form>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 bg-slate-50 dark:bg-[#0D1117] py-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1B4F8A] shrink-0" />
              <span>{isEn ? "Secure checkout encrypted via Stripe." : isVi ? "Thanh toán an toàn được mã hóa qua Stripe." : "Stripe社による暗号化された安全な決済処理が施されます"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
