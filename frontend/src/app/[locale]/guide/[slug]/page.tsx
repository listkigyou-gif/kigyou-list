import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  getGuideBySlug, 
  getAllGuideSlugs, 
  GUIDE_ARTICLES,
  GuideArticle 
} from "@/lib/guides";
import { 
  BookOpen, Clock, Calendar, ChevronRight, ArrowLeft, ArrowRight, 
  CheckCircle2, AlertTriangle, Sparkles, Copy, FileText, Database, 
  Send, ShieldCheck, HelpCircle, FileSpreadsheet, Building2, Coins, ChevronDown
} from "lucide-react";
import { CopyPromptButton } from "./CopyPromptButton";

export const revalidate = 86400; // Static ISR caching 24h

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllGuideSlugs();
  const locales = ['ja', 'en', 'vi'];
  const params: { locale: string; slug: string }[] = [];
  
  for (const locale of locales) {
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "ja";
  const slug = resolvedParams.slug;
  const article = getGuideBySlug(slug);

  if (!article) {
    return notFound();
  }

  const isEn = locale === "en";
  const isVi = locale === "vi";

  const title = article.title[locale as 'ja'|'en'|'vi'] || article.title.ja;
  const description = article.metaDescription[locale as 'ja'|'en'|'vi'] || article.metaDescription.ja;
  const ogLocale = isEn ? "en_US" : isVi ? "vi_VN" : "ja_JP";

  return {
    title,
    description,
    keywords: article.keywords,
    alternates: {
      canonical: `/${locale}/guide/${slug}`,
      languages: {
        ja: `/ja/guide/${slug}`,
        en: `/en/guide/${slug}`,
        vi: `/vi/guide/${slug}`,
        "x-default": `/ja/guide/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `https://kigyoulist.com/${locale}/guide/${slug}`,
      siteName: "Kigyou-list",
      locale: ogLocale,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author.name],
    },
  };
}

export default async function GuideDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "ja";
  const slug = resolvedParams.slug;
  const article = getGuideBySlug(slug);

  if (!article) {
    notFound();
  }

  const isJa = locale === "ja";
  const isVi = locale === "vi";
  const isEn = !isJa && !isVi;

  const title = article.title[locale as 'ja'|'en'|'vi'] || article.title.ja;
  const desc = article.metaDescription[locale as 'ja'|'en'|'vi'] || article.metaDescription.ja;
  const catLabel = article.categoryLabel[locale as 'ja'|'en'|'vi'] || article.categoryLabel.ja;
  const highlights = article.highlights[locale as 'ja'|'en'|'vi'] || article.highlights.ja;
  const cta = article.cta;

  // Other related articles
  const relatedArticles = GUIDE_ARTICLES.filter(a => a.slug !== article.slug).slice(0, 3);

  // Schema: BreadcrumbList
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": isVi ? "Trang chủ" : isEn ? "Home" : "ホーム",
        "item": `https://kigyoulist.com/${locale}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": isVi ? "Cẩm nang B2B" : isEn ? "Sales Guides" : "営業ノウハウ・活用ガイド",
        "item": `https://kigyoulist.com/${locale}/guide`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": title,
        "item": `https://kigyoulist.com/${locale}/guide/${slug}`
      }
    ]
  };

  // Schema: TechArticle / Article
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": title,
    "description": desc,
    "url": `https://kigyoulist.com/${locale}/guide/${slug}`,
    "datePublished": article.publishedAt,
    "dateModified": article.updatedAt,
    "inLanguage": locale,
    "author": {
      "@type": "Organization",
      "name": article.author.name
    },
    "publisher": {
      "@type": "Organization",
      "name": "Kigyou-list 編集部",
      "url": "https://kigyoulist.com"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://kigyoulist.com/${locale}/guide/${slug}`
    }
  };

  // Schema: FAQPage
  const faqSchema = article.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": article.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <Header />

      <main className="flex-1 pb-20">
        {/* Header Breadcrumbs & Title Section */}
        <div className="bg-white dark:bg-[#161B22] border-b border-slate-200/80 dark:border-slate-800 py-10 md:py-14">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb Navigation */}
            <nav className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-6 font-medium">
              <Link href={`/${locale}`} className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                {isVi ? "Trang chủ" : isEn ? "Home" : "ホーム"}
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <Link href={`/${locale}/guide`} className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                {isVi ? "Cẩm nang B2B" : isEn ? "Sales Guides" : "営業ガイド"}
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-xs sm:max-w-sm">
                {catLabel}
              </span>
            </nav>

            {/* Category & Read Time */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-md text-xs font-bold bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                {catLabel}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>{article.readTimeMinutes} {isJa ? "分で読める" : isVi ? "phút đọc" : "min read"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>{isJa ? "公開日: " : isVi ? "Xuất bản: " : "Published: "}{article.publishedAt}</span>
              </div>
            </div>

            {/* Article Main H1 Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6 leading-tight">
              {title}
            </h1>

            {/* Author box */}
            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 pb-2">
              <div className="w-8 h-8 rounded-full bg-[#1B4F8A] text-white flex items-center justify-center font-bold text-xs">
                K
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white">{article.author.name}</div>
                <div className="text-[11px] text-slate-500">{article.author.role}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout with Sticky TOC */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left/Main Column: Article Body (8 cols on lg) */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              
              {/* Executive Summary / Highlights Callout Box */}
              <div className="bg-white dark:bg-[#161B22] rounded-2xl border-l-4 border-l-[#1B4F8A] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                  <span>{isJa ? "この記事でわかること（要点まとめ）" : isVi ? "Nội dung nổi bật" : "Key Takeaways"}</span>
                </h2>
                <ul className="space-y-2">
                  {highlights.map((item, idx) => (
                    <li key={idx} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dynamic Body Content according to Article Slug */}
              <div className="bg-white dark:bg-[#161B22] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-2xs prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed text-sm sm:text-base">
                {renderArticleBody(article.slug, locale)}
              </div>

              {/* FAQs Accordion Section */}
              {article.faqs.length > 0 && (
                <div id="faq-section" className="bg-white dark:bg-[#161B22] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-2xs">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
                    <span>{isJa ? "よくある質問（FAQ）" : isVi ? "Câu hỏi thường gặp (FAQ)" : "Frequently Asked Questions"}</span>
                  </h2>
                  <div className="space-y-4">
                    {article.faqs.map((faq, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-start gap-2">
                          <span className="text-[#1B4F8A] dark:text-blue-400 font-extrabold">Q.</span>
                          <span>{faq.question}</span>
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-5">
                          {faq.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversion CTA Box */}
              <div className="bg-gradient-to-r from-[#1B4F8A] to-[#143D6C] rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2">
                    {cta.title[locale as 'ja'|'en'|'vi'] || cta.title.ja}
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                    {cta.desc[locale as 'ja'|'en'|'vi'] || cta.desc.ja}
                  </p>
                </div>
                <Link
                  href={cta.href}
                  className="px-6 py-3 rounded-xl bg-white text-[#1B4F8A] font-bold text-sm shadow-md hover:bg-blue-50 transition-all whitespace-nowrap active:scale-98 shrink-0 flex items-center gap-2"
                >
                  <span>{cta.buttonText[locale as 'ja'|'en'|'vi'] || cta.buttonText.ja}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Related Articles */}
              <div className="mt-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                  <span>{isJa ? "あわせて読みたい関連ガイド" : isVi ? "Bài viết liên quan" : "Related Guides"}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {relatedArticles.map((rel) => (
                    <Link
                      key={rel.slug}
                      href={`/${locale}/guide/${rel.slug}`}
                      className="p-4 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 hover:border-[#1B4F8A] transition-all flex flex-col justify-between group shadow-2xs"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-[#1B4F8A] dark:text-blue-400 block mb-1">
                          {rel.categoryLabel[locale as 'ja'|'en'|'vi'] || rel.categoryLabel.ja}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#1B4F8A] line-clamp-2 transition-colors">
                          {rel.title[locale as 'ja'|'en'|'vi'] || rel.title.ja}
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-3 flex items-center gap-1 font-semibold">
                        <span>{isJa ? "読む" : isVi ? "Đọc" : "Read"}</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Table of Contents (4 cols on lg) */}
            <div className="lg:col-span-4">
              <div className="sticky top-20 flex flex-col gap-5">
                
                {/* Table of Contents Box */}
                <div className="bg-white dark:bg-[#161B22] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <FileText className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                    <span>{isJa ? "目次（INDEX）" : isVi ? "Mục lục bài viết" : "Table of Contents"}</span>
                  </h3>
                  <nav className="space-y-1.5">
                    {article.tableOfContents.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="text-xs text-slate-600 dark:text-slate-400 hover:text-[#1B4F8A] dark:hover:text-blue-400 py-1 block transition-colors leading-snug font-medium hover:underline"
                      >
                        {item.title}
                      </a>
                    ))}
                    {article.faqs.length > 0 && (
                      <a
                        href="#faq-section"
                        className="text-xs text-slate-600 dark:text-slate-400 hover:text-[#1B4F8A] dark:hover:text-blue-400 py-1 block transition-colors leading-snug font-medium hover:underline"
                      >
                        {isJa ? "よくある質問（FAQ）" : isVi ? "Câu hỏi thường gặp" : "FAQs"}
                      </a>
                    )}
                  </nav>
                </div>

                {/* Quick DB Search Widget */}
                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center mb-3">
                    <Database className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                    {isJa ? "全国500万社を今すぐ検索" : isVi ? "Tra cứu 5M doanh nghiệp" : "Search 5M Companies"}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                    {isJa
                      ? "業種・地域・求人や補助金実績で瞬時に絞り込み、リストを作成できます。"
                      : isVi
                      ? "Lọc công ty theo ngành, địa phương và các tín hiệu kinh doanh có sẵn."
                      : "Instant filters by industry, prefecture, and business intent."}
                  </p>
                  <Link
                    href={`/${locale}/search`}
                    className="w-full py-2 px-3 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <span>{isJa ? "企業検索ツールを開く" : isVi ? "Mở công cụ tìm kiếm" : "Open Search Tool"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Back to Guides link */}
                <Link
                  href={`/${locale}/guide`}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-[#1B4F8A] inline-flex items-center gap-1.5 transition-colors font-medium px-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{isJa ? "営業ガイド一覧に戻る" : isVi ? "Quay lại danh sách cẩm nang" : "Back to All Guides"}</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/**
 * Renders the rich, authoritative Japanese B2B content for each article.
 */
function renderArticleBody(slug: string, locale: string) {
  switch (slug) {
    case 'ai-sales-list':
      return renderAiSalesListContent(locale);
    case 'excel-sales-list-template':
      return renderExcelSalesListContent(locale);
    case 'form-marketing-tips':
      return renderFormMarketingContent(locale);
    case 'bankruptcy-signs-check':
      return renderBankruptcyCheckContent(locale);
    case 'edinet-salary-ranking-utilization':
      return renderEdinetSalaryContent(locale);
    default:
      return <p>コンテンツを準備中です。</p>;
  }
}

// -----------------------------------------------------------------------------
// BÀI 1 CONTENT: ai-sales-list
// -----------------------------------------------------------------------------
function renderAiSalesListContent(locale: string) {
  return (
    <div className="space-y-8">
      <section id="problem-hallucination">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          1. なぜChatGPT単体での営業リスト作成は失敗するのか？
        </h2>
        <p>
          「ChatGPTやClaudeにプロンプトを入力して、東京都内のIT企業一覧を出力させれば営業リストが完成する」——このように考えた多くのセールス担当者が、実際に現場で大きな壁にぶつかっています。
        </p>
        <p>
          その最大の原因は、大規模言語モデル（LLM）特有の<strong>「ハルシネーション（もっともらしい嘘・幻覚）」</strong>です。
        </p>
        <div className="my-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
          <div className="font-bold mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>生成AI単体で企業リストを作った際の代表的トラブル</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>実在しない架空の会社名が出力される（約40%）</li>
            <li>会社名は合っているが、電話番号やURLが他社や個人宅のものである（約35%）</li>
            <li>数年前に閉鎖・解散された倒産企業が含まれている（約20%）</li>
            <li>問い合わせフォームの直リンクではなく代表トップページURLしか出ない</li>
          </ul>
        </div>
        <p>
          この状態でテレアポやフォーム送信を行うと、無駄な作業工数が発生するだけでなく、無関係な個人や他社へ迷惑連絡をしてしまい、自社のブランド信用を著しく損ねるリスクがあります。
        </p>
      </section>

      <section id="two-tier-architecture">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          2. 成功する「一次データ × 生成AI」の2層アーキテクチャ
        </h2>
        <p>
          AIを活用したB2B営業でトップクラスの成約率を誇るチームは、AIに「企業データをゼロから探させる」ことは決してしません。
          彼らが実践している唯一の正解は、<strong>「公式一次データをAIに流し込み、セグメンテーションと文面生成を担当させる」2層構造</strong>です。
        </p>
        <div className="overflow-x-auto my-4">
          <table className="w-full text-xs text-left border-collapse border border-slate-200 dark:border-slate-700">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                <th className="p-3 border border-slate-200 dark:border-slate-700">比較項目</th>
                <th className="p-3 border border-slate-200 dark:border-slate-700 text-rose-600">ChatGPT単体でリスト作成</th>
                <th className="p-3 border border-slate-200 dark:border-slate-700 text-[#1B4F8A] font-bold">Kigyou-list 500万社DB × AI</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 border border-slate-200 dark:border-slate-700 font-bold">法人番号の正確性</td>
                <td className="p-3 border border-slate-200 dark:border-slate-700">架空・推測値（精度30%以下）</td>
                <td className="p-3 border border-slate-200 dark:border-slate-700 text-emerald-600 font-bold">国税庁直結（100%完全一致）</td>
              </tr>
              <tr>
                <td className="p-3 border border-slate-200 dark:border-slate-700 font-bold">問い合わせフォームURL</td>
                <td className="p-3 border border-slate-200 dark:border-slate-700">取得不可またはエラー多数</td>
                <td className="p-3 border border-slate-200 dark:border-slate-700 text-emerald-600 font-bold">正規フォームURL常時検証済み</td>
              </tr>
              <tr>
                <td className="p-3 border border-slate-200 dark:border-slate-700 font-bold">求人・補助金等のシグナル</td>
                <td className="p-3 border border-slate-200 dark:border-slate-700">判別不能</td>
                <td className="p-3 border border-slate-200 dark:border-slate-700 text-emerald-600 font-bold">ハローワーク・省庁入札データ連携</td>
              </tr>
              <tr>
                <td className="p-3 border border-slate-200 dark:border-slate-700 font-bold">作成スピード</td>
                <td className="p-3 border border-slate-200 dark:border-slate-700">1回につき数社〜十数社（遅い）</td>
                <td className="p-3 border border-slate-200 dark:border-slate-700 text-emerald-600 font-bold">条件指定で数千社を瞬時CSV出力</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="prompts-targeting">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          3. 【実践】即戦力プロンプト集（ターゲティング＆文面自動生成）
        </h2>
        <p>
          Kigyou-listからダウンロードした企業CSVデータをChatGPTやClaudeに読み込ませ、成約確度の高いターゲットを抽出し、パーソナライズされた営業文面を生成するためのプロンプトです。
        </p>

        <div className="my-5">
          <div className="flex items-center justify-between bg-slate-800 text-slate-200 px-4 py-2 rounded-t-xl text-xs font-bold">
            <span>プロンプト1: 企業データから顧客セグメントを自動分類する</span>
            <CopyPromptButton text={`# 指示
添付した企業リストCSV（社名、業種、従業員数、資本金、求人シグナル、問い合わせURL）を分析し、
当社の商材【商材名やサービス内容を入力】に最も合致する上位20社をスコアリングしてください。

# 評価基準
1. 従業員規模が50〜300名の中堅企業であること
2. 「求人シグナルあり」の企業を成長意欲が高いとみなし加点
3. 各社のWebサイト特徴から、想定される課題を1行で言語化すること

# 出力形式
表形式（会社名、優先度S/A/B、想定課題、アプローチ切り口）`} />
          </div>
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-b-xl text-xs overflow-x-auto whitespace-pre-wrap font-mono">
{`# 指示
添付した企業リストCSV（社名、業種、従業員数、資本金、求人シグナル、問い合わせURL）を分析し、
当社の商材【商材名やサービス内容を入力】に最も合致する上位20社をスコアリングしてください。

# 評価基準
1. 従業員規模が50〜300名の中堅企業であること
2. 「求人シグナルあり」の企業を成長意欲が高いとみなし加点
3. 各社のWebサイト特徴から、想定される課題を1行で言語化すること

# 出力形式
表形式（会社名、優先度S/A/B、想定課題、アプローチ切り口）`}
          </pre>
        </div>

        <div className="my-5">
          <div className="flex items-center justify-between bg-slate-800 text-slate-200 px-4 py-2 rounded-t-xl text-xs font-bold">
            <span>プロンプト2: 問い合わせフォーム専用の短文ピッチを自動生成する</span>
            <CopyPromptButton text={`# 前提
あなたはB2Bトップセールスライターです。
対象企業【会社名】のWeb問い合わせフォームに送る、返信率の高い提案文を作成してください。

# 条件
・文字数は350〜450文字以内（長文は読まれないため厳禁）
・売り込み感を消し、「課題解決の有益情報提供」として構成する
・必ず「特定電子メール法の免責（ご不要な場合は破棄または返信不要の旨）」を末尾に添える

# 構成
1. 挨拶および問い合わせ理由（対象企業の取り組みへの言及）
2. 想定課題の提示
3. 当社が提供できる具体的な解決策と実績数値
4. アクション喚起（15分オンライン相談の提案）`} />
          </div>
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-b-xl text-xs overflow-x-auto whitespace-pre-wrap font-mono">
{`# 前提
あなたはB2Bトップセールスライターです。
対象企業【会社名】のWeb問い合わせフォームに送る、返信率の高い提案文を作成してください。

# 条件
・文字数は350〜450文字以内（長文は読まれないため厳禁）
・売り込み感を消し、「課題解決の有益情報提供」として構成する
・必ず「特定電子メール法の免責（ご不要な場合は破棄または返信不要の旨）」を末尾に添える

# 構成
1. 挨拶および問い合わせ理由（対象企業の取り組みへの言及）
2. 想定課題の提示
3. 当社が提供できる具体的な解決策と実績数値
4. アクション喚起（15分オンライン相談の提案）`}
          </pre>
        </div>
      </section>

      <section id="integration-steps">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          4. Kigyou-list 500万社DBとの具体的な連携ステップ
        </h2>
        <ol className="list-decimal pl-5 space-y-3">
          <li>
            <strong>ターゲット条件の絞り込み:</strong><br />
            Kigyou-listの
            <Link href={`/${locale}/search`} className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline mx-1">
              企業詳細検索画面（/ja/search）
            </Link>
            で、地域・JSIC産業大分類・資本金規模・「問い合わせフォームあり」にチェックを入れて検索します。
          </li>
          <li>
            <strong>正規CSVデータの出力:</strong><br />
            「CSV一括エクスポート」をクリックし、法人番号・商号・所在地・代表者名・直通フォームURLが含まれたデータをダウンロードします（
            <Link href={`/${locale}/pricing`} className="text-[#1B4F8A] dark:text-blue-400 font-bold hover:underline">
              無料プランでも毎月50社出力可能
            </Link>
            ）。
          </li>
          <li>
            <strong>AIへのインポートと自動アプローチ:</strong><br />
            出力されたCSVファイルをChatGPT Advanced Data AnalysisやClaude Codeにドラッグ＆ドロップし、上記の即戦力プロンプトを実行します。自社の
            <Link href={`/${locale}/form-marketing`} className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline mx-1">
              フォーム営業自動配信サービス
            </Link>
            と連携すれば、最短即日で高確度アプローチが完了します。
          </li>
        </ol>

        {/* Lead Magnet CTA Callout */}
        <div className="my-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-white block mb-0.5 font-bold">
              ⚡ 500万社データベース直結でAIプロンプトの精度を最大化
            </strong>
            国税庁公表データ・適格インボイス・求人活動・有報年収データをCSV出力し、ChatGPTやClaudeで即座に分析可能。
          </div>
          <Link
            href={`/${locale}/search`}
            className="shrink-0 px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-2xs whitespace-nowrap"
          >
            企業データベースを検索 ➔
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/search?contact_form=true`}
            className="px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-2xs"
          >
            フォーム営業可能な企業を探す ➔
          </Link>
          <Link
            href={`/${locale}/pricing`}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700"
          >
            月額1,260円〜の料金プラン ➔
          </Link>
        </div>
      </section>
    </div>
  );
}

// -----------------------------------------------------------------------------
// BÀI 2 CONTENT: excel-sales-list-template
// -----------------------------------------------------------------------------
function renderExcelSalesListContent(locale: string) {
  return (
    <div className="space-y-8">
      <section id="flaws-of-bad-lists">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          1. 成果が出ない営業リストの3大原因
        </h2>
        <p>
          「テレアポを100件かけても受付でブロックされる」「メールを送ってもエラーで返ってくる」——こうした営業活動の停滞は、営業パーソンのトークスキルではなく、<strong>土台となるExcel営業リストの項目設計ミス</strong>に原因があります。
        </p>
        <div className="my-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs sm:text-sm text-rose-900 dark:text-rose-200 space-y-2">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>失敗する営業リストの典型例</span>
          </div>
          <p>
            1. <strong>「代表電話番号」しか載っていない:</strong> 代表受付に繋がり、営業お断りで100%弾かれる。<br />
            2. <strong>「代表者名・役員名」がない:</strong> 誰宛てに手紙やメールを送ればよいか分からず開封されない。<br />
            3. <strong>「重複チェック」が機能していない:</strong> 既存顧客やクレーム企業に誤って営業連絡しトラブルに発展する。
          </p>
        </div>
      </section>

      <section id="essential-10-columns">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          2. B2B営業を成功に導く「必須10項目」の設計基準
        </h2>
        <p>
          成約率の高い営業組織がExcelやGoogleスプレッドシートで管理している必須10項目です。このフォーマットで統一することで、誰が担当してもスムーズな営業引き継ぎが可能になります。
        </p>
        <div className="overflow-x-auto my-4">
          <table className="w-full text-xs text-left border-collapse border border-slate-200 dark:border-slate-700">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="p-2.5 border">列</th>
                <th className="p-2.5 border">項目名</th>
                <th className="p-2.5 border">データ例</th>
                <th className="p-2.5 border">なぜ必須なのか（営業的価値）</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2.5 border font-mono">A</td>
                <td className="p-2.5 border font-bold">法人番号（13桁）</td>
                <td className="p-2.5 border font-mono">1010001008734</td>
                <td className="p-2.5 border">名寄せ・重複判定の唯一絶対のキー（社名変更にも対応）</td>
              </tr>
              <tr>
                <td className="p-2.5 border font-mono">B</td>
                <td className="p-2.5 border font-bold">企業名（商号）</td>
                <td className="p-2.5 border">〇〇株式会社</td>
                <td className="p-2.5 border">正式名称（株などの略称を統一して失礼を防ぐ）</td>
              </tr>
              <tr>
                <td className="p-2.5 border font-mono">C</td>
                <td className="p-2.5 border font-bold">本社所在地</td>
                <td className="p-2.5 border">東京都千代田区神田錦町3-7-1</td>
                <td className="p-2.5 border">訪問営業・エリア担当分けに必須</td>
              </tr>
              <tr>
                <td className="p-2.5 border font-mono">D</td>
                <td className="p-2.5 border font-bold">代表者役職・氏名</td>
                <td className="p-2.5 border">代表取締役 八木 晋</td>
                <td className="p-2.5 border">手紙送付やフォーム営業の宛名指定で開封率激増</td>
              </tr>
              <tr>
                <td className="p-2.5 border font-mono">E</td>
                <td className="p-2.5 border font-bold">代表TEL / 直通TEL</td>
                <td className="p-2.5 border font-mono">03-1234-5678</td>
                <td className="p-2.5 border">コール履歴管理</td>
              </tr>
              <tr>
                <td className="p-2.5 border font-mono">F</td>
                <td className="p-2.5 border font-bold">問い合わせフォームURL</td>
                <td className="p-2.5 border text-blue-600">https://example.com/contact</td>
                <td className="p-2.5 border">フォームDM送信で決裁権者へ最速リーチ</td>
              </tr>
              <tr>
                <td className="p-2.5 border font-mono">G</td>
                <td className="p-2.5 border font-bold">資本金 / 売上規模</td>
                <td className="p-2.5 border">1,000万円 / 15億円</td>
                <td className="p-2.5 border">予算規模・支払い能力の一次フィルター</td>
              </tr>
              <tr>
                <td className="p-2.5 border font-mono">H</td>
                <td className="p-2.5 border font-bold">従業員数</td>
                <td className="p-2.5 border">45名</td>
                <td className="p-2.5 border">組織課題・導入規模の判定</td>
              </tr>
              <tr>
                <td className="p-2.5 border font-mono">I</td>
                <td className="p-2.5 border font-bold">事業シグナル</td>
                <td className="p-2.5 border">求人募集中 / 補助金採択</td>
                <td className="p-2.5 border">「なぜ今提案するのか」のトークフック</td>
              </tr>
              <tr>
                <td className="p-2.5 border font-mono">J</td>
                <td className="p-2.5 border font-bold">ステータス・次回予定</td>
                <td className="p-2.5 border">未アプローチ / 11/10架電</td>
                <td className="p-2.5 border">営業進捗の可視化</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="excel-formulas-dedup">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          3. 重複・過去接触企業を瞬時に排除するExcel実用テクニック
        </h2>
        <p>
          リスト内の重複や、別シートにある既存顧客リストとの突合には<strong>「法人番号（13桁）」をキーにしたCOUNTIF関数</strong>を使用するのが鉄則です。社名は「株式会社」の前後や半角全角スペースで表記揺れを起こすため、社名突合は避けてください。
        </p>
        <div className="my-3 p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono">
          <div className="text-slate-400 mb-1">// 重複チェック用数式（行2の場合）</div>
          <code>=IF(COUNTIF(A$2:A2, A2)&gt;1, &quot;★重複&quot;, &quot;OK&quot;)</code>
        </div>
      </section>

      <section id="kigyoulist-export-flow">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          4. Kigyou-listを活用して最短5分でリストを完成させる方法
        </h2>
        <p>
          自力で上記の10項目をWeb検索して埋める作業は、1社につき3〜5分、100社で約6時間以上かかります。
          Kigyou-listなら、すでに国税庁・官公庁から集約済みの500万社データから必要な条件を絞り込み、上記の10項目が整ったCSVファイルを
          <Link href={`/${locale}/pricing`} className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline mx-1">
            ワンクリックで出力（月50社まで無料）
          </Link>
          できます。
        </p>

        {/* Lead Magnet CTA Callout */}
        <div className="my-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-white block mb-0.5 font-bold">
              📥 Excelですぐ使えるCSV企業リストを一括作成
            </strong>
            業種・地域・資本金・従業員数・問い合わせフォームURLなど、営業に必要な全項目を網羅した高精度リスト。
          </div>
          <Link
            href={`/${locale}/search`}
            className="shrink-0 px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-2xs whitespace-nowrap"
          >
            条件を指定して検索する ➔
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/pricing`}
            className="px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-2xs"
          >
            料金プラン・無料枠を確認 ➔
          </Link>
          <Link
            href={`/${locale}/compare`}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700"
          >
            他社リストツールとの料金比較 ➔
          </Link>
        </div>
      </section>
    </div>
  );
}

// -----------------------------------------------------------------------------
// BÀI 3 CONTENT: form-marketing-tips
// -----------------------------------------------------------------------------
function renderFormMarketingContent(locale: string) {
  return (
    <div className="space-y-8">
      <section id="channel-comparison">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          1. テレアポ・メール・フォーム営業の費用対効果を徹底比較
        </h2>
        <p>
          B2B新規開拓において、電話営業（テレアポ）は受付ブロック率が90%を超え、代表メールへの一斉配信（Cold Email）は迷惑メールフィルターによって開封率が0.1〜0.5%に低迷しています。
        </p>
        <p>
          そこで今、多くの成長企業が主力チャネルとして採用しているのが<strong>「Web問い合わせフォーム営業（Form DM）」</strong>です。
        </p>
        <div className="overflow-x-auto my-4">
          <table className="w-full text-xs text-left border-collapse border border-slate-200 dark:border-slate-700">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="p-3 border">営業手法</th>
                <th className="p-3 border">到達・閲覧率</th>
                <th className="p-3 border">決裁権者リーチ度</th>
                <th className="p-3 border">1件あたりコスト</th>
                <th className="p-3 border">アプローチ可能数/日</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 border font-bold">テレアポ（外注）</td>
                <td className="p-3 border">5%〜10%（通話率）</td>
                <td className="p-3 border text-amber-600 font-semibold">受付ブロック高</td>
                <td className="p-3 border">150円〜300円/コール</td>
                <td className="p-3 border">50〜100件</td>
              </tr>
              <tr>
                <td className="p-3 border font-bold">代表メール一斉配信</td>
                <td className="p-3 border text-rose-600">0.1%〜0.5%（ほぼ迷惑箱）</td>
                <td className="p-3 border text-rose-600">ほぼ見られない</td>
                <td className="p-3 border">1円〜3円</td>
                <td className="p-3 border">数千件（ただしドメイン汚染リスク）</td>
              </tr>
              <tr className="bg-blue-50/60 dark:bg-blue-950/30">
                <td className="p-3 border font-bold text-[#1B4F8A]">フォーム営業（自動）</td>
                <td className="p-3 border font-bold text-emerald-600">50%〜90%（通知メール経由）</td>
                <td className="p-3 border font-bold text-emerald-600">担当役員・経営陣が確認</td>
                <td className="p-3 border font-bold text-[#1B4F8A]">5.9円〜10円</td>
                <td className="p-3 border font-bold">1,000〜5,000件</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="legal-compliance">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          2. フォーム営業の適法性と守るべき法的ルール（特定電子メール法）
        </h2>
        <p>
          問い合わせフォームへの営業送信を検討する際、最も気になるのが<strong>「法律違反にならないのか？」</strong>という点です。
        </p>
        <p>
          日本の「特定電子メールの送信の適正化等に関する法律（特定電子メール法）」は、あらかじめ同意のない者に対する広告・宣伝用<strong>電子メールの送信</strong>を原則禁止（オプトイン規制）しています。
          しかし、総務省・消費者庁の公式見解において、Webサイト上の<strong>問い合わせフォームへの入力・送信は「電子メールの送信」そのものには該当しない</strong>と解釈されるのが一般的です。
        </p>
        <div className="my-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm">
          <div className="font-bold mb-1">【重要】トラブルを防ぐための3大配信マナー</div>
          <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-300">
            <li><strong>送信者情報の明記:</strong> 会社名・担当者名・所在地・連絡先TEL・メールアドレスを必ず記載する。</li>
            <li><strong>配信停止（オプトアウト）導線の設置:</strong> 文末に「ご不要な場合は大変お手数ですが本メッセージを破棄ください」等の文言を添える。</li>
            <li><strong>「営業お断り」サイトの除外:</strong> フォーム周辺に「セールス禁止」「営業目的の利用お断り」と明記されている企業には絶対に送信しない。</li>
          </ol>
        </div>
      </section>

      <section id="templates-section">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          3. 【実例公開】決裁権者から返信が届く文面テンプレート3選
        </h2>
        <div className="my-4">
          <div className="flex items-center justify-between bg-slate-800 text-slate-200 px-4 py-2 rounded-t-xl text-xs font-bold">
            <span>テンプレート: コスト削減・業務自動化訴求（汎用高返信率型）</span>
            <CopyPromptButton text={`突然のご連絡にて大変恐縮でございます。
株式会社〇〇の【担当者名】と申します。

貴社の事業内容（〇〇の展開）を拝見し、当社が提供する【サービス名】によって、貴社営業部門の工数を月間30時間以上削減できる可能性が高いと考え、ご連絡いたしました。

【ご提案の要点】
・現在手作業で行われている〇〇業務をAIとAPIで自動化
・同業他社（〇〇社様など）で月間〇〇万円のコスト削減実績あり
・最短2週間で導入、初期費用0円プランあり

もし1%でもご興味をお持ちいただけましたら、15分ほどオンラインにて概要をご案内させていただけますと幸いです。

▼サービス詳細URL：https://example.com
▼連絡先：info@example.com / 03-xxxx-xxxx

※貴社の貴重な問い合わせ窓口をお借りしてのご連絡、心よりお詫び申し上げます。本件がご不要の場合は、誠に恐縮ですが本メッセージを破棄いただけますと幸甚に存じます。`} />
          </div>
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-b-xl text-xs overflow-x-auto whitespace-pre-wrap font-mono">
{`突然のご連絡にて大変恐縮でございます。
株式会社〇〇の【担当者名】と申します。

貴社の事業内容（〇〇の展開）を拝見し、当社が提供する【サービス名】によって、貴社営業部門の工数を月間30時間以上削減できる可能性が高いと考え、ご連絡いたしました。

【ご提案の要点】
・現在手作業で行われている〇〇業務をAIとAPIで自動化
・同業他社（〇〇社様など）で月間〇〇万円のコスト削減実績あり
・最短2週間で導入、初期費用0円プランあり

もし1%でもご興味をお持ちいただけましたら、15分ほどオンラインにて概要をご案内させていただけますと幸いです。

▼サービス詳細URL：https://example.com
▼連絡先：info@example.com / 03-xxxx-xxxx

※貴社の貴重な問い合わせ窓口をお借りしてのご連絡、心よりお詫び申し上げます。本件がご不要の場合は、誠に恐縮ですが本メッセージを破棄いただけますと幸甚に存じます。`}
          </pre>
        </div>
      </section>

      <section id="ng-filter-safety">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          4. クレームを防ぐ「営業お断り」サイトの除外と安全な自動化
        </h2>
        <p>
          フォーム営業で最も恐ろしいのは、クレーム電話やSNSへの悪評投稿です。
          これを完全に防ぐには、送信前にWebサイトのフォーム画面をクローリングし、「営業お断り」「セールス禁止」「業務妨害」といったNGワードが含まれていないか機械審査する仕組みが不可欠です。
        </p>
        <p>
          Kigyou-listの
          <Link href={`/${locale}/form-marketing`} className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline mx-1">
            Web問い合わせフォーム自動配信機能
          </Link>
          では、AIによる「営業お断り免責判定フィルター」が全件に適用され、リスクのある企業を自動でスキップして安全な配信を実現しています。
        </p>

        {/* Lead Magnet CTA Callout */}
        <div className="my-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-white block mb-0.5 font-bold">
              🚀 問い合わせフォーム営業を安全かつ自動化
            </strong>
            全国50万件のフォーム設置済み企業リストから、ターゲットを絞り込んで送信代行・配信管理を一気通貫でサポート。
          </div>
          <Link
            href={`/${locale}/form-marketing`}
            className="shrink-0 px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-2xs whitespace-nowrap"
          >
            フォーム営業の詳細を見る ➔
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/search?contact_form=true`}
            className="px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-2xs"
          >
            フォームあり企業（50万社）を検索 ➔
          </Link>
          <Link
            href={`/${locale}/search?hiring=true`}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700"
          >
            求人募集中企業で絞り込む ➔
          </Link>
        </div>
      </section>
    </div>
  );
}

// -----------------------------------------------------------------------------
// BÀI 4 CONTENT: bankruptcy-signs-check
// -----------------------------------------------------------------------------
function renderBankruptcyCheckContent(locale: string) {
  return (
    <div className="space-y-8">
      <section id="why-due-diligence-matters">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          1. なぜB2B取引において事前の信用調査が死活問題なのか？
        </h2>
        <p>
          新規取引先から大口の受注が決まり、納品を完了させた矢先に「破産手続き開始決定通知」が弁護士から届く——。
          中小企業やスタートアップにとって、数百万円〜数千万円の<strong>売掛金の焦げ付き（貸倒れ）は、自社までもが資金ショートに追い込まれる「連鎖倒産」の引き金</strong>になります。
        </p>
        <p>
          企業が倒産する際、前触れなく突然倒れるケースはごく稀です。80%以上の企業は、破産に至る数ヶ月前から<strong>公的登記や行政データに明らかな「異変シグナル」</strong>を発しています。
        </p>
      </section>

      <section id="five-warning-signals">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          2. 公的データから見抜く「倒産前の5大前兆シグナル」
        </h2>
        <div className="space-y-4 my-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 mb-1">
              ① 頻繁な本店移転（オフィスのダウングレード）
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              駅前の一等地ビルから郊外の雑居ビルやバーチャルオフィス、代表者の自宅アパートへと本店登記が移転されている場合、家賃滞納や賃料圧縮に追い込まれている危険性が極めて高いです。
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 mb-1">
              ② 代表取締役の短期間での交代・親族以外の就任
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              創業社長が突然辞任し、業界経験のない人物や名義貸しが疑われる人物が代表に就いている場合、いわゆる「事件屋（整理屋）」が介入しているか、創業者が個人保証から逃れようとしている危険サインです。
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 mb-1">
              ③ 適格インボイス登録番号の取消・失効
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
              国税庁公表の「インボイス発行事業者情報」において、登録取消や失効が発生している場合、消費税の未納滞納処分を受けているか、事業活動を実質停止している決定的な証拠となります。
            </p>
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">取引先のインボイス登録状況を即座に確認：</span>
              <Link
                href={`/${locale}/search?invoice=true`}
                className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                <span>適格インボイス登録企業を照会 ➔</span>
              </Link>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 mb-1">
              ④ 厚生年金被保険者数（正規従業員数）の急減
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
              日本年金機構の公表データで被保険者数が半年〜1年で半分以下に急減している企業は、資金繰り破綻による大量離職か、社会保険料の支払いが滞り適用除外手続きを受けている可能性があります。
            </p>
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">実質正規雇用規模・被保険者数の動向：</span>
              <Link
                href={`/${locale}/ranking/employees`}
                className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                <span>厚生年金被保険者数ランキング ➔</span>
              </Link>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 mb-1">
              ⑤ 官報における解散登記・特別清算の公告
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
              株主総会決議による解散や裁判所による破産手続開始決定は官報および法務局登記簿に直ちに掲載されます。Kigyou-listの
              <Link href={`/${locale}/status/bankruptcies`} className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline mx-1">
                全国企業倒産速報データベース
              </Link>
              を活用すれば、日本全国の倒産・解散・清算情報を日次で把握可能です。
            </p>

            {/* Regional Bankruptcy Deep Link Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-xs text-left border-collapse bg-white dark:bg-slate-900">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    <th className="p-2.5 border-b font-bold">主要都道府県</th>
                    <th className="p-2.5 border-b font-bold">倒産・清算動向の特徴</th>
                    <th className="p-2.5 border-b font-bold text-right">地域別速報リンク</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 font-bold">東京都</td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">建設資材高騰・ITベンチャー選別・飲食店廃業</td>
                    <td className="p-2.5 text-right">
                      <Link href={`/${locale}/status/bankruptcies/tokyo`} className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline">
                        東京都の倒産速報 ➔
                      </Link>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 font-bold">大阪府</td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">製造業下請け・卸売・商業流通の資金ショート</td>
                    <td className="p-2.5 text-right">
                      <Link href={`/${locale}/status/bankruptcies/osaka`} className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline">
                        大阪府の倒産速報 ➔
                      </Link>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 font-bold">愛知県</td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">自動車一次・二次サプライチェーン・運送物流</td>
                    <td className="p-2.5 text-right">
                      <Link href={`/${locale}/status/bankruptcies/aichi`} className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline">
                        愛知県の倒産速報 ➔
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Lead Magnet CTA Callout */}
        <div className="my-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-white block mb-0.5 font-bold">
              💡 取引先の信用不安・倒産リスクをリアルタイムで検知
            </strong>
            官報公告・法務局閉鎖登記・インボイス失効情報を毎日自動集約。未然の貸倒れ防止にご活用いただけます。
          </div>
          <Link
            href={`/${locale}/status/bankruptcies`}
            className="shrink-0 px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-2xs whitespace-nowrap"
          >
            倒産速報DBを検索（無料）
          </Link>
        </div>
      </section>

      <section id="credit-checklist">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          3. 即実践できる「取引先信用調査チェックリスト7項目」
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          <li><strong>法人番号の存在確認:</strong> 国税庁法人番号サイトで登記が活動中か（閉鎖・解散ステータスになっていないか）。</li>
          <li><strong>過去の登記異動履歴:</strong> 過去2年以内に商号変更や本店移転を3回以上繰り返していないか。</li>
          <li>
            <strong>適格請求書発行事業者のステータス:</strong> 
            有効なT番号を保有しているか。
            <Link href={`/${locale}/search?invoice=true`} className="text-[#1B4F8A] dark:text-blue-400 font-bold hover:underline ml-1">
              [インボイス登録企業を確認]
            </Link>
          </li>
          <li><strong>役員の継続性:</strong> 直近で監査役や取締役が全員辞任していないか。</li>
          <li>
            <strong>求人活動の実態:</strong> 
            ハローワーク等で求人を出しているか（採用意欲がある企業は事業拡大中の証拠）。
            <Link href={`/${locale}/search?hiring=true`} className="text-[#1B4F8A] dark:text-blue-400 font-bold hover:underline ml-1">
              [求人募集中企業を検索]
            </Link>
          </li>
          <li>
            <strong>公共入札・補助金の採択歴:</strong> 
            国や自治体の審査を通過している企業は公的信用度が一段高い。
            <Link href={`/${locale}/search?bidding=true`} className="text-[#1B4F8A] dark:text-blue-400 font-bold hover:underline ml-1">
              [公共入札実績企業一覧]
            </Link>
          </li>
          <li><strong>Webサイトの更新状況:</strong> お知らせ欄が数年前で止まっていないか、SSL証明書が切れていないか。</li>
        </ul>
      </section>

      <section id="automated-monitoring">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          4. Kigyou-listの企業監視・倒産速報を活用したリスク自動検知
        </h2>
        <p>
          自社の取引先数十社〜数百社を一社ずつ定期的に調べるのは現実的ではありません。
          Kigyou-listの<strong>「企業監視・検知（ウォッチリスト）」機能</strong>に取引先を登録しておくだけで、代表者変更・本社移転・インボイス取消・解散登記を毎日システムが自動検知し、ダッシュボードでお知らせします。
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/watchlist`}
            className="px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-2xs"
          >
            企業監視ウォッチリストを開く ➔
          </Link>
          <Link
            href={`/${locale}/status/bankruptcies`}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700"
          >
            全国の倒産速報一覧を見る ➔
          </Link>
        </div>
      </section>
    </div>
  );
}

// -----------------------------------------------------------------------------
// BÀI 5 CONTENT: edinet-salary-ranking-utilization
// -----------------------------------------------------------------------------
function renderEdinetSalaryContent(locale: string) {
  return (
    <div className="space-y-8">
      <section id="edinet-source-of-truth">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          1. なぜ有価証券報告書（EDINET）が企業分析の最高峰なのか？
        </h2>
        <p>
          求人サイトや企業のコーポレートサイトに掲載されている「平均年収」や「モデル給与」には、残業代の多寡やインセンティブ、特定の好調部署のみを切り出した数値が含まれることが多く、実態を正確に反映していないケースが多々あります。
        </p>
        <p>
          これに対し、<strong>金融庁の電子開示システム（EDINET）に提出される「有価証券報告書」</strong>に記載された平均年間給与・平均年齢・平均勤続年数は、公認会計士や監査法人の厳格な監査を受けた法定の確定データです。
          虚偽の記載には金融商品取引法に基づく重い刑事罰が科されるため、<strong>日本国内において最も信頼性の高い企業実態データ（Source of Truth）</strong>と断言できます。
        </p>
      </section>

      <section id="three-golden-metrics">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          2. 優良企業を見抜く「3大公的指標」（年収・勤続年数・被保険者数）
        </h2>
        <p>
          企業を分析する際、「年収が高い企業 ＝ 素晴らしい企業」と短絡的に結論づけるのは危険です。
          投資・転職・営業ターゲティングのすべてにおいて、以下の<strong>3大指標のバランス</strong>を読み解くことが肝要です。
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
          <Link 
            href={`/${locale}/ranking/salary`}
            className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-[#1B4F8A] transition-all group block"
          >
            <div className="text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded w-fit mb-2">
              金融庁 EDINET
            </div>
            <h3 className="font-bold text-sm mb-1 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors">
              平均年間給与 ➔
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              全正社員の基準内賃金＋賞与の実績値。企業の労働分配率と1人あたり付加価値の高さを示します。
            </p>
          </Link>

          <Link 
            href={`/${locale}/ranking/tenure`}
            className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-[#1B4F8A] transition-all group block"
          >
            <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded w-fit mb-2">
              厚労省 職場情報
            </div>
            <h3 className="font-bold text-sm mb-1 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors">
              平均継続勤務年数 ➔
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              定着率と職場環境の安定性。15年〜20年を超える企業は離職率が低く「真のホワイト企業」の証左。
            </p>
          </Link>

          <Link 
            href={`/${locale}/ranking/employees`}
            className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-[#1B4F8A] transition-all group block"
          >
            <div className="text-[10px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded w-fit mb-2">
              日本年金機構
            </div>
            <h3 className="font-bold text-sm mb-1 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors">
              厚生年金被保険者数 ➔
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              厚生年金適用事業所の現役被保険者数。名目上の「グループ連結」ではない単体の正規雇用実力値。
            </p>
          </Link>
        </div>
      </section>

      <section id="sales-targeting-strategy">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          3. 高単価B2B商材で成約率を跳ね上げる「高年収企業ターゲティング」
        </h2>
        <p>
          SaaSシステム、コンサルティング、DX支援、役員研修などの高単価B2B商材を販売する場合、
          <Link href={`/${locale}/ranking/salary`} className="text-[#1B4F8A] dark:text-blue-400 font-bold hover:underline mx-1">
            平均年収ランキング上位企業（1,000万円超）
          </Link>
          を狙い撃ちにするのが最も費用対効果が高い戦略です。
        </p>
        <p>
          平均年収1,000万円超の企業は、従業員1人の時間コストが非常に高く評価されているため、「業務時間を月5時間削減できる」といった提案に対し、数百万円の予算決済が即座に下りやすい特徴があります。
        </p>

        {/* Lead Magnet CTA Callout */}
        <div className="my-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-white block mb-0.5 font-bold">
              📊 上場企業4,000社の有報財務データを一括分析
            </strong>
            平均年間給与・勤続年数・資本金・従業員数から、予算潤沢な優良ターゲット企業を瞬時に抽出できます。
          </div>
          <Link
            href={`/${locale}/ranking/salary`}
            className="shrink-0 px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-2xs whitespace-nowrap"
          >
            年収ランキングを見る（無料）
          </Link>
        </div>
      </section>

      <section id="ranking-matrix-how-to">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          4. Kigyou-listのランキング一覧からCSVを出力して活用する手順
        </h2>
        <p>
          Kigyou-listでは、EDINET開示の
          <Link href={`/${locale}/ranking/salary`} className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline mx-1">
            給与ランキング（/ja/ranking/salary）
          </Link>
          、厚労省データの
          <Link href={`/${locale}/ranking/tenure`} className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline mx-1">
            勤続年数ランキング（/ja/ranking/tenure）
          </Link>
          、
          <Link href={`/${locale}/ranking/employees`} className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline mx-1">
            被保険者数ランキング（/ja/ranking/employees）
          </Link>
          をすべて公式公表情報に基づいて公開しています。
        </p>
        <p>
          各ランキングページから上場市場別・都道府県別でさらに絞り込み、役員名や公式電話番号が紐づいたリストを即座にエクスポートしてアプローチに活用できます。
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/ranking/salary`}
            className="px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-2xs"
          >
            平均年間給与ランキングTOP100 ➔
          </Link>
          <Link
            href={`/${locale}/search`}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700"
          >
            500万社から条件で探す ➔
          </Link>
        </div>
      </section>
    </div>
  );
}

