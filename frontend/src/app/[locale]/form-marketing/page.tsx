"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { 
  Send, ShieldCheck, CheckCircle2, Clock, 
  ArrowRight, FileText, Phone, Mail, Building2, User, 
  ChevronDown, Check, Zap, Target, BarChart3,
  ExternalLink, Loader2, AlertCircle, Award, Layers,
  Calculator, Copy, Receipt, Lock, Banknote, TrendingUp, Coins, CreditCard
} from "lucide-react";
import Link from "next/link";

export default function FormMarketingPage() {
  const { locale } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const isJa = locale === "ja";
  const isVi = locale === "vi";

  // Outreach ROI Simulator state
  const [simVolume, setSimVolume] = useState<number>(3000);
  const [simCvr, setSimCvr] = useState<number>(0.8);
  const [activeTemplateTab, setActiveTemplateTab] = useState<string>("it_saas");
  const [copiedTemplate, setCopiedTemplate] = useState<boolean>(false);

  const getSimPricing = (vol: number) => {
    switch (vol) {
      case 1000:
        return { listPrice: 28000, campaignPrice: 8400, taxIncl: 9240, unitRate: 8.4, planName: isJa ? "1,000 件プラン" : isVi ? "Gói 1.000 Form" : "1,000 Forms" };
      case 3000:
        return { listPrice: 69000, campaignPrice: 20700, taxIncl: 22770, unitRate: 6.9, planName: isJa ? "3,000 件プラン" : isVi ? "Gói 3.000 Form" : "3,000 Forms" };
      case 5000:
        return { listPrice: 99000, campaignPrice: 29700, taxIncl: 32670, unitRate: 5.9, planName: isJa ? "5,000 件プラン" : isVi ? "Gói 5.000 Form" : "5,000 Forms" };
      case 10000:
      default:
        return { listPrice: 180000, campaignPrice: 54000, taxIncl: 59400, unitRate: 5.4, planName: isJa ? "10,000 件プラン" : isVi ? "Gói 10.000 Form" : "10,000 Forms" };
    }
  };

  const outreachTemplates = [
    {
      id: "it_saas",
      name: isJa ? "IT・SaaS・クラウド導入" : isVi ? "CNTT / SaaS / Cloud" : "IT / SaaS / Cloud",
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
      name: isJa ? "採用・人材紹介・派遣" : isVi ? "Tuyển dụng / Nhân sự" : "Recruitment / HR",
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
      name: isJa ? "士業・M&A・経営コンサル" : isVi ? "Tư vấn / M&A / Luật - Thuế" : "Consulting / M&A",
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
      name: isJa ? "製造・受託開発・OEM" : isVi ? "Sản xuất / Gia công OEM" : "Manufacturing / OEM",
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

  // Enterprise Custom Inquiry Form states
  const [selectedVolume, setSelectedVolume] = useState<"10k" | "20k" | "50k" | "custom">("10k");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleEnterpriseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !contactName || !email) {
      setErrorMsg(
        isJa
          ? "必須項目（会社名、お名前、メールアドレス）を入力してください。"
          : isVi
          ? "Vui lòng nhập các trường bắt buộc (Tên công ty, Họ tên, Email)."
          : "Please enter all required fields."
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const volumeLabels = {
      "10k": "10,000件〜20,000件 (大口プラン)",
      "20k": "20,000件〜50,000件 (大規模配信)",
      "50k": "50,000件以上 / 定期配信",
      "custom": "自社保有リスト・その他カスタム要件"
    };

    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "FORM_DM_CAMPAIGN",
          company_name: companyName,
          person_in_charge: contactName,
          requester_email: email,
          mobile_number: phone,
          locale,
          message: `【フォーム営業代行 大口・エンタープライズご相談】
■ 希望ボリューム: ${volumeLabels[selectedVolume]}
■ 相談内容・商材概要:
${message || "未入力"}`
        })
      });

      if (!res.ok) throw new Error("Failed to submit inquiry");
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        isJa
          ? "送信に失敗しました。時間をおいて再試行してください。"
          : isVi
          ? "Gửi yêu cầu thất bại. Vui lòng thử lại sau."
          : "Submission failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    {
      q: isJa
        ? "問い合わせフォーム営業は特定商取引法などの法律上問題ありませんか？"
        : isVi
        ? "Gửi Form DM có vi phạm luật chống spam hay luật Tokushoho tại Nhật không?"
        : "Is contact form outreach compliant with Japanese anti-spam regulations?",
      a: isJa 
        ? "はい、法令を遵守した設計を行っております。送信文面には特定商取引法に基づく発信者情報（会社名・担当者名・連絡先）および送信停止（オプトアウト）案内を必ず明記します。また、当社のAIシステムにより「営業目的の連絡お断り」と明記されている企業を自動除外するため、クレームリスクを最小化しています。"
        : isVi
        ? "Hoàn toàn hợp pháp và tuân thủ đúng Luật giao dịch thương mại đặc định (特定商取引法) của Nhật Bản. Mỗi thông điệp gửi đi đều ghi rõ thông tin pháp nhân người gửi và câu hướng dẫn từ chối nhận tin (Opt-out). Đặc biệt, hệ thống AI của chúng tôi tự động quét và bỏ qua các công ty có ghi chú 'Cấm chào hàng' (営業お断り)."
        : "Yes, fully compliant with Japanese laws. Every message contains complete sender corporate disclosure and an explicit opt-out notice. Additionally, our AI automatically filters out forms with anti-sales disclaimers."
    },
    {
      q: isJa
        ? "テレアポやメール営業（メルマガ）と何が違うのですか？"
        : isVi
        ? "Điểm khác biệt lớn nhất so với Telesales và Cold Email là gì?"
        : "How does this compare to Cold Email and Telesales?",
      a: isJa
        ? "メルマガや代表メール（info@宛）はスパムフィルターや受付で埋もれがちですが、Webサイトのお問い合わせフォームは【見込み客からの連絡窓口】であるため、社内の担当部署や決裁者（役員・部長クラス）が必ず目を通します。そのため閲覧率が50%〜90%と圧倒的に高く、アポイント獲得単価を大幅に削減できます。"
        : isVi
        ? "Email gửi hòm thư chung (info@) thường bị lễ tân bỏ qua hoặc rơi vào mục Spam. Ngược lại, Form liên hệ trên website là kênh đón khách hàng nên luôn được Ban Giám đốc, Trưởng phòng Kinh doanh hoặc CSKH kiểm tra kỹ lưỡng. Tỷ lệ mở thực tế đạt 50% - 90%, mang lại số lượng cuộc hẹn cao gấp nhiều lần."
        : "Unlike general info@ inboxes that get flooded with spam, corporate contact forms are designated inquiry channels actively monitored by executives and managers, resulting in 50%-90% read rates."
    },
    {
      q: isJa
        ? "文面がまだ完成していないのですが、どうすればよいですか？"
        : isVi
        ? "Chúng tôi chưa có kịch bản chào hàng tiếng Nhật chuẩn thì có được hỗ trợ không?"
        : "Can you help optimize our Japanese pitch template?",
      a: isJa
        ? "管理画面内に日本のビジネスマナーに対応した「業種別テンプレート」を複数ご用意しております。自社のサービス概要や会社名を当てはめるだけで、誰でも効果的なアプローチ文面を簡単に作成いただけます。また、作成された文面は配信開始前に運営スタッフが特定商取引法やNGワードの事前審査を行いますので、安心してご利用いただけます。"
        : isVi
        ? "Trong trang quản trị (Dashboard) có sẵn thư viện mẫu kịch bản Kính ngữ (Keigo) chuẩn theo từng ngành nghề. Bạn chỉ cần điền tên sản phẩm là có thể kích hoạt. Ngoài ra, đội ngũ quản trị sẽ rà soát tuân thủ luật Tokushoho và từ khóa cấm trước khi hệ thống bắt đầu phát hành."
        : "Our dashboard provides pre-built Japanese business etiquette (Keigo) templates. All submitted scripts undergo compliance verification prior to dispatch."
    },
    {
      q: isJa
        ? "送信結果やレポートはどのように確認できますか？"
        : isVi
        ? "Sau khi gửi xong, báo cáo kết quả được cung cấp như thế nào?"
        : "How is the delivery proof delivered?",
      a: isJa
        ? "配信開始後、管理画面のダッシュボード上でリアルタイムに送信進捗が反映されます。配信完了後は、送信企業名、法人番号、送信日時、対象フォームURL、送信ステータスを記載した詳細なエクセル/CSVレポートをワンクリックでダウンロード可能です。"
        : isVi
        ? "Ngay khi bắt đầu gửi, tiến độ sẽ cập nhật trực tiếp trên Dashboard. Khi hoàn tất, bạn có thể tải về file Excel/CSV chi tiết gồm: Tên doanh nghiệp, Mã số thuế, Thời gian gửi, URL form và trạng thái gửi thành công."
        : "Live progress updates are shown directly on your dashboard. Upon completion, download full CSV reports containing corporate numbers, company names, form URLs, exact timestamps, and delivery logs."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D1117] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-[#1B4F8A]/20 font-sans">
      <Header />

      <main className="flex-1">
        {/* HERO SECTION: Authoritative Japan B2B Header */}
        <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-20 border-b border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0D1117]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              {/* B2B Eyebrow Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 text-[#1B4F8A] dark:text-blue-400 text-xs font-bold mb-6 tracking-wide shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A] dark:bg-blue-400 animate-pulse" />
                <span>
                  {isJa
                    ? "国内500万社DB連携 × 完全オンライン自動フォーム営業プラットフォーム"
                    : isVi
                    ? "Database 5 Triệu Doanh nghiệp × Tự động hóa Form Outreach B2B"
                    : "5M+ Verified Companies × Self-Serve Contact Form Outreach SaaS"}
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.25] mb-6">
                {isJa ? (
                  <>
                    問い合わせフォーム営業を、<br />
                    <span className="text-[#1B4F8A] dark:text-blue-400">
                      オンラインで最短即日スタート。
                    </span>
                  </>
                ) : isVi ? (
                  <>
                    Tiếp cận trực tiếp ban lãnh đạo doanh nghiệp Nhật với<br />
                    <span className="text-[#1B4F8A] dark:text-blue-400">
                      Nền tảng Tự động Gửi Form Marketing B2B
                    </span>
                  </>
                ) : (
                  <>
                    Scale Your B2B Meetings in Japan with<br />
                    <span className="text-[#1B4F8A] dark:text-blue-400">
                      Self-Serve Form Outreach Platform
                    </span>
                  </>
                )}
              </h1>

              {/* Subheadline */}
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-8 max-w-2xl mx-auto font-normal">
                {isJa
                  ? "テレアポの受付ブロックやメールの迷惑フォルダを完全回避。500万社データベースからターゲット企業を抽出し、管理画面から自社の営業文面を即時設定。運営による事前法令・NGワード審査で、安全かつ効率的な新規商談創出を実現します。"
                  : isVi
                  ? "Vượt qua bộ lọc spam và lễ tân. Lọc tệp khách hàng từ 5 triệu doanh nghiệp, tự soạn kịch bản và kích hoạt chiến dịch ngay trên hệ thống. Đội ngũ kiểm duyệt tuân thủ Tokushoho và nội dung trước khi gửi để đảm bảo an toàn tuyệt đối."
                  : "Bypass gatekeepers and spam filters. Filter hyper-targeted prospects from 5M+ records, set up your pitch template, and dispatch automatically with our safety & compliance verification."}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={`/${locale}/dashboard?tab=formCampaigns`}
                  className="px-6 py-3.5 rounded-lg font-bold text-xs sm:text-sm text-white bg-[#1B4F8A] hover:bg-[#163e6d] shadow-2xs active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isJa
                      ? "今すぐ配信キャンペーンを設定する"
                      : isVi
                      ? "Thiết lập chiến dịch gửi ngay"
                      : "Launch Campaign Now"}
                  </span>
                </Link>
                <Link
                  href={`/${locale}/search?contact_form=true`}
                  className="px-6 py-3.5 rounded-lg font-bold text-xs sm:text-sm bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 shadow-2xs active:scale-[0.98] transition-all flex items-center gap-1.5"
                >
                  <span>
                    {isJa
                      ? "フォーム対象企業を検索"
                      : isVi
                      ? "Khám phá danh sách có Form"
                      : "Search Companies with Forms"}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>

              {/* Key Trust Metrics Bar (B2B Spec Matrix) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-200/80 dark:border-slate-800">
                <div className="text-center p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-800">
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">5,070,000+</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{isJa ? "収録法人データベース" : isVi ? "Dữ liệu pháp nhân toàn Nhật" : "Total Companies in DB"}</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-800">
                  <div className="text-xl sm:text-2xl font-bold text-[#1B4F8A] dark:text-blue-400">235,000+</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{isJa ? "フォームURL常時解析済" : isVi ? "Form liên hệ sẵn sàng gửi" : "Verified Form URLs"}</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-800">
                  <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">50〜90%</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{isJa ? "平均開封・閲覧率" : isVi ? "Tỷ lệ mở & đọc thực tế" : "Average Read Rate"}</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-800">
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-200">¥5.9〜</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{isJa ? "初回送信完了単価 (業界最安)" : isVi ? "Chi phí gửi từ 5.9 JPY/form (Lần đầu)" : "Cost per form from 5.9 JPY (1st Order)"}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMPARISON TABLE: Why Form DM > Cold Email & Telesales */}
        <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2.5">
              {isJa ? "他アウトバウンド手法との決定的な違い" : isVi ? "So sánh Form DM với các kênh Outbound khác tại Nhật" : "Why Form Outreach Beats Traditional Channels"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal">
              {isJa
                ? "テレアポ・代表メール営業の課題をすべて解決する次世代の営業アプローチです。"
                : isVi
                ? "Giải quyết triệt để vấn đề bị lễ tân chặn hay email rơi vào hộp thư rác."
                : "A modern B2B acquisition strategy designed to bypass spam filters and gatekeepers."}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse bg-white dark:bg-[#161B22] rounded-xl overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-2xs text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                  <th className="p-4 sm:p-5 font-bold text-slate-700 dark:text-slate-300">{isJa ? "比較項目" : isVi ? "Tiêu chí" : "Metric"}</th>
                  <th className="p-4 sm:p-5 font-medium text-slate-500 dark:text-slate-400">{isJa ? "代表メール (info@)" : isVi ? "Cold Email (info@)" : "Cold Email"}</th>
                  <th className="p-4 sm:p-5 font-medium text-slate-500 dark:text-slate-400">{isJa ? "テレアポ (架電)" : isVi ? "Telesales (Gọi điện)" : "Cold Calling"}</th>
                  <th className="p-4 sm:p-5 font-bold text-[#1B4F8A] dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 border-l border-r border-blue-200/80 dark:border-blue-900/60">
                    <span className="flex items-center gap-1.5">
                      <Send className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                      {isJa ? "Kigyou-List フォーム営業" : isVi ? "Gửi Form DM (Kigyou-List)" : "Kigyou-List Form DM"}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                <tr>
                  <td className="p-4 sm:p-5 font-semibold">{isJa ? "閲覧・到達率" : isVi ? "Tỷ lệ đọc / Mở" : "Read / Open Rate"}</td>
                  <td className="p-4 sm:p-5 text-rose-600 dark:text-rose-400">3% 〜 5% (迷惑メール化)</td>
                  <td className="p-4 sm:p-5 text-amber-600 dark:text-amber-400">10% 〜 20% (受付ブロック)</td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/20 border-l border-r border-blue-200/60 dark:border-blue-900/40">
                    50% 〜 90% (決裁者必読)
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold">{isJa ? "アプローチ単価" : isVi ? "Chi phí tiếp cận / lượt" : "Cost per touch"}</td>
                  <td className="p-4 sm:p-5">¥1 〜 ¥3</td>
                  <td className="p-4 sm:p-5 text-rose-600 dark:text-rose-400">¥200 〜 ¥350 / 呼</td>
                  <td className="p-4 sm:p-5 font-bold text-[#1B4F8A] dark:text-blue-400 bg-blue-50/20 dark:bg-blue-950/20 border-l border-r border-blue-200/60 dark:border-blue-900/40">
                    <div className="flex flex-col">
                      <span className="text-rose-600 dark:text-rose-400 font-extrabold">
                        {isJa ? "初回 約 ¥5.9 〜 ¥8.4 / 送信" : isVi ? "Lần đầu: ~¥5.9 〜 ¥8.4 / lượt" : "1st time: ~5.9 - 8.4 JPY"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {isJa ? "（通常: ¥19.8 〜 ¥28）" : isVi ? "（Giá gốc: ¥19.8 〜 ¥28）" : "(Regular: 19.8 - 28 JPY)"}
                      </span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold">{isJa ? "アポ獲得率 (CVR)" : isVi ? "Tỷ lệ chốt cuộc hẹn" : "Meeting CVR"}</td>
                  <td className="p-4 sm:p-5 text-slate-500">0.05% 〜 0.1%</td>
                  <td className="p-4 sm:p-5">0.5% 〜 1.0%</td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/20 border-l border-r border-blue-200/60 dark:border-blue-900/40">
                    0.5% 〜 2.0% (高レスポンス)
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold">{isJa ? "自社リソース負荷" : isVi ? "Gánh nặng nhân sự nội bộ" : "In-house Workload"}</td>
                  <td className="p-4 sm:p-5">中 (配信リスト管理・SPF)</td>
                  <td className="p-4 sm:p-5 text-rose-600 dark:text-rose-400">極めて大 (担当者の疲弊)</td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/20 border-l border-r border-blue-200/60 dark:border-blue-900/40">
                    数分で完了 (完全オンライン完結)
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold">{isJa ? "クレーム防止対策" : isVi ? "Phòng chống khiếu nại" : "Complaint Prevention"}</td>
                  <td className="p-4 sm:p-5">ドメイン汚染リスク大</td>
                  <td className="p-4 sm:p-5">ガチャ切り・苦情リスク</td>
                  <td className="p-4 sm:p-5 font-bold text-[#1B4F8A] dark:text-blue-400 bg-blue-50/20 dark:bg-blue-950/20 border-l border-r border-blue-200/60 dark:border-blue-900/40">
                    AI自動除外 ＆ 運営事前審査
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4 CORE FEATURES */}
        <section className="py-16 bg-slate-50/60 dark:bg-[#12161E] border-t border-b border-slate-200/80 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2.5">
                {isJa ? "Kigyou-list が選ばれる4つの強み" : isVi ? "4 Ưu điểm độc quyền của Nền tảng Gửi Form Kigyou-List" : "4 Pillars of Kigyou-List Form Outreach SaaS"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal">
                {isJa
                  ? "高い反響率と法令遵守の両立を支えるセルフサービステクノロジー。"
                  : isVi
                  ? "Tối ưu hóa chuyển đổi và bảo vệ uy tín thương hiệu bằng quy trình tự động hóa chuẩn xác."
                  : "Enterprise-grade safety, precision targeting, and high conversion safeguards."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Feature 1 */}
              <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-900/50 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
                    {isJa ? "AI「営業お断り」自動検知・除外フィルター" : isVi ? "AI Tự động bỏ qua Form 'Cấm chào hàng'" : "AI Anti-Spam Disclaimer Detector"}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    {isJa
                      ? "フォーム周辺にある「営業目的の連絡はお断り」「セールス禁止」などの免責文言をAIが事前解析。該当する企業には自動的に送信をスキップし、貴社のブランド価値を保全します。"
                      : isVi
                      ? "Thuật toán AI tự động quét nội dung trang form. Nếu phát hiện các câu cảnh báo như '営業お断り' (Cấm quảng cáo), bot sẽ lập tức bỏ qua để đảm bảo an toàn tuyệt đối cho thương hiệu của bạn."
                      : "Our AI scans DOM for anti-sales keywords before submitting, automatically skipping non-compliant forms to protect your brand reputation."}
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-900/50 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
                    {isJa ? "運営スタッフによる事前法令・NGワード審査" : isVi ? "Duyệt kịch bản tuân thủ Pháp luật & Từ khóa cấm" : "Human Compliance & Tokushoho Review"}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    {isJa
                      ? "送信前に特定商取引法に基づく発信者情報やオプトアウト案内の記載を専任スタッフが迅速にチェック（最短2〜4時間）。法令違反や過度な売り込みトラブルを未然に防止します。"
                      : isVi
                      ? "Trước khi gửi, chuyên viên sẽ kiểm duyệt kịch bản để đảm bảo đầy đủ thông tin pháp nhân người gửi và câu từ chối nhận tin (opt-out), tránh mọi rủi ro vi phạm pháp luật Nhật Bản."
                      : "Every submitted campaign is reviewed by our compliance specialists within 2-4 hours to ensure Tokushoho and opt-out regulations are strictly met."}
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-900/50 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
                    {isJa ? "500万社DBから高精度ターゲティング" : isVi ? "Nhắm chọn đối tượng mục tiêu từ 5 triệu doanh nghiệp" : "Hyper-Targeting from 5M+ Enterprise DB"}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    {isJa
                      ? "JSIC中分類業界コード、資本金、従業員規模、都道府県、求人・助成金シグナルを組み合わせ、本当に貴社の商品を必要としている企業だけを狙い撃ちできます。"
                      : isVi
                      ? "Kết hợp ngành nghề JSIC, số vốn, số nhân viên, tỉnh thành, tín hiệu tuyển dụng (HelloWork) hoặc nhận trợ cấp nhà nước để nhắm đúng các công ty có ngân sách và nhu cầu thực tế."
                      : "Filter by JSIC industry codes, capital amount, employee headcounts, prefecture, and hiring signals to target high-budget buyers."}
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-900/50 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
                    {isJa ? "リアルタイム管理画面 & CSV証跡レポート" : isVi ? "Báo cáo minh bạch 100% kèm Log & Bằng chứng" : "Live Dashboard & 100% Audit Logs"}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    {isJa
                      ? "送信進捗は管理画面でリアルタイムに確認可能。送信完了後は企業名、法人番号、送信日時、フォームURLを網羅したCSVレポートをいつでもダウンロードいただけます。"
                      : isVi
                      ? "Theo dõi tiến độ gửi trực tiếp trên giao diện quản trị. Tải về file báo cáo chi tiết gồm tên công ty, link form, thời điểm gửi, kết quả xác nhận bất cứ lúc nào."
                      : "Track delivery progress live in your dashboard. Download comprehensive CSV audit files including timestamps and URLs upon completion."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING PLANS */}
        <section id="pricing" className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8" style={{ fontFeatureSettings: '"palt"' }}>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#1B4F8A] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 text-xs font-semibold mb-3">
              <Coins className="w-3.5 h-3.5" />
              <span>{isJa ? "シンプル＆成果重視の料金体系（完全都度課金）" : isVi ? "Bảng giá minh bạch - Không phí ẩn" : "Transparent Pricing - Pay-As-You-Go"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2.5 tracking-tight">
              {isJa ? "送信ボリューム別プラン" : isVi ? "Các gói chiến dịch gửi Form" : "Outreach Volume Packages"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
              {isJa ? "初期費用ゼロ・月額固定費ゼロ。送信完了件数に応じた完全都度課金制。管理画面から即時オンライン配信。" : isVi ? "Không phí khởi tạo, không phí duy trì. Tự lên kịch bản và kích hoạt trực tiếp từ hệ thống." : "Zero setup fees, zero monthly commitments. Pure pay-as-you-go delivery."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {/* 1,000 Plan */}
            <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  {isJa ? "1,000 件プラン" : isVi ? "Gói Starter 1.000 Form" : "Starter (1,000 Forms)"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 font-normal">
                  {isJa ? "まずは効果検証・テスト送信に最適" : isVi ? "Thử nghiệm phản hồi thị trường" : "Ideal for testing product-market fit"}
                </p>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums font-mono">¥8,400</span>
                  <span className="text-xs text-slate-400">({isJa ? "税抜" : isVi ? "chưa VAT" : "excl. tax"})</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="line-through text-slate-400 text-xs tabular-nums font-mono">¥28,000</span>
                  <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400 text-[10px] tabular-nums font-mono">
                    初回 70% OFF
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums font-mono mb-2">
                  <span>税込 ¥9,240</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold mb-6 tabular-nums font-mono">
                  {isJa ? "単価: 8.4円（税込 9.24円）/ 送信完了" : isVi ? "Đơn giá: 8.4 JPY (gồm thuế 9.24 JPY) / lượt" : "8.4 JPY (tax incl. 9.24 JPY) / form"}
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-350 border-t border-slate-100 dark:border-slate-800 pt-5 font-normal">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isJa ? "ターゲット企業リスト抽出" : isVi ? "Lọc tệp khách hàng từ 5M DB" : "Target list filtering"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isJa ? "AI営業お断り自動除外" : isVi ? "AI quét bỏ qua form cấm quảng cáo" : "AI anti-sales form skip"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isJa ? "業種別テンプレート活用" : isVi ? "Thư viện mẫu kịch bản chuẩn Keigo" : "Industry templates library"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isJa ? "運営による事前法令・NGワード審査" : isVi ? "Kiểm duyệt tuân thủ Tokushoho" : "Pre-dispatch compliance check"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isJa ? "リアルタイム進捗 ＆ CSVレポート" : isVi ? "Báo cáo CSV và theo dõi trực tiếp" : "Realtime logs & CSV report"}</span>
                  </li>
                </ul>
              </div>

              <Link
                href={`/${locale}/dashboard?tab=formCampaigns`}
                className="mt-8 w-full py-2.5 rounded-lg font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-center transition-colors block shadow-2xs active:scale-[0.98]"
              >
                {isJa ? "このプランで配信設定する" : isVi ? "Cấu hình gói Starter" : "Select Starter"}
              </Link>
            </div>

            {/* 3,000 Plan (RECOMMENDED) */}
            <div className="bg-white dark:bg-[#161B22] border-2 border-[#1B4F8A] rounded-xl p-6 sm:p-7 shadow-xs flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-md bg-[#1B4F8A] text-white text-[10px] font-bold tracking-wider shadow-2xs whitespace-nowrap flex items-center gap-1.5 border border-white/20">
                <CheckCircle2 className="w-3 h-3 text-white" />
                <span>{isJa ? "推奨・一番人気の標準プラン" : isVi ? "Phổ biến & Tối ưu nhất" : "RECOMMENDED & BEST VALUE"}</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#1B4F8A] dark:text-blue-400 mb-1">
                  {isJa ? "3,000 件プラン" : isVi ? "Gói Standard 3.000 Form" : "Standard (3,000 Forms)"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 font-normal">
                  {isJa ? "本格的なリード獲得・商談創出に" : isVi ? "Đạt lượng chuyển đổi cuộc hẹn ổn định" : "Optimal for scalable lead generation"}
                </p>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-extrabold text-[#1B4F8A] dark:text-blue-300 tabular-nums font-mono">¥20,700</span>
                  <span className="text-xs text-slate-400">({isJa ? "税抜" : isVi ? "chưa VAT" : "excl. tax"})</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="line-through text-slate-400 text-xs tabular-nums font-mono">¥69,000</span>
                  <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400 text-[10px] tabular-nums font-mono">
                    初回 70% OFF
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums font-mono mb-2">
                  <span>税込 ¥22,770</span>
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-6 tabular-nums font-mono">
                  {isJa ? "単価: 6.9円（税込 7.59円）/ 送信完了 (業界最安級)" : isVi ? "Đơn giá: 6.9 JPY (gồm thuế 7.59 JPY) / lượt" : "6.9 JPY (tax incl. 7.59 JPY) / form"}
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-350 border-t border-slate-100 dark:border-slate-800 pt-5 font-normal">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isJa ? "ターゲット企業リスト抽出" : isVi ? "Lọc tệp khách hàng từ 5M DB" : "Target list filtering"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isJa ? "AI営業お断り自動除外" : isVi ? "AI quét bỏ qua form cấm quảng cáo" : "AI anti-sales form skip"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      {isJa ? "企業名・住所などの自動差し込みタグ対応" : isVi ? "Tự động chèn {company_name}, {location}" : "Dynamic placeholder tags"}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isJa ? "優先スピード審査（最短2時間）" : isVi ? "Ưu tiên kiểm duyệt trong 2 giờ" : "Priority 2-hour compliance check"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isJa ? "リアルタイム進捗 ＆ CSVレポート" : isVi ? "Báo cáo CSV và theo dõi trực tiếp" : "Realtime logs & CSV report"}</span>
                  </li>
                </ul>
              </div>

              <Link
                href={`/${locale}/dashboard?tab=formCampaigns`}
                className="mt-8 w-full py-3 rounded-lg font-bold text-xs text-white bg-[#1B4F8A] hover:bg-[#143D6C] shadow-2xs text-center transition-all block active:scale-[0.98]"
              >
                {isJa ? "このプランで今すぐ始める" : isVi ? "Bắt đầu với gói Standard" : "Launch Standard"}
              </Link>
            </div>

            {/* 5,000+ Plan */}
            <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  {isJa ? "5,000 件プラン" : isVi ? "Gói Enterprise 5.000 Form" : "Enterprise (5,000+ Forms)"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 font-normal">
                  {isJa ? "大量アプローチで商談数を最大化" : isVi ? "Quy mô lớn, chi phí trên mỗi form rẻ nhất" : "Maximum appointment pipeline volume"}
                </p>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums font-mono">¥29,700</span>
                  <span className="text-xs text-slate-400">({isJa ? "税抜" : isVi ? "chưa VAT" : "excl. tax"})</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="line-through text-slate-400 text-xs tabular-nums font-mono">¥99,000</span>
                  <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400 text-[10px] tabular-nums font-mono">
                    初回 70% OFF
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums font-mono mb-2">
                  <span>税込 ¥32,670</span>
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-6 tabular-nums font-mono">
                  {isJa ? "単価: 5.9円（税込 6.49円）/ 送信完了 (最安値レート)" : isVi ? "Đơn giá: 5.9 JPY (gồm thuế 6.49 JPY) / lượt" : "5.9 JPY (tax incl. 6.49 JPY) / form"}
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-350 border-t border-slate-100 dark:border-slate-800 pt-5 font-normal">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isJa ? "ターゲット企業リスト抽出" : isVi ? "Lọc tệp khách hàng từ 5M DB" : "Target list filtering"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isJa ? "AI営業お断り自動除外" : isVi ? "AI quét bỏ qua form cấm quảng cáo" : "AI anti-sales form skip"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isJa ? "自動差し込みタグ＆高度な除外設定" : isVi ? "Hỗ trợ tùy biến nâng cao" : "Advanced filter & tags"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isJa ? "最優先審査 ＆ 分割配信スケジュール対応" : isVi ? "Chia lịch gửi tối ưu theo ngày" : "Priority scheduling"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isJa ? "リアルタイム進捗 ＆ CSVレポート" : isVi ? "Báo cáo CSV và theo dõi trực tiếp" : "Realtime logs & CSV report"}</span>
                  </li>
                </ul>
              </div>

              <Link
                href={`/${locale}/dashboard?tab=formCampaigns`}
                className="mt-8 w-full py-2.5 rounded-lg font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-center transition-colors block shadow-2xs active:scale-[0.98]"
              >
                {isJa ? "このプランで配信設定する" : isVi ? "Cấu hình gói Enterprise" : "Select Enterprise"}
              </Link>
            </div>
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
                <span>{isJa ? "商談獲得シミュレーター（効果試算）" : isVi ? "Bộ tính toán Hiệu quả Đầu tư ROI" : "Outreach ROI Simulator"}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isJa ? "配信ボリューム別の商談獲得見込と獲得単価" : isVi ? "Dự toán Số Cuộc hẹn & Chi phí CPA" : "Estimate Appointments & Cost per Meeting"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-normal">
                {isJa 
                  ? "配信件数と想定反響率（CVR）を選択すると、獲得できる商談数や1アポイントあたりの推定コストを即時試算できます。"
                  : isVi 
                  ? "Chọn quy mô số lượng form và tỷ lệ phản hồi mong muốn để tính toán hiệu quả và chi phí trên mỗi cuộc hẹn."
                  : "Select target delivery volume and expected conversion rate to simulate ROI before launching."}
              </p>
            </div>
            <div className="px-3 py-1.5 bg-slate-50 dark:bg-[#0D1117] rounded-lg border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
              {isJa ? "※ 弊社B2B配信実績に基づく統計値" : isVi ? "Dựa trên dữ liệu thực tế B2B" : "Based on real B2B benchmarks"}
            </div>
          </div>

          {/* Controls: Volume & CVR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Volume selector */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>{isJa ? "1. 配信件数（ボリューム）を選択" : isVi ? "1. Chọn số lượng form tiếp cận" : "1. Select Outreach Volume"}</span>
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
                    {vol === 3000 && <span className="block text-[9px] font-sans font-normal opacity-90">{isJa ? "推奨" : isVi ? "Phổ biến" : "Popular"}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* CVR selector */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>{isJa ? "2. 想定アポイント獲得率（CVR）" : isVi ? "2. Tỷ lệ phản hồi / Đặt hẹn dự kiến (CVR)" : "2. Target Response Rate (CVR)"}</span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{simCvr}%</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 0.3, label: isJa ? "慎重 (0.3%)" : isVi ? "Thận trọng" : "Conservative" },
                  { val: 0.8, label: isJa ? "標準 (0.8%)" : isVi ? "Trung bình" : "Standard" },
                  { val: 1.5, label: isJa ? "最適化 (1.5%)" : isVi ? "Tối ưu cao" : "Optimized" }
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
                      {isJa ? "配信費用（税込総額）" : isVi ? "Tổng chi phí (gồm thuế)" : "Total Price (Tax Incl.)"}
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
                      {isJa ? "商談獲得見込数" : isVi ? "Số cuộc hẹn dự kiến" : "Estimated Appointments"}
                    </span>
                    <div className="mt-2">
                      <div className="text-2xl sm:text-3xl font-extrabold text-[#1B4F8A] dark:text-blue-400 tabular-nums font-mono">
                        {appointments} <span className="text-xs font-normal">件</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {isJa ? `反響率 ${simCvr}% 基準` : isVi ? `Ước tính CVR ${simCvr}%` : `CVR ${simCvr}% estimated`}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {isJa ? "1商談あたりの獲得コスト" : isVi ? "Chi phí trên 1 cuộc hẹn" : "Cost per Meeting"}
                    </span>
                    <div className="mt-2">
                      <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums font-mono">
                        ¥{cpa.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-emerald-600/90 dark:text-emerald-400/80 font-medium">
                        {isJa ? "テレアポの約1/10" : isVi ? "Tiết kiệm hơn Telesales" : "Industry lowest level"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0D1117] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {isJa ? "テレアポ代行比の削減額" : isVi ? "Tiết kiệm so với thuê ngoài" : "Saved vs Telesales"}
                    </span>
                    <div className="mt-2">
                      <div className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums font-mono">
                        -¥{savings.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {isJa ? "※ アポ単価2万円換算との比較" : isVi ? "(So với mức ¥20.000 / hẹn)" : "※ Benchmark: ¥20k / meeting"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-900/30 mt-1">
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-white font-bold">{pricing.planName}</strong>
                    {" "}(¥{pricing.campaignPrice.toLocaleString()} 税抜) {isJa ? "でこの効果を今すぐ管理画面で検証できます。" : isVi ? "để kiểm chứng hiệu quả ngay trên hệ thống." : "can be launched directly on dashboard."}
                  </span>
                  <Link
                    href={`/${locale}/dashboard?tab=formCampaigns`}
                    className="px-4 py-2 rounded-lg font-bold text-xs text-white bg-[#1B4F8A] hover:bg-[#143D6C] shadow-2xs transition-all flex items-center gap-1.5 shrink-0 active:scale-[0.98]"
                  >
                    <span>{isJa ? "管理画面で配信設定へ" : isVi ? "Tạo chiến dịch ngay" : "Launch on Dashboard"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })()}

          {/* Enterprise notice & Cross-link to Data Pricing */}
          <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
            {isJa ? (
              <>
                <p>
                  ※ 10,000件以上の大口配信や、請求書払い（月末締め翌月末払い）をご希望の場合は、
                  <a href="#contact-form" className="text-[#1B4F8A] dark:text-blue-400 underline font-semibold ml-1">
                    下記の大口・カスタム窓口
                  </a>
                  よりお気軽にご相談ください。
                </p>
                <p className="text-slate-400 dark:text-slate-500">
                  ※ 企業データベースの閲覧やCSV抽出のみをご希望の場合は、
                  <Link href={`/${locale}/pricing`} className="text-[#1B4F8A] dark:text-blue-400 underline font-medium ml-1">
                    企業データ料金プラン
                  </Link>
                  をご確認ください。
                </p>
              </>
            ) : isVi ? (
              <>
                <p>
                  ※ Đối với nhu cầu gửi trên 10.000 Form hoặc thanh toán bằng hóa đơn công ty (Invoice), vui lòng liên hệ tại
                  <a href="#contact-form" className="text-[#1B4F8A] dark:text-blue-400 underline font-semibold ml-1">
                    Mục tư vấn Doanh nghiệp lớn
                  </a>.
                </p>
                <p className="text-slate-400 dark:text-slate-500">
                  ※ Nếu bạn chỉ có nhu cầu tra cứu và xuất danh sách CSV, vui lòng xem
                  <Link href={`/${locale}/pricing`} className="text-[#1B4F8A] dark:text-blue-400 underline font-medium ml-1">
                    Bảng giá Dữ liệu Doanh nghiệp
                  </Link>.
                </p>
              </>
            ) : (
              <>
                <p>
                  For enterprise volume (10,000+ forms) or invoice billing, please contact our
                  <a href="#contact-form" className="text-[#1B4F8A] dark:text-blue-400 underline font-semibold ml-1">
                    Enterprise Consultation desk
                  </a>.
                </p>
                <p className="text-slate-400 dark:text-slate-500">
                  If you only need corporate search and CSV list exports, please view our
                  <Link href={`/${locale}/pricing`} className="text-[#1B4F8A] dark:text-blue-400 underline font-medium ml-1">
                    Corporate Data Pricing Plans
                  </Link>.
                </p>
              </>
            )}
          </div>
        </section>

        {/* 4-STEP WORKFLOW */}
        <section className="py-16 bg-slate-50/60 dark:bg-[#12161E] border-t border-b border-slate-200/80 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2.5">
                {isJa ? "お申し込みから配信開始までの流れ" : isVi ? "Quy trình triển khai 4 bước tự động" : "Simple 4-Step Self-Serve Workflow"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal">
                {isJa ? "管理画面からオンライン完結。最短即日でターゲット企業へのアプローチを開始できます。" : isVi ? "Thực hiện hoàn toàn trực tuyến trên hệ thống, bắt đầu tiếp cận khách hàng chỉ trong ngày." : "Setup entirely online. Launch your outbound campaign in as fast as same-day."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <div className="p-5 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 shadow-2xs relative">
                <div className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 mb-1.5 uppercase tracking-wide">STEP 01</div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {isJa ? "ターゲット抽出・リスト指定" : isVi ? "Lọc đối tượng mục tiêu" : "Filter Target Prospects"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                  {isJa ? "500万社データベースから業種、地域、企業規模、キーワードなどの条件を指定し、アプローチ対象企業を抽出。" : isVi ? "Lọc tệp doanh nghiệp theo ngành nghề, vốn điều lệ, số nhân sự, tỉnh thành hoặc tín hiệu kinh doanh." : "Select target industry, geography, and headcounts from our 5M+ database."}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 shadow-2xs relative">
                <div className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 mb-1.5 uppercase tracking-wide">STEP 02</div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {isJa ? "配信メッセージの作成" : isVi ? "Soạn thảo kịch bản chào hàng" : "Compose Pitch Message"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                  {isJa ? "管理画面上で営業文面を入力。業種別テンプレートを活用し、会社名や住所の自動差し込みタグも設定可能。" : isVi ? "Tự nhập nội dung hoặc chọn mẫu có sẵn, hỗ trợ tự động chèn tên công ty người nhận." : "Craft your pitch copy using industry templates with dynamic company name tags."}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 shadow-2xs relative">
                <div className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 mb-1.5 uppercase tracking-wide">STEP 03</div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {isJa ? "オンライン決済 & 運営審査" : isVi ? "Thanh toán & Kiểm duyệt" : "Checkout & Compliance Review"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                  {isJa ? "オンラインで決済完了後、特定商取引法遵守・オプトアウト記載や営業NG規約を専任スタッフが速やかに審査（最短2〜4時間）。" : isVi ? "Thanh toán trực tuyến. Đội ngũ quản trị kiểm tra tính tuân thủ pháp luật và từ khóa cấm trong 2-4 giờ." : "Instant checkout. Our team verifies Tokushoho compliance within 2 to 4 hours."}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 shadow-2xs relative">
                <div className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 mb-1.5 uppercase tracking-wide">STEP 04</div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {isJa ? "自動配信開始 & リアルタイム管理" : isVi ? "Tự động gửi & Báo cáo real-time" : "Automated Sending & Live Logs"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                  {isJa ? "AI自動除外を用いて安全に配信。送信完了結果やログは管理画面からリアルタイムで確認・CSVダウンロード可能。" : isVi ? "Hệ thống tự động gửi an toàn qua proxy Nhật. Khách hàng theo dõi tiến độ và tải file CSV trên Dashboard." : "Safe residential proxy dispatching with auto-skip. Audit CSV logs available on dashboard."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* SECTION: Industry Keigo Templates Showcase */}
        {/* ======================================================== */}
        <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full" style={{ fontFeatureSettings: '"palt"' }}>
          <div className="bg-white border border-slate-200/90 dark:bg-[#151B22] dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#1B4F8A] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 text-[11px] font-bold mb-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isJa ? "業種別・高反響アプローチ文面テンプレート" : isVi ? "THƯ VIỆN KỊCH BẢN KÍNH NGỮ" : "High-Converting Templates"}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {isJa ? "成果実証済みの営業文面テンプレートを無料開放" : isVi ? "Mẫu Kịch Bản Chuẩn Keigo Theo Từng Ngành" : "Proven Outreach Pitch Copies"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-normal">
                  {isJa
                    ? "「文面をどう書けばいいか分からない」を解消。業界ごとに反響の高かった定型フォーマットを管理画面ですぐに呼び出せます。"
                    : isVi
                    ? "Không lo tốn công soạn kịch bản. Các mẫu kính ngữ chuẩn Nhật Bản sẵn sàng tùy biến và áp dụng ngay."
                    : "Zero copywriter blocks. Professional, courteous Japanese Keigo templates ready to deploy."}
                </p>
              </div>
              <Link
                href={`/${locale}/dashboard?tab=formCampaigns`}
                className="px-4 py-2 rounded-lg font-bold text-xs text-white bg-[#1B4F8A] hover:bg-[#143D6C] shadow-2xs transition-all flex items-center gap-1.5 shrink-0 active:scale-[0.98]"
              >
                <span>{isJa ? "管理画面で使う" : isVi ? "Tạo chiến dịch ngay" : "Use in Dashboard"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
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
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isJa ? "件名" : isVi ? "Tiêu đề" : "Subject"}:</span>
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
                          <span className="text-emerald-600">{isJa ? "コピー完了" : isVi ? "Đã sao chép!" : "Copied!"}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{isJa ? "文面をコピー" : isVi ? "Sao chép" : "Copy Pitch"}</span>
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
          </div>
        </section>

        {/* ENTERPRISE & CUSTOM INQUIRY FORM */}
        <section id="contact-form" className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-xs">
            
            {/* Self-serve hint banner */}
            <div className="mb-7 p-3.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#1B4F8A] dark:text-blue-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400 shrink-0" />
                <span>
                  {isJa
                    ? "1,000件〜5,000件の通常プランは、管理画面から今すぐオンライン完結で配信設定いただけます。"
                    : isVi
                    ? "Các gói tiêu chuẩn từ 1.000 đến 5.000 Form có thể thiết lập trực tiếp trên Dashboard."
                    : "Standard packages (1k - 5k forms) can be launched directly online via your Dashboard."}
                </span>
              </div>
              <Link
                href={`/${locale}/dashboard?tab=formCampaigns`}
                className="px-3.5 py-1.5 rounded-md bg-[#1B4F8A] hover:bg-[#143D6C] text-white font-semibold text-xs shrink-0 transition-colors shadow-2xs"
              >
                {isJa ? "管理画面へ進む" : isVi ? "Mở Dashboard" : "Go to Dashboard"}
              </Link>
            </div>

            <div className="text-center max-w-xl mx-auto mb-8">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold mb-2">
                {isJa ? "法人・エンタープライズ窓口" : isVi ? "Dành cho Khách hàng Doanh nghiệp lớn" : "Enterprise Inquiries"}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1.5">
                {isJa ? "大口配信（10,000件以上）・カスタム要件のご相談" : isVi ? "Tư vấn Gói lớn (>10.000 Form) & Hóa đơn công ty" : "Enterprise Volume & Custom Inquiries"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal">
                {isJa
                  ? "月間1万件以上の大規模配信、貴社保有リストへの配信、請求書払い（Paid/後払い）などのご要望はこちらよりお気軽にご相談ください。"
                  : isVi
                  ? "Doanh nghiệp có nhu cầu gửi trên 10.000 form/tháng, gửi trên danh sách riêng hoặc thanh toán hóa đơn công ty (Invoice) vui lòng để lại thông tin."
                  : "Share your high-volume requirements (10,000+ forms), custom targeting lists, or invoice billing needs."}
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-10 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                  {isJa ? "お問い合わせありがとうございます" : isVi ? "Cảm ơn bạn đã gửi yêu cầu!" : "Thank You For Your Request!"}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  {isJa
                    ? "担当者よりご入力いただいたメールアドレス宛に、1営業日以内に大口ボリューム向けのお見積り・進行スケジュールをご案内いたします。"
                    : isVi
                    ? "Chúng tôi đã ghi nhận yêu cầu. Chuyên viên tư vấn sẽ liên hệ lại với bạn trong vòng 24 giờ làm việc."
                    : "Our enterprise sales specialist will contact you via email within 1 business day."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleEnterpriseSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                {/* Volume Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    {isJa ? "想定送信ボリューム / ご希望要件" : isVi ? "Quy mô số lượng dự kiến / Nhu cầu" : "Estimated Target Volume"}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedVolume("10k")}
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        selectedVolume === "10k"
                          ? "border-[#1B4F8A] bg-blue-50/70 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 font-bold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-xs font-semibold">10,000〜20,000件</div>
                      <div className="text-[10px] opacity-75">単価相談可</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedVolume("20k")}
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        selectedVolume === "20k"
                          ? "border-[#1B4F8A] bg-blue-50/70 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 font-bold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-xs font-semibold">20,000〜50,000件</div>
                      <div className="text-[10px] opacity-75">特別割引適用</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedVolume("50k")}
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        selectedVolume === "50k"
                          ? "border-[#1B4F8A] bg-blue-50/70 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 font-bold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-xs font-semibold">50,000件以上</div>
                      <div className="text-[10px] opacity-75">定期配信・API連携</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedVolume("custom")}
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        selectedVolume === "custom"
                          ? "border-[#1B4F8A] bg-blue-50/70 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 font-bold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-xs font-semibold">自社リスト配信</div>
                      <div className="text-[10px] opacity-75">カスタム要件</div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      {isJa ? "貴社名 *" : isVi ? "Tên công ty của bạn *" : "Company Name *"}
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder={isJa ? "例: 株式会社〇〇" : isVi ? "Ví dụ: Công ty Cổ phần ABC" : "e.g. Acme Corp"}
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-350 mb-1">
                      {isJa ? "ご担当者様名 *" : isVi ? "Họ tên người phụ trách *" : "Contact Name *"}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder={isJa ? "例: 山田 太郎" : isVi ? "Ví dụ: Nguyễn Văn A" : "e.g. John Doe"}
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-350 mb-1">
                      {isJa ? "メールアドレス *" : isVi ? "Email nhận báo giá *" : "Business Email *"}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-350 mb-1">
                      {isJa ? "電話番号" : isVi ? "Số điện thoại" : "Phone Number"}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        placeholder="03-1234-5678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-350 mb-1">
                    {isJa ? "ご要望・商材概要・ご質問内容" : isVi ? "Yêu cầu chi tiết, sản phẩm chào hàng hoặc câu hỏi" : "Requirements & Offer Overview"}
                  </label>
                  <textarea
                    rows={4}
                    placeholder={
                      isJa
                        ? "希望件数、対象業種・地域、請求書払い希望、貴社保有リストの利用有無などをご記入ください。"
                        : isVi
                        ? "Mô tả số lượng mong muốn, tệp khách hàng hoặc yêu cầu thanh toán hóa đơn..."
                        : "Please describe your desired volume, targeting criteria, or invoice billing preferences."
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full text-xs font-medium p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg font-bold text-xs sm:text-sm text-white bg-[#1B4F8A] hover:bg-[#163e6d] shadow-2xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{isJa ? "大口・カスタム要件を相談する" : isVi ? "Gửi yêu cầu tư vấn Doanh nghiệp" : "Submit Enterprise Inquiry"}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* ======================================================== */}
        {/* SECTION: Corporate Trust, Invoice & Compliance Badges */}
        {/* ======================================================== */}
        <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200/80 dark:border-slate-800" style={{ fontFeatureSettings: '"palt"' }}>
          <div className="bg-slate-50/70 dark:bg-[#12161E] border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 sm:p-8">
            <div className="text-center max-w-2xl mx-auto mb-6">
              <span className="text-[11px] font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-widest">
                {isJa ? "安心・安全の企業間取引体制" : isVi ? "TIÊU CHUẨN AN TOÀN DOANH NGHIỆP" : "Corporate Trust & Compliance"}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                {isJa ? "インボイス制度対応・法人向け決済 ＆ 法令遵守体制" : isVi ? "Tuân thủ Hóa đơn Invoice & Thanh toán Doanh nghiệp" : "Qualified Invoice System & Regulatory Compliance"}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Badge 1: Invoice */}
              <div className="bg-white dark:bg-[#161B22] p-4 rounded-lg border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {isJa ? "インボイス制度対応" : isVi ? "Hóa đơn điện tử Invoice" : "Qualified Invoice"}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {isJa ? "適格請求書発行事業者登録番号" : isVi ? "Mã số thuế doanh nghiệp:" : "Registration No."}
                      <span className="block font-mono font-bold text-slate-700 dark:text-slate-300 tabular-nums">T7010401140954</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Badge 2: Payment */}
              <div className="bg-white dark:bg-[#161B22] p-4 rounded-lg border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {isJa ? "カード決済・領収書即時" : isVi ? "Thẻ tín dụng & Hóa đơn tức thì" : "Instant Card & Receipt"}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {isJa ? "Stripe経由でVISA/Master/JCB/AMEX対応。決済完了と同時にPDF領収書発行。" : isVi ? "Hỗ trợ các loại thẻ qua Stripe, tự động xuất hóa đơn PDF." : "Stripe encrypted checkout with instant PDF receipt download."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Badge 3: Paid Invoice */}
              <div className="bg-white dark:bg-[#161B22] p-4 rounded-lg border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {isJa ? "請求書払い（Paid）対応" : isVi ? "Thanh toán công nợ cuối tháng" : "Paid Monthly Invoicing"}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {isJa ? "法人向け後払いサービス「Paid」による月末締め翌月末払いに対応（事前審査あり）。" : isVi ? "Hỗ trợ thanh toán công nợ trả sau cho khách hàng doanh nghiệp." : "Monthly invoicing (net-30) available for qualified enterprise clients."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Badge 4: Compliance */}
              <div className="bg-white dark:bg-[#161B22] p-4 rounded-lg border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {isJa ? "特商法 ＆ 個人情報保護法準拠" : isVi ? "Tuân thủ Pháp luật & Bảo mật APPI" : "APPI & Tokushoho Compliant"}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {isJa ? "オプトアウトURL自動付与、AIによるNG除外、厳格な国内法規コンプライアンス運用。" : isVi ? "Tự động chèn link từ chối, lọc form cấm tiếp thị, bảo mật thông tin." : "Automatic opt-out tags, anti-sales suppression, 100% compliant."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200/80 dark:border-slate-800">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1.5">
              {isJa ? "よくあるご質問 (FAQ)" : isVi ? "Câu hỏi thường gặp" : "Frequently Asked Questions"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isJa ? "問い合わせフォーム営業に関する主な疑問にお答えします。" : isVi ? "Giải đáp các thắc mắc về tính an toàn và hiệu quả của dịch vụ." : "Common questions about safety, delivery, and conversion rates."}
            </p>
          </div>

          <div className="space-y-2.5">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 rounded-lg overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-5 py-3.5 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-800 dark:text-white hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      openFaq === idx ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 font-normal">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
