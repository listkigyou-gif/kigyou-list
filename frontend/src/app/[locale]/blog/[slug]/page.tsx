import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/db";
import { MarkdownRenderer } from "@/lib/markdown";
import { ChevronRight, Calendar, Tag, BookOpen, Search, ArrowLeft, Download, Award, ShieldCheck } from "lucide-react";

export const revalidate = 3600; // Cache articles for 1 hour, ISR enabled

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || 'ja';
  const post = await getBlogPostBySlug(resolvedParams.slug, locale);

  if (!post) {
    return {
      title: locale === 'en' ? "Article Not Found | Kigyou-list" : "記事が見つかりません | Kigyou-list",
    };
  }

  return {
    title: `${post.title} | Kigyou-list ${locale === 'en' ? 'Blog' : 'ブログ'}`,
    description: post.summary,
    alternates: {
      canonical: `/${locale}/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || 'ja';
  const post = await getBlogPostBySlug(resolvedParams.slug, locale);

  if (!post) {
    return notFound();
  }

  // Fetch recent posts to display as related articles (anti-orphan internal linking)
  const allRecentPosts = await getBlogPosts(4, 0, locale);
  const relatedPosts = allRecentPosts.filter(p => p.slug !== post.slug).slice(0, 3);

  const d = locale === 'en' ? {
    home: "Home",
    blog: "Blog",
    author: "Author: Kigyou-list Editorial",
    readingTime: "Reading Time: ~5 mins",
    relatedReports: "Related Industry Reports",
    backToList: "Back to List",
    ctaTitle: "Build High-Quality Lead Lists Instantly",
    ctaDesc: "Filter by JSIC industries, prefectures, capital, and employee sizes, and unlock purchase signals like recruitment, subsidies, and tenders.",
    ctaBtn: "Try Free Company Search",
    dbTitle: "Database Coverage",
    dbCount1Label: "Active Companies",
    dbCount1Val: "Over 5 Million",
    dbCount2Label: "Phone Numbers",
    dbCount2Val: "Over 3 Million",
    dbCount3Label: "Email Addresses",
    dbCount3Val: "Over 800k",
    dbCount4Label: "Financial Reports",
    dbCount4Val: "Over 150k",
    authorOrg: "Kigyou-list Editorial"
  } : {
    home: "ホーム",
    blog: "ブログ",
    author: "著者: Kigyou-list 編集部",
    readingTime: "閲覧時間: 約5分",
    relatedReports: "関連する業界分析レポート",
    backToList: "一覧に戻る",
    ctaTitle: "高品質な営業リストを即時構築",
    ctaDesc: "JSIC産業分類や都道府県、資本金、従業員数による高度な絞り込みに加え、採用・助成金・入札などの購買シグナルでターゲット特定。",
    ctaBtn: "無料で企業検索を試す",
    dbTitle: "データベース収録数",
    dbCount1Label: "全国稼働企業数",
    dbCount1Val: "500万社以上",
    dbCount2Label: "電話番号掲載",
    dbCount2Val: "300万社以上",
    dbCount3Label: "メールアドレス掲載",
    dbCount3Val: "80万社以上",
    dbCount4Label: "財務決算データ",
    dbCount4Val: "15万社以上",
    authorOrg: "Kigyou-list 編集部"
  };

  // Schema Markup JSON-LD for BlogPosting & BreadcrumbList
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
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": `https://kigyoulist.com/${locale}/blog/${post.slug}`
      }
    ]
  };

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.summary,
    "datePublished": post.published_at,
    "dateModified": post.published_at,
    "author": {
      "@type": "Organization",
      "name": d.authorOrg,
      "url": `https://kigyoulist.com/${locale}`
    },
    "publisher": {
      "@type": "Organization",
      "name": "Kigyou-list",
      "logo": {
        "@type": "ImageObject",
        "url": "https://kigyoulist.com/icon.svg"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://kigyoulist.com/${locale}/blog/${post.slug}`
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />

      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-6">
        {/* Visual Breadcrumbs */}
        <nav className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors">{d.home}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <Link href={`/${locale}/blog`} className="hover:text-primary transition-colors">{d.blog}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200 line-clamp-1" aria-current="page">{post.title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Main article body */}
          <article className="w-full lg:flex-1 min-w-0 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-850 rounded-2xl p-4 sm:p-8 md:p-10 shadow-sm">
            {/* Meta header */}
            <div className="flex flex-col gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/80 mb-6">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 text-2xs font-extrabold rounded-md uppercase tracking-wider">
                  {post.category}
                </span>
                <div className="flex items-center gap-1.5 text-slate-455 dark:text-slate-500 text-2xs font-semibold">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <time dateTime={post.published_at}>
                    {post.published_at.replace(/-/g, "/")}
                  </time>
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                {post.title}
              </h1>

              <div className="flex items-center gap-2 text-2xs text-slate-400 font-semibold mt-1">
                <span>{d.author}</span>
                <span>•</span>
                <span>{d.readingTime}</span>
              </div>
            </div>

            {/* Markdown rendered body */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <MarkdownRenderer content={post.content} />
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800/85">
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-6">
                  {d.relatedReports}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedPosts.map((rPost) => (
                    <a
                      key={rPost.id}
                      href={`/${locale}/blog/${rPost.slug}`}
                      className="group flex flex-col gap-2.5 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all shadow-sm"
                    >
                      <span className="px-2 py-0.5 w-fit bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 text-[10px] font-extrabold rounded uppercase tracking-wider">
                        {rPost.category}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-primary dark:text-slate-200 dark:group-hover:text-secondary line-clamp-2 transition-colors leading-snug">
                        {rPost.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-auto flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {rPost.published_at.replace(/-/g, "/")}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Back button */}
            <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800/85">
              <Link
                href={`/${locale}/blog`}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary dark:text-slate-400 dark:hover:text-secondary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {d.backToList}
              </Link>
            </div>
          </article>

          {/* Right Sidebar */}
          <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-6 lg:sticky lg:top-20">
            {/* CTA Box */}
            <div className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-855 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 rounded-xl flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                  {d.ctaTitle}
                </h3>
                <p className="text-2xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {d.ctaDesc}
                </p>
              </div>
              <Link
                href={`/${locale}/search`}
                className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all text-center flex items-center justify-center gap-2 group"
              >
                <span>{d.ctaBtn}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* DB counts / trust box */}
            <div className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-855 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <h4 className="font-black text-xs text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-2">
                {d.dbTitle}
              </h4>
              <ul className="flex flex-col gap-3 text-xs">
                <li className="flex justify-between items-center text-2xs font-semibold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />{d.dbCount1Label}</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{d.dbCount1Val}</span>
                </li>
                <li className="flex justify-between items-center text-2xs font-semibold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />{d.dbCount2Label}</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{d.dbCount2Val}</span>
                </li>
                <li className="flex justify-between items-center text-2xs font-semibold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />{d.dbCount3Label}</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{d.dbCount3Val}</span>
                </li>
                <li className="flex justify-between items-center text-2xs font-semibold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />{d.dbCount4Label}</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{d.dbCount4Val}</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
