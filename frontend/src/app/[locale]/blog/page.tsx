import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getBlogPosts } from "@/lib/db";
import { ChevronRight, Calendar, BookOpen, Clock, ArrowRight, Search, Sparkles } from "lucide-react";

export const revalidate = 3600; // Cache blog index for 1 hour

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; type?: string; q?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const search = await searchParams;
  const locale = resolvedParams.locale || 'ja';
  const pageNum = parseInt(search.page || "1", 10);
  const type = search.type || "all";
  const query = (search.q || "").trim();
  
  let canonicalPath = `/${locale}/blog`;
  const queryParams: string[] = [];
  if (type !== "all") queryParams.push(`type=${type}`);
  if (query) queryParams.push(`q=${encodeURIComponent(query)}`);
  if (pageNum > 1) queryParams.push(`page=${pageNum}`);
  if (queryParams.length > 0) {
    canonicalPath += `?${queryParams.join("&")}`;
  }

  let title = "";
  let desc = "";
  if (locale === 'en') {
    const typeLabel = type === 'guides' ? 'Guides & How-tos' : type === 'reports' ? 'Data Reports' : 'Industry Reports';
    title = pageNum > 1 
      ? `Blog & ${typeLabel} (Page ${pageNum}) | Kigyou-list`
      : `Blog & ${typeLabel} | Kigyou-list`;
    desc = "Latest B2B sales guides, company rankings, and market reports using our Japanese corporate database.";
  } else if (locale === 'vi') {
    const typeLabel = type === 'guides' ? 'Hướng dẫn' : type === 'reports' ? 'Báo cáo dữ liệu' : 'Báo cáo ngành';
    title = pageNum > 1 
      ? `Blog & ${typeLabel} (Trang ${pageNum}) | Kigyou-list`
      : `Blog & ${typeLabel} phân tích doanh nghiệp | Kigyou-list`;
    desc = "Các bài viết hướng dẫn bán hàng B2B, xếp hạng doanh nghiệp và báo cáo phân tích thị trường Nhật Bản.";
  } else {
    const typeLabel = type === 'guides' ? '営業ノウハウ' : type === 'reports' ? 'データレポート' : '業界分析レポート';
    title = pageNum > 1 
      ? `ブログ・${typeLabel} (ページ ${pageNum}) | Kigyou-list`
      : `ブログ・${typeLabel}一覧 | Kigyou-list`;
    desc = "Kigyou-listが提供する、日本全国の企業データを活用した最新の業界分析、企業ランキング、および営業アプローチ戦略のレポート一覧です。";
  }

  return {
    title,
    description: desc,
    alternates: {
      canonical: canonicalPath,
    },
  };
}

export default async function BlogIndexPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || 'ja';
  const search = await searchParams;
  const currentPage = Math.max(1, parseInt(search.page || "1", 10));
  const activeType = search.type || "all";
  const searchQuery = (search.q || "").trim();
  const limit = 12;
  const offset = (currentPage - 1) * limit;

  // Fetch all posts to perform in-memory categorization, counting, filtering and pagination
  const allPosts = await getBlogPosts(1000, 0, locale);

  const guidesCategories = [
    // VI
    "Hướng dẫn Bán hàng B2B", "Thành lập Doanh nghiệp", "Dữ liệu Doanh nghiệp", "Tín hiệu Thị trường",
    // EN
    "B2B Sales Guide", "Business Setup", "Corporate Data", "Market Signals",
    // JA (handle legacy database typo "営業ノウ5ウ")
    "営業ノウハウ", "営業ノウ5ウ", "カオスマップ", "入札・企業調査", "補助金・助成金"
  ];
  
  const formatCategory = (cat: string) => (cat === "営業ノウ5ウ" ? "営業ノウハウ" : cat);
  
  const getPostType = (category: string): 'guides' | 'reports' => {
    return guidesCategories.includes(category) ? 'guides' : 'reports';
  };

  const totalCountAll = allPosts.length;
  const totalCountGuides = allPosts.filter(p => getPostType(p.category) === 'guides').length;
  const totalCountReports = allPosts.filter(p => getPostType(p.category) === 'reports').length;

  const filteredPosts = allPosts.filter(post => {
    // Type filter
    if (activeType === 'guides' && getPostType(post.category) !== 'guides') return false;
    if (activeType === 'reports' && getPostType(post.category) !== 'reports') return false;
    // Keyword search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = post.title.toLowerCase().includes(q);
      const matchSummary = post.summary.toLowerCase().includes(q);
      const matchCategory = post.category.toLowerCase().includes(q);
      if (!matchTitle && !matchSummary && !matchCategory) return false;
    }
    return true;
  });

  const totalCount = filteredPosts.length;
  const totalPages = Math.ceil(totalCount / limit);
  const paginatedPosts = filteredPosts.slice(offset, offset + limit);

  // Distinguish featured post on page 1 when no search query and tab is all
  const hasFeatured = currentPage === 1 && !searchQuery && activeType === 'all' && paginatedPosts.length > 0;
  const featuredPost = hasFeatured ? paginatedPosts[0] : null;
  const gridPosts = hasFeatured ? paginatedPosts.slice(1) : paginatedPosts;

  const d = locale === 'vi' ? {
    home: "Trang chủ",
    blog: "Blog & Báo cáo",
    heroBadge: "KIGYOU-LIST INSIGHTS",
    heroTitle: "Báo cáo ngành & Chiến lược tiếp cận B2B",
    heroDesc: "Kho tri thức và chiến lược phân tích sâu trích xuất từ cơ sở dữ liệu hơn 5 triệu doanh nghiệp Nhật Bản. Giúp bạn định vị đúng đối tác tiềm năng và gia tăng cơ hội hợp tác.",
    searchPlaceholder: "Tìm kiếm bài viết, trợ cấp, kinh nghiệm tiếp cận...",
    searchBtn: "Tìm kiếm",
    featuredBadge: "Báo cáo tiêu điểm",
    allArticlesTitle: "Tất cả bài viết & Phân tích mới nhất",
    readArticle: "Đọc bài viết",
    readingTime: "Khoảng",
    minutes: "phút",
    emptyTitle: "Không tìm thấy bài viết nào",
    emptyDesc: "Thử thay đổi từ khóa hoặc chọn phân loại khác để tìm nội dung phù hợp.",
    clearSearch: "Xóa tìm kiếm",
    prev: "Trước",
    next: "Sau",
    collectionName: "Kigyou-list Blog & Báo cáo phân tích ngành nghề",
    collectionDesc: "Các bài viết phân tích ngành mới nhất, xếp hạng doanh nghiệp và chiến lược tiếp cận bán hàng B2B bằng cơ sở dữ liệu doanh nghiệp Nhật Bản.",
    tabAll: "Tất cả bài viết",
    tabGuides: "Hướng dẫn & Kỹ năng B2B",
    tabReports: "Báo cáo dữ liệu doanh nghiệp",
    ctaBadge: "DỮ LIỆU DOANH NGHIỆP TOÀN NHẬT BẢN",
    ctaTitle: "Mở rộng danh sách khách hàng B2B chất lượng cao ngay hôm nay",
    ctaDesc: "Khám phá hơn 5 triệu hồ sơ doanh nghiệp Nhật Bản với đầy đủ thông tin liên hệ, tín hiệu tuyển dụng và tình hình tài chính.",
    ctaSearchBtn: "Tra cứu doanh nghiệp miễn phí",
    ctaPricingBtn: "Xem bảng giá & Gói cước",
  } : locale === 'en' ? {
    home: "Home",
    blog: "Blog & Insights",
    heroBadge: "KIGYOU-LIST INSIGHTS",
    heroTitle: "Industry Reports & B2B Sales Strategies",
    heroDesc: "Actionable corporate insights extracted from our database of 5 million active Japanese companies. Learn winning sales approaches and industry trends.",
    searchPlaceholder: "Search guides, market trends, subsidies...",
    searchBtn: "Search",
    featuredBadge: "Featured Report",
    allArticlesTitle: "Latest Articles & Analysis",
    readArticle: "Read Article",
    readingTime: "~",
    minutes: "mins",
    emptyTitle: "No Articles Found",
    emptyDesc: "Try adjusting your search query or switching categories to find what you need.",
    clearSearch: "Clear search",
    prev: "Prev",
    next: "Next",
    collectionName: "Kigyou-list Blog & Industry Reports",
    collectionDesc: "Latest industry analysis, company rankings, and sales approach strategies using our comprehensive Japanese corporate database.",
    tabAll: "All Articles",
    tabGuides: "Guides & How-tos",
    tabReports: "Data Reports",
    ctaBadge: "JAPAN CORPORATE DATABASE",
    ctaTitle: "Scale Your B2B Outreach with Verified Corporate Data",
    ctaDesc: "Access 5+ million Japanese company profiles with verified contact details, buying signals, and financial overviews.",
    ctaSearchBtn: "Try Company Search Free",
    ctaPricingBtn: "Explore Pricing Plans",
  } : {
    home: "ホーム",
    blog: "ブログ・業界分析",
    heroBadge: "KIGYOU-LIST INSIGHTS & DATA",
    heroTitle: "業界分析レポート & 営業戦略ノウハウ",
    heroDesc: "全国500万社の企業ビッグデータから抽出した最新インサイト。地域・業界ごとの代表企業動向や、成約率を高める営業アプローチの実務を公開。",
    searchPlaceholder: "キーワードで記事を検索（例: 与信管理、IT導入補助金、営業リスト）...",
    searchBtn: "検索",
    featuredBadge: "注目レポート",
    allArticlesTitle: "新着記事・分析レポート一覧",
    readArticle: "記事を読む",
    readingTime: "約",
    minutes: "分",
    emptyTitle: "該当する記事が見つかりません",
    emptyDesc: "検索キーワードを変更するか、カテゴリータブを切り替えて再度お試しください。",
    clearSearch: "検索をクリア",
    prev: "前へ",
    next: "次へ",
    collectionName: "Kigyou-list ブログ・業界分析レポート",
    collectionDesc: "日本全国の企業データを活用した最新の業界分析、企業ランキング、および営業アプローチ戦略のレポート一覧です。",
    tabAll: "すべての記事",
    tabGuides: "営業ノウハウ・ガイド",
    tabReports: "データ分析・業界レポート",
    ctaBadge: "日本最大級の企業データベース",
    ctaTitle: "500万社以上の企業データで、営業開拓を次のステージへ",
    ctaDesc: "JSIC産業分類や都道府県、資本金、従業員数による精緻なターゲティングと、採用・助成金・入札などの購買シグナルを今すぐ活用。",
    ctaSearchBtn: "無料で企業検索を試す",
    ctaPricingBtn: "料金プラン・機能を見る",
  };

  const getCategoryBadgeClass = (category: string) => {
    if (category.includes("営業") || category.includes("Sales") || category.includes("Bán hàng")) {
      return "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    }
    if (category.includes("補助金") || category.includes("助成金") || category.includes("Subsidy")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    }
    if (category.includes("カオス") || category.includes("Market") || category.includes("Thị trường")) {
      return "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
    }
    if (category.includes("入札") || category.includes("与信") || category.includes("Tín hiệu")) {
      return "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    }
    return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  };

  // Schema Markup JSON-LD for Blog / CollectionPage
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": d.home,
        "item": `https://kigyoulist.com/${locale}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": d.blog,
        "item": `https://kigyoulist.com/${locale}/blog`
      }
    ]
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": d.collectionName,
    "description": d.collectionDesc,
    "url": `https://kigyoulist.com/${locale}/blog`,
    "publisher": {
      "@type": "Organization",
      "name": "Kigyou-list",
      "logo": {
        "@type": "ImageObject",
        "url": "https://kigyoulist.com/icon.svg"
      }
    },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": paginatedPosts.length,
      "itemListElement": paginatedPosts.map((post, idx) => ({
        "@type": "ListItem",
        "position": offset + idx + 1,
        "url": `https://kigyoulist.com/${locale}/blog/${post.slug}`,
        "name": post.title
      }))
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <Header />

      {/* Light & Calm Hero Section */}
      <section className="bg-gradient-to-b from-white via-slate-50/60 to-slate-100/70 border-b border-slate-200/80 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-extrabold uppercase tracking-wider rounded-full shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            {d.heroBadge}
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-[2.6rem] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {d.heroTitle}
          </h1>

          <p className="text-xs sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl font-medium leading-relaxed">
            {d.heroDesc}
          </p>

          {/* Quick Search Bar */}
          <form action={`/${locale}/blog`} method="GET" className="w-full max-w-xl relative mt-2">
            {activeType !== 'all' && <input type="hidden" name="type" value={activeType} />}
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder={d.searchPlaceholder}
              className="w-full pl-11 pr-24 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold rounded-full transition-colors cursor-pointer"
            >
              {d.searchBtn}
            </button>
          </form>
        </div>
      </section>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col gap-8">
        {/* Visual Breadcrumbs */}
        <nav className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
          <Link href={`/${locale}`} className="hover:text-blue-600 transition-colors">{d.home}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200" aria-current="page">{d.blog}</span>
        </nav>

        {/* Filter Bar with Segmented Pills & Search Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2" aria-label="Blog categories">
            {[
              { id: "all", label: d.tabAll, count: totalCountAll },
              { id: "guides", label: d.tabGuides, count: totalCountGuides },
              { id: "reports", label: d.tabReports, count: totalCountReports }
            ].map(tab => {
              const isActive = activeType === tab.id;
              const queryParams = new URLSearchParams();
              if (tab.id !== 'all') queryParams.set('type', tab.id);
              if (searchQuery) queryParams.set('q', searchQuery);
              const href = `/${locale}/blog${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
              return (
                <Link
                  key={tab.id}
                  href={href}
                  className={`py-2 px-4 text-xs font-bold rounded-full transition-all duration-200 flex items-center gap-2 shadow-2xs ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm ring-1 ring-slate-900 dark:bg-blue-600 dark:ring-blue-600"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}>
                    {tab.count}
                  </span>
                </Link>
              );
            })}
          </div>

          {searchQuery && (
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span>検索結果: <strong>"{searchQuery}"</strong> ({filteredPosts.length}件)</span>
              <Link
                href={`/${locale}/blog${activeType !== 'all' ? `?type=${activeType}` : ''}`}
                className="text-blue-600 hover:underline font-semibold ml-1"
              >
                {d.clearSearch}
              </Link>
            </div>
          )}
        </div>

        {paginatedPosts.length === 0 ? (
          <div className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl p-16 text-center shadow-xs flex flex-col items-center gap-4 justify-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">{d.emptyTitle}</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md">
              {d.emptyDesc}
            </p>
            {searchQuery && (
              <Link
                href={`/${locale}/blog`}
                className="mt-2 px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                {d.clearSearch}
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {/* Featured Post Card (Page 1 Top Highlight) */}
            {featuredPost && (
              <section className="relative group bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 shadow-xs hover:shadow-md hover:border-blue-400/80 dark:hover:border-blue-500/50 transition-all duration-300 flex flex-col lg:flex-row gap-6 lg:gap-10 items-start overflow-hidden">
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 text-[11px] font-extrabold rounded-full flex items-center gap-1.5 shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      {d.featuredBadge}
                    </span>
                    <span className={`px-2.5 py-0.5 text-2xs font-extrabold rounded-full border ${getCategoryBadgeClass(featuredPost.category)}`}>
                      {formatCategory(featuredPost.category)}
                    </span>
                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-2xs font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      <time dateTime={featuredPost.published_at}>{featuredPost.published_at.replace(/-/g, "/")}</time>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-2xs font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{d.readingTime} 5{d.minutes}</span>
                    </div>
                  </div>

                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <Link href={`/${locale}/blog/${featuredPost.slug}`}>
                      {featuredPost.title}
                    </Link>
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal line-clamp-3">
                    {featuredPost.summary}
                  </p>

                  <div className="pt-2">
                    <Link
                      href={`/${locale}/blog/${featuredPost.slug}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all group-hover:gap-3"
                    >
                      <span>{d.readArticle}</span>
                      <ArrowRight className="w-4 h-4 transition-transform" />
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {/* Grid Layout for Articles */}
            <section className="flex flex-col gap-6">
              {featuredPost && (
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {d.allArticlesTitle}
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold">{totalCount}件</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gridPosts.map((post) => (
                  <article
                    key={post.id}
                    className="group bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-6 shadow-2xs hover:shadow-md hover:border-blue-400/80 dark:hover:border-blue-500/50 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="flex flex-col gap-3.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 text-2xs font-extrabold rounded-full border ${getCategoryBadgeClass(post.category)}`}>
                          {formatCategory(post.category)}
                        </span>
                        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 text-2xs font-semibold">
                          <Clock className="w-3 h-3" />
                          <span>{d.readingTime} 3{d.minutes}</span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400 tracking-tight transition-colors line-clamp-2 leading-snug">
                        <Link href={`/${locale}/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {post.summary}
                      </p>
                    </div>

                    <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-2xs">
                        <Calendar className="w-3.5 h-3.5" />
                        <time dateTime={post.published_at}>
                          {post.published_at.replace(/-/g, "/")}
                        </time>
                      </div>

                      <Link
                        href={`/${locale}/blog/${post.slug}`}
                        className="inline-flex items-center gap-1 text-2xs font-bold text-blue-600 dark:text-blue-400 group-hover:gap-1.5 transition-all"
                      >
                        <span>{d.readArticle}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Modern Rounded Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-1.5 pt-4" aria-label="Pagination">
                {currentPage > 1 && (
                  <Link
                    href={`/${locale}/blog?page=${currentPage - 1}${activeType !== 'all' ? `&type=${activeType}` : ''}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`}
                    className="p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    {d.prev}
                  </Link>
                )}

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const page = idx + 1;
                  const isCurrent = page === currentPage;
                  return (
                    <Link
                      key={page}
                      href={`/${locale}/blog?page=${page}${activeType !== 'all' ? `&type=${activeType}` : ''}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`}
                      aria-current={isCurrent ? "page" : undefined}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                        isCurrent
                          ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xs font-extrabold"
                          : "border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {page}
                    </Link>
                  );
                })}

                {currentPage < totalPages && (
                  <Link
                    href={`/${locale}/blog?page=${currentPage + 1}${activeType !== 'all' ? `&type=${activeType}` : ''}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`}
                    className="p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    {d.next}
                  </Link>
                )}
              </nav>
            )}
          </div>
        )}
      </main>

      {/* Bottom Conversion Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-500/15 via-transparent to-transparent pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-blue-200 text-xs font-bold border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>{d.ctaBadge}</span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black max-w-2xl leading-tight">
            {d.ctaTitle}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
            {d.ctaDesc}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-2">
            <Link
              href={`/${locale}/search`}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{d.ctaSearchBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 transition-all text-center cursor-pointer"
            >
              {d.ctaPricingBtn}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
