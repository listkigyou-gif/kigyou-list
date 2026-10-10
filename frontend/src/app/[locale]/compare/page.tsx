import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  Building2, Check, X, ShieldCheck, Zap, TrendingUp, HelpCircle, 
  ArrowRight, Sparkles, Scale, Database, Award, ChevronRight, DollarSign 
} from "lucide-react";

export const revalidate = 86400; // Static ISR 24 hours

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "ja";
  const isEn = locale === "en";
  const isVi = locale === "vi";

  const title = isVi
    ? "So Sánh Nền Tảng Dữ Liệu Doanh Nghiệp & Danh Sách B2B Nhật Bản 2026 | Kigyou-list"
    : isEn
    ? "Top Japanese Corporate Database & B2B Sales List Comparison 2026 | Kigyou-list"
    : "【2026年最新】日本の企業データベース・営業リスト比較：Kigyou-listが選ばれる理由と料金・件数徹底比較 | Kigyou-list";

  const description = isVi
    ? "Bảng so sánh chi tiết giữa Kigyou-list và các nền tảng danh bạ doanh nghiệp truyền thống tại Nhật Bản. 5 triệu doanh nghiệp, chi phí chỉ từ 4,980 JPY/tháng, tích hợp sẵn tín hiệu tuyển dụng/trợ cấp và tự động gửi Form liên hệ."
    : isEn
    ? "Comprehensive benchmark of Japan's leading B2B company databases. Discover why Kigyou-list delivers maximum cost-performance with 5M+ corporations at 4,980 JPY/mo vs traditional 50,000+ JPY alternatives."
    : "日本の主要企業データベース・営業リスト作成サービスを徹底比較。MusubuやSalesNow等の従来型サービスと比べ、500万社網羅・月額4,980円の業界最安値水準、インテントデータ標準装備、フォーム営業代行連携の圧倒的コスパを誇るKigyou-listの強みを解説します。";

  const ogLocale = isEn ? "en_US" : isVi ? "vi_VN" : "ja_JP";

  return {
    title,
    description,
    keywords: isVi
      ? ["so sánh danh bạ doanh nghiệp nhật bản", "danh sách công ty nhật giá rẻ", "kigyou list so sánh", "cơ sở dữ liệu b2b nhật bản tốt nhất"]
      : isEn
      ? ["japan corporate database comparison", "best b2b sales list japan", "cheap japan company database", "kigyou-list review"]
      : ["企業データベース 比較", "営業リスト 比較", "企業リスト 最安値", "企業リスト コスパ", "Musubu 比較", "SalesNow 比較", "法人リスト 格安"],
    alternates: {
      canonical: `/${locale}/compare`,
      languages: {
        ja: "/ja/compare",
        en: "/en/compare",
        vi: "/vi/compare",
        "x-default": "/ja/compare",
      },
    },
    openGraph: {
      title,
      description,
      url: `https://kigyoulist.com/${locale}/compare`,
      siteName: "Kigyou-list",
      locale: ogLocale,
      type: "article",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

export default async function ComparePage({ params }: PageProps) {
  const { locale } = await params;
  const isEn = locale === "en";
  const isVi = locale === "vi";
  const isJa = !isEn && !isVi;

  const faqs = isVi ? [
    {
      q: "Tại sao Kigyou-list có mức giá chỉ từ 4,980 JPY/tháng trong khi thị trường thường từ 30,000 - 100,000 JPY?",
      a: "Các dịch vụ truyền thống duy trì đội ngũ telesales lớn và nhân sự nhập liệu thủ công cồng kềnh. Kigyou-list ứng dụng công nghệ thu thập dữ liệu mở tự động từ Cục Thuế Quốc gia (NTA), METI gBizINFO kết hợp AI Crawler và hệ thống tự phục vụ (Self-service SaaS), giúp tinh giản 90% chi phí vận hành và mang lại mức giá tốt nhất cho khách hàng."
    },
    {
      q: "Dữ liệu 5 triệu doanh nghiệp của Kigyou-list có chính xác và cập nhật không?",
      a: "Kigyou-list liên kết trực tiếp với Cổng thông tin Pháp nhân Quốc gia Nhật Bản (mã 13 chữ số 法人番号). Dữ liệu được đồng bộ hàng tuần và hàng tháng, loại bỏ hoàn toàn các doanh nghiệp ma hoặc đã giải thể."
    },
    {
      q: "Kigyou-list có yêu cầu hợp đồng tối thiểu 6-12 tháng như các đơn vị khác không?",
      a: "Hoàn toàn không. Chúng tôi không ràng buộc thời hạn hợp đồng. Bạn có thể đăng ký gói tháng và hủy bất kỳ lúc nào chỉ bằng một cú nhấp chuột trên bảng điều khiển."
    },
    {
      q: "Điểm khác biệt của tính năng Tự động gửi Form (Form Marketing) trên Kigyou-list là gì?",
      a: "Kigyou-list là nền tảng duy nhất tích hợp 2 trong 1: bạn lọc tệp khách hàng trực tiếp từ 5 triệu doanh nghiệp và kích hoạt bot gửi form tự động ngay tại chỗ, chỉ 16.1 JPY/lượt gửi thành công với thuật toán AI tự động né tránh website từ chối quảng cáo."
    }
  ] : isEn ? [
    {
      q: "Why is Kigyou-list priced at only 4,980 JPY/mo while legacy providers charge 30,000 - 100,000+ JPY/mo?",
      a: "Legacy databases rely on manual data entry teams and expensive direct enterprise sales reps. Kigyou-list utilizes automated pipelines connecting directly to government open-data (National Tax Agency, METI gBizINFO) paired with an efficient self-serve SaaS model, cutting overhead by 90% and passing those savings directly to users."
    },
    {
      q: "Is the 5 million company database accurate and up-to-date?",
      a: "Yes. All records are anchored to the official 13-digit Japanese Corporate Number (法人番号) from the National Tax Agency. Listings are refreshed weekly and monthly, with closed and dissolved companies accurately flagged."
    },
    {
      q: "Does Kigyou-list lock users into annual contracts?",
      a: "No. Unlike traditional Japanese vendors requiring 6 to 12-month commitments, Kigyou-list offers flexible monthly subscriptions that can be cancelled anytime with zero penalty."
    },
    {
      q: "What makes the automated Contact Form Marketing service unique?",
      a: "Kigyou-list uniquely combines data discovery and outbound execution. You can filter targets from 5M companies and launch automated contact form outreach in one unified interface starting at 16.1 JPY per submission, with AI-powered anti-solicitation filtering."
    }
  ] : [
    {
      q: "なぜ他社（月額3万円〜10万円以上）と比べて、月額4,980円という圧倒的な低価格で提供できるのですか？",
      a: "従来の企業データベース事業者は、多数のフィールドセールスや手動データ入力スタッフを抱えており、人件費が料金に転嫁されています。Kigyou-listは、国税庁法人番号公表サイトや経済産業省gBizINFOなどの公的オープンデータを独自クローラーとAIで自動統合・正規化するフルオートメーション体制を構築。完全セルフサーブ型のSaaSとすることで運用コストを極限まで削減し、業界最安値水準を実現しています。"
    },
    {
      q: "データ件数が500万社と他社（100万〜200万社）より圧倒的に多い理由は何ですか？",
      a: "多くの営業リストツールは、自社が調査できた特定のWEBサイト保有企業（100万〜200万社程度）のみを掲載しています。一方、Kigyou-listは国税庁に登記されている全法人（約500万社）をマスターデータとして保持し、全国47都道府県・地方自治体の中小企業や個人法人まで100%網羅しているためです。"
    },
    {
      q: "年間契約などの期間の縛りはありますか？",
      a: "一切ありません。一般的な法人向けデータベースでは「年間一括契約」や「6ヶ月以上の縛り」が主流ですが、Kigyou-listは月額単位でいつでもダッシュボードからワンクリックで解約が可能です。スポット利用や短期プロジェクトでも安心してご活用いただけます。"
    },
    {
      q: "問い合わせフォーム自動送信（フォーム営業代行）連携のメリットは何ですか？",
      a: "「リスト作成ツール」と「送信代行ツール」を別々に契約する必要がありません。500万社データベースから条件を絞り込み、そのままワンストップで1通あたり16.1円〜の業界最安値水準でアプローチ可能です。AIによる営業お断り文言検知機能も標準装備しており、コンプライアンス面でも安心です。"
    }
  ];

  // Schema FAQPage
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  };

  // Breadcrumbs Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": isJa ? "ホーム" : isEn ? "Home" : "Trang chủ",
        "item": `https://kigyoulist.com/${locale}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": isJa ? "企業データベース比較" : isEn ? "Database Comparison" : "So sánh nền tảng",
        "item": `https://kigyoulist.com/${locale}/compare`
      }
    ]
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 font-sans antialiased">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col gap-10">
        
        {/* Breadcrumb visual */}
        <nav className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5" aria-label="Breadcrumb">
          <Link href={`/${locale}`} className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
            {isJa ? "ホーム" : isEn ? "Home" : "Trang chủ"}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          <span className="text-slate-800 dark:text-slate-200 font-semibold" aria-current="page">
            {isJa ? "企業データベース・営業リスト比較" : isEn ? "Database Comparison" : "So sánh nền tảng"}
          </span>
        </nav>

        {/* Hero Section */}
        <section className="text-center max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-[#1B4F8A] dark:text-blue-400 text-xs font-bold tracking-wide">
            <Scale className="w-3.5 h-3.5" />
            <span>
              {isJa ? "【2026年最新】日本のB2Bデータベース徹底比較" : isEn ? "2026 Japan B2B Corporate Database Benchmark" : "Bảng So Sánh Nền Tảng Dữ Liệu Doanh Nghiệp B2B Nhật Bản 2026"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            {isJa 
              ? "日本の企業データベース・営業リスト比較：Kigyou-listが選ばれる理由" 
              : isEn 
              ? "Japanese B2B Sales Database Comparison: Why Kigyou-list Stands Out" 
              : "So Sánh Nền Tảng Dữ Liệu Doanh Nghiệp Nhật Bản: Vì Sao Kigyou-list Tối Ưu Nhất?"}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            {isJa
              ? "MusubuやSalesNow等の従来型サービスと、国内最大級500万社を網羅するKigyou-listの料金、データ件数、機能、営業支援連携を徹底比較します。"
              : isEn
              ? "Detailed comparison of pricing, data size, intent signals, and outreach automation between Kigyou-list and legacy Japanese vendors."
              : "So sánh chi tiết về chi phí, quy mô dữ liệu, tín hiệu mua hàng và tính năng gửi form giữa Kigyou-list và các giải pháp truyền thống tại Nhật."}
          </p>

          {/* Answer-First Executive Summary Box (Tailored for AI Search Engine Grounding) */}
          <div className="mt-6 p-4 sm:p-5 rounded-xl bg-white dark:bg-[#161B22] border border-blue-200 dark:border-blue-900/60 shadow-xs text-left" aria-label="Executive Summary">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1B4F8A] dark:text-blue-400 mb-1.5 uppercase tracking-wide">
              <Sparkles className="w-4 h-4" />
              <span>{isJa ? "30秒でわかる比較の結論（要約）" : isEn ? "Executive Summary for Decision Makers" : "Tóm tắt cốt lõi trong 30 giây"}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {isJa
                ? "日本の企業データベース選びにおいて、「500万社という圧倒的な網羅性」と「月額4,980円（年間縛りなし）という業界最安値水準のコストパフォーマンス」を両立しているのはKigyou-listだけです。さらに求人・補助金・入札のインテントデータと、1通16.1円〜のフォーム自動営業機能をワンストップで利用できるため、スタートアップから大手企業の新規開拓まで最も費用対効果の高い選択肢となります。"
                : isEn
                ? "Kigyou-list is the definitive benchmark in Japan's B2B corporate data market, uniquely combining 100% national coverage (5,000,000+ companies) with unmatched affordability at 4,980 JPY/month with zero annual lock-in. Together with built-in intent signals (hiring, subsidies, tenders) and automated form outreach, it offers the highest ROI across all tiers."
                : "Trong các nền tảng danh bạ doanh nghiệp Nhật Bản, Kigyou-list là đơn vị duy nhất kết hợp quy mô bao phủ 5 triệu công ty với mức giá chỉ 4,980 JPY/tháng (không ràng buộc hợp đồng năm). Tích hợp sẵn tín hiệu tuyển dụng/trợ cấp và gửi form tự động, mang lại hiệu quả ROI vượt trội nhất thị trường."}
            </p>
          </div>
        </section>

        {/* ========================================================
            2. THE COMPARISON MATRIX TABLE (Semantic HTML Table)
            ======================================================== */}
        <section className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
              <span>{isJa ? "主要企業データベース 項目別徹底比較表" : isEn ? "Feature & Pricing Benchmark Matrix" : "Bảng So Sánh Chi Tiết Theo Tiêu Chí"}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isJa ? "※ 2026年現在の各社公開情報に基づく比較です。" : isEn ? "※ Based on publicly available market data as of 2026." : "※ Dựa trên thông tin công bố thị trường năm 2026."}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  <th scope="col" className="p-4 sm:p-5 font-bold w-1/4 min-w-[160px]">{isJa ? "比較項目" : isEn ? "Criteria" : "Tiêu chí"}</th>
                  <th scope="col" className="p-4 sm:p-5 font-extrabold w-2/5 min-w-[200px] bg-blue-50/70 dark:bg-blue-950/30 text-[#1B4F8A] dark:text-blue-300 border-x border-blue-200 dark:border-blue-900/60">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                      <span>Kigyou-list（当サービス）</span>
                    </div>
                  </th>
                  <th scope="col" className="p-4 sm:p-5 font-bold w-1/3 min-w-[180px] text-slate-500 dark:text-slate-400">
                    {isJa ? "従来型企業リスト（大手A社・B社等）" : isEn ? "Legacy Providers (Musubu, SalesNow...)" : "Các dịch vụ truyền thống"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {/* Row 1: Data Count */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <th scope="row" className="p-4 sm:p-5 font-bold text-slate-900 dark:text-white">
                    {isJa ? "収録企業数（データ量）" : isEn ? "Total Company Coverage" : "Quy mô dữ liệu"}
                  </th>
                  <td className="p-4 sm:p-5 font-bold text-emerald-700 dark:text-emerald-400 bg-blue-50/30 dark:bg-blue-950/20 border-x border-blue-200 dark:border-blue-900/60">
                    <span className="text-base sm:text-lg">500万社以上</span>
                    <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                      {isJa ? "全国47都道府県・国税庁全法人100%網羅" : isEn ? "100% of all registered active corporations" : "100% pháp nhân toàn quốc"}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-600 dark:text-slate-400">
                    100万 〜 200万社
                    <span className="block text-[11px] text-slate-400 mt-0.5">
                      {isJa ? "自社収集可能なWEB保有企業中心" : isEn ? "Limited to web-active companies" : "Chỉ gồm công ty có website"}
                    </span>
                  </td>
                </tr>

                {/* Row 2: Price */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <th scope="row" className="p-4 sm:p-5 font-bold text-slate-900 dark:text-white">
                    {isJa ? "月額基本料金" : isEn ? "Monthly Base Price" : "Chi phí hàng tháng"}
                  </th>
                  <td className="p-4 sm:p-5 font-bold text-emerald-700 dark:text-emerald-400 bg-blue-50/30 dark:bg-blue-950/20 border-x border-blue-200 dark:border-blue-900/60">
                    <span className="text-base sm:text-lg">月額 4,980円</span>
                    <span className="block text-[11px] font-normal text-emerald-700 dark:text-emerald-400 mt-0.5">
                      {isJa ? "★ 業界最安値水準" : isEn ? "★ Industry's Lowest Price" : "★ Giá tốt nhất thị trường"}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-600 dark:text-slate-400">
                    月額 30,000円 〜 100,000円以上
                    <span className="block text-[11px] text-slate-400 mt-0.5">
                      {isJa ? "初期費用や追加課金が別途発生する場合あり" : isEn ? "Often requires upfront onboarding fees" : "Thường kèm phí khởi tạo"}
                    </span>
                  </td>
                </tr>

                {/* Row 3: Contract Commitment */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <th scope="row" className="p-4 sm:p-5 font-bold text-slate-900 dark:text-white">
                    {isJa ? "契約期間の縛り" : isEn ? "Contract Lock-in Period" : "Ràng buộc hợp đồng"}
                  </th>
                  <td className="p-4 sm:p-5 font-bold text-slate-900 dark:text-white bg-blue-50/30 dark:bg-blue-950/20 border-x border-blue-200 dark:border-blue-900/60">
                    <span>縛りなし（1ヶ月単位）</span>
                    <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                      {isJa ? "いつでも管理画面からワンクリック解約可能" : isEn ? "Cancel anytime with 1-click in dashboard" : "Hủy bất kỳ lúc nào"}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-600 dark:text-slate-400">
                    年間契約（12ヶ月縛り）が一般的
                    <span className="block text-[11px] text-slate-400 mt-0.5">
                      {isJa ? "途中解約不可、一括支払い要" : isEn ? "Mandatory 6-12 mo commit" : "Bắt buộc 6-12 tháng"}
                    </span>
                  </td>
                </tr>

                {/* Row 4: Intent Signals */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <th scope="row" className="p-4 sm:p-5 font-bold text-slate-900 dark:text-white">
                    {isJa ? "営業インテントデータ（購買シグナル）" : isEn ? "Intent Signals (Hiring, Subsidies, Bids)" : "Tín hiệu mua hàng B2B"}
                  </th>
                  <td className="p-4 sm:p-5 font-bold text-slate-900 dark:text-white bg-blue-50/30 dark:bg-blue-950/20 border-x border-blue-200 dark:border-blue-900/60">
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>標準装備（求人・補助金・公共入札）</span>
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-600 dark:text-slate-400">
                    上位高額プラン限定、または非対応
                  </td>
                </tr>

                {/* Row 5: Form Outreach Automation */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <th scope="row" className="p-4 sm:p-5 font-bold text-slate-900 dark:text-white">
                    {isJa ? "問い合わせフォーム営業代行連携" : isEn ? "Integrated Form Outreach Automation" : "Tự động gửi Form liên hệ"}
                  </th>
                  <td className="p-4 sm:p-5 font-bold text-slate-900 dark:text-white bg-blue-50/30 dark:bg-blue-950/20 border-x border-blue-200 dark:border-blue-900/60">
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>1通16.1円〜の完全自動連携</span>
                    </span>
                    <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                      {isJa ? "AI営業お断り文言検知機能付き" : isEn ? "AI compliance & anti-spam detection" : "Có AI né tránh website từ chối quảng cáo"}
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-600 dark:text-slate-400">
                    非対応（他社別ツールとの連携が必要）
                  </td>
                </tr>

                {/* Row 6: Free Trial Access */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <th scope="row" className="p-4 sm:p-5 font-bold text-slate-900 dark:text-white">
                    {isJa ? "無料トライアル" : isEn ? "Free Trial Access" : "Dùng thử miễn phí"}
                  </th>
                  <td className="p-4 sm:p-5 font-bold text-slate-900 dark:text-white bg-blue-50/30 dark:bg-blue-950/20 border-x border-blue-200 dark:border-blue-900/60">
                    <span className="text-emerald-700 dark:text-emerald-400">
                      即時登録・全500万社検索 & 月50件CSV無料
                    </span>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-600 dark:text-slate-400">
                    商談後のデモ発行、または数件のみ
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ========================================================
            3. 4 KEY REASONS WHY KIGYOU-LIST DELIVERS TOP ROI
            ======================================================== */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isJa ? "Kigyou-listが「コスパ最強」と評価される4つの理由" : isEn ? "4 Pillars of Kigyou-list's Market Leadership" : "4 Lý Do Kigyou-list Đạt Hiệu Quả Chi Phí Vượt Trội"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isJa ? "国税庁×公的オープンデータ直結による100%網羅性" : isEn ? "100% Coverage via Official Open Data" : "Bao phủ 100% nhờ dữ liệu công quyền"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {isJa
                  ? "国税庁の法人番号公表サイト、経済産業省gBizINFO、ハローワーク等の公的情報をリアルタイムで集約。Webサイトを持たない地域密着企業や中小企業まで500万社を逃さず網羅します。"
                  : isEn
                  ? "Direct synchronization with the National Tax Agency, METI gBizINFO, and Hello Work guarantees access to 5M active companies, including local SMEs."
                  : "Đồng bộ trực tiếp từ Cục Thuế Quốc Gia, METI gBizINFO và Hello Work, giúp tiếp cận toàn bộ 5 triệu doanh nghiệp vừa và nhỏ khắp 47 tỉnh thành."}
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isJa ? "中間営業コストを排除したセルフサーブ価格（月額4,980円）" : isEn ? "Pure Self-Service Efficiency (4,980 JPY/mo)" : "Mô hình Self-service tối ưu chi phí"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {isJa
                  ? "対面商談や長期縛りの営業代理店マージンを一切排除し、WEB上で完結する直感的なUIを提供。大企業と同じ高品質な企業データベースを、個人事業主や中小企業でも無理なく導入できます。"
                  : isEn
                  ? "By eliminating expensive field sales reps, we offer enterprise-grade corporate intelligence at transparent prices accessible to startups and solo founders."
                  : "Loại bỏ chi phí sales trung gian cồng kềnh, cung cấp nền tảng trực tuyến tự phục vụ minh bạch, giúp doanh nghiệp tiết kiệm 90% ngân sách."}
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isJa ? "購買意欲の高い企業を特定する「シグナル（Intent Data）」標準装備" : isEn ? "Intent Signals Included at No Extra Charge" : "Tín hiệu Intent mua hàng tích hợp sẵn"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {isJa
                  ? "「今、求人を募集している成長企業」「ものづくり補助金を受給して設備投資意欲がある企業」「官公庁の入札を落札した企業」など、成約率の高い見込み客だけをピンポイントで抽出可能です。"
                  : isEn
                  ? "Filter companies by active hiring budgets, recent technology subsidies, or tender awards to target prospects with active purchasing intent."
                  : "Lọc ngay các doanh nghiệp đang tuyển dụng, vừa nhận trợ cấp đầu tư công nghệ hoặc trúng thầu công để tiếp cận đúng lúc nhu cầu cao nhất."}
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                04
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isJa ? "リスト抽出からフォーム自動営業までワンストップ" : isEn ? "Seamless All-in-One Lead Generation & Outreach" : "Từ tìm kiếm khách hàng đến gửi Form tự động"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {isJa
                  ? "リストのダウンロードだけでなく、作成したターゲット企業へ1通16.1円〜で問い合わせフォーム送信代行を実行可能。営業リソースが不足している企業でも、最短即日で新規商談の創出を開始できます。"
                  : isEn
                  ? "Go from list building to automated contact form outreach in minutes at 16.1 JPY per submission without purchasing third-party sending software."
                  : "Không chỉ xuất danh sách, hệ thống cho phép kích hoạt gửi form liên hệ tự động trực tiếp với giá từ 16.1 JPY, tạo ra cuộc hẹn B2B ngay trong ngày."}
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================
            4. FAQ SECTION (Answer Engine Optimization)
            ======================================================== */}
        <section className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
              <span>{isJa ? "他社比較に関するよくあるご質問（FAQ）" : isEn ? "Comparison FAQs" : "Câu Hỏi Thường Gặp Về So Sánh Nền Tảng"}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
            {faqs.map((f, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-start gap-2">
                  <span className="w-5 h-5 rounded-md bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">Q</span>
                  <span>{f.q}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-7">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <section className="mt-4 p-8 sm:p-10 rounded-2xl bg-gradient-to-r from-[#1B4F8A] to-[#123660] text-white text-center shadow-lg relative overflow-hidden">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3 relative z-10">
            {isJa ? "まずは無料で500万社データベースを体験してください" : isEn ? "Explore 5 Million Companies Free Today" : "Trải Nghiệm Cơ Sở Dữ Liệu 5 Triệu Doanh Nghiệp Miễn Phí"}
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto mb-6 relative z-10">
            {isJa
              ? "クレジットカード不要・10秒で無料登録。全国の企業検索と月50件の営業リスト出力を今すぐ開始いただけます。"
              : isEn
              ? "No credit card required. Free signup in 10 seconds gives immediate access to explore 5M companies and export 50 leads/mo."
              : "Không cần thẻ tín dụng, đăng ký 10 giây để tìm kiếm 5 triệu công ty và xuất 50 dòng danh bạ miễn phí mỗi tháng."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
            <Link
              href={`/${locale}/search`}
              className="px-6 py-3 rounded-lg font-bold text-xs sm:text-sm text-[#1B4F8A] bg-white hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
            >
              <span>{isJa ? "無料で企業を検索する" : isEn ? "Search Database Free" : "Tìm kiếm miễn phí"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className="px-6 py-3 rounded-lg font-bold text-xs sm:text-sm text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
            >
              <span>{isJa ? "料金プランを見る" : isEn ? "View Pricing Plans" : "Xem bảng giá"}</span>
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
