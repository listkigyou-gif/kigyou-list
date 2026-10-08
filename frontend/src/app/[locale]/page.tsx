import React from "react";
import Link from "next/link";
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
  TrendingUp, 
  Sparkles, 
  Filter, 
  Users, 
  Award, 
  ExternalLink, 
  HelpCircle, 
  ChevronRight, 
  Layers, 
  FileSpreadsheet, 
  Lock, 
  Clock, 
  DollarSign,
  FileText,
  BadgeCheck,
  Zap,
  Target
} from "lucide-react";
import { getDatabaseStats, getFeaturedPartners, getMockPartners } from "@/lib/db";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getTranslations } from "@/lib/i18n";

export const revalidate = 3600; // Cache for 1 hour for high performance

interface PageParams {
  params: Promise<{ locale: string }>;
}

export default async function Home({ params }: PageParams) {
  const { locale } = await params;
  const t = getTranslations(locale);
  const isJa = locale === "ja";
  const isVi = locale === "vi";

  // Fetch real database counts dynamically
  const stats = await getDatabaseStats();
  const realPartners = await getFeaturedPartners();
  const mockPartners = await getMockPartners();
  const partners = [...realPartners, ...mockPartners];

  // Split into 2 rows for partner marquee
  const halfLength = Math.ceil(partners.length / 2);
  const row1Partners = partners.slice(0, halfLength);
  const row2Partners = partners.slice(halfLength);

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

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Kigyou-list",
    "url": `https://kigyoulist.com/${locale}`,
    "logo": "https://kigyoulist.com/icon.svg"
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 font-sans antialiased selection:bg-[#1B4F8A]/15 selection:text-[#1B4F8A]">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      {/* Global Sleek Header */}
      <Header />

      <main className="flex-1">
        {/* ========================================================
            1. HERO SECTION (B2B Authority & Dual Proposition)
            ======================================================== */}
        <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 bg-white dark:bg-[#0D1117] border-b border-slate-200/90 dark:border-slate-800">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#161b22_1px,transparent_1px),linear-gradient(to_bottom,#161b22_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
            {/* Kicker Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold mb-6 tracking-wide shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#1B4F8A] dark:bg-blue-400 animate-pulse" />
              <span>
                {isJa 
                  ? "国内最大級 500万社データベース × 完全自動フォーム営業" 
                  : isVi 
                  ? "5 Triệu Doanh Nghiệp Nhật Bản × Tự Động Hóa Gửi Form B2B" 
                  : "Over 5M Japanese Companies DB × Automated Form Outreach"}
              </span>
            </div>

            {/* H1 Main Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.25] text-slate-900 dark:text-white mb-6">
              {isJa ? (
                <>
                  日本全国500万社の企業データを、次の一手へ。<br className="hidden sm:inline" />
                  <span className="text-[#1B4F8A] dark:text-blue-400">高確度ターゲティング</span>
                  から
                  <span className="text-[#1B4F8A] dark:text-blue-400">自動フォーム営業</span>
                  までワンストップ。
                </>
              ) : isVi ? (
                <>
                  Dữ liệu 5 triệu doanh nghiệp Nhật Bản cho chiến lược mới.<br className="hidden sm:inline" />
                  <span className="text-[#1B4F8A] dark:text-blue-400">Từ lọc khách hàng mục tiêu</span>
                  đến
                  <span className="text-[#1B4F8A] dark:text-blue-400">gửi Form tự động</span>
                  toàn diện.
                </>
              ) : (
                <>
                  Power your B2B Pipeline with 5M+ Japanese Companies.<br className="hidden sm:inline" />
                  <span className="text-[#1B4F8A] dark:text-blue-400">Precision Targeting</span>
                  to
                  <span className="text-[#1B4F8A] dark:text-blue-400">Automated Form Outreach</span>
                  in One Place.
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
              {isJa
                ? "国税庁・法務省・公的オープンデータに直結した法人データベース。求人・助成金・入札・特許などの最新営業意図シグナルで確度の高い企業を抽出し、AIによる安全なフォーム営業自動配信で新規商談を最大化します。"
                : isVi
                ? "Cơ sở dữ liệu kết nối trực tiếp với Bộ Tư pháp và Cơ quan Thuế Nhật Bản. Trích xuất chính xác các doanh nghiệp đang tuyển dụng, nhận trợ cấp, trúng thầu công và tự động hóa gửi chào hàng qua biểu mẫu liên hệ an toàn."
                : "Official government-linked database with 5 million verified companies. Target businesses with active hiring, subsidies, and public bids, and automate safe contact form outreach at scale."}
            </p>

            {/* Central B2B Search Box */}
            <div className="max-w-3xl mx-auto mb-6">
              <form action={`/${locale}/search`} method="GET" className="relative flex items-center p-1.5 rounded-xl bg-white shadow-sm border border-slate-300/90 dark:bg-[#161B22] dark:border-slate-700 focus-within:ring-2 focus-within:ring-[#1B4F8A]/20 focus-within:border-[#1B4F8A] transition-all">
                <Search className="w-5 h-5 text-slate-400 ml-3.5 shrink-0" />
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
                  className="w-full px-4 py-3 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white text-sm"
                />
                <button
                  type="submit"
                  className="px-6 py-3 font-bold text-xs sm:text-sm text-white bg-[#1B4F8A] hover:bg-[#143D6C] rounded-lg shadow-xs transition-colors whitespace-nowrap cursor-pointer shrink-0"
                >
                  {isJa ? "企業を検索" : isVi ? "Tìm kiếm" : "Search"}
                </button>
              </form>
            </div>

            {/* Quick Intent Filter Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto text-xs text-slate-500 dark:text-slate-400 mb-8">
              <span className="font-bold text-slate-400 dark:text-slate-500 text-[11px] uppercase tracking-wider mr-1">
                {isJa ? "人気の条件:" : isVi ? "Bộ lọc nhanh:" : "Hot Filters:"}
              </span>
              <Link 
                href={`/${locale}/search?contact_form=true`} 
                className="px-2.5 py-1 rounded-md bg-white border border-slate-200/90 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors shadow-2xs flex items-center gap-1"
              >
                <Send className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>{isJa ? "お問い合わせフォームあり 🔑" : isVi ? "Có biểu mẫu liên hệ 🔑" : "Contact Form 🔑"}</span>
              </Link>
              <Link 
                href={`/${locale}/search?hiring=true`} 
                className="px-2.5 py-1 rounded-md bg-white border border-slate-200/90 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors shadow-2xs"
              >
                {isJa ? "求人活動中 🔑" : isVi ? "Đang tuyển dụng 🔑" : "Actively Hiring 🔑"}
              </Link>
              <Link 
                href={`/${locale}/search?subsidy=true`} 
                className="px-2.5 py-1 rounded-md bg-white border border-slate-200/90 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors shadow-2xs"
              >
                {isJa ? "補助金受給 🔑" : isVi ? "Nhận trợ cấp 🔑" : "Subsidies 🔑"}
              </Link>
              <Link 
                href={`/${locale}/search?bidding=true`} 
                className="px-2.5 py-1 rounded-md bg-white border border-slate-200/90 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors shadow-2xs"
              >
                {isJa ? "公共入札実績 🔑" : isVi ? "Đấu thầu công 🔑" : "Public Bids 🔑"}
              </Link>
              <Link 
                href={`/${locale}/search?industry=G`} 
                className="px-2.5 py-1 rounded-md bg-white border border-slate-200/90 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors shadow-2xs"
              >
                {isJa ? "IT・情報通信業" : isVi ? "IT & Phần mềm" : "IT / Software"}
              </Link>
              <Link 
                href={`/${locale}/search?prefecture=13`} 
                className="px-2.5 py-1 rounded-md bg-white border border-slate-200/90 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors shadow-2xs"
              >
                {isJa ? "東京都" : isVi ? "Tokyo" : "Tokyo"}
              </Link>
            </div>

            {/* Dual CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href={`/${locale}/search`}
                className="w-full sm:w-auto px-6 py-3 rounded-lg font-bold text-xs sm:text-sm text-white bg-[#1B4F8A] hover:bg-[#143D6C] shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <Search className="w-4 h-4" />
                <span>{isJa ? "企業データベースを検索する" : isVi ? "Khám phá Cơ sở dữ liệu 5M cty" : "Explore Corporate Database"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/${locale}/form-marketing`}
                className="w-full sm:w-auto px-6 py-3 rounded-lg font-bold text-xs sm:text-sm text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-750 shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{isJa ? "セルフ型フォーム営業の詳細を見る" : isVi ? "Tìm hiểu dịch vụ Gửi Form tự động" : "Learn About Form Outreach"}</span>
                <span className="text-[9px] bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded uppercase">NEW</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================
            2. REAL DATABASE STATS (Official Data Credibility)
            ======================================================== */}
        <section className="py-12 bg-slate-50 dark:bg-[#0B0F17] border-b border-slate-200/80 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Stat 1 */}
              <div className="p-6 rounded-xl bg-white border border-slate-200/90 dark:bg-[#161B22] dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {isJa ? "収録法人データ数" : isVi ? "Số pháp nhân toàn quốc" : "Corporate Records"}
                  </span>
                  <Database className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                </div>
                <div>
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#1B4F8A] font-mono tracking-tight dark:text-blue-400">
                    {(stats.totalCompanies).toLocaleString()}+
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                    {isJa ? "国税庁・法務省連携の最新法人番号データベース" : isVi ? "Cơ quan Thuế & Bộ Tư pháp Nhật Bản" : "Official NTA & MOJ registered businesses"}
                  </p>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="p-6 rounded-xl bg-white border border-slate-200/90 dark:bg-[#161B22] dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {isJa ? "地域・産業の網羅性" : isVi ? "Tỉnh thành & Ngành nghề" : "Coverage Scope"}
                  </span>
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight dark:text-white">
                    {stats.totalPrefectures} 都道府県
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                    {isJa ? `全 ${stats.totalIndustries} 産業大分類（JSIC準拠）を完全網羅` : isVi ? `Bao phủ toàn bộ ${stats.totalIndustries} ngành chuẩn JSIC` : `All ${stats.totalIndustries} JSIC industries covered`}
                  </p>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="p-6 rounded-xl bg-white border border-slate-200/90 dark:bg-[#161B22] dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {isJa ? "営業意図シグナル抽出" : isVi ? "Tín hiệu bằng sáng chế & R&D" : "Intent Signals"}
                  </span>
                  <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <span className="text-3xl sm:text-4xl font-extrabold text-amber-600 dark:text-amber-400 font-mono tracking-tight">
                    {(stats.signalPatent).toLocaleString()}+
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                    {isJa ? "特許・求人・助成金・公共入札の購買意欲を可視化" : isVi ? "Tuyển dụng, trợ cấp, đấu thầu, bằng sáng chế" : "Patents, hiring, grants, and public bids"}
                  </p>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="p-6 rounded-xl bg-white border border-slate-200/90 dark:bg-[#161B22] dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {isJa ? "フォーム営業 開封実績" : isVi ? "Tỷ lệ mở Form tiếp cận" : "Outreach Open Rate"}
                  </span>
                  <Send className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <span className="text-3xl sm:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
                    50% 〜 90%
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                    {isJa ? "決裁権者・担当者への直接届く高反響アプローチ" : isVi ? "Tiếp cận trực tiếp lãnh đạo, vượt trội email lạnh" : "Executive direct read rates, 5x higher than cold email"}
                  </p>
                </div>
              </div>
            </div>

            {/* Official Source Footnote */}
            <div className="text-center mt-6">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {isJa 
                  ? "※ データソース: 国税庁法人番号公表サイト、法務省登記所データ、経済産業省gBizINFO、厚生労働省、特許庁の公的オープンデータ"
                  : isVi 
                  ? "※ Nguồn dữ liệu: Dữ liệu mở chính thức từ Quốc thuế, Bộ Tư pháp, METI gBizINFO, Bộ Y tế Lao động và Cục Sáng chế Nhật Bản"
                  : "※ Sources: Official public open data from NTA, Ministry of Justice, METI gBizINFO, and JPO"}
              </span>
            </div>
          </div>
        </section>

        {/* ========================================================
            3. PARTNER MARQUEE SLIDER
            ======================================================== */}
        {partners && partners.length > 0 && (
          <section className="py-10 bg-slate-50/70 dark:bg-[#0D1117] border-b border-slate-200/80 dark:border-slate-800 overflow-hidden relative">
            <div className="max-w-4xl mx-auto mb-6 text-center px-4">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isJa ? "導入企業・活用パートナー" : isVi ? "Khách hàng & Đối tác doanh nghiệp" : "Trusted by B2B Teams"}
              </span>
            </div>

            {/* Marquee Row */}
            <div className="relative w-full flex flex-col gap-4 overflow-hidden py-1">
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-50 dark:from-[#0D1117] to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-50 dark:from-[#0D1117] to-transparent z-10 pointer-events-none" />

              <div className="flex gap-12 custom-marquee-scroll whitespace-nowrap">
                {[...row1Partners, ...row1Partners].map((partner, index) => (
                  <div
                    key={`${partner.user_email}-row1-${index}`}
                    className="inline-flex items-center select-none opacity-60 hover:opacity-100 transition-opacity duration-200 shrink-0"
                  >
                    {(!partner.user_email.startsWith("mock_") && partner.logo_url && !partner.logo_url.startsWith("MOCK_SVG_")) ? (
                      <div className="h-7 max-w-[130px] flex items-center justify-center">
                        <img
                          src={partner.logo_url}
                          alt={partner.billing_name || "Partner Logo"}
                          className="max-h-full max-w-full object-contain grayscale hover:grayscale-0 transition-all dark:brightness-200"
                        />
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors tracking-wide">
                        {partner.billing_name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================
            4. THE 5 CORE PILLARS (Tất cả tính năng mới cốt lõi)
            ======================================================== */}
        <section id="features" className="py-20 bg-white dark:bg-[#0D1117] border-b border-slate-200/90 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="b2b-kicker mb-3">
                <Target className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                <span>{isJa ? "プラットフォーム主要機能" : isVi ? "5 Trụ cột tính năng toàn diện" : "Platform Capabilities"}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
                {isJa 
                  ? "B2B新規開拓に必要なすべてを、ひとつの画面に。" 
                  : isVi 
                  ? "Mọi công cụ phát triển khách hàng B2B hội tụ trong một nền tảng" 
                  : "Everything You Need for B2B Pipeline Growth in One Place"}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
                {isJa
                  ? "リストの抽出から、意図シグナルの分析、案件管理、自動アプローチまで。営業チームの生産性を劇的に引き上げる5つのソリューション。"
                  : isVi
                  ? "Từ lọc tệp khách hàng tiềm năng, phân tích tài chính, quản lý phễu đàm phán đến tự động gửi Form tiếp cận hàng nghìn doanh nghiệp."
                  : "From list extraction and intent signals to pipeline management and automated outreach, fully integrated."}
              </p>
            </div>

            {/* 5 Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {/* Pillar 1: 5M Company Database */}
              <div className="b2b-card p-6 flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center mb-4 border border-blue-200/70 dark:border-blue-800">
                    <Database className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                    {isJa ? "1. 500万社 企業データベース" : isVi ? "1. Cơ sở dữ liệu 5 triệu doanh nghiệp" : "1. 5M+ Verified Database"}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {isJa
                      ? "47都道府県、市区町村、JSIC全産業コード、資本金、従業員規模、設立年など、精密な絞り込みが可能。ノイズのない高確度リストを即座に生成します。"
                      : isVi
                      ? "Tìm kiếm chi tiết theo 47 tỉnh thành, quận huyện, ngành nghề chuẩn JSIC, vốn điều lệ, quy mô nhân sự, năm thành lập để tạo tệp khách hàng chính xác."
                      : "Filter by 47 prefectures, cities, JSIC industry codes, capital, employee counts, and establishment year for targeted lists."}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-bold text-[#1B4F8A] dark:text-blue-400">
                  <Link href={`/${locale}/search`} className="inline-flex items-center gap-1 hover:underline">
                    <span>{isJa ? "絞り込み検索を試す" : isVi ? "Thử nghiệm bộ lọc tìm kiếm" : "Try Search Filters"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Pillar 2: Automated Form Outreach (Featured Highlight) */}
              <div className="b2b-card p-6 flex flex-col justify-between group border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-50/20 to-white dark:from-indigo-950/20 dark:to-[#161B22]">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/70 dark:border-indigo-800">
                      <Send className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      NEW FEATURE
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                    <span>{isJa ? "2. セルフ型フォーム自動営業" : isVi ? "2. Gửi Form tự động (Self-serve)" : "2. Automated Form Outreach"}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {isJa
                      ? "絞り込んだターゲット企業のWebフォームへ自動配信。AIが「営業お断り」サイトを自動検知して除外。開封率50〜90%で決裁権者へ直接リーチし、送信URLログをCSVで完全納品。"
                      : isVi
                      ? "Gửi thông điệp tự động vào form liên hệ của doanh nghiệp. AI tự lọc bỏ trang web cấm quảng cáo, tỷ lệ mở 50%-90%, xuất báo cáo CSV chi tiết thời gian và URL gửi thành công."
                      : "Automated delivery to verified company inquiry forms. AI automatically detects and excludes anti-sales sites. 50-90% read rates with live URL delivery CSV logs."}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <Link href={`/${locale}/form-marketing`} className="inline-flex items-center gap-1 hover:underline">
                    <span>{isJa ? "フォーム営業の仕組みを見る" : isVi ? "Khám phá chi tiết giải pháp" : "Learn How It Works"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Pillar 3: Corporate Signals & Financials */}
              <div className="b2b-card p-6 flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 flex items-center justify-center mb-4 border border-amber-200/70 dark:border-amber-800">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                    {isJa ? "3. 購買意図シグナル・財務3期分析" : isVi ? "3. Tín hiệu tăng trưởng & Tài chính 3 năm" : "3. Intent Signals & Financials"}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {isJa
                      ? "求人活動、補助金・助成金の採択実績、公共入札落札、特許取得などの動態データを可視化。売上高・純利益の推移と合わせて「今、投資意欲の高い企業」を特定します。"
                      : isVi
                      ? "Dữ liệu thời gian thực về tuyển dụng, nhận trợ cấp, đấu thầu công, bằng sáng chế và doanh thu 3 năm giúp xác định ngay doanh nghiệp đang có nhu cầu chi tiêu ngân sách."
                      : "Track live intent signals: active hiring, government subsidy grants, public bidding wins, patents, and 3-year revenue trends."}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Link href={`/${locale}/search?hiring=true`} className="inline-flex items-center gap-1 hover:underline">
                    <span>{isJa ? "シグナル抽出条件を見る" : isVi ? "Xem các bộ lọc tín hiệu" : "Explore Signal Filters"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Pillar 4: Kanban CRM & MyList */}
              <div className="b2b-card p-6 flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 flex items-center justify-center mb-4 border border-purple-200/70 dark:border-purple-800">
                    <Kanban className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                    {isJa ? "4. カンバン進捗管理 & マイリスト" : isVi ? "4. Quản lý phễu Kanban CRM & MyList" : "4. Kanban Pipeline & MyList"}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {isJa
                      ? "気になる企業をワンクリックでマイリストに保存。「未連絡・連絡済み・商談中・成約」の4段階カンバンボードで、高額なSFAを導入せずともチームで営業案件を進捗管理できます。"
                      : isVi
                      ? "Lưu danh sách doanh nghiệp tiềm năng và quản lý quy trình tiếp cận 4 bước: Chưa liên hệ, Đã liên hệ, Đang đàm phán, Thành công mà không cần mua phần mềm CRM đắt đỏ."
                      : "Save target companies to MyList and manage deals across 4 visual stages: Uncontacted, Contacted, In Progress, and Closed."}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-bold text-purple-600 dark:text-purple-400">
                  <Link href={`/${locale}/dashboard`} className="inline-flex items-center gap-1 hover:underline">
                    <span>{isJa ? "ダッシュボードを開く" : isVi ? "Mở Dashboard quản lý" : "Open Dashboard"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Pillar 5: CSV Bulk Export & Quota */}
              <div className="b2b-card p-6 flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-200/70 dark:border-emerald-800">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                    {isJa ? "5. CSV一括出力 & SFA連携" : isVi ? "5. Xuất dữ liệu CSV hàng loạt & Tích hợp" : "5. Bulk CSV Export & SFA Ready"}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {isJa
                      ? "絞り込んだ企業リストを、電話番号・メールアドレス・代表者名・WebサイトURL付きで一括CSV出力。Salesforce、HubSpot、kintoneなどのSFA/CRMへ即日インポート可能です。"
                      : isVi
                      ? "Xuất file CSV chứa đầy đủ số điện thoại, email, tên người đại diện, URL website để nạp thẳng vào Salesforce, HubSpot, kintone hoặc chạy quảng cáo B2B."
                      : "Export filtered lists with phones, emails, executive names, and URLs. Formatted for instant import into Salesforce, HubSpot, and Excel."}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <Link href={`/${locale}/pricing`} className="inline-flex items-center gap-1 hover:underline">
                    <span>{isJa ? "ダウンロード容量・料金表" : isVi ? "Xem hạn ngạch tải CSV" : "Check Export Quotas"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Pillar 6: Anti-Spam Compliance */}
              <div className="b2b-card p-6 flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700">
                    <ShieldCheck className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                    {isJa ? "6. 法令遵守 & AIクレーム除外" : isVi ? "6. Tuân thủ Pháp lý & Tránh khiếu nại" : "6. Strict Compliance & AI Filtering"}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {isJa
                      ? "特定電子メール法および関係ガイドラインに準拠。Webフォームの「セールスお断り」「特定目的以外の送信禁止」免責事項をAIが事前検知し、トラブルリスクをゼロへ近づけます。"
                      : isVi
                      ? "Tuân thủ chặt chẽ Đạo luật Thư điện tử Đặc biệt của Nhật Bản. AI tự phát hiện điều khoản từ chối chào hàng trên form để bảo vệ uy tín thương hiệu của bạn."
                      : "Strictly compliant with Japanese Electronic Messaging laws. AI automatically screens out contact pages that prohibit commercial solicitations."}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                  <Link href={`/${locale}/tokushoho`} className="inline-flex items-center gap-1 hover:underline">
                    <span>{isJa ? "法令遵守ポリシー" : isVi ? "Chính sách pháp lý" : "Compliance Policy"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            5. WORKFLOW: 3-STEP IMPLEMENTATION (Quy trình 3 bước)
            ======================================================== */}
        <section className="py-20 bg-slate-50 dark:bg-[#0B0F17] border-b border-slate-200/90 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="b2b-kicker mb-3">
                <Clock className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                <span>{isJa ? "導入は最短5分" : isVi ? "Quy trình 3 bước nhanh gọn" : "3-Step Workflow"}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
                {isJa ? "最短3ステップで、新規商談アプローチを開始" : isVi ? "Triển khai tiếp cận khách hàng B2B chỉ sau 3 bước" : "Launch Outreach in 3 Simple Steps"}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {isJa ? "面倒な名簿収集や手作業のフォーム送信から営業チームを解放します。" : isVi ? "Giải phóng đội ngũ kinh doanh khỏi việc gõ từng form thủ công." : "Save your sales team from hours of manual list gathering and form submission."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className="b2b-card p-6 relative">
                <div className="w-8 h-8 rounded-lg bg-[#1B4F8A] text-white font-extrabold text-sm flex items-center justify-center mb-4">
                  01
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {isJa ? "条件指定でターゲット抽出" : isVi ? "Bước 1: Lọc tệp doanh nghiệp" : "Step 1: Precision Filter"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isJa
                    ? "地域、業界、資本金、そして「お問い合わせフォームあり」「求人活動中」などのシグナルで、今アプローチすべき企業をピンポイント抽出。"
                    : isVi
                    ? "Chọn khu vực, ngành nghề và tích chọn 'Có biểu mẫu liên hệ' hoặc 'Đang tuyển dụng' để lọc đúng tệp doanh nghiệp tiềm năng nhất."
                    : "Filter companies by prefecture, industry, capital, and active signals like 'Contact Form' and 'Hiring'."}
                </p>
              </div>

              {/* Step 2 */}
              <div className="b2b-card p-6 relative">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center mb-4">
                  02
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {isJa ? "文面作成 & 配信件数の指定" : isVi ? "Bước 2: Soạn nội dung & Số lượng" : "Step 2: Draft & Volume"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isJa
                    ? "業種別の高反響テンプレートを活用し、敬語と訴求文を設定。送信したい件数（100件〜）を指定してキャンペーンを下書き保存または即時送信。"
                    : isVi
                    ? "Dùng các mẫu thư ngỏ chuẩn kính ngữ tiếng Nhật, cài đặt tiêu đề và nội dung chào hàng, chọn số lượng form cần gửi (từ 100 form)."
                    : "Select pre-built Keigo templates, customize your pitch, and choose target volume (100+ forms)."}
                </p>
              </div>

              {/* Step 3 */}
              <div className="b2b-card p-6 relative">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center mb-4">
                  03
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {isJa ? "自動配信 & レポート確認" : isVi ? "Bước 3: Tự động gửi & Nhận báo cáo" : "Step 3: Auto-Delivery & Logs"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isJa
                    ? "AIエンジンが営業お断りサイトを除外しつつ自動配信。送信完了後、送信先URLと日時の完全CSVログをダウンロードして反響を確認。"
                    : isVi
                    ? "Hệ thống AI tự động xử lý gửi an toàn. Sau khi hoàn thành, bạn tải về file log CSV chứa toàn bộ URL và thời gian đã gửi để theo dõi."
                    : "AI handles automated delivery while skipping disclaimer forms. Download full URL delivery CSV logs to track replies."}
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link
                href={`/${locale}/search`}
                className="b2b-btn-primary px-8 py-3.5 text-sm"
              >
                <span>{isJa ? "まずは条件を指定して企業を探す" : isVi ? "Bắt đầu lọc danh sách doanh nghiệp ngay" : "Start Filtering Companies Now"}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================
            6. TRANSPARENT PRICING PREVIEW (Minh bạch chi phí)
            ======================================================== */}
        <section id="pricing" className="py-20 bg-white dark:bg-[#0D1117] border-b border-slate-200/90 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="b2b-kicker mb-3">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{isJa ? "明瞭な料金体系" : isVi ? "Bảng giá minh bạch" : "Clear Pricing Plans"}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
                {isJa ? "事業規模に応じた柔軟な料金プラン" : isVi ? "Lựa chọn gói cước phù hợp quy mô doanh nghiệp" : "Flexible Plans Built for Your Scale"}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {isJa ? "初期費用0円・契約期間の縛りなし。必要な機能と容量に合わせてお選びいただけます。" : isVi ? "Không phí khởi tạo, hủy bất cứ lúc nào, thanh toán an toàn qua Stripe." : "No setup fees, cancel anytime, secure checkout via Stripe."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {/* Free Plan */}
              <div className="b2b-card p-6 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">FREE</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mb-4">
                    ¥0 <span className="text-xs font-normal text-slate-500">/ 永久無料</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
                    {isJa ? "基本企業情報の閲覧・簡易検索をお試しされたい個人・小規模チーム向け" : isVi ? "Dành cho cá nhân trải nghiệm tra cứu dữ liệu doanh nghiệp cơ bản" : "For basic lookups and trying out company search"}
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-350 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{isJa ? "全国500万社の基本情報検索" : isVi ? "Tìm kiếm cơ bản 5 triệu cty" : "Basic 5M search"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{isJa ? "CSV出力 50件 / 月" : isVi ? "Xuất CSV: 50 dòng/tháng" : "50 CSV rows / month"}</span>
                    </li>
                    <li className="flex items-center gap-2 text-slate-400">
                      <span className="w-4 text-center">—</span>
                      <span>{isJa ? "連絡先フィルター（PRO限定）" : isVi ? "Bộ lọc liên hệ (Cần PRO)" : "Contact filters (PRO only)"}</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href={`/${locale}/search`}
                  className="b2b-btn-secondary w-full"
                >
                  {isJa ? "無料で始める" : isVi ? "Bắt đầu miễn phí" : "Start Free"}
                </Link>
              </div>

              {/* PRO Plan (Recommended) */}
              <div className="b2b-card p-6 flex flex-col justify-between border-2 border-[#1B4F8A] dark:border-blue-500 relative shadow-md">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1B4F8A] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  {isJa ? "一番人気 / おすすめ" : isVi ? "Phổ biến nhất" : "Most Popular"}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider mb-2">PRO</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mb-4">
                    ¥9,800 <span className="text-xs font-normal text-slate-500">/ 月 (税込)</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
                    {isJa ? "「連絡先情報の有無」の全解除、求人・助成金シグナル、CSV大量出力、フォーム営業の全連携" : isVi ? "Mở khóa toàn bộ kênh liên lạc (Form, Email, Phone), tín hiệu tuyển dụng, gửi form tự động" : "Unlock all contact filters, intent signals, bulk CSV, and automated form campaigns"}
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-350 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{isJa ? "連絡先情報（フォーム・メール・電話）全アンロック" : isVi ? "Mở khóa Form, Email, SĐT, Fax" : "Full contact presence unlocked"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{isJa ? "CSV出力 5,000件 / 月" : isVi ? "Xuất CSV: 5.000 dòng/tháng" : "5,000 CSV rows / month"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{isJa ? "フォーム営業（自動配信）利用権限" : isVi ? "Quyền chạy chiến dịch Gửi Form" : "Automated Form Outreach access"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{isJa ? "カンバンCRM & マイリスト無制限" : isVi ? "Kanban CRM & MyList không giới hạn" : "Unlimited Kanban & MyList"}</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href={`/${locale}/pricing`}
                  className="b2b-btn-primary w-full"
                >
                  {isJa ? "Proプランにアップグレード" : isVi ? "Nâng cấp gói PRO ngay" : "Upgrade to PRO"}
                </Link>
              </div>

              {/* Form Outreach Add-on Wallet */}
              <div className="b2b-card p-6 flex flex-col justify-between bg-gradient-to-b from-indigo-50/30 to-white dark:from-indigo-950/20 dark:to-[#161B22]">
                <div>
                  <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-2">
                    {isJa ? "フォーム営業クレジット" : isVi ? "Tín dụng gửi Form" : "Outreach Credits"}
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mb-4">
                    1通 ¥15〜 <span className="text-xs font-normal text-slate-500">/ 従量課金</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
                    {isJa ? "必要な送信件数に応じて都度チャージ。月額固定費なし、有効期限なしで柔軟にアプローチ" : isVi ? "Nạp credits gửi form theo nhu cầu, không hết hạn, khấu trừ theo số lượng gửi thực tế" : "Pay-as-you-go credits for form outreach. No expiration, scalable volume"}
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-350 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{isJa ? "AI営業お断り自動除外機能込み" : isVi ? "Bao gồm AI lọc web cấm quảng cáo" : "AI anti-spam auto exclusion"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{isJa ? "送信日時・URLのCSVログ完全納品" : isVi ? "Báo cáo CSV thời gian & URL gửi" : "Full timestamp & URL CSV logs"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{isJa ? "最低100件〜 大量配信対応" : isVi ? "Tối thiểu từ 100 form" : "From 100 forms up to 50k"}</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href={`/${locale}/pricing?tab=form`}
                  className="b2b-btn-secondary w-full border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                >
                  {isJa ? "配信枠の料金・購入" : isVi ? "Bảng giá gói Form Credits" : "View Credit Packs"}
                </Link>
              </div>
            </div>

            <div className="text-center">
              <Link
                href={`/${locale}/pricing`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline"
              >
                <span>{isJa ? "Enterpriseプラン・年払い割引などの全詳細を見る" : isVi ? "Xem bảng so sánh chi tiết và gói Enterprise" : "View full feature matrix and annual discounts"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================
            7. FAQ (Câu hỏi thường gặp B2B)
            ======================================================== */}
        <section className="py-20 bg-slate-50 dark:bg-[#0B0F17] border-b border-slate-200/90 dark:border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <div className="b2b-kicker mb-3">
                <HelpCircle className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                <span>{isJa ? "FAQ" : isVi ? "Hỏi đáp" : "FAQ"}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                {isJa ? "よくあるご質問" : isVi ? "Câu hỏi thường gặp" : "Frequently Asked Questions"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {isJa ? "ご不明な点がございましたらお気軽にお問い合わせください。" : isVi ? "Các thắc mắc phổ biến về dữ liệu và cơ chế gửi form." : "Common questions about our database and outreach automation."}
              </p>
            </div>

            <div className="space-y-4">
              {/* Q1 */}
              <div className="b2b-card p-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="text-[#1B4F8A] dark:text-blue-400 font-mono font-bold">Q.</span>
                  <span>{isJa ? "データの更新頻度と出典について教えてください。" : isVi ? "Dữ liệu được cập nhật từ đâu và tần suất thế nào?" : "Where is the data sourced and how often is it updated?"}</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
                  {isJa
                    ? "国税庁の法人番号公表サイト、法務省、経済産業省のgBizINFOなどの公的オープンデータをベースに、週次・月次で更新しています。連絡先情報（電話・Webフォーム・メール）も独自のクローラーにより常時鮮度を保っています。"
                    : isVi
                    ? "Dữ liệu được đồng bộ từ Cổng thông tin Quốc thuế, Bộ Tư pháp, METI gBizINFO hàng tuần. Thông tin kênh liên hệ (Web form, phone, email) được bot rà quét cập nhật liên tục."
                    : "Sourced from the National Tax Agency, Ministry of Justice, and METI gBizINFO, updated weekly and monthly."}
                </p>
              </div>

              {/* Q2 */}
              <div className="b2b-card p-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="text-[#1B4F8A] dark:text-blue-400 font-mono font-bold">Q.</span>
                  <span>{isJa ? "フォーム営業で苦情やクレームが来る心配はありませんか？" : isVi ? "Gửi Form tự động có rủi ro bị khiếu nại không?" : "Are there risks of spam complaints with automated form outreach?"}</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
                  {isJa
                    ? "当システムはAIにより、Webサイト上の「営業お断り」「特定目的以外の送信禁止」といった免責事項を自動検出し、該当企業への送信を自動でスキップします。また、日本のビジネスマナー・敬語に準拠した文面設定により、クレーム発生率を極めて低く抑えています。"
                    : isVi
                    ? "Hệ thống tích hợp AI tự động quét và bỏ qua các website có ghi chú 'Cấm chào hàng/Cấm quảng cáo'. Ngoài ra văn phong sử dụng chuẩn kính ngữ Keigo giúp tỷ lệ phàn nàn giảm xuống mức tối thiểu."
                    : "Our AI engine automatically detects and skips websites that specify 'No commercial solicitations', keeping risk minimal."}
                </p>
              </div>

              {/* Q3 */}
              <div className="b2b-card p-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="text-[#1B4F8A] dark:text-blue-400 font-mono font-bold">Q.</span>
                  <span>{isJa ? "どのような業種・ターゲットにアプローチできますか？" : isVi ? "Có thể tiếp cận những ngành nghề và đối tượng nào?" : "Which industries and targets can we reach?"}</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
                  {isJa
                    ? "IT・通信、製造、建設、不動産、医療、飲食、士業など、日本標準産業分類（JSIC）の全業種に対応しています。都道府県や市区町村別の絞り込みに加え、「資本金1,000万円以上」「求人中」などの条件を掛け合わせることで、貴社に最適なターゲットを抽出できます。"
                    : isVi
                    ? "Phủ khắp toàn bộ các ngành như IT, sản xuất, xây dựng, bất động sản, y tế, dịch vụ... Có thể kết hợp lọc địa lý, vốn điều lệ và các tín hiệu tuyển dụng."
                    : "Covers all JSIC industries nationwide with cross-filtering by capital, geography, and intent signals."}
                </p>
              </div>

              {/* Q4 */}
              <div className="b2b-card p-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="text-[#1B4F8A] dark:text-blue-400 font-mono font-bold">Q.</span>
                  <span>{isJa ? "無料会員でもどこまで利用できますか？" : isVi ? "Tài khoản miễn phí có thể làm được những gì?" : "What can free accounts do?"}</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
                  {isJa
                    ? "無料登録を行うだけで、全国500万社の基本情報（社名、所在地、業種、法人番号）の検索および月50件までのCSVダウンロードが可能です。連絡先フィルター（フォーム・メール）や大量CSV出力、フォーム自動営業をご利用いただく場合はProプラン以上をご利用ください。"
                    : isVi
                    ? "Đăng ký miễn phí có thể tìm kiếm dữ liệu cơ bản của 5 triệu cty và xuất 50 dòng CSV/tháng. Để dùng bộ lọc kênh liên lạc và gửi Form tự động, bạn có thể nâng cấp Pro bất kỳ lúc nào."
                    : "Free accounts can search all 5M companies and export up to 50 rows per month. Upgrade to PRO to unlock contact filters and form outreach."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            8. FINAL CTA BANNER
            ======================================================== */}
        <section className="py-20 bg-white dark:bg-[#0D1117]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl p-8 sm:p-12 bg-gradient-to-br from-[#163A5F] via-[#1B4F8A] to-[#122F53] text-white text-center shadow-lg relative overflow-hidden">
              {/* Subtle light accents */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-4 relative z-10 leading-snug">
                {isJa 
                  ? "今すぐ、確度の高い見込み企業を見つけましょう" 
                  : isVi 
                  ? "Bắt đầu tiếp cận tệp doanh nghiệp tiềm năng ngay hôm nay" 
                  : "Start Targeting High-Intent B2B Prospects Today"}
              </h2>
              <p className="text-sm sm:text-base text-blue-100/90 max-w-2xl mx-auto mb-8 relative z-10 font-normal">
                {isJa
                  ? "クレジットカード登録不要・初期費用0円。無料会員登録ですぐにデータベースの検索と営業リスト作成を体験いただけます。"
                  : isVi
                  ? "Không cần thẻ tín dụng, không phí khởi tạo. Đăng ký tài khoản miễn phí để trải nghiệm tìm kiếm và tạo danh sách khách hàng ngay."
                  : "No credit card required. Free registration gives immediate access to explore 5 million companies and start building pipelines."}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 relative z-10">
                <Link
                  href={`/${locale}/search`}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-lg font-bold text-xs sm:text-sm text-[#1B4F8A] bg-white hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Search className="w-4 h-4 text-[#1B4F8A]" />
                  <span>{isJa ? "まずは無料で企業を検索する" : isVi ? "Tìm kiếm doanh nghiệp miễn phí" : "Search Companies Free"}</span>
                  <ArrowRight className="w-4 h-4 text-[#1B4F8A]" />
                </Link>
                <Link
                  href={`/${locale}/form-marketing`}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-lg font-bold text-xs sm:text-sm text-white bg-white/10 hover:bg-white/20 border border-white/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isJa ? "自動フォーム営業について詳しく" : isVi ? "Tìm hiểu dịch vụ gửi Form tự động" : "Explore Form Outreach"}</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Global Sleek Footer */}
      <Footer />
    </div>
  );
}
