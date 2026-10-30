import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getOfficeBuildings, OfficeBuilding } from "@/lib/db";
import { Building2, MapPin, ChevronRight, Layers, ArrowRight, ShieldCheck, Users, Compass } from "lucide-react";
import { Metadata } from "next";

export const revalidate = 86400; // 24-hour ISR caching

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "ja";
  const currentYear = new Date().getFullYear();

  const title = locale === "en"
    ? `Top Office Buildings & Landmark Towers Japan (${currentYear}) | Kigyou-list`
    : locale === "vi"
      ? `Top Cao ốc Văn phòng Biểu tượng Nhật Bản (${currentYear}) | Kigyou-list`
      : `【${currentYear}年最新】全国の主要オフィスビル・ランドマークタワーTOP100入居企業一覧 | Kigyou-list`;

  const description = locale === "en"
    ? "Explore headquarters, enterprises, and tenant directories inside Japan's Top 100 major office buildings and skyscrapers across Tokyo, Osaka, Nagoya, Yokohama, and Fukuoka."
    : locale === "vi"
      ? "Danh bạ chính thức 100 tòa nhà văn phòng và cao ốc biểu tượng hàng đầu Nhật Bản (Tokyo, Osaka, Nagoya, Yokohama, Fukuoka). Tra cứu danh sách công ty, trụ sở và nhân sự đóng bảo hiểm."
      : "麻布台ヒルズ森JPタワー、六本木ヒルズ、丸の内ビル、グランフロント大阪、JRゲートタワー、天神ビジネスセンターなど、日本全国の主要超高層オフィスビルTOP100に入居する企業の最新名鑑。売上高、従業員数、電話番号を網羅。";

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/building`,
      languages: {
        ja: "/ja/building",
        en: "/en/building",
        vi: "/vi/building",
        "x-default": "/ja/building",
      },
    },
    openGraph: {
      title,
      description,
      url: `https://kigyoulist.com/${locale}/building`,
      siteName: "Kigyou-list",
      locale: locale === "en" ? "en_US" : locale === "vi" ? "vi_VN" : "ja_JP",
      type: "website",
    },
  };
}

export default async function OfficeBuildingsIndexPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "ja";
  const buildings = await getOfficeBuildings(250);

  // Group by strategic economic regions
  const tokyoBuildings = buildings.filter((b) => b.prefecture_code === "13");
  const kanagawaBuildings = buildings.filter((b) => b.prefecture_code === "14");
  const osakaBuildings = buildings.filter((b) => b.prefecture_code === "27");
  const aichiBuildings = buildings.filter((b) => b.prefecture_code === "23");
  const fukuokaBuildings = buildings.filter((b) => b.prefecture_code === "40");
  const kansaiOtherBuildings = buildings.filter((b) => ["26", "28"].includes(b.prefecture_code));
  const otherBuildings = buildings.filter(
    (b) => !["13", "14", "27", "23", "40", "26", "28"].includes(b.prefecture_code)
  );

  const totalTenants = buildings.reduce((acc, b) => acc + (b.tenant_company_count || 0), 0);

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
        "name": locale === "en" ? "Directory" : "企業一覧",
        "item": `https://kigyoulist.com/${locale}/directory`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": locale === "en" ? "Office Buildings" : "主要オフィスビル一覧",
        "item": `https://kigyoulist.com/${locale}/building`,
      },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": locale === "en" ? "Major Office Buildings in Japan" : "全国の主要オフィスビル・ランドマークタワー名鑑",
    "description": "Directory of tenant companies headquartered in major Japanese office buildings.",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": buildings.map((b, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "name": b.building_name,
        "url": `https://kigyoulist.com/${locale}/building/${b.building_slug}`,
      })),
    },
  };

  const renderBuildingGroup = (id: string, title: string, subtitle: string, groupList: OfficeBuilding[]) => {
    if (groupList.length === 0) return null;
    const groupTenants = groupList.reduce((acc, b) => acc + (b.tenant_company_count || 0), 0);
    return (
      <section id={id} className="mb-12 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-5 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400 shrink-0" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              ({groupList.length}棟)
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>{subtitle}</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
              入居企業計: {groupTenants.toLocaleString()}社
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupList.map((building) => (
            <Link
              key={building.building_slug}
              href={`/${locale}/building/${building.building_slug}`}
              className="p-5 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 hover:border-[#1B4F8A] dark:hover:border-blue-500 transition-all shadow-2xs hover:shadow-xs group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[11px] font-semibold text-[#1B4F8A] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 px-2 py-0.5 rounded">
                    {building.city_name}
                  </span>
                  <span className="text-xs font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                    {building.tenant_company_count.toLocaleString()}社入居
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">
                  {building.building_name}
                </h3>
                {building.building_name_en && (
                  <p className="text-xs text-slate-400 font-mono line-clamp-1 mb-2">
                    {building.building_name_en}
                  </p>
                )}

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {building.description || building.street_address}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="text-[11px]">
                  {building.total_floors ? `地上${building.total_floors}階建` : "大型オフィス"}
                </span>
                <span className="text-[#1B4F8A] dark:text-blue-400 font-medium inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>{locale === "en" ? "View Tenants" : locale === "vi" ? "Xem doanh nghiệp" : "入居企業を見る"}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  };

  const navRegions = [
    { id: "region-tokyo", label: "東京都", count: tokyoBuildings.length },
    { id: "region-kanagawa", label: "神奈川県", count: kanagawaBuildings.length },
    { id: "region-osaka", label: "大阪府", count: osakaBuildings.length },
    { id: "region-aichi", label: "愛知県（名古屋）", count: aichiBuildings.length },
    { id: "region-fukuoka", label: "福岡県", count: fukuokaBuildings.length },
    { id: "region-kansai-other", label: "京都・兵庫", count: kansaiOtherBuildings.length },
    { id: "region-other", label: "北海道・東北・中国", count: otherBuildings.length },
  ].filter((r) => r.count > 0);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6">
          <Link href={`/${locale}`} className="hover:text-[#1B4F8A] transition-colors">
            {locale === "en" ? "Home" : "ホーム"}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/${locale}/directory`} className="hover:text-[#1B4F8A] transition-colors">
            {locale === "en" ? "Directory" : "企業一覧"}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 dark:text-white font-medium">
            {locale === "en" ? "Major Office Buildings" : "主要オフィスビル一覧"}
          </span>
        </nav>

        {/* Hero Banner */}
        <div className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 mb-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 text-[#1B4F8A] dark:text-blue-300 text-xs font-semibold mb-3">
                <Building2 className="w-3.5 h-3.5" />
                <span>オフィスビル・ランドマークタワー企業名鑑</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                {locale === "en"
                  ? "Top 100 Major Office Buildings & Landmark Towers in Japan"
                  : locale === "vi"
                    ? "Top 100 Tòa nhà Văn phòng & Cao ốc Biểu tượng Nhật Bản"
                    : "全国の主要オフィスビル・ランドマークタワーTOP100入居企業一覧"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {locale === "en"
                  ? "Browse verified headquarters, corporations, and tenant directories across Japan's Top 100 prominent office complexes."
                  : locale === "vi"
                    ? "Danh bạ chính thức các doanh nghiệp, trụ sở pháp nhân đặt văn phòng tại Top 100 tòa nhà cao ốc thương mại và trung tâm tài chính hàng đầu Nhật Bản."
                    : "麻布台ヒルズ森JPタワー、六本木ヒルズ、丸の内ビル、グランフロント大阪、JRゲートタワー、天神ビジネスセンターなど、日本全国の主要超高層オフィスビルTOP100に入居する企業をビル単位で網羅。登記情報、売上高、被保険者数を一覧で比較できます。"}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex sm:flex-col gap-4 sm:gap-2 shrink-0 pt-2 sm:pt-0 sm:border-l sm:border-slate-200 sm:dark:border-slate-800 sm:pl-6">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">対象主要ビル</span>
                <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {buildings.length}棟
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">入居企業数</span>
                <span className="text-xl font-bold font-mono tabular-nums text-[#1B4F8A] dark:text-blue-400">
                  {totalTenants.toLocaleString()}社
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Region Anchor Navigation Pills */}
        <div className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-xl p-3 mb-8 shadow-2xs overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 px-2 py-1 font-medium">
              <Compass className="w-3.5 h-3.5" />
              <span>地域で絞り込み:</span>
            </div>
            {navRegions.map((region) => (
              <a
                key={region.id}
                href={`#${region.id}`}
                className="px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-[#1B4F8A] dark:hover:border-blue-400 hover:text-[#1B4F8A] dark:hover:text-blue-300 bg-slate-50 dark:bg-slate-900/60 font-medium transition-all"
              >
                {region.label} <span className="font-mono text-[11px] opacity-75">({region.count})</span>
              </a>
            ))}
          </div>
        </div>

        {/* Region Groups */}
        {renderBuildingGroup("region-tokyo", "東京都（丸の内・大手町・港区・新宿・渋谷・豊島・江東）", "日本のビジネス中枢を形成する首都圏超高層ビル群", tokyoBuildings)}
        {renderBuildingGroup("region-kanagawa", "神奈川県（横浜みなとみらい・新横浜・川崎）", "湾岸イノベーションと先端R&D拠点が集積する国際港湾都市", kanagawaBuildings)}
        {renderBuildingGroup("region-osaka", "大阪府（梅田・中之島・本町・難波・阿倍野）", "西日本最大の経済中枢と御堂筋沿道のランドマークタワー", osakaBuildings)}
        {renderBuildingGroup("region-aichi", "愛知県（名駅・栄）", "世界最高峰のモノづくり・自動車産業を支える中部中核拠点", aichiBuildings)}
        {renderBuildingGroup("region-fukuoka", "福岡県（天神・博多）", "天神ビッグバン・博多コネクティッドで躍進するアジアの玄関口", fukuokaBuildings)}
        {renderBuildingGroup("region-kansai-other", "関西広域（京都・兵庫・神戸）", "古都京都の玄関口と神戸港を望む国際ビジネス拠点", kansaiOtherBuildings)}
        {renderBuildingGroup("region-other", "主要地方都市（北海道・宮城・広島）", "北日本・東北・中国地方の経済を牽引する中核ランドマーク", otherBuildings)}
      </main>

      <Footer />
    </div>
  );
}
