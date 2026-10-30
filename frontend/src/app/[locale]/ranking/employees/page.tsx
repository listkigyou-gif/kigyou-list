import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getCorporateRankings } from "@/lib/db";
import { RankingHubView } from "@/components/ranking/RankingHubView";
import { Users, ChevronRight, ShieldCheck, Award, ArrowRight } from "lucide-react";
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
    ? `Top Japanese Corporations by Employees (${currentYear}) | Kigyou-list`
    : locale === "vi"
    ? `Top Doanh Nghiệp Quy Mô Nhân Sự Lớn Nhất (${currentYear}) | Kigyou-list`
    : `【${currentYear}年最新】全国企業の厚生年金被保険者数TOP100 | Kigyou-list`;

  const description = locale === "en"
    ? `Official corporate size ranking based on the verified number of insured regular employees published by the Japan Pension Service. Screen large enterprises, corporate groups, and subsidiaries with CSV export.`
    : locale === "vi"
    ? `Bảng xếp hạng quy mô doanh nghiệp Nhật Bản theo số lượng nhân sự tham gia Bảo hiểm Phúc lợi 厚生年金 từ Cơ quan Hưu trí Nhật Bản. Xuất danh sách CSV gồm ban lãnh đạo và số điện thoại.`
    : `日本年金機構（厚生年金適用事業所公表情報）に基づく全国企業の厚生年金被保険者数ランキングTOP100。実質的な正規雇用規模を正確に把握できる法人リストのCSV一括ダウンロードに対応。`;

  const canonicalUrl = `/${locale}/ranking/employees${resolvedSearch.prefecture ? `?prefecture=${resolvedSearch.prefecture}` : ''}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `/ja/ranking/employees`,
        en: `/en/ranking/employees`,
        vi: `/vi/ranking/employees`,
        "x-default": `/ja/ranking/employees`,
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

export default async function EmployeesRankingPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const locale = resolvedParams.locale || "ja";
  const prefectureCode = resolvedSearch.prefecture;
  const currentYear = new Date().getFullYear();

  const items = await getCorporateRankings("employees", 100, prefectureCode);

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
        "item": `https://kigyoulist.com/${locale}/ranking/employees`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": locale === "en" ? "Insured Workforce" : "厚生年金被保険者数ランキング",
        "item": `https://kigyoulist.com/${locale}/ranking/employees`,
      },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `全国企業 厚生年金被保険者数ランキングTOP100 (${currentYear}年)`,
    "description": "日本年金機構の公式公表データに基づく全国企業の正規被保険者数・規模ランキング",
    "numberOfItems": items.length,
    "itemListElement": items.slice(0, 30).map((item, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "url": `https://kigyoulist.com/${locale}/company/${item.corporate_number}`,
      "name": item.company_name,
      "description": `${item.company_name}の厚生年金被保険者数: ${item.metric_value.toLocaleString()}名`,
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
            {locale === "en" ? "Insured Workforce" : "厚生年金被保険者数ランキング"}
          </span>
        </nav>

        {/* Ranking Hub View */}
        <RankingHubView 
          items={items} 
          activeType="employees" 
          locale={locale} 
          prefectureCode={prefectureCode} 
        />

        {/* SEO Explanatory & Programmatic Silo Knowledge Section */}
        <section className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <div className="p-6 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#1B4F8A]" />
                <span>日本年金機構「厚生年金被保険者数」の信頼性</span>
              </h2>
              <p className="leading-relaxed mb-3">
                厚生年金被保険者数は、日本年金機構が毎月公表する「厚生年金保険・健康保険適用事業所情報」に基づいて集計されています。
              </p>
              <p className="leading-relaxed">
                自社ウェブサイト等の公称従業員数（パート・アルバイト・業務委託・派遣を含む場合がある）とは異なり、社会保険に加入している正規雇用労働者の実数を正確に反映しています。
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>エンタープライズ営業・アカウント選定</span>
              </h2>
              <p className="leading-relaxed mb-3">
                被保険者数が多い企業は、大規模な情報システムや福利厚生サービス、グループウェア、労務管理SaaSなどの大口需要が見込めるターゲットです。
              </p>
              <p className="leading-relaxed">
                名目上の売上高だけでなく、実際の人的稼働規模をベースにした高確度なABM（アカウント・ベースド・マーケティング）を実現します。
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
                href={`/${locale}/ranking/tenure`}
                className="p-3 rounded-lg bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-700 hover:border-[#1B4F8A] text-slate-800 dark:text-slate-200 flex items-center justify-between group transition-colors"
              >
                <div>
                  <span className="font-bold block group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400">
                    ホワイト企業・勤続年数ランキング
                  </span>
                  <span className="text-[10px] text-slate-400">厚労省 職場情報開示</span>
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
