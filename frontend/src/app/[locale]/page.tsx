import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { 
  Search, 
  Building2, 
  Send, 
  Download, 
  Kanban, 
  ShieldCheck, 
  Database, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Award, 
  ChevronRight, 
  FileSpreadsheet, 
  Lock, 
  Clock, 
  Zap, 
  Activity, 
  MapPin,
  TrendingUp,
  FileCheck2,
  AlertTriangle,
  RotateCw,
  HelpCircle,
  Scale,
  Sparkles,
  Bell
} from "lucide-react";
import { getDatabaseStats } from "@/lib/db";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getTranslations } from "@/lib/i18n";

export const revalidate = 3600; // 1-hour ISR cache for fast sub-50ms TTFB

interface PageParams {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale } = await params;
  return {
    alternates: {
      canonical: `/${locale}`,
    },
  };
}

export default async function Home({ params }: PageParams) {
  const { locale } = await params;
  const t = getTranslations(locale);
  const isJa = locale === "ja";
  const isVi = locale === "vi";

  // Dynamic database statistics
  const stats = await getDatabaseStats();

  // Tier 1 Schema: WebSite with Google Sitelinks SearchBox Action
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Kigyou-list",
    "url": `https://kigyoulist.com/${locale}`,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `https://kigyoulist.com/${locale}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  // Tier 2 Schema: Legal Entity Authority (TQC Inc.)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Kigyou-list",
    "legalName": "TQC株式会社",
    "url": `https://kigyoulist.com/${locale}`,
    "logo": "https://kigyoulist.com/icon.svg",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "豊島区",
      "addressRegion": "東京都",
      "addressCountry": "JP"
    },
    "sameAs": [
      "https://x.com/kigyoulist",
      "https://note.com/kigyoulist",
      "https://qiita.com/listkigyou",
      "https://zenn.dev/kigyoulist"
    ]
  };

  // Tier 3 Schema: FAQPage for Rich Snippets Accordion in Google & Bing
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": isJa 
          ? "データの更新頻度と情報源（データソース）について教えてください。" 
          : isVi 
          ? "Dữ liệu được cập nhật từ đâu và tần suất thế nào?" 
          : "Where is the data sourced and how often is it updated?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": isJa
            ? "国税庁の法人番号公表サイト、法務省登記所データ、経済産業省gBizINFOなどの公的オープンデータをベースに、週次・月次で更新しています。連絡先情報（電話・Webフォーム・メール）も独自のクローラーにより常時鮮度を保っています。"
            : isVi
            ? "Dữ liệu được đồng bộ trực tiếp từ Cổng thông tin Quốc thuế, Bộ Tư pháp, METI gBizINFO hàng tuần. Thông tin kênh liên hệ (Web form, điện thoại, email) được bot rà quét cập nhật liên tục."
            : "Sourced from the National Tax Agency, Ministry of Justice, and METI gBizINFO, continuously refreshed with verified corporate contacts."
        }
      },
      {
        "@type": "Question",
        "name": isJa 
          ? "フォーム自動営業で苦情やクレームが来る心配はありませんか？" 
          : isVi 
          ? "Gửi Form tự động có rủi ro bị khiếu nại không?" 
          : "Are there risks of spam complaints with automated form outreach?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": isJa
            ? "当システムはAIにより、Webサイト上の「営業お断り」「特定目的以外の送信禁止」といった免責事項を自動検出し、該当企業への送信を自動でスキップします。また、日本のビジネスマナー・敬語に準拠した文面設定により、クレーム発生率を極めて低く抑えています。"
            : isVi
            ? "Hệ thống tích hợp AI tự động quét và bỏ qua các website có ghi chú 'Cấm chào hàng/Cấm quảng cáo'. Ngoài ra văn phong sử dụng chuẩn kính ngữ Keigo giúp tỷ lệ phàn nàn giảm xuống mức tối thiểu."
            : "Our AI engine automatically detects and skips websites that specify 'No commercial solicitations', keeping risk minimal."
        }
      },
      {
        "@type": "Question",
        "name": isJa 
          ? "無料会員でもどこまで利用できますか？" 
          : isVi 
          ? "Tài khoản miễn phí có thể làm được những gì?" 
          : "What can free accounts do?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": isJa
            ? "無料登録を行うだけで、全国500万社の基本情報（社名、所在地、業種、法人番号）の検索および毎日20件（月最大600件、企業認証で1日50件/月1,500件）までのCSVダウンロードが可能です。連絡先フィルター（フォーム・メール）や大量CSV出力、フォーム自動営業をご利用いただく場合はProプラン以上をご利用ください。"
            : isVi
            ? "Đăng ký miễn phí có thể tìm kiếm dữ liệu cơ bản của 5 triệu cty và xuất CSV 20 dòng mỗi ngày (tối đa 600 dòng/tháng). Để dùng bộ lọc kênh liên lạc và gửi Form tự động, bạn có thể nâng cấp Pro bất kỳ lúc nào."
            : "Free accounts can search all 5M companies and export 20 CSV rows per day. Upgrade to PRO to unlock contact filters and form outreach."
        }
      },
      {
        "@type": "Question",
        "name": isJa 
          ? "営業リストを購入する場合、名簿業者からの買い切りと比べてどのようなメリットがありますか？" 
          : isVi 
          ? "So với việc mua danh sách từ các công ty bán danh bạ truyền thống, Kigyou-list có ưu điểm gì?" 
          : "What are the advantages of Kigyou-list compared to buying static lists from list brokers?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": isJa
            ? "従来のリスト販売業者は1件あたり10〜50円と高額な上に、古いデータが混ざり不通電話や廃業ロスが発生します。Kigyou-listは公的オープンデータを常時クローリングして鮮度を担保し、月額定額（初月1,260円〜、通常4,200円）で必要な分だけ最新データをCSV抽出できます。年間縛りもありません。"
            : isVi
            ? "Các đơn vị bán danh bạ thường tính phí 10-50 Yên/công ty và dữ liệu tĩnh cũ dễ gặp số chết. Kigyou-list liên tục cập nhật dữ liệu mới nhất, hoạt động theo mô hình thuê bao linh hoạt (chỉ từ 1,260 Yên tháng đầu - giảm 70%, không ràng buộc năm), tiết kiệm 90% chi phí."
            : "Traditional list vendors charge 10-50 JPY/lead for static lists. Kigyou-list provides continuously refreshed cloud data on a flexible monthly subscription without annual commitments."
        }
      }
    ]
  };

  // Tier 4 Schema: Google Dataset Search Specification
  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "Kigyou-list Japan Corporate Intelligence Database",
    "description": "Comprehensive B2B directory covering over 5,000,000 registered Japanese corporate entities across 47 prefectures and all JSIC industries.",
    "keywords": ["企業リスト", "企業データ", "営業リスト", "日本企業データベース", "500万社"],
    "license": "https://kigyoulist.com/terms",
    "isAccessibleForFree": true,
    "creator": {
      "@type": "Organization",
      "name": "TQC株式会社",
      "url": "https://kigyoulist.com"
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0D1117] text-slate-800 dark:text-slate-100 transition-colors">
      {/* 4-Tier Structured Data Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }}
      />

      {/* Global Navigation Header */}
      <Header />

      <main className="flex-1" role="main">
        {/* ========================================================
            TẦNG 1: HERO TỐI GIẢN & TÌM KIẾM 1 CHẠM (Sub-Agent 1)
            ======================================================== */}
        <section aria-labelledby="hero-heading" className="pt-12 pb-14 lg:pt-16 lg:pb-20 border-b border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0D1117]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            
            {/* Kicker Eyebrow (Tối giản, trang nhã, không nhấp nháy AI) */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold mb-5 tracking-wide border border-slate-200/80 dark:border-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A] dark:bg-blue-400" />
              <span>
                {isJa 
                  ? "国内最大級 500万社データベース × 完全自動フォーム営業" 
                  : isVi 
                  ? "Cơ sở dữ liệu 5 Triệu Doanh Nghiệp × Tự Động Hóa Gửi Form B2B" 
                  : "Japan 5M+ Company Database × Automated Form Outreach"}
              </span>
            </div>

            {/* H1 Main Heading: Chuẩn SEO Exact Match cho Google & Bing */}
            <h1 id="hero-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.35] text-slate-900 dark:text-white mb-4">
              {isJa ? (
                <>
                  日本全国500万社の<span className="text-[#1B4F8A] dark:text-blue-400">企業リスト・企業データ・営業リスト</span>を、次の一手へ。<br className="hidden sm:inline" />
                  高確度ターゲティングから<span className="text-[#1B4F8A] dark:text-blue-400">自動フォーム営業</span>までワンストップ。
                </>
              ) : isVi ? (
                <>
                  Dữ liệu 5 triệu doanh nghiệp Nhật Bản cho chiến lược bán hàng B2B.<br className="hidden sm:inline" />
                  <span className="text-[#1B4F8A] dark:text-blue-400">Lọc khách hàng mục tiêu</span> đến <span className="text-[#1B4F8A] dark:text-blue-400">gửi Form tự động</span> toàn diện.
                </>
              ) : (
                <>
                  Power Your Sales Pipeline with 5M+ Japanese Companies.<br className="hidden sm:inline" />
                  <span className="text-[#1B4F8A] dark:text-blue-400">Precision Targeting</span> to <span className="text-[#1B4F8A] dark:text-blue-400">Automated Form Outreach</span>.
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
              {isJa
                ? "国税庁・法務省・公的オープンデータに直結した法人データベース。求人・助成金・入札・特許などの最新営業意図シグナルで確度の高い企業を抽出し、AIによる安全なフォーム営業自動配信で新規商談を最大化します。"
                : isVi
                ? "Cơ sở dữ liệu kết nối trực tiếp với Cơ quan Thuế và Bộ Tư pháp Nhật Bản. Trích xuất chính xác các doanh nghiệp đang tuyển dụng, nhận trợ cấp, trúng thầu công để tiếp cận chào hàng an toàn."
                : "Official government-linked database with 5 million verified companies. Target businesses with active hiring, subsidies, and public bids with automated safe outreach."}
            </p>

            {/* Central B2B Search Box */}
            <div className="max-w-2xl mx-auto mb-5">
              <form action={`/${locale}/search`} method="GET" className="relative flex items-center p-1.5 rounded-xl bg-white dark:bg-[#161B22] border border-slate-300 dark:border-slate-700 shadow-2xs focus-within:ring-2 focus-within:ring-[#1B4F8A]/20 focus-within:border-[#1B4F8A] transition-all">
                <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
                <input
                  type="text"
                  name="q"
                  placeholder={
                    isJa 
                      ? "企業名、法人番号（13桁）、またはキーワードを入力..." 
                      : isVi 
                      ? "Nhập tên công ty, mã số pháp nhân (13 số) hoặc từ khóa..." 
                      : "Search by company name, corporate number (13 digits), or keywords..."
                  }
                  className="w-full px-3 py-2.5 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white text-xs sm:text-sm"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 font-bold text-xs sm:text-sm text-white bg-[#1B4F8A] hover:bg-[#143D6C] rounded-lg shadow-2xs transition-colors whitespace-nowrap cursor-pointer shrink-0"
                >
                  {isJa ? "企業を検索" : isVi ? "Tìm kiếm" : "Search"}
                </button>
              </form>
            </div>

            {/* Quick Intent Filter Chips (Tối giản thanh lịch, xóa bỏ emoji chìa khóa 🔑) */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto text-xs text-slate-500 dark:text-slate-400 mb-8">
              <span className="font-semibold text-slate-400 dark:text-slate-500 text-[11px] uppercase tracking-wider mr-1">
                {isJa ? "人気の絞り込み:" : isVi ? "Bộ lọc phổ biến:" : "Quick Filters:"}
              </span>
              <Link 
                href={`/${locale}/search?contact_form=true`} 
                className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors text-[11px]"
              >
                {isJa ? "お問い合わせフォームあり" : isVi ? "Có biểu mẫu liên hệ" : "Contact Form Available"}
              </Link>
              <Link 
                href={`/${locale}/search?hiring=true`} 
                className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors text-[11px]"
              >
                {isJa ? "求人活動中" : isVi ? "Đang tuyển dụng" : "Actively Hiring"}
              </Link>
              <Link 
                href={`/${locale}/search?subsidy=true`} 
                className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors text-[11px]"
              >
                {isJa ? "補助金受給企業" : isVi ? "Nhận trợ cấp" : "Subsidy Recipients"}
              </Link>
              <Link 
                href={`/${locale}/search?bidding=true`} 
                className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors text-[11px]"
              >
                {isJa ? "公共入札実績" : isVi ? "Đấu thầu công" : "Public Bidders"}
              </Link>
            </div>

            {/* Dual Primary CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/${locale}/search`}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold text-xs sm:text-sm text-white bg-[#1B4F8A] hover:bg-[#143D6C] shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <Search className="w-4 h-4" />
                <span>{isJa ? "企業データベースを検索する" : isVi ? "Khám phá Cơ sở dữ liệu 5M cty" : "Explore Corporate Database"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={`/${locale}/form-marketing`}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold text-xs sm:text-sm text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{isJa ? "自動フォーム営業の詳細を見る" : isVi ? "Tìm hiểu dịch vụ Gửi Form tự động" : "Learn About Form Outreach"}</span>
              </Link>
            </div>

          </div>
        </section>

        {/* ========================================================
            TẦNG 2: CHỈ SỐ MINH BẠCH TỔNG CỤC DỮ LIỆU (Sub-Agent 2)
            ======================================================== */}
        <section aria-labelledby="stats-heading" className="py-10 bg-slate-50 dark:bg-[#0D1117] border-b border-slate-200/90 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 id="stats-heading" className="sr-only">
              {isJa ? "データベース収録規模" : "Database Coverage Scope"}
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat 1 */}
              <div className="p-5 rounded-xl bg-white border border-slate-200/90 dark:bg-[#161B22] dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {isJa ? "収録法人データ数" : isVi ? "Số pháp nhân toàn quốc" : "Corporate Records"}
                  </span>
                  <Database className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-bold text-[#1B4F8A] dark:text-blue-400 tabular-nums font-mono">
                    {(stats.totalCompanies).toLocaleString('ja-JP')}+
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {isJa ? "国税庁・法務省公表の公式法人番号" : isVi ? "Cơ quan Thuế & Bộ Tư pháp" : "Official NTA & MOJ registered"}
                  </p>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="p-5 rounded-xl bg-white border border-slate-200/90 dark:bg-[#161B22] dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {isJa ? "地域カバー率" : isVi ? "Độ bao phủ địa lý" : "Regional Coverage"}
                  </span>
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tabular-nums font-mono">
                    {stats.totalPrefectures} 都道府県
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {isJa ? "日本全国の全市区町村を網羅" : isVi ? "Toàn bộ 47 tỉnh thành Nhật Bản" : "All 47 prefectures nationwide"}
                  </p>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="p-5 rounded-xl bg-white border border-slate-200/90 dark:bg-[#161B22] dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {isJa ? "標準産業分類 (JSIC)" : isVi ? "Phân loại ngành JSIC" : "JSIC Industries"}
                  </span>
                  <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tabular-nums font-mono">
                    {stats.totalIndustries} 産業大分類
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {isJa ? "総務省準拠の業種コード体系" : isVi ? "Chuẩn phân ngành chính thức" : "Ministry of Internal Affairs code"}
                  </p>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="p-5 rounded-xl bg-white border border-slate-200/90 dark:bg-[#161B22] dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {isJa ? "フォーム営業 開封率" : isVi ? "Tỷ lệ mở Form DM" : "Outreach Open Rate"}
                  </span>
                  <Send className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums font-mono">
                    50% 〜 90%
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {isJa ? "決裁権者へ直接届く高い視認性" : isVi ? "Tiếp cận trực tiếp lãnh đạo" : "Executive direct read rates"}
                  </p>
                </div>
              </div>
            </div>

            {/* Official Source Footnote */}
            <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-4 font-normal">
              {isJa 
                ? "※ 出典: 国税庁法人番号公表サイト、法務省登記所データ、経済産業省gBizINFO、厚生労働省、特許庁の公的オープンデータ"
                : isVi 
                ? "※ Nguồn: Dữ liệu mở từ Cục Thuế Quốc gia (NTA), Bộ Tư pháp (MOJ), METI gBizINFO, Bộ Y tế Lao động và Cục Sáng chế Nhật Bản"
                : "※ Official Sources: National Tax Agency, Ministry of Justice, METI gBizINFO, and Japan Patent Office."}
            </p>
          </div>
        </section>

        {/* ========================================================
            TẦNG 3: ⚡ DỮ LIỆU BIẾN ĐỘNG THỜI GIAN THỰC (Sub-Agent 3)
            Trọng tâm Lưới 6 Hub biến động - Tối ưu SEO cho Google & Bing
            ======================================================== */}
        <section aria-labelledby="signals-heading" className="py-14 bg-white dark:bg-[#0D1117] border-b border-slate-200/90 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-slate-200/80 dark:border-slate-800 gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider mb-1">
                  <Activity className="w-3.5 h-3.5 text-amber-500" />
                  <span>REAL-TIME BUSINESS SIGNALS</span>
                </div>
                <h2 id="signals-heading" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {isJa ? "最新の企業動向・市場シグナル" : isVi ? "Tín hiệu biến động doanh nghiệp thời gian thực" : "Real-Time Market & Business Signals"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {isJa 
                    ? "公的オープンデータや市場動態から、今アプローチすべき確度の高い営業ターゲットを即時抽出" 
                    : isVi 
                    ? "Dữ liệu pháp lý và thị trường giúp xác định ngay doanh nghiệp đang có nhu cầu ngân sách" 
                    : "Discover active prospects from verified legal changes, hiring, and bidding wins."}
                </p>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {isJa ? "※ 毎週次・月次自動同期中" : isVi ? "※ Đồng bộ định kỳ hàng tuần" : "※ Synchronized weekly"}
              </span>
            </div>

            {/* Grid 6 Dynamic Hubs (3 Cột x 2 Hàng) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Hub 1: Pháp nhân mới thành lập */}
              <Link 
                href={`/${locale}/new-companies`} 
                className="b2b-card p-5 hover:border-[#1B4F8A] dark:hover:border-blue-400 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                      {isJa ? "新規登記速報" : isVi ? "Mới đăng ký" : "New Register"}
                    </span>
                    <Building2 className="w-4 h-4 text-slate-400 group-hover:text-[#1B4F8A] transition-colors" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors">
                    {isJa ? "新設法人・新規設立企業速報" : isVi ? "Pháp nhân mới thành lập" : "Newly Established Companies"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                    {isJa
                      ? "設立直後のスタートアップ・新設法人へ、競合他社より早く初期提案を実施。"
                      : isVi
                      ? "Tiếp cận các công ty mới thành lập trước đối thủ để chào các gói dịch vụ ban đầu."
                      : "Target newly registered businesses before competitors for early commercial pitches."}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#1B4F8A] dark:text-blue-400">
                  <span>{isJa ? "最新リストを見る" : isVi ? "Xem danh sách" : "View List"}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              {/* Hub 2: Chuyển trụ sở văn phòng */}
              <Link 
                href={`/${locale}/changes/relocation`} 
                className="b2b-card p-5 hover:border-[#1B4F8A] dark:hover:border-blue-400 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                      {isJa ? "拠点拡大・移転" : isVi ? "Mở rộng văn phòng" : "Relocation"}
                    </span>
                    <MapPin className="w-4 h-4 text-slate-400 group-hover:text-[#1B4F8A] transition-colors" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors">
                    {isJa ? "本社移転・所在地変更企業速報" : isVi ? "Công ty đổi trụ sở / chuyển văn phòng" : "Head Office Relocations"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                    {isJa
                      ? "オフィス移転・拠点新設に伴うIT機器、什器、通信回線の需要を早期キャッチ。"
                      : isVi
                      ? "Đón đầu nhu cầu mua sắm thiết bị văn phòng, mạng viễn thông khi công ty chuyển địa điểm."
                      : "Catch early procurement demand for office equipment, IT, and telecom services."}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#1B4F8A] dark:text-blue-400">
                  <span>{isJa ? "最新リストを見る" : isVi ? "Xem danh sách" : "View List"}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              {/* Hub 3: Tuyển dụng gấp */}
              <Link 
                href={`/${locale}/jobs/latest`} 
                className="b2b-card p-5 hover:border-[#1B4F8A] dark:hover:border-blue-400 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                      {isJa ? "採用意欲大" : isVi ? "Đang mở rộng" : "Hiring"}
                    </span>
                    <Users className="w-4 h-4 text-slate-400 group-hover:text-[#1B4F8A] transition-colors" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors">
                    {isJa ? "求人募集中・新着採用企業速報" : isVi ? "Doanh nghiệp đang tuyển dụng gấp" : "Actively Hiring Companies"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                    {isJa
                      ? "採用費を投じている成長企業へ、人材サービスや業務効率化ツールを提案。"
                      : isVi
                      ? "Chào bán dịch vụ tuyển dụng, phần mềm nhân sự cho các công ty đang mở rộng quy mô."
                      : "Pitch HR tools, staffing services, and software to fast-growing hiring teams."}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#1B4F8A] dark:text-blue-400">
                  <span>{isJa ? "最新リストを見る" : isVi ? "Xem danh sách" : "View List"}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              {/* Hub 4: Đấu thầu công & Trợ cấp */}
              <Link 
                href={`/${locale}/search?subsidy=true&bidding=true`} 
                className="b2b-card p-5 hover:border-[#1B4F8A] dark:hover:border-blue-400 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                      {isJa ? "予算獲得企業" : isVi ? "Có ngân sách" : "Funded"}
                    </span>
                    <Award className="w-4 h-4 text-slate-400 group-hover:text-[#1B4F8A] transition-colors" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors">
                    {isJa ? "補助金受給・官公庁入札企業" : isVi ? "Trợ cấp chính phủ & Đấu thầu công" : "Subsidies & Public Bidders"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                    {isJa
                      ? "ものづくり補助金等の採択企業や省庁入札落札企業など、予算潤沢な先を特定。"
                      : isVi
                      ? "Xác định các doanh nghiệp vừa nhận nguồn tiền trợ cấp hoặc trúng gói thầu chính phủ."
                      : "Target companies that recently secured government grants and public contract wins."}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#1B4F8A] dark:text-blue-400">
                  <span>{isJa ? "最新リストを見る" : isVi ? "Xem danh sách" : "View List"}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              {/* Hub 5: Đổi tên công ty & M&A */}
              <Link 
                href={`/${locale}/changes/merger`} 
                className="b2b-card p-5 hover:border-[#1B4F8A] dark:hover:border-blue-400 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800">
                      {isJa ? "体制刷新" : isVi ? "Tái cấu trúc" : "Reorganization"}
                    </span>
                    <RotateCw className="w-4 h-4 text-slate-400 group-hover:text-[#1B4F8A] transition-colors" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors">
                    {isJa ? "商号変更・企業合併一覧" : isVi ? "Đổi tên công ty / Sáp nhập M&A" : "Name Changes & Mergers"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                    {isJa
                      ? "社名変更やM&A合併によるリブランディング、システム刷新の商機を発掘。"
                      : isVi
                      ? "Khai thác cơ hội nâng cấp hệ thống và dịch vụ tư vấn khi công ty tái cơ cấu thương hiệu."
                      : "Discover software migration and rebranding opportunities during M&A integrations."}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#1B4F8A] dark:text-blue-400">
                  <span>{isJa ? "最新リストを見る" : isVi ? "Xem danh sách" : "View List"}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              {/* Hub 6: Giải thể & Phá sản (Quản trị rủi ro) */}
              <Link 
                href={`/${locale}/status/bankruptcies`} 
                className="b2b-card p-5 hover:border-red-400 dark:hover:border-red-700 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                      {isJa ? "与信リスク管理" : isVi ? "Rủi ro tín dụng" : "Credit Risk"}
                    </span>
                    <AlertTriangle className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    {isJa ? "倒産・解散・清算結了速報" : isVi ? "Doanh nghiệp giải thể / phá sản" : "Dissolutions & Closures"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                    {isJa
                      ? "取引先や営業先リストから活動停止企業を即時検知し、未回収リスクを未然に防止。"
                      : isVi
                      ? "Kiểm tra và loại bỏ các đối tác đã dừng hoạt động để tránh rủi ro công nợ khó đòi."
                      : "Screen out dissolved entities from sales campaigns to protect credit accounts."}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400">
                  <span>{isJa ? "最新リストを見る" : isVi ? "Xem danh sách" : "View List"}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

            </div>
          </div>
        </section>

        {/* ========================================================
            TẦNG 4: 4 TRỤ CỘT GIẢI PHÁP KINH DOANH (Sub-Agent 4)
            ======================================================== */}
        <section aria-labelledby="solutions-heading" className="py-16 bg-slate-50 dark:bg-[#0D1117] border-b border-slate-200/90 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider block mb-1">
                {isJa ? "4つの主要ソリューション" : isVi ? "4 Trụ cột giải pháp" : "Core Capabilities"}
              </span>
              <h2 id="solutions-heading" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isJa ? "B2B新規開拓に必要なすべてを、ひとつの画面に" : isVi ? "Mọi giải pháp phát triển bán hàng B2B trên một nền tảng" : "Integrated B2B Pipeline Growth Platform"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {isJa 
                  ? "リストの抽出から意図シグナルの分析、案件管理、自動アプローチまで。営業チームの生産性を引き上げる4つの柱。" 
                  : isVi 
                  ? "Từ lọc tệp khách hàng, phân tích tín hiệu, quản lý phễu đàm phán đến tự động hóa gửi Form tiếp cận." 
                  : "Target, analyze, track, and automate outreach to Japanese corporate accounts seamlessly."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Pillar 1 */}
              <div className="b2b-card p-6 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center mb-4 border border-blue-200/70 dark:border-blue-800">
                    <Database className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                    {isJa ? "1. 500万社 企業データベース" : isVi ? "1. CSDL 5M+ Doanh nghiệp" : "1. 5M+ Company Database"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    {isJa
                      ? "地域、JSIC全産業、資本金、従業員規模などの複合条件で即座にリスト作成。電話番号・HP・代表者名付きでCSV一括出力。"
                      : isVi
                      ? "Lọc theo 47 tỉnh thành, ngành nghề JSIC, vốn điều lệ, nhân sự và xuất file CSV có SĐT, website, người đại diện."
                      : "Filter across prefectures, JSIC industry codes, capital, and staff. Export verified CSV lists."}
                  </p>
                </div>
                <Link href={`/${locale}/search`} className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 inline-flex items-center gap-1 hover:underline pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span>{isJa ? "検索を試す" : isVi ? "Dùng thử bộ lọc" : "Explore DB"}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Pillar 2 */}
              <div className="b2b-card p-6 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-200/70 dark:border-indigo-800">
                    <Send className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                    {isJa ? "2. セルフ型フォーム自動営業" : isVi ? "2. Gửi Form tự động (Form DM)" : "2. Automated Form Outreach"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    {isJa
                      ? "Web問い合わせフォームへ自動配信。AIが「営業お断り」サイトを自動除外し、開封率50〜90%で決裁権者へリーチ。"
                      : isVi
                      ? "Gửi thư ngỏ vào form website công ty. AI tự lọc bỏ trang cấm quảng cáo, tỷ lệ mở 50-90%, báo cáo URL gửi thành công."
                      : "Deliver directly to inquiry forms. AI automatically skips disclaimer sites, delivering 50-90% read rates."}
                  </p>
                </div>
                <Link href={`/${locale}/form-marketing`} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1 hover:underline pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span>{isJa ? "詳細を見る" : isVi ? "Xem chi tiết" : "Learn More"}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Pillar 3 */}
              <div className="b2b-card p-6 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-200/70 dark:border-emerald-800">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                    {isJa ? "3. 適格請求書（インボイス）一括照会" : isVi ? "3. Đối soát Hóa đơn Invoice hàng loạt" : "3. Bulk Invoice Verification (NTA)"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    {isJa
                      ? "国税庁Web-APIと直結し、登録番号（T番号）を最大100件まで一括高速照会。失効・取消・社名不一致リスクを瞬時に検知。"
                      : isVi
                      ? "Kết nối trực tiếp Web-API Quốc thuế Nhật Bản, đối soát tối đa 100 mã số T-Number cùng lúc. Phát hiện ngay số hết hạn hoặc sai lệch."
                      : "Direct connection to Japan NTA Web-API. Validate up to 100 T-numbers in bulk. Detect revoked or mismatched invoices instantly."}
                  </p>
                </div>
                <Link href={`/${locale}/invoice`} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 hover:underline pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span>{isJa ? "一括照会を試す" : isVi ? "Tra cứu hàng loạt" : "Verify Invoices"}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Pillar 4 */}
              <div className="b2b-card p-6 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 flex items-center justify-center mb-4 border border-purple-200/70 dark:border-purple-800">
                    <Bell className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                    {isJa ? "4. 企業監視・重要変動検知" : isVi ? "4. Giám sát Doanh nghiệp & Biến động" : "4. Company Monitoring & Risk Alerts"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    {isJa
                      ? "取引先や営業先を最大100社まで無料見守り。代表者交代、本社移転、インボイス登録取消、法人閉鎖を毎日自動検知してアラート。"
                      : isVi
                      ? "Theo dõi miễn phí tối đa 100 đối tác. Tự động phát hiện thay đổi đại diện, dời trụ sở, hủy mã số Invoice hoặc giải thể."
                      : "Monitor up to 100 partner companies. Automatically detect CEO changes, relocations, invoice revocations, and closures."}
                  </p>
                </div>
                <Link href={`/${locale}/watchlist`} className="text-xs font-bold text-purple-600 dark:text-purple-400 inline-flex items-center gap-1 hover:underline pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span>{isJa ? "見守り機能を見る" : isVi ? "Khám phá tính năng" : "Explore Watchlist"}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================
            TẦNG 5: BẢN ĐỒ DỮ LIỆU 47 TỈNH THÀNH (Sub-Agent 5)
            ======================================================== */}
        <section aria-labelledby="prefectures-heading" className="py-14 bg-white dark:bg-[#0D1117] border-b border-slate-200/90 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-200/80 dark:border-slate-800 gap-3">
              <div>
                <span className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider block mb-1">
                  REGIONAL DATABASE
                </span>
                <h2 id="prefectures-heading" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {isJa ? "日本全国47都道府県の企業一覧・営業リスト" : isVi ? "Danh mục doanh nghiệp theo 47 tỉnh thành" : "Japan 47 Prefectures Business Directory"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isJa ? "各都道府県の主要企業、法人番号、電話番号、財務情報を網羅した地域別データベース" : isVi ? "Dữ liệu pháp nhân theo từng địa bàn từ Hokkaido đến Okinawa" : "Explore corporate profiles across all 47 prefectures"}
                </p>
              </div>
              <Link
                href={`/${locale}/directory#industries`}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline shrink-0"
              >
                <span>{isJa ? "JSIC産業分類・全カテゴリを見る" : isVi ? "Xem phân loại ngành JSIC" : "View JSIC Categories"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              {[
                {
                  regionJa: "北海道・東北",
                  regionEn: "Hokkaido & Tohoku",
                  regionVi: "Hokkaido & Tohoku",
                  items: [
                    { code: "01", ja: "北海道", en: "Hokkaido", vi: "Hokkaido" },
                    { code: "02", ja: "青森県", en: "Aomori", vi: "Aomori" },
                    { code: "03", ja: "岩手県", en: "Iwate", vi: "Iwate" },
                    { code: "04", ja: "宮城県", en: "Miyagi", vi: "Miyagi" },
                    { code: "05", ja: "秋田県", en: "Akita", vi: "Akita" },
                    { code: "06", ja: "山形県", en: "Yamagata", vi: "Yamagata" },
                    { code: "07", ja: "福島県", en: "Fukushima", vi: "Fukushima" },
                  ]
                },
                {
                  regionJa: "関東",
                  regionEn: "Kanto",
                  regionVi: "Kanto",
                  items: [
                    { code: "08", ja: "茨城県", en: "Ibaraki", vi: "Ibaraki" },
                    { code: "09", ja: "栃木県", en: "Tochigi", vi: "Tochigi" },
                    { code: "10", ja: "群馬県", en: "Gunma", vi: "Gunma" },
                    { code: "11", ja: "埼玉県", en: "Saitama", vi: "Saitama" },
                    { code: "12", ja: "千葉県", en: "Chiba", vi: "Chiba" },
                    { code: "13", ja: "東京都", en: "Tokyo", vi: "Tokyo" },
                    { code: "14", ja: "神奈川県", en: "Kanagawa", vi: "Kanagawa" },
                  ]
                },
                {
                  regionJa: "中部・北陸",
                  regionEn: "Chubu & Hokuriku",
                  regionVi: "Chubu & Hokuriku",
                  items: [
                    { code: "15", ja: "新潟県", en: "Niigata", vi: "Niigata" },
                    { code: "16", ja: "富山県", en: "Toyama", vi: "Toyama" },
                    { code: "17", ja: "石川県", en: "Ishikawa", vi: "Ishikawa" },
                    { code: "18", ja: "福井県", en: "Fukui", vi: "Fukui" },
                    { code: "19", ja: "山梨県", en: "Yamanashi", vi: "Yamanashi" },
                    { code: "20", ja: "長野県", en: "Nagano", vi: "Nagano" },
                    { code: "21", ja: "岐阜県", en: "Gifu", vi: "Gifu" },
                    { code: "22", ja: "静岡県", en: "Shizuoka", vi: "Shizuoka" },
                    { code: "23", ja: "愛知県", en: "Aichi", vi: "Aichi" },
                  ]
                },
                {
                  regionJa: "近畿・関西",
                  regionEn: "Kinki & Kansai",
                  regionVi: "Kinki & Kansai",
                  items: [
                    { code: "24", ja: "三重県", en: "Mie", vi: "Mie" },
                    { code: "25", ja: "滋賀県", en: "Shiga", vi: "Shiga" },
                    { code: "26", ja: "京都府", en: "Kyoto", vi: "Kyoto" },
                    { code: "27", ja: "大阪府", en: "Osaka", vi: "Osaka" },
                    { code: "28", ja: "兵庫県", en: "Hyogo", vi: "Hyogo" },
                    { code: "29", ja: "奈良県", en: "Nara", vi: "Nara" },
                    { code: "30", ja: "和歌山県", en: "Wakayama", vi: "Wakayama" },
                  ]
                },
                {
                  regionJa: "中国・四国",
                  regionEn: "Chugoku & Shikoku",
                  regionVi: "Chugoku & Shikoku",
                  items: [
                    { code: "31", ja: "鳥取県", en: "Tottori", vi: "Tottori" },
                    { code: "32", ja: "島根県", en: "Shimane", vi: "Shimane" },
                    { code: "33", ja: "岡山県", en: "Okayama", vi: "Okayama" },
                    { code: "34", ja: "広島県", en: "Hiroshima", vi: "Hiroshima" },
                    { code: "35", ja: "山口県", en: "Yamaguchi", vi: "Yamaguchi" },
                    { code: "36", ja: "徳島県", en: "Tokushima", vi: "Tokushima" },
                    { code: "37", ja: "香川県", en: "Kagawa", vi: "Kagawa" },
                    { code: "38", ja: "愛媛県", en: "Ehime", vi: "Ehime" },
                    { code: "39", ja: "高知県", en: "Kochi", vi: "Kochi" },
                  ]
                },
                {
                  regionJa: "九州・沖縄",
                  regionEn: "Kyushu & Okinawa",
                  regionVi: "Kyushu & Okinawa",
                  items: [
                    { code: "40", ja: "福岡県", en: "Fukuoka", vi: "Fukuoka" },
                    { code: "41", ja: "佐賀県", en: "Saga", vi: "Saga" },
                    { code: "42", ja: "長崎県", en: "Nagasaki", vi: "Nagasaki" },
                    { code: "43", ja: "熊本県", en: "Kumamoto", vi: "Kumamoto" },
                    { code: "44", ja: "大分県", en: "Oita", vi: "Oita" },
                    { code: "45", ja: "宮崎県", en: "Miyazaki", vi: "Miyazaki" },
                    { code: "46", ja: "鹿児島県", en: "Kagoshima", vi: "Kagoshima" },
                    { code: "47", ja: "沖縄県", en: "Okinawa", vi: "Okinawa" },
                  ]
                }
              ].map((group) => {
                const regionTitle = isJa ? group.regionJa : isVi ? group.regionVi : group.regionEn;
                return (
                  <div key={group.regionJa} className="p-4 rounded-xl bg-slate-50 dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2.5 text-xs flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                      <span>{regionTitle}</span>
                      <span className="text-[10px] font-mono text-slate-400">{group.items.length} 府県</span>
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map((item) => {
                        const name = isJa ? item.ja : isVi ? item.vi : item.en;
                        return (
                          <Link
                            key={item.code}
                            href={`/${locale}/area/${item.code}`}
                            className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#1B4F8A] dark:hover:border-blue-400 hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors font-medium text-[11px]"
                          >
                            {name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* ========================================================
            TẦNG 5.5: CƠ SỞ DỮ LIỆU CÔNG QUYỀN & GIẤY PHÉP QUỐC GIA (SEO Hubs)
            ======================================================== */}
        <section aria-labelledby="licenses-heading" className="py-14 bg-slate-50 dark:bg-[#0D1117] border-b border-slate-200/90 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-200/80 dark:border-slate-800 gap-3">
              <div>
                <span className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider block mb-1">
                  OFFICIAL LICENSES & ACCREDITATIONS
                </span>
                <h2 id="licenses-heading" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>{isJa ? "公的許認可・国家資格・士業法人データベース" : isVi ? "Cơ sở dữ liệu Giấy phép Công & Pháp nhân Chuyên môn" : "Official Licenses & Professional Registrations"}</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
                    51万件+
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isJa 
                    ? "出入国在留管理庁、国土交通省、厚生労働省、公安委員会から認可・登録を受けた正規事業者を横断検索" 
                    : isVi 
                    ? "Danh bạ doanh nghiệp được cấp phép chính thức từ Cục Xuất nhập cảnh, Bộ Giao thông, Bộ Lao động và Công an" 
                    : "Verified statutory registrations and accredited corporate entities nationwide"}
                </p>
              </div>
              <Link
                href={`/${locale}/licenses`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline shrink-0 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-900 bg-white dark:bg-[#161B22] hover:bg-blue-50/50 transition-colors shadow-2xs"
              >
                <span>{isJa ? "全許認可ハブ一覧を見る" : isVi ? "Xem tất cả Hub Giấy phép" : "View All License Hubs"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {[
                {
                  slug: "tokutei",
                  titleJa: "登録支援機関",
                  titleVi: "Cơ quan hỗ trợ Tokutei",
                  titleEn: "Registered Support Org",
                  badgeJa: "出入国在留管理庁",
                  badgeVi: "Cục Xuất nhập cảnh",
                  badgeEn: "Immigration Agency",
                  count: "7,731",
                  descJa: "特定技能外国人材受入れ、対応言語・直通番号網羅",
                  descVi: "Hỗ trợ visa đặc định, ngôn ngữ và SĐT liên hệ",
                  descEn: "Specified skilled workers visa & foreign support"
                },
                {
                  slug: "shigyo",
                  titleJa: "士業専門職法人",
                  titleVi: "Pháp nhân Thuế & Luật",
                  titleEn: "Statutory Law & Accounting",
                  badgeJa: "各士業法・官公庁",
                  badgeVi: "Pháp lý chuyên ngành",
                  badgeEn: "Statutory Registry",
                  count: "635",
                  descJa: "税理士法人・弁護士法人・社労士法人・行政書士法人",
                  descVi: "Pháp nhân thuế, luật sư, bảo hiểm xã hội, hành chính",
                  descEn: "Incorporated tax, legal, labor, and patent firms"
                },
                {
                  slug: "takken",
                  titleJa: "宅地建物取引業者",
                  titleVi: "Môi giới Bất động sản",
                  titleEn: "Real Estate Brokers",
                  badgeJa: "国土交通省・知事",
                  badgeVi: "Bộ Đất đai & Tỉnh",
                  badgeEn: "MLIT / Prefectures",
                  count: "25,913",
                  descJa: "宅建免許番号、更新回数（業歴指標）、代表者情報",
                  descVi: "Mã số giấy phép, thâm niên và người đại diện",
                  descEn: "License numbers, business tenure, verified brokers"
                },
                {
                  slug: "kensetsu",
                  titleJa: "建設業許可",
                  titleVi: "Giấy phép Xây dựng",
                  titleEn: "Construction Licenses",
                  badgeJa: "国交大臣・知事許可",
                  badgeVi: "Bộ Xây dựng & Tỉnh",
                  badgeEn: "MLIT Authority",
                  count: "355,587",
                  descJa: "土木・建築・管工事など29業種許可、施工能力証明",
                  descVi: "29 phân ngành xây dựng, cấp phép thi công công trình",
                  descEn: "29 industry categories, certified general contractors"
                },
                {
                  slug: "kobutsu",
                  titleJa: "古物商許可",
                  titleVi: "Kinh doanh Đồ cũ",
                  titleEn: "Secondhand Dealers",
                  badgeJa: "公安委員会・警察署",
                  badgeVi: "Ủy ban An toàn Công",
                  badgeEn: "Public Safety Comm",
                  count: "8,923",
                  descJa: "リユース・ブランド買取・中古車輸出・質屋営業",
                  descVi: "Mua bán đồ cũ, tái chế, xuất khẩu xe và cầm đồ",
                  descEn: "Reuse, luxury appraisal, export, pawnshop licenses"
                },
                {
                  slug: "haken",
                  titleJa: "労働者派遣事業",
                  titleVi: "Phái cử Lao động",
                  titleEn: "Worker Dispatch",
                  badgeJa: "厚生労働省 (派番号)",
                  badgeVi: "Bộ Y tế Lao động",
                  badgeEn: "MHLW Approved",
                  count: "55,485",
                  descJa: "一般派遣免許、ITエンジニア・製造・事務人材供給",
                  descVi: "Cung ứng nhân lực IT, kỹ sư, văn phòng, sản xuất",
                  descEn: "Temporary staffing, IT & manufacturing manpower"
                },
                {
                  slug: "shokugyo",
                  titleJa: "有料職業紹介事業",
                  titleVi: "Giới thiệu Việc làm",
                  titleEn: "Recruitment Agencies",
                  badgeJa: "厚生労働省 (ユ番号)",
                  badgeVi: "Bộ Y tế Lao động",
                  badgeEn: "MHLW Approved",
                  count: "36,892",
                  descJa: "人材紹介・ヘッドハンティング・エグゼクティブサーチ",
                  descVi: "Headhunt, tuyển dụng nhân sự cấp cao, môi giới",
                  descEn: "Executive search, recruitment, employment placement"
                },
                {
                  slug: "inshoku",
                  titleJa: "飲食店営業許可",
                  titleVi: "Nhà hàng & Quán ăn",
                  titleEn: "Restaurants & Eateries",
                  badgeJa: "食品衛生法・保健所",
                  badgeVi: "Luật Vệ sinh Thực phẩm",
                  badgeEn: "Food Sanitation Act",
                  count: "29,956",
                  descJa: "外食チェーン・居酒屋・カフェ、直通連絡先と店舗情報",
                  descVi: "Chuỗi nhà hàng, quán ăn, cafe, số điện thoại trực tiếp",
                  descEn: "Dining chains, izakayas, certified culinary operators"
                },
                {
                  slug: "ryokan",
                  titleJa: "旅館・ホテル営業許可",
                  titleVi: "Khách sạn & Nhà nghỉ",
                  titleEn: "Hotels & Ryokans",
                  badgeJa: "旅館業法・各自治体",
                  badgeVi: "Luật Khách sạn",
                  badgeEn: "Inns & Hotels Act",
                  count: "2,137",
                  descJa: "全国ホテル、旅館、簡易宿所運営企業、客室規模網羅",
                  descVi: "Khách sạn, ryokan, homestay, thông tin phòng ốc",
                  descEn: "Hotels, traditional ryokans, licensed lodgings"
                },
                {
                  slug: "licenses",
                  isAll: true,
                  titleJa: "許認可データベース全件",
                  titleVi: "Xem tất cả Giấy phép",
                  titleEn: "All Licenses Directory",
                  badgeJa: "47都道府県横断",
                  badgeVi: "Toàn quốc 47 tỉnh",
                  badgeEn: "All 47 Prefectures",
                  count: "51万+",
                  descJa: "全国の公的資格・許認可・士業登録企業を検索・CSV抽出",
                  descVi: "Tìm kiếm và xuất CSV doanh nghiệp có giấy phép công",
                  descEn: "Comprehensive master directory with CSV export"
                }
              ].map((item) => {
                const title = isJa ? item.titleJa : isVi ? item.titleVi : item.titleEn;
                const badge = isJa ? item.badgeJa : isVi ? item.badgeVi : item.badgeEn;
                const desc = isJa ? item.descJa : isVi ? item.descVi : item.descEn;
                const href = item.isAll ? `/${locale}/licenses` : `/${locale}/license/${item.slug}`;

                return (
                  <Link
                    key={item.slug}
                    href={href}
                    className="p-4 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 hover:border-[#1B4F8A] dark:hover:border-blue-400 transition-all flex flex-col justify-between group shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {badge}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-[#1B4F8A] dark:text-blue-400">
                          {item.count} 社
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-xs mb-1 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors">
                        {title}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {desc}
                      </p>
                    </div>
                    <div className="pt-2.5 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-[#1B4F8A] dark:text-blue-400">
                      <span>{isJa ? "専用ハブを開く" : isVi ? "Xem chi tiết" : "Open Hub"}</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>

          </div>
        </section>

        {/* ========================================================
            TẦNG 6: BẢNG SO SÁNH GIÁ TRỊ & TIẾT KIỆM CHI PHÍ (Sub-Agent 6)
            ======================================================== */}
        <section aria-labelledby="comparison-heading" className="py-16 bg-slate-50 dark:bg-[#0D1117] border-b border-slate-200/90 dark:border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider block mb-1">
                ROI & COST EFFICIENCY
              </span>
              <h2 id="comparison-heading" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isJa ? "従来の営業リスト調達との決定的な違い" : isVi ? "So sánh hiệu quả chi phí với cách truyền thống" : "Traditional Procurement vs. Kigyou-list"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {isJa ? "高額な名簿買い切りや手作業の非効率から営業チームを解放します" : isVi ? "Tiết kiệm 90% chi phí và thời gian so với mua danh bạ cũ" : "Stop overpaying for stale static lists."}
              </p>
            </div>

            {/* Comparison Table */}
            <div className="bg-white dark:bg-[#161B22] rounded-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
                      <th className="py-3 px-4 font-bold text-slate-500 dark:text-slate-400">{isJa ? "項目" : isVi ? "Tiêu chí" : "Criteria"}</th>
                      <th className="py-3 px-4 font-bold text-slate-500 dark:text-slate-400">{isJa ? "名簿販売業者 (買い切り)" : isVi ? "Mua danh bạ cũ" : "Traditional Brokers"}</th>
                      <th className="py-3 px-4 font-bold text-slate-500 dark:text-slate-400">{isJa ? "手作業でのWeb収集" : isVi ? "Tự cào thủ công" : "Manual Scraping"}</th>
                      <th className="py-3 px-4 font-bold text-[#1B4F8A] dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20">{isJa ? "Kigyou-list" : "Kigyou-list"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{isJa ? "1件あたりの単価" : isVi ? "Chi phí mỗi công ty" : "Cost per Lead"}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{isJa ? "10円 〜 50円（高額）" : "10 - 50 Yên/công ty"}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{isJa ? "0円（莫大な人件費）" : "0đ (Mất nhiều giờ công)"}</td>
                      <td className="py-3 px-4 font-bold text-[#1B4F8A] dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/10">
                        {isJa ? "実質 0.1円〜（定額使い放題）" : isVi ? "Từ 0.1 Yên (Thuê bao cố định)" : "From 0.1 JPY (Flat)"}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{isJa ? "データの鮮度" : isVi ? "Độ tươi mới" : "Data Freshness"}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{isJa ? "数年前の古いデータ混在" : "Dữ liệu tĩnh cũ, nhiều số chết"}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{isJa ? "最新だが収集限界あり" : "Thu thập chậm"}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/30 dark:bg-blue-950/10">
                        {isJa ? "公的オープンデータを常時更新" : isVi ? "Cập nhật liên tục từ NTA" : "Continuously refreshed"}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{isJa ? "契約期間の縛り" : isVi ? "Thời hạn hợp đồng" : "Commitment"}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{isJa ? "年間一括契約が多い" : "Bắt buộc ký 1 năm"}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{isJa ? "なし" : "Không có"}</td>
                      <td className="py-3 px-4 font-bold text-[#1B4F8A] dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/10">
                        {isJa ? "月額制・縛りなし（いつでも解約可）" : isVi ? "Không ràng buộc năm (Hủy bất kỳ lúc nào)" : "Monthly, Cancel Anytime"}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{isJa ? "営業アプローチ手段" : isVi ? "Công cụ tiếp cận" : "Outreach Integration"}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{isJa ? "CSV提供のみ" : "Chỉ đưa file Excel"}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{isJa ? "手動入力のみ" : "Gõ tay từng form"}</td>
                      <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400 bg-blue-50/30 dark:bg-blue-950/10">
                        {isJa ? "完全自動フォーム営業連携" : isVi ? "Tích hợp Gửi Form tự động 1 chạm" : "Automated Form Outreach"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                href={`/${locale}/pricing`}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold text-white bg-[#1B4F8A] hover:bg-[#143D6C] shadow-2xs transition-colors"
              >
                <span>{isJa ? "料金プランを見る (初月70%OFF 1,260円〜)" : isVi ? "Xem bảng giá (Tháng đầu giảm 70% còn 1,260 JPY)" : "View Pricing (From 1,260 JPY 1st Mo)"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </section>

        {/* ========================================================
            TẦNG 7: FAQ CHUẨN DOANH NGHIỆP & BẢO ĐẢM PHÁP LÝ (Sub-Agent 7)
            ======================================================== */}
        <section aria-labelledby="faq-heading" className="py-16 bg-white dark:bg-[#0D1117] border-b border-slate-200/90 dark:border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider block mb-1">
                FAQ & COMPLIANCE
              </span>
              <h2 id="faq-heading" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isJa ? "よくあるご質問" : isVi ? "Câu hỏi thường gặp" : "Frequently Asked Questions"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isJa ? "ご不明な点がございましたらお気軽にお問い合わせください" : isVi ? "Mọi thắc mắc vui lòng liên hệ bộ phận hỗ trợ" : "Need help? Contact our support team anytime."}
              </p>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              {faqSchema.mainEntity.map((item, idx) => (
                <details 
                  key={idx}
                  className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#161B22] p-4 transition-colors"
                >
                  <summary className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer list-none flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center font-mono text-xs shrink-0 font-bold">
                        Q
                      </span>
                      <span>{item.name}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform shrink-0" />
                  </summary>
                  <p className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800 text-slate-600 dark:text-slate-400 leading-relaxed text-xs">
                    {item.acceptedAnswer.text}
                  </p>
                </details>
              ))}
            </div>

          </div>
        </section>

      </main>

      {/* Global Sleek Footer */}
      <Footer />
    </div>
  );
}
