import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getPrefecturesWithCounts, getIndustriesHierarchy } from "@/lib/db";
import { MapPin, Briefcase, ChevronRight, Building2, Search, ArrowRight, Layers, Compass } from "lucide-react";
import { getPrefectureName, getIndustryName } from "@/lib/locale-mapping";
import { getTranslations } from "@/lib/i18n";
import { Metadata } from "next";

export const revalidate = 86400; // 24-hour ISR static caching for instant sub-50ms transitions

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || 'ja';
  const isEn = locale === 'en';
  const isVi = locale === 'vi';

  const pageTitle = isVi
    ? "Danh mục doanh nghiệp Nhật Bản & Sơ đồ Trang web | Kigyou-list"
    : isEn
    ? "Japan Company Directory & Category Sitemap | Kigyou-list"
    : "日本全国の企業データ一覧・カテゴリ別検索 | Kigyou-list";

  const pageDesc = isVi
    ? "Tìm kiếm cơ sở dữ liệu doanh nghiệp theo 47 tỉnh thành Nhật Bản và tất cả các phân loại ngành nghề JSIC. Dữ liệu liên hệ, báo cáo tài chính và tín hiệu kinh doanh thực tế phong phú."
    : isEn
    ? "Search corporate databases by 47 Japanese prefectures and all 20 major JSIC industry classifications. Rich database of contact information, financials, and real-time business signals."
    : "日本全国47都道府県および全19種類のJSIC産業分類から企業データベースを検索できます。最新の会社情報、電話番号、財務指標、営業シグナル情報が豊富に収録されています。";

  const ogLocale = isEn ? "en_US" : isVi ? "vi_VN" : "ja_JP";

  return {
    title: pageTitle,
    description: pageDesc,
    alternates: {
      canonical: `/${locale}/directory`,
      languages: {
        ja: "/ja/directory",
        en: "/en/directory",
        vi: "/vi/directory",
        "x-default": "/ja/directory",
      }
    },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      url: `https://kigyoulist.com/${locale}/directory`,
      siteName: "Kigyou-list",
      locale: ogLocale,
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDesc,
      images: ["/og-image.png"],
    },
  };
}

// Standard Japanese 8 regions
const REGIONS = [
  {
    name: "北海道・東北",
    prefectures: ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
  },
  {
    name: "関東",
    prefectures: ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"],
  },
  {
    name: "中部",
    prefectures: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"],
  },
  {
    name: "近畿",
    prefectures: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"],
  },
  {
    name: "中国",
    prefectures: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"],
  },
  {
    name: "四国",
    prefectures: ["徳島県", "香川県", "愛媛県", "高知県"],
  },
  {
    name: "九州・沖縄",
    prefectures: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"],
  },
];

export default async function DirectoryPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || 'ja';
  const t = getTranslations(locale);

  const prefectures = await getPrefecturesWithCounts();

  // node:sqlite → null prototype → convert to plain objects
  const hierarchy: {
    code: string;
    name: string;
    totalCount: number;
    children: { code: string; name: string; count: number }[];
  }[] = JSON.parse(JSON.stringify(await getIndustriesHierarchy()));

  // Filter out 大分類 with 0 companies (no data yet) and sort alphabetically A->B->C...
  const activeHierarchy = hierarchy
    .filter((maj) => maj.totalCount > 0)
    .sort((a, b) => a.code.localeCompare(b.code));

  // Double check that children inside each major are sorted numerically 1-2-3...
  activeHierarchy.forEach((major) => {
    major.children.sort((a, b) => parseInt(a.code, 10) - parseInt(b.code, 10));
  });

  // Map database prefectures by name for quick lookup
  const prefMap = new Map(prefectures.map((p) => [p.name, p]));
  const totalCompaniesCount = prefectures.reduce((sum, p) => sum + (p.count || 0), 0);

  // Regional number formatter
  const formatCount = (count: number) => {
    const loc = locale === 'vi' ? 'vi-VN' : locale === 'en' ? 'en-US' : 'ja-JP';
    return count.toLocaleString(loc);
  };

  const d = locale === 'vi' ? {
    heroTag: "MỤC LỤC & SƠ ĐỒ DỮ LIỆU DOANH NGHIỆP",
    heroTitle: "Thư mục Doanh nghiệp Toàn quốc theo Danh mục",
    heroDesc: "Tra cứu toàn diện hệ thống dữ liệu doanh nghiệp Nhật Bản theo 47 tỉnh thành và phân loại ngành nghề JSIC tiêu chuẩn. Cập nhật chỉ số tài chính, thông tin liên hệ và tín hiệu kinh doanh.",
    prefTitle: "Tìm kiếm theo Khu vực & Tỉnh thành",
    prefDesc: "Dữ liệu pháp nhân theo từng địa bàn từ Hokkaido đến Okinawa.",
    indTitle: "Tìm kiếm theo Phân loại Ngành nghề (JSIC)",
    indDesc: "Phân loại chuẩn hóa theo hệ thống ngành công nghiệp Nhật Bản.",
    companySuffix: " doanh nghiệp",
    majorIndexLabel: "Tổng số: {count} doanh nghiệp",
    childIndexLabel: "{count} doanh nghiệp",
    regionTitle: "Khu vực & 47 Tỉnh thành",
    industryTitle: "Phân loại Ngành nghề JSIC",
    allInMajor: "Xem tất cả doanh nghiệp ngành {major}",
    statsPrefLabel: "Khu vực địa bàn",
    statsPrefValue: "47 Tỉnh thành (7 Vùng)",
    statsIndLabel: "Phân loại chuẩn JSIC",
    statsIndValue: "19 Đại ngành / 99+ Trung ngành",
    statsTotalLabel: "Tổng dữ liệu doanh nghiệp",
    statsTotalValue: `${formatCount(totalCompaniesCount)} DN`,
    jumpPref: "📍 Đến phần Tỉnh thành",
    jumpInd: "🏢 Đến phần Ngành nghề",
    jumpSearch: "🔍 Bộ lọc tìm kiếm nâng cao",
    ctaTitle: "Cần tìm kiếm danh sách khách hàng tiềm năng cụ thể hơn?",
    ctaDesc: "Sử dụng bộ lọc đa tiêu chí gồm vốn điều lệ, doanh thu, có form liên hệ hay không, cùng khả năng xuất CSV và gửi form tiếp cận tự động.",
    ctaSearchBtn: "Mở bộ lọc tìm kiếm doanh nghiệp",
    ctaMarketingBtn: "Giải pháp gửi Form tự động"
  } : locale === 'en' ? {
    heroTag: "SITEMAP INDEX & DIRECTORY HUB",
    heroTitle: "National Corporate Directory & Category Index",
    heroDesc: "Browse verified Japanese corporate records across all 47 prefectures and standardized JSIC industry classifications. Real-time access to financials, contact channels, and growth signals.",
    prefTitle: "Browse by Region & Prefecture",
    prefDesc: "Explore corporate databases across Japan from Hokkaido to Okinawa.",
    indTitle: "Browse by JSIC Industry Classification",
    indDesc: "Standardized segmentation based on Japan Standard Industrial Classification.",
    companySuffix: " companies",
    majorIndexLabel: "Total: {count} companies",
    childIndexLabel: "{count} companies",
    regionTitle: "Regions & 47 Prefectures",
    industryTitle: "JSIC Industry Hierarchy",
    allInMajor: "View all companies in {major}",
    statsPrefLabel: "Coverage Area",
    statsPrefValue: "47 Prefectures (7 Regions)",
    statsIndLabel: "JSIC Classification",
    statsIndValue: "19 Major / 99+ Minor Divisions",
    statsTotalLabel: "Recorded Enterprises",
    statsTotalValue: `${formatCount(totalCompaniesCount)} Companies`,
    jumpPref: "📍 Prefectures",
    jumpInd: "🏢 JSIC Industries",
    jumpSearch: "🔍 Advanced Search",
    ctaTitle: "Looking for specific target segments?",
    ctaDesc: "Filter by capital size, revenue, verified contact forms, and launch automated form outreach or export structured CSV lists directly.",
    ctaSearchBtn: "Open Advanced Search",
    ctaMarketingBtn: "Automated Form Outreach"
  } : {
    heroTag: "SITEMAP INDEX & DIRECTORY",
    heroTitle: "全国企業データ一覧・カテゴリ別インデックス",
    heroDesc: "日本全国47都道府県および全19種類のJSIC（日本標準産業分類）から企業データベースを網羅的に検索できます。最新の会社概要、所在地、財務推移、営業シグナルを体系的に収録しています。",
    prefTitle: "地域別・47都道府県から探す",
    prefDesc: "北海道から沖縄まで、各地域の法人データを網羅しています。",
    indTitle: "業界別・JSIC標準産業分類から探す",
    indDesc: "総務省の日本標準産業分類に基づき体系的に分類しています。",
    companySuffix: "社",
    majorIndexLabel: "計 {count}社",
    childIndexLabel: "{count}社",
    regionTitle: "地域別・47都道府県から探す",
    industryTitle: "業界別・JSIC産業分類から探す",
    allInMajor: "{major} の企業をすべて見る",
    statsPrefLabel: "収録対象エリア",
    statsPrefValue: "47 都道府県（7地方区分）",
    statsIndLabel: "標準産業分類",
    statsIndValue: "19 大分類 / 99 中分類",
    statsTotalLabel: "全国総収録企業数",
    statsTotalValue: `${formatCount(totalCompaniesCount)} 社`,
    jumpPref: "📍 都道府県一覧へ",
    jumpInd: "🏢 産業分類一覧へ",
    jumpSearch: "🔍 詳細条件で検索",
    ctaTitle: "条件を指定してさらに精密に企業を絞り込む",
    ctaDesc: "資本金、売上高、従業員規模、お問い合わせフォームの有無、決算推移などの複合条件で確度の高い営業リストを瞬時に抽出できます。",
    ctaSearchBtn: "詳細検索画面へ",
    ctaMarketingBtn: "自動フォーム営業について"
  };

  const categoryName = locale === 'en' ? "Directory" : locale === 'vi' ? "Danh mục Doanh nghiệp" : "企業データ一覧";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": locale === 'vi' ? "Trang chủ" : locale === 'en' ? "Home" : "ホーム",
        "item": `https://kigyoulist.com/${locale}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": categoryName,
        "item": `https://kigyoulist.com/${locale}/directory`
      }
    ]
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Visual Breadcrumbs */}
        <nav className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
          <Link href={`/${locale}`} className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
            {locale === 'vi' ? 'Trang chủ' : locale === 'en' ? 'Home' : 'ホーム'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200 font-semibold" aria-current="page">{categoryName}</span>
        </nav>

        {/* Page Hero Banner: Authoritative B2B Japanese Header */}
        <section className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-2.5 max-w-3xl">
              <div className="inline-flex items-center gap-2 w-fit px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[#1B4F8A] dark:text-blue-400 text-xs font-semibold tracking-wide shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A] dark:bg-blue-400" />
                <span>{d.heroTag}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                {d.heroTitle}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-normal leading-relaxed">
                {d.heroDesc}
              </p>
            </div>

            {/* Quick Jumper Pills */}
            <div className="flex flex-wrap sm:flex-col lg:flex-row gap-2 shrink-0 self-start lg:self-center">
              <a
                href="#regions"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-[#1B4F8A] hover:border-[#1B4F8A] transition-colors"
              >
                <span>{d.jumpPref}</span>
              </a>
              <a
                href="#industries"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-[#1B4F8A] hover:border-[#1B4F8A] transition-colors"
              >
                <span>{d.jumpInd}</span>
              </a>
              <Link
                href={`/${locale}/search`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#163e6d] text-white text-xs font-semibold shadow-2xs transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{d.jumpSearch}</span>
              </Link>
            </div>
          </div>

          {/* Key Metric Specs Matrix (スペック表風インジケーター) */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70">
              <div className="w-8 h-8 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-[#1B4F8A] dark:text-blue-400 shrink-0 shadow-2xs">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{d.statsPrefLabel}</span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{d.statsPrefValue}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70">
              <div className="w-8 h-8 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-[#1B4F8A] dark:text-blue-400 shrink-0 shadow-2xs">
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{d.statsIndLabel}</span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{d.statsIndValue}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70">
              <div className="w-8 h-8 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-[#1B4F8A] dark:text-blue-400 shrink-0 shadow-2xs">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{d.statsTotalLabel}</span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{d.statsTotalValue}</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: Regional Directory (47 Prefectures across 7 Regions) */}
        <section id="regions" className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-7 shadow-2xs scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-900/50 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {d.regionTitle}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {d.prefDesc}
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 whitespace-nowrap">
              47 都道府県（7地方区分）
            </span>
          </div>

          <div className="flex flex-col gap-5">
            {REGIONS.map((region) => {
              const regionPrefs = region.prefectures
                .map((pName) => prefMap.get(pName))
                .filter((p): p is { code: string; name: string; count: number } => !!p);

              if (regionPrefs.length === 0) return null;

              const localizedRegionName = t.regions[region.name as keyof typeof t.regions] || region.name;

              return (
                <div
                  key={region.name}
                  className="p-3.5 sm:p-4.5 bg-slate-50/70 dark:bg-slate-800/20 rounded-lg border border-slate-200/70 dark:border-slate-800/70"
                >
                  {/* Region Subheader with Corporate Left Accent */}
                  <div className="flex items-center justify-between mb-3 border-l-3 border-[#1B4F8A] pl-2.5 py-0.5">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 tracking-wide">
                      {localizedRegionName}
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {regionPrefs.length} 拠点
                    </span>
                  </div>

                  {/* Prefecture Grid: Responsive 2 to 6 columns with plenty of room */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5">
                    {regionPrefs.map((pref) => {
                      const localizedPrefName = getPrefectureName(pref.name, locale);

                      return (
                        <Link
                          key={pref.code}
                          href={`/${locale}/search?prefecture=${pref.code}`}
                          className="p-2.5 sm:p-3 bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-700 hover:border-[#1B4F8A] dark:hover:border-blue-500 rounded-lg text-left transition-all flex items-center justify-between group shadow-2xs hover:shadow-xs"
                        >
                          <div className="flex flex-col min-w-0 pr-1">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 truncate">
                              {localizedPrefName}
                            </span>
                            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                              {formatCount(pref.count)}{d.companySuffix}
                            </span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#1B4F8A] dark:text-slate-600 dark:group-hover:text-blue-400 shrink-0 transition-colors" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: JSIC Industry Classification Directory (Full-Width 2-Column Grid) */}
        <section id="industries" className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-7 shadow-2xs scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-900/50 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {d.industryTitle}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {d.indDesc}
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 whitespace-nowrap">
              {activeHierarchy.length} 大分類 / 99+ 中分類
            </span>
          </div>

          {/* JSIC Accordion List in Spacious 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 items-start">
            {activeHierarchy.map((major) => {
              const localizedMajorName = t.majorIndustries[major.code as keyof typeof t.majorIndustries] || major.name;

              return (
                <details
                  key={major.code}
                  className="group rounded-lg border border-slate-200/80 dark:border-slate-700/80 overflow-hidden bg-white dark:bg-[#161B22] shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors [&_summary::-webkit-details-marker]:hidden"
                >
                  {/* 大分類 summary */}
                  <summary className="flex items-center justify-between gap-3 px-3.5 py-3 bg-slate-50/80 hover:bg-slate-100/70 dark:bg-slate-800/40 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none list-none group-open:bg-slate-100/90 dark:group-open:bg-slate-800/70">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Code Badge */}
                      <div className="w-6 h-6 rounded-md bg-[#1B4F8A] text-white shrink-0 flex items-center justify-center shadow-2xs font-bold font-mono text-xs">
                        <span>{major.code}</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2 min-w-0 flex-1">
                        <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 truncate leading-snug">
                          {localizedMajorName}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap shrink-0">
                          {d.majorIndexLabel.replace("{count}", formatCount(major.totalCount))}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 group-open:rotate-90" />
                  </summary>

                  {/* 中分類 children */}
                  {major.children.filter((c) => c.count > 0).length > 0 && (
                    <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-[#161B22] border-t border-slate-200/70 dark:border-slate-700/70">
                      {/* Link to all companies in this major category */}
                      <Link
                        href={`/${locale}/search?industry=${major.code}`}
                        className="flex items-center justify-between gap-2 px-4 py-2.5 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 transition-colors group"
                      >
                        <span className="text-xs font-semibold text-[#1B4F8A] dark:text-blue-400">
                          {d.allInMajor.replace("{major}", localizedMajorName)}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#1B4F8A]/70 dark:text-blue-400/70 shrink-0" />
                      </Link>

                      {major.children
                        .filter((child) => child.count > 0)
                        .map((child) => {
                          const localizedChildName = getIndustryName(child.name, locale);

                          return (
                            <Link
                              key={child.code}
                              href={`/${locale}/search?industry=${child.code}`}
                              className="flex items-center justify-between gap-2 px-4 py-2 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-sm shrink-0 font-mono">
                                  {child.code}
                                </span>
                                <span className="text-xs font-normal text-slate-700 dark:text-slate-300 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 truncate">
                                  {localizedChildName}
                                </span>
                              </div>
                              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
                                {d.childIndexLabel.replace("{count}", formatCount(child.count))}
                              </span>
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </details>
              );
            })}
          </div>
        </section>

        {/* Bottom B2B Callout Strip: Flow to Advanced Search & Form Outreach */}
        <section className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs mt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex flex-col gap-1.5 max-w-2xl">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {d.ctaTitle}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                {d.ctaDesc}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href={`/${locale}/form-marketing`}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
              >
                {d.ctaMarketingBtn}
              </Link>
              <Link
                href={`/${locale}/search`}
                className="px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#163e6d] text-white text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
              >
                <span>{d.ctaSearchBtn}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
