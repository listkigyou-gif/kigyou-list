import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Building2, ChevronRight, MapPin } from "lucide-react";
import { getLiveSyncFeed } from "@/lib/db";
import { PREFECTURES } from "@/lib/hubUtils";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const revalidate = 300; // 5-minute ISR cache for real-time SEO freshness

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale = "ja" } = await params;
  const isVi = locale === "vi";
  const isEn = locale === "en";
  const currentYear = new Date().getFullYear();

  const title = isVi
    ? `Trung tâm Biến động & Cập nhật Doanh nghiệp Nhật Bản (${currentYear}) | Kigyou-list`
    : isEn
    ? `Japan Corporate Changes & Live Updates Hub (${currentYear}) | Kigyou-list`
    : `企業変動・最新更新速報データベース（本店移転・合併・新設）【${currentYear}年】 | Kigyou-list`;

  const description = isVi
    ? "Theo dõi biến động doanh nghiệp Nhật Bản theo thời gian thực: chuyển trụ sở, sáp nhập M&A, đổi tên và thành lập mới từ dữ liệu công bố Quốc thuế."
    : isEn
    ? "Real-time directory of Japanese corporate changes: HQ relocations, mergers, name changes, and new incorporations synced from National Tax Agency records."
    : "国税庁の法人番号公表データおよび商業登記情報に基づく、日本企業のリアルタイム変動速報ハブ。本店移転・合併・商号変更・新設法人・最新更新企業を一覧で確認できます。";

  return {
    title,
    description,
    alternates: {
      canonical: `https://kigyoulist.com/${locale}/changes`,
      languages: {
        ja: "https://kigyoulist.com/ja/changes",
        "x-default": "https://kigyoulist.com/ja/changes",
      },
    },
  };
}

export default async function ChangesHubPage({ params }: PageProps) {
  const { locale = "ja" } = await params;
  const isJa = locale === "ja";
  const isVi = locale === "vi";

  const feed = await getLiveSyncFeed(50);
  const topPrefSlugs = [
    "tokyo",
    "osaka",
    "aichi",
    "kanagawa",
    "fukuoka",
    "saitama",
    "chiba",
    "hyogo",
    "hokkaido",
  ];
  const topPrefs = PREFECTURES.filter((p) => topPrefSlugs.includes(p.slug));

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: isJa ? "ホーム" : isVi ? "Trang chủ" : "Home",
        item: `https://kigyoulist.com/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: isJa
          ? "企業変動・最新更新速報"
          : isVi
          ? "Biến động doanh nghiệp"
          : "Corporate Changes Hub",
        item: `https://kigyoulist.com/${locale}/changes`,
      },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: isJa
      ? "企業変動・最新更新速報データベース"
      : isVi
      ? "Trung tâm Biến động & Cập nhật Doanh nghiệp"
      : "Corporate Changes & Live Updates Hub",
    url: `https://kigyoulist.com/${locale}/changes`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: feed.items.length,
      itemListElement: feed.items.slice(0, 20).map((item, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `https://kigyoulist.com/${locale}/company/${item.corporate_number}`,
        name: item.company_name,
      })),
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0D1117] text-slate-800 dark:text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-5"
        >
          <Link href={`/${locale}`} className="hover:text-[#1B4F8A] dark:hover:text-blue-400">
            {isJa ? "ホーム" : isVi ? "Trang chủ" : "Home"}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {isJa
              ? "企業変動・最新更新速報"
              : isVi
              ? "Biến động & Cập nhật mới"
              : "Corporate Changes"}
          </span>
        </nav>

        {/* Page Header */}
        <section className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-lg p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                {isJa
                  ? "リアルタイム同期中"
                  : isVi
                  ? "Đang đồng bộ thời gian thực"
                  : "Real-Time Sync Active"}
              </span>
              {feed.today_count > 0 && (
                <span className="tabular-nums text-emerald-700 dark:text-emerald-400">
                  ({feed.today_count.toLocaleString("ja-JP")}
                  {isJa ? "社" : isVi ? " DN" : " updated"})
                </span>
              )}
            </div>
            <Link
              href={`/${locale}/search`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline"
            >
              <span>
                {isJa
                  ? "全500万社を検索する"
                  : isVi
                  ? "Tìm kiếm trong 5 triệu doanh nghiệp"
                  : "Search all 5M+ companies"}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug mb-2">
            {isJa
              ? "企業変動・最新更新速報データベース"
              : isVi
              ? "Trung tâm Biến động & Cập nhật Doanh nghiệp Nhật Bản"
              : "Japan Corporate Changes & Live Updates Hub"}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
            {isJa
              ? "国税庁の法人番号公表データおよび公的登記情報をもとに、本店移転・合併・商号変更・新設法人などの企業変動をリアルタイムで集約しています。営業リストの鮮度維持や取引先与信管理にご活用ください。"
              : isVi
              ? "Tổng hợp theo thời gian thực các biến động đăng ký pháp nhân tại Nhật Bản: chuyển trụ sở, sáp nhập, đổi tên và doanh nghiệp thành lập mới."
              : "Aggregating official Japanese corporate registry updates in real time, including HQ relocations, mergers, name changes, and new incorporations."}
          </p>
        </section>

        {/* Spoke Hubs Navigation */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link
            href={`/${locale}/changes/relocation`}
            className="group bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 hover:border-[#1B4F8A] dark:hover:border-blue-500 rounded-lg p-4 transition-colors"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400">
                {isJa
                  ? "本店移転・オフィス移転一覧"
                  : isVi
                  ? "Doanh nghiệp chuyển trụ sở"
                  : "HQ & Office Relocations"}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#1B4F8A]" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {isJa
                ? "直近に本店所在地の変更登記を行った企業を都道府県別に確認できます。"
                : isVi
                ? "Danh sách công ty vừa đăng ký thay đổi địa chỉ trụ sở theo tỉnh thành."
                : "Browse companies that recently registered headquarters relocations by prefecture."}
            </p>
          </Link>

          <Link
            href={`/${locale}/changes/merger`}
            className="group bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 hover:border-[#1B4F8A] dark:hover:border-blue-500 rounded-lg p-4 transition-colors"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400">
                {isJa
                  ? "合併・組織再編企業一覧"
                  : isVi
                  ? "Sáp nhập & Tái cấu trúc (M&A)"
                  : "Mergers & Reorganizations"}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#1B4F8A]" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {isJa
                ? "吸収合併・新設合併・組織再編が発生した企業の最新履歴を追跡します。"
                : isVi
                ? "Theo dõi lịch sử các thương vụ sáp nhập và tái cấu trúc pháp nhân."
                : "Track corporate mergers, acquisitions, and organizational restructurings."}
            </p>
          </Link>

          <Link
            href={`/${locale}/new-companies`}
            className="group bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 hover:border-[#1B4F8A] dark:hover:border-blue-500 rounded-lg p-4 transition-colors"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400">
                {isJa
                  ? "新設法人データベース"
                  : isVi
                  ? "Doanh nghiệp mới thành lập"
                  : "New Incorporations"}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#1B4F8A]" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {isJa
                ? "新たに法人番号が指定されたスタートアップ・新設法人を一覧で検索。"
                : isVi
                ? "Khám phá các doanh nghiệp và startup vừa được cấp mã số pháp nhân."
                : "Discover newly incorporated companies and startups across Japan."}
            </p>
          </Link>
        </section>

        {/* Prefecture Quick Links (SEO Internal Link Matrix) */}
        <section className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-lg p-4 mb-6">
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            {isJa
              ? "主要エリア別の移転・変動速報"
              : isVi
              ? "Biến động theo khu vực trọng điểm"
              : "Regional Relocation Hubs"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {topPrefs.map((pref) => (
              <Link
                key={pref.code}
                href={`/${locale}/changes/relocation/${pref.slug}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 hover:bg-[#F0F4F9] text-slate-700 hover:text-[#1B4F8A] border border-slate-200/90 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-700 dark:hover:text-white transition-colors"
              >
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{isJa ? pref.nameJa : pref.nameEn}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Latest Updates Table */}
        <section className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {isJa
                ? `最新の企業更新・変動フィード（直近${feed.items.length}件）`
                : isVi
                ? `Cập nhật doanh nghiệp mới nhất (${feed.items.length} bản ghi)`
                : `Latest Corporate Updates (${feed.items.length})`}
            </h2>
          </div>

          {feed.items.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {isJa
                ? "現在表示できる更新データはありません。"
                : isVi
                ? "Chưa có dữ liệu cập nhật mới."
                : "No recent updates available."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/90 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="py-2.5 px-4 whitespace-nowrap">
                      {isJa ? "更新日" : isVi ? "Ngày" : "Date"}
                    </th>
                    <th className="py-2.5 px-4 whitespace-nowrap">
                      {isJa ? "種別" : isVi ? "Loại" : "Category"}
                    </th>
                    <th className="py-2.5 px-4 min-w-[200px]">
                      {isJa ? "企業名" : isVi ? "Tên doanh nghiệp" : "Company Name"}
                    </th>
                    <th className="py-2.5 px-4 whitespace-nowrap min-w-[120px]">
                      {isJa ? "所在地" : isVi ? "Tỉnh / TP" : "Location"}
                    </th>
                    <th className="py-2.5 px-4 whitespace-nowrap">
                      {isJa ? "法人番号" : isVi ? "Mã pháp nhân" : "Corporate No."}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {feed.items.map((item, idx) => {
                    const label = isJa
                      ? item.event_label_ja
                      : isVi
                      ? item.event_label_vi
                      : item.event_label_en;
                    return (
                      <tr
                        key={`${item.corporate_number}-${item.event_date}-${item.event_category}-${idx}`}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                          <div>{item.synced_at || item.event_date || "-"}</div>
                          {item.synced_at && item.event_date && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">
                              {isJa ? `発生: ${item.event_date}` : isVi ? `Phát sinh: ${item.event_date}` : `Event: ${item.event_date}`}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                            {label}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                          <Link
                            href={`/${locale}/company/${item.corporate_number}`}
                            className="inline-flex items-center gap-1.5 hover:text-[#1B4F8A] dark:hover:text-blue-400 hover:underline"
                          >
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{item.company_name}</span>
                          </Link>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {[item.prefecture_name, item.city_name]
                            .filter(Boolean)
                            .join(" ") || "-"}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                          {item.corporate_number}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
