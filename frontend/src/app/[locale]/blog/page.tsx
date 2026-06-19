import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getBlogPosts, getBlogPostsCount } from "@/lib/db";
import { ChevronRight, Calendar, BookOpen, Clock, ArrowRight } from "lucide-react";

export const revalidate = 3600; // Cache blog index for 1 hour

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const search = await searchParams;
  const locale = resolvedParams.locale || 'ja';
  const pageNum = parseInt(search.page || "1", 10);
  
  if (locale === 'en') {
    const title = pageNum > 1 
      ? `Blog & Industry Reports (Page ${pageNum}) | Kigyou-list`
      : "Blog & Industry Reports | Kigyou-list";
    const desc = "Latest industry analysis, company rankings, and sales approach strategies using our comprehensive Japanese corporate database.";
    return {
      title,
      description: desc,
      alternates: {
        canonical: pageNum > 1 ? `/en/blog?page=${pageNum}` : "/en/blog",
      },
    };
  } else {
    const title = pageNum > 1 
      ? `ブログ・業界分析レポート (ページ ${pageNum}) | Kigyou-list`
      : "ブログ・業界分析レポート | Kigyou-list";
    const desc = "Kigyou-listが提供する、日本全国の企業データを活用した最新の業界分析、企業ランキング、および営業アプローチ戦略のレポート一覧です。";
    return {
      title,
      description: desc,
      alternates: {
        canonical: pageNum > 1 ? `/ja/blog?page=${pageNum}` : "/ja/blog",
      },
    };
  }
}

export default async function BlogIndexPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || 'ja';
  const search = await searchParams;
  const currentPage = Math.max(1, parseInt(search.page || "1", 10));
  const limit = 12;
  const offset = (currentPage - 1) * limit;

  const [posts, totalCount] = await Promise.all([
    getBlogPosts(limit, offset, locale),
    getBlogPostsCount(locale)
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  const d = locale === 'en' ? {
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
    collectionDesc: "Latest industry analysis, company rankings, and sales approach strategies using our comprehensive Japanese corporate database."
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
    collectionDesc: "日本全国の企業データを活用した最新の業界分析、企業ランキング、および営業アプローチ戦略 of レポート一覧です。"
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
      "numberOfItems": posts.length,
      "itemListElement": posts.map((post, idx) => ({
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
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-indigo-950">
        <div className="max-w-7xl mx-auto text-center flex flex-col items-center gap-4">
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider rounded-full border border-indigo-500/30">
            Insights & Data
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight max-w-3xl leading-tight">
            {d.heroTitle}
          </h1>
          <p className="text-base sm:text-lg text-slate-355 max-w-2xl font-medium text-slate-300">
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

        {posts.length === 0 ? (
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
              {posts.map((post) => (
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
                    href={`/${locale}/blog?page=${currentPage - 1}`}
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
                      href={`/${locale}/blog?page=${page}`}
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
                    href={`/${locale}/blog?page=${currentPage + 1}`}
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
