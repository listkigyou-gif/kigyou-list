import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getCorporateRankings, CorporateRankingItem } from "@/lib/db";
import { RankingHubView } from "@/components/ranking/RankingHubView";
import { Coins, ChevronRight, ShieldCheck, Database, Award, ArrowRight } from "lucide-react";
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
    ? `Top Japanese Companies by Average Annual Salary (${currentYear}) | FSA EDINET Disclosures - Kigyou-list`
    : locale === "vi"
    ? `Bảng Xếp Hạng Doanh Nghiệp Thu Nhập Cao Nhất Nhật Bản (${currentYear}) | Kigyou-list`
    : `【${currentYear}年最新】全国企業の平均年間給与ランキングTOP50 | 金融庁EDINET有報開示データ - Kigyou-list`;

  const description = locale === "en"
    ? `Official ranking of Japanese corporations by average annual salary based on audited securities reports filed with the Financial Services Agency (FSA). Export full lists with corporate numbers and contacts.`
    : locale === "vi"
    ? `Bảng xếp hạng thu nhập bình quân năm của các tập đoàn hàng đầu Nhật Bản trích xuất từ Báo cáo tài chính FSA EDINET có kiểm toán. Cho phép tải danh sách CSV có số điện thoại và ban giám đốc.`
    : `金融庁EDINET開示の有価証券報告書に基づく全国企業の平均年間給与ランキングTOP50。役員名、公式電話番号、被保険者数、所在地を含む法人リストのCSV一括ダウンロードに対応。`;

  const canonicalUrl = `/${locale}/ranking/salary${resolvedSearch.prefecture ? `?prefecture=${resolvedSearch.prefecture}` : ''}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `/ja/ranking/salary`,
        en: `/en/ranking/salary`,
        vi: `/vi/ranking/salary`,
        "x-default": `/ja/ranking/salary`,
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

export default async function SalaryRankingPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const locale = resolvedParams.locale || "ja";
  const prefectureCode = resolvedSearch.prefecture;
  const currentYear = new Date().getFullYear();

  const items = await getCorporateRankings("salary", 50, prefectureCode);

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
        "item": `https://kigyoulist.com/${locale}/ranking/salary`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": locale === "en" ? "Average Annual Salary" : "平均年間給与ランキング",
        "item": `https://kigyoulist.com/${locale}/ranking/salary`,
      },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `全国企業 平均年間給与ランキングTOP50 (${currentYear}年)`,
    "description": "金融庁EDINET有価証券報告書の公式開示データに基づく全国上場企業の平均給与ランキング",
    "numberOfItems": items.length,
    "itemListElement": items.slice(0, 30).map((item, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "url": `https://kigyoulist.com/${locale}/company/${item.corporate_number}`,
      "name": item.company_name,
      "description": `${item.company_name}の平均年間給与: ${item.metric_value}万円`,
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
            {locale === "en" ? "Average Annual Salary" : "平均年間給与ランキング"}
          </span>
        </nav>

        {/* Ranking Hub View with Tabs, Hero, CSV Export and Ranking List */}
        <RankingHubView 
          items={items} 
          activeType="salary" 
          locale={locale} 
          prefectureCode={prefectureCode} 
        />

        {/* SEO Explanatory & Programmatic Silo Knowledge Section */}
        <section className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <div className="p-6 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>金融庁EDINET開示の平均給与データとは</span>
              </h2>
              <p className="leading-relaxed mb-3">
                本ランキングの「平均年間給与」は、金融商品取引法に基づき上場企業各社が提出する「有価証券報告書（EDINET開示書類）」内の提出会社従業員状況から厳密に抽出しています。
              </p>
              <p className="leading-relaxed">
                賞与（ボーナス）や基準外賃金を含めた税引前支給総額であり、民間調査会社のアンケート推計とは異なり、公認会計士または監査法人の監査証明を受けた極めて信頼性の高い公式データです。
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1B4F8A]" />
                <span>法人営業・採用調査での活用法</span>
              </h2>
              <p className="leading-relaxed mb-3">
                給与水準が高い企業は、従業員一人当たりの付加価値創出額が高く、IT投資や業務効率化ツール、高単価なB2Bサービスへの投資意欲が旺盛です。
              </p>
              <p className="leading-relaxed">
                また、就職・転職活動における企業の待遇水準の客観的比較や、与信管理における人件費支払余力のベンチマークとしても広く活用されています。
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
