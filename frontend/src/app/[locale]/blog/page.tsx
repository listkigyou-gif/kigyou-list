import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getBlogPosts } from "@/lib/db";
import { ChevronRight, Calendar, BookOpen, Clock, ArrowRight } from "lucide-react";

export const revalidate = 3600; // Cache blog index for 1 hour

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; type?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const search = await searchParams;
  const locale = resolvedParams.locale || 'ja';
  const pageNum = parseInt(search.page || "1", 10);
  const type = search.type || "all";
  
  let canonicalPath = `/${locale}/blog`;
  const queryParams: string[] = [];
  if (type !== "all") queryParams.push(`type=${type}`);
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
    desc = "Kigyou-listが提供する、日本全国 of 企業データを活用した最新の業界分析、企業ランキング、および営業アプローチ戦略のレポート一覧です。";
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
  const limit = 12;
  const offset = (currentPage - 1) * limit;

  // Fetch all posts to perform in-memory categorization, counting, and pagination
  const allPosts = await getBlogPosts(1000, 0, locale);

  const guidesCategories = [
    // VI
    "Hướng dẫn Bán hàng B2B", "Thành lập Doanh nghiệp", "Dữ liệu Doanh nghiệp", "Tín hiệu Thị trường",
    // EN
    "B2B Sales Guide", "Business Setup", "Corporate Data", "Market Signals",
    // JA
    "営業ノウハウ", "営業ノウ5ウ", "カオスマップ", "入札・企業調査", "補助金・助成金"
  ];
  
  const getPostType = (category: string): 'guides' | 'reports' => {
    return guidesCategories.includes(category) ? 'guides' : 'reports';
  };

  const totalCountAll = allPosts.length;
  const totalCountGuides = allPosts.filter(p => getPostType(p.category) === 'guides').length;
  const totalCountReports = allPosts.filter(p => getPostType(p.category) === 'reports').length;

  const filteredPosts = allPosts.filter(post => {
    if (activeType === 'guides') return getPostType(post.category) === 'guides';
    if (activeType === 'reports') return getPostType(post.category) === 'reports';
    return true;
  });

  const totalCount = filteredPosts.length;
  const totalPages = Math.ceil(totalCount / limit);
  const paginatedPosts = filteredPosts.slice(offset, offset + limit);

  const d = locale === 'vi' ? {
    home: "Trang chủ",
    blog: "Blog",
    heroTitle: "Báo cáo ngành & Chiến lược tiếp cận",
    heroDesc: "Các bài viết phân tích chuyên sâu được trích xuất từ cơ sở dữ liệu hơn 5 triệu doanh nghiệp Nhật Bản hoạt động sôi nổi. Tìm hiểu về các doanh nghiệp tiêu biểu và cách tiếp cận bán hàng hiệu quả.",
    emptyTitle: "Không tìm thấy bài viết nào",
    emptyDesc: "Chúng tôi đang biên soạn các bài viết phân tích ngành mới nhất. Vui lòng quay lại sau.",
    readArticle: "Đọc bài viết",
    prev: "Trước",
    next: "Sau",
    collectionName: "Kigyou-list Blog & Báo cáo phân tích ngành nghề",
    collectionDesc: "Các bài viết phân tích ngành mới nhất, xếp hạng doanh nghiệp và chiến lược tiếp cận bán hàng B2B bằng cơ sở dữ liệu doanh nghiệp Nhật Bản.",
    tabAll: "Tất cả",
    tabGuides: "Bài viết hướng dẫn",
    tabReports: "Báo cáo dữ liệu"
  } : locale === 'en' ? {
    home: "Home",
    blog: "Blog",
    heroTitle: "Industry Reports & Sales Insights",
    heroDesc: "Insights extracted from our database of 5 million active Japanese companies. Learn about representative companies and sales approaches.",
    emptyTitle: "No Articles Found",
    emptyDesc: "We are currently writing new report articles. Please check back later.",
    readArticle: "Read Article",
    prev: "Prev",
    next: "Next",
    collectionName: "Kigyou-list Blog & Industry Reports",
    collectionDesc: "Latest industry analysis, company rankings, and sales approach strategies using our comprehensive Japanese corporate database.",
    tabAll: "All",
    tabGuides: "Guides & How-tos",
    tabReports: "Data Reports"
  } : {
    home: "ホーム",
    blog: "ブログ",
    heroTitle: "業界分析レポート & 営業戦略",
    heroDesc: "全国500万社の企業データベースから抽出したインサイト。地域・業界ごとの代表企業データと効果的なアプローチ法を公開。",
    emptyTitle: "記事が見つかりません",
    emptyDesc: "現在、新しいレポート記事を作成中です。しばらく経ってから再度アクセスしてください。",
    readArticle: "記事を読む",
    prev: "前へ",
    next: "次へ",
    collectionName: "Kigyou-list ブログ・業界分析レポート",
    collectionDesc: "日本全国の企業データを活用した最新の業界分析、企業ランキング、および営業アプローチ戦略のレポート一覧です。",
    tabAll: "すべて",
    tabGuides: "ノウハウ・ガイド",
    tabReports: "データ・レポート"
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

      {/* Hero section */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-indigo-955">
        <div className="max-w-7xl mx-auto text-center flex flex-col items-center gap-4">
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider rounded-full border border-indigo-500/30">
            Insights & Data
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight max-w-3xl leading-tight">
            {d.heroTitle}
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-medium">
            {d.heroDesc}
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-6">
        {/* Visual Breadcrumbs */}
        <nav className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors">{d.home}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200" aria-current="page">{d.blog}</span>
        </nav>

        {/* Category Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800/80 mb-2 overflow-x-auto scrollbar-none gap-2" aria-label="Blog categories">
          {[
            { id: "all", label: d.tabAll, count: totalCountAll },
            { id: "guides", label: d.tabGuides, count: totalCountGuides },
            { id: "reports", label: d.tabReports, count: totalCountReports }
          ].map(tab => {
            const isActive = activeType === tab.id;
            return (
              <Link
                key={tab.id}
                href={`/${locale}/blog?type=${tab.id}`}
                className={`py-3 px-4 text-xs font-bold transition-all relative border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? "border-primary text-primary dark:border-indigo-400 dark:text-indigo-400 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  isActive 
                    ? "bg-indigo-50 text-primary dark:bg-indigo-500/20 dark:text-indigo-400" 
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400"
                }`}>
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>

        {paginatedPosts.length === 0 ? (
          <div className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-16 text-center shadow-sm flex flex-col items-center gap-4 justify-center">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 animate-pulse" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{d.emptyTitle}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {d.emptyDesc}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {/* Grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {paginatedPosts.map((post) => (
                <article
                  key={post.id}
                  className="group bg-white border border-slate-200/80 dark:bg-[#1C2128] dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full"
                >
                  <div className="p-6 sm:p-7 flex flex-col gap-4 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 text-2xs font-extrabold rounded-md uppercase tracking-wider">
                        {post.category}
                      </span>
                      <div className="flex items-center gap-1 text-slate-455 dark:text-slate-500 text-2xs font-semibold">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <time dateTime={post.published_at}>
                          {post.published_at.replace(/-/g, "/")}
                        </time>
                      </div>
                    </div>

                    <h2 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-primary dark:text-white dark:group-hover:text-secondary tracking-tight transition-colors line-clamp-2 leading-snug">
                      <Link href={`/${locale}/blog/${post.slug}`} className="focus:outline-none">
                        {post.title}
                      </Link>
                    </h2>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed flex-1">
                      {post.summary}
                    </p>
                  </div>

                  <Link
                    href={`/${locale}/blog/${post.slug}`}
                    className="px-6 py-4 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between group/link focus:outline-none"
                  >
                    <span className="text-2xs font-black text-slate-655 dark:text-slate-400 group-hover/link:text-primary dark:group-hover/link:text-secondary transition-colors">
                      {d.readArticle}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover/link:text-primary dark:group-hover/link:text-secondary group-hover/link:translate-x-1 transition-all" />
                  </Link>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-1.5 pt-4" aria-label="Pagination">
                {currentPage > 1 && (
                  <Link
                    href={`/${locale}/blog?page=${currentPage - 1}${activeType !== 'all' ? `&type=${activeType}` : ''}`}
                    className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 transition-colors"
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
                      href={`/${locale}/blog?page=${page}${activeType !== 'all' ? `&type=${activeType}` : ''}`}
                      aria-current={isCurrent ? "page" : undefined}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                        isCurrent
                          ? "bg-primary text-white shadow-sm"
                          : "border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-655 dark:text-slate-350"
                      }`}
                    >
                      {page}
                    </Link>
                  );
                })}

                {currentPage < totalPages && (
                  <Link
                    href={`/${locale}/blog?page=${currentPage + 1}${activeType !== 'all' ? `&type=${activeType}` : ''}`}
                    className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 transition-colors"
                  >
                    {d.next}
                  </Link>
                )}
              </nav>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
