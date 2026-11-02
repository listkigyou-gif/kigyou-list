import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GUIDE_ARTICLES, GUIDE_CATEGORIES, GuideArticle } from "@/lib/guides";
import { 
  BookOpen, Sparkles, Clock, ArrowRight, CheckCircle2, 
  ChevronRight, Compass, Filter, Send, Database, ShieldAlert, Coins
} from "lucide-react";

export const revalidate = 86400; // Static ISR caching 24h

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "ja";
  const isEn = locale === "en";
  const isVi = locale === "vi";

  const currentYear = new Date().getFullYear();

  const title = isVi
    ? `Cẩm Nang B2B & Bí Quyết Khai Thác Dữ Liệu Doanh Nghiệp ${currentYear} | Kigyou-list`
    : isEn
    ? `B2B Sales Guides & Corporate Intelligence Playbooks ${currentYear} | Kigyou-list`
    : `【${currentYear}年最新】営業ノウハウ・企業データ活用ガイド一覧｜B2B新規開拓の知恵袋 | Kigyou-list`;

  const description = isVi
    ? "Tổng hợp các bài viết hướng dẫn chuyên sâu về tạo danh sách bán hàng bằng AI (ChatGPT, Claude), mẫu Excel chuẩn hóa, bí quyết gửi Form Marketing tỷ lệ phản hồi cao, nhận diện nguy cơ phá sản và phân tích báo cáo tài chính EDINET."
    : isEn
    ? "Actionable B2B sales intelligence playbooks: AI sales list generation with ChatGPT and Claude, free Excel prospecting templates, contact form outreach benchmarks, insolvency risk due diligence, and audited EDINET financial analysis."
    : "ChatGPTやClaudeを活用した高確度な営業リスト作成法、Excelテンプレート設計、問い合わせフォーム営業の返信率向上ノウハウ、取引先の倒産・破産予兆検知、有報EDINET給与分析など、B2B新規開拓を加速する実践的ノウハウを体系的に公開。";

  return {
    title,
    description,
    keywords: isVi
      ? ["cẩm nang b2b nhật bản", "hướng dẫn tạo danh sách khách hàng", "chatgpt sales list", "thẩm định doanh nghiệp nhật bản"]
      : isEn
      ? ["b2b sales guides japan", "chatgpt prospecting guide", "japan corporate intelligence", "form outreach strategy"]
      : [
          "営業ノウハウ",
          "営業リスト 作り方",
          "企業データ 活用",
          "ChatGPT 営業リスト",
          "フォーム営業 コツ",
          "倒産 前兆",
          "企業分析 有報"
        ],
    alternates: {
      canonical: `/${locale}/guide`,
      languages: {
        ja: "/ja/guide",
        en: "/en/guide",
        vi: "/vi/guide",
        "x-default": "/ja/guide",
      },
    },
    openGraph: {
      title,
      description,
      url: `https://kigyoulist.com/${locale}/guide`,
      siteName: "Kigyou-list",
      locale: isEn ? "en_US" : isVi ? "vi_VN" : "ja_JP",
      type: "website",
    },
  };
}

export default async function GuideIndexPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const locale = resolvedParams.locale || "ja";
  const selectedCategory = resolvedSearch.category || "all";

  const isJa = locale === "ja";
  const isVi = locale === "vi";
  const isEn = !isJa && !isVi;

  const filteredArticles = selectedCategory === "all"
    ? GUIDE_ARTICLES
    : GUIDE_ARTICLES.filter(a => a.category === selectedCategory);

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
      }
    ]
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": isVi ? "Cẩm nang B2B & Khai thác Dữ liệu Doanh nghiệp" : isEn ? "B2B Sales & Corporate Intelligence Guides" : "営業ノウハウ・企業データ活用ガイド一覧",
    "description": "日本全国500万社データを活用したB2B新規開拓・営業自動化・信用調査の実践ガイド集",
    "url": `https://kigyoulist.com/${locale}/guide`,
    "hasPart": GUIDE_ARTICLES.map(a => ({
      "@type": "Article",
      "headline": a.title[locale as 'ja'|'en'|'vi'] || a.title.ja,
      "url": `https://kigyoulist.com/${locale}/guide/${a.slug}`,
      "datePublished": a.publishedAt,
      "dateModified": a.updatedAt
    }))
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <Header />

      <main className="flex-1 pb-16">
        {/* Hero Section */}
        <div className="bg-white dark:bg-[#161B22] border-b border-slate-200/80 dark:border-slate-800 py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6 font-medium">
              <Link href={`/${locale}`} className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                {isVi ? "Trang chủ" : isEn ? "Home" : "ホーム"}
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-800 dark:text-slate-200 font-semibold">
                {isVi ? "Cẩm nang B2B" : isEn ? "Sales Guides" : "営業ガイド"}
              </span>
            </nav>

            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-blue-950/60 dark:text-blue-400 text-xs font-semibold mb-4 border border-[#1B4F8A]/20">
                <BookOpen className="w-3.5 h-3.5" />
                <span>
                  {isJa ? "B2B新規開拓ナレッジベース" : isVi ? "Trung tâm Tri thức B2B" : "B2B Knowledge Hub"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
                {isJa ? "営業ノウハウ・企業データ活用ガイド" : isVi ? "Cẩm Nang B2B & Khai Thác Dữ Liệu Doanh Nghiệp" : "B2B Sales Playbooks & Corporate Data Guides"}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                {isJa
                  ? "全国500万社の正規法人データベース（国税庁・官公庁オープンデータ直結）を活用した営業リスト作成、ChatGPT連携、フォーム自動配信、取引先信用調査の実践知を体系的にお届けします。"
                  : isVi
                  ? "Tổng hợp quy trình tạo danh sách khách hàng bằng AI, biểu mẫu Excel chuẩn hóa, chiến lược gửi Form tự động và phương pháp thẩm định đối tác từ cơ sở dữ liệu 5 triệu doanh nghiệp Nhật Bản."
                  : "Actionable playbooks for sales list generation, generative AI prospecting, automated form delivery, and credit due diligence built on verified corporate databases."}
              </p>
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="bg-slate-100/70 dark:bg-[#12161D] border-b border-slate-200 dark:border-slate-800 py-3 sticky top-14 z-20 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
              <span className="text-xs font-bold text-slate-500 shrink-0 hidden sm:inline-flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" />
                <span>{isJa ? "カテゴリ:" : isVi ? "Chủ đề:" : "Topic:"}</span>
              </span>
              {GUIDE_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                const label = cat.label[locale as 'ja'|'en'|'vi'] || cat.label.ja;
                return (
                  <Link
                    key={cat.id}
                    href={cat.id === 'all' ? `/${locale}/guide` : `/${locale}/guide?category=${cat.id}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-[#1B4F8A] text-white shadow-2xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Article Cards Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => {
              const title = article.title[locale as 'ja'|'en'|'vi'] || article.title.ja;
              const desc = article.metaDescription[locale as 'ja'|'en'|'vi'] || article.metaDescription.ja;
              const catLabel = article.categoryLabel[locale as 'ja'|'en'|'vi'] || article.categoryLabel.ja;
              const highlights = article.highlights[locale as 'ja'|'en'|'vi'] || article.highlights.ja;

              return (
                <article
                  key={article.slug}
                  className="bg-white dark:bg-[#161B22] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 flex flex-col justify-between hover:border-[#1B4F8A] dark:hover:border-blue-400 transition-all hover:shadow-md group"
                >
                  <div>
                    {/* Header meta */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                        {catLabel}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{article.readTimeMinutes} {isJa ? "分で読める" : isVi ? "phút đọc" : "min read"}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                      <Link href={`/${locale}/guide/${article.slug}`}>
                        {title}
                      </Link>
                    </h2>

                    {/* Description */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-3">
                      {desc}
                    </p>

                    {/* Highlights bullet box */}
                    <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3 mb-4 border border-slate-100 dark:border-slate-800/80">
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#1B4F8A] dark:text-blue-400" />
                        <span>{isJa ? "この記事の要点" : isVi ? "Điểm cốt lõi" : "Key Takeaways"}</span>
                      </div>
                      <ul className="space-y-1">
                        {highlights.slice(0, 2).map((hl, idx) => (
                          <li key={idx} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5 line-clamp-1">
                            <span className="text-[#1B4F8A] dark:text-blue-400 font-bold shrink-0">•</span>
                            <span>{hl}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {isJa ? "最終更新: " : isVi ? "Cập nhật: " : "Updated: "}{article.updatedAt}
                    </span>
                    <Link
                      href={`/${locale}/guide/${article.slug}`}
                      className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 inline-flex items-center gap-1 group-hover:underline"
                    >
                      <span>{isJa ? "記事を読む" : isVi ? "Đọc bài viết" : "Read Guide"}</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Bottom Lead Magnet Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
          <div className="bg-gradient-to-r from-[#1B4F8A] to-[#143D6C] rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-white/20 text-white text-xs font-semibold mb-2">
                <Database className="w-3.5 h-3.5" />
                <span>{isJa ? "国内最大級 500万社データベース" : isVi ? "CSDL 5 Triệu Doanh Nghiệp" : "5M+ Verified Companies"}</span>
              </span>
              <h3 className="text-xl sm:text-2xl font-bold mb-2">
                {isJa ? "自社に最適な営業リストを、今すぐ作成しませんか？" : isVi ? "Bắt đầu tạo danh sách khách hàng tiềm năng ngay hôm nay" : "Build Your Custom B2B Sales Prospecting List Today"}
              </h3>
              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                {isJa
                  ? "地域・業界・資本金・求人シグナルで高確度ターゲティング。毎月50社まで無料出力できます。"
                  : isVi
                  ? "Lọc theo tỉnh thành, ngành nghề, vốn và tín hiệu tuyển dụng. Tải miễn phí 50 công ty mỗi tháng."
                  : "Target by prefecture, industry, and hiring intent. Free 50 corporate exports every month."}
              </p>
            </div>
            <Link
              href={`/${locale}/search`}
              className="px-6 py-3 rounded-xl bg-white text-[#1B4F8A] font-bold text-sm shadow-md hover:bg-blue-50 transition-all whitespace-nowrap active:scale-98 shrink-0 flex items-center gap-2"
            >
              <span>{isJa ? "無料で企業を検索する" : isVi ? "Tìm kiếm miễn phí" : "Search Companies Free"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
