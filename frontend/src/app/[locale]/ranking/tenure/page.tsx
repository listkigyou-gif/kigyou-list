import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getCorporateRankings } from "@/lib/db";
import { RankingHubView } from "@/components/ranking/RankingHubView";
import { Clock, ChevronRight, ShieldCheck, Award, ArrowRight } from "lucide-react";
import { Metadata } from "next";

export const revalidate = 3600; // 1-hour ISR cache

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ prefecture?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const locale = resolvedParams.locale || "ja";
  const currentYear = new Date().getFullYear();

  const title = locale === "en"
    ? `Top White Companies by Service Tenure (${currentYear}) | Kigyou-list`
    : locale === "vi"
    ? `Top Doanh Nghiệp Thâm Niên Cao Nhất Nhật Bản (${currentYear}) | Kigyou-list`
    : `【${currentYear}年最新】全国ホワイト企業・平均勤続年数TOP100 | Kigyou-list`;

  const description = locale === "en"
    ? `Official ranking of Japanese corporations by average tenure of regular employees published by the Ministry of Health, Labour and Welfare (MHLW). Discover companies with high retention and worker satisfaction.`
    : locale === "vi"
    ? `Bảng xếp hạng các doanh nghiệp uy tín (White Company) có thời gian gắn bó và thâm niên nhân viên cao nhất Nhật Bản công bố bởi Bộ Y tế, Lao động & Phúc lợi (MHLW). Xuất danh sách CSV đầy đủ.`
    : `厚生労働省「職場情報総合サイト」公表データに基づく全国ホワイト企業・正社員平均勤続年数ランキングTOP100。高い定着率と安定雇用を誇る優良法人の電話番号、役員名、被保険者数を含むCSV出力に対応。`;

  const canonicalUrl = `/${locale}/ranking/tenure${resolvedSearch.prefecture ? `?prefecture=${resolvedSearch.prefecture}` : ''}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `/ja/ranking/tenure`,
        en: `/en/ranking/tenure`,
        vi: `/vi/ranking/tenure`,
        "x-default": `/ja/ranking/tenure`,
      },
    },
    openGraph: {
      title,
      description,
      url: `https://kigyoulist.com${canonicalUrl}`,
      siteName: "Kigyou-list",
      locale: locale === "en" ? "en_US" : locale === "vi" ? "vi_VN" : "ja_JP",
      type: "website",
    },
  };
}

export default async function TenureRankingPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const locale = resolvedParams.locale || "ja";
  const prefectureCode = resolvedSearch.prefecture;
  const currentYear = new Date().getFullYear();

  const items = await getCorporateRankings("tenure", 100, prefectureCode);

  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": locale === "en" ? "Home" : "ホーム",
        "item": `https://kigyoulist.com/${locale}`,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": locale === "en" ? "Rankings" : "企業ランキング一覧",
        "item": `https://kigyoulist.com/${locale}/ranking/tenure`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": locale === "en" ? "Average Service Years" : "ホワイト企業・平均勤続年数ランキング",
        "item": `https://kigyoulist.com/${locale}/ranking/tenure`,
      },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `全国ホワイト企業 平均勤続年数ランキングTOP100 (${currentYear}年)`,
    "description": "厚生労働省「職場情報総合サイト」公表データに基づく全国企業の平均勤続年数ランキング",
    "numberOfItems": items.length,
    "itemListElement": items.slice(0, 30).map((item, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "url": `https://kigyoulist.com/${locale}/company/${item.corporate_number}`,
      "name": item.company_name,
      "description": `${item.company_name}の正社員平均勤続年数: ${item.metric_value}年`,
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-[#0D1117] transition-colors">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-6 font-normal overflow-x-auto scrollbar-none">
          <Link href={`/${locale}`} className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors whitespace-nowrap">
            {locale === "en" ? "Home" : "ホーム"}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-400 dark:text-slate-500 whitespace-nowrap">
            {locale === "en" ? "Rankings" : "企業ランキング"}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-900 dark:text-white truncate">
            {locale === "en" ? "White Companies (Tenure)" : "ホワイト企業・平均勤続年数ランキング"}
          </span>
        </nav>

        {/* Ranking Hub View */}
        <RankingHubView 
          items={items} 
          activeType="tenure" 
          locale={locale} 
          prefectureCode={prefectureCode} 
        />

        {/* SEO Explanatory & Programmatic Silo Knowledge Section */}
        <section className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <div className="p-6 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>厚生労働省公表「平均勤続年数」の意義</span>
              </h2>
              <p className="leading-relaxed mb-3">
                平均勤続年数は、女性活躍推進法や若者雇用促進法に基づき、厚生労働省「職場情報総合サイト（しょくばらぼ）」で公表される客観的就労データです。
              </p>
              <p className="leading-relaxed">
                勤続年数が長い企業は、離職率が低く、育児・介護休業制度の充実、安定した人事評価制度など、従業員が長期にわたり安心して就労できる環境（ホワイト企業）であることを実証しています。
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1B4F8A]" />
                <span>与信審査・パートナー選定における指標</span>
              </h2>
              <p className="leading-relaxed mb-3">
                従業員の定着率が高い企業は、組織のノウハウ蓄積やサービス品質の安定性が極めて高く、突発的な人員流出によるプロジェクト遅延や事業破綻のリスクが低い傾向にあります。
              </p>
              <p className="leading-relaxed">
                長期的な取引契約を結ぶサプライチェーンの選定や、信頼性の高いアウトソーシング先の選定において不可欠な人的資本指標です。
              </p>
            </div>
          </div>

          {/* Cross-linking Related Hubs Spider-web */}
          <div className="p-6 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              関連データハブ & 企業分析インデックス
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <Link
                href={`/${locale}/ranking/salary`}
                className="p-3 rounded-lg bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-700 hover:border-[#1B4F8A] text-slate-800 dark:text-slate-200 flex items-center justify-between group transition-colors"
              >
                <div>
                  <span className="font-bold block group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400">
                    平均年間給与ランキング
                  </span>
                  <span className="text-[10px] text-slate-400">金融庁EDINET有報開示</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1B4F8A]" />
              </Link>

              <Link
                href={`/${locale}/ranking/employees`}
                className="p-3 rounded-lg bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-700 hover:border-[#1B4F8A] text-slate-800 dark:text-slate-200 flex items-center justify-between group transition-colors"
              >
                <div>
                  <span className="font-bold block group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400">
                    厚生年金被保険者数ランキング
                  </span>
                  <span className="text-[10px] text-slate-400">日本年金機構 公表データ</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1B4F8A]" />
              </Link>

              <Link
                href={`/${locale}/building`}
                className="p-3 rounded-lg bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-700 hover:border-[#1B4F8A] text-slate-800 dark:text-slate-200 flex items-center justify-between group transition-colors"
              >
                <div>
                  <span className="font-bold block group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400">
                    主要オフィスビル名鑑
                  </span>
                  <span className="text-[10px] text-slate-400">六本木ヒルズ等の入居企業</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1B4F8A]" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
