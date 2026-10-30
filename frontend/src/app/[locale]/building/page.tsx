import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getOfficeBuildings, OfficeBuilding } from "@/lib/db";
import { Building2, MapPin, ChevronRight, Layers, ArrowRight, ShieldCheck, Users } from "lucide-react";
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
    ? `Major Office Buildings & Landmark Tower Directory in Japan (${currentYear}) | Kigyou-list`
    : locale === "vi"
    ? `Danh bạ các Tòa nhà Văn phòng & Cao ốc Trọng điểm Nhật Bản (${currentYear}) | Kigyou-list`
    : `【${currentYear}年最新】全国の主要オフィスビル・ランドマークタワー入居企業一覧 | Kigyou-list`;

  const description = locale === "en"
    ? "Explore headquarters and corporate tenants inside major Japanese landmark towers such as Roppongi Hills, Yebisu Garden Place, Toranomon Hills, and Grand Front Osaka."
    : locale === "vi"
    ? "Tra cứu danh sách doanh nghiệp và trụ sở chính đặt tại các cao ốc văn phòng biểu tượng của Nhật Bản như Roppongi Hills, Ebisu Garden Place, Toranomon Hills, Grand Front Osaka."
    : "六本木ヒルズ森タワー、恵比寿ガーデンプレイス、虎ノ門ヒルズ、グランフロント大阪など、日本を代表する主要超高層オフィスビルに入居する企業の最新名鑑。売上高、従業員数、電話番号を網羅。";

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
  const buildings = await getOfficeBuildings(100);

  // Group by region
  const tokyoBuildings = buildings.filter((b) => b.prefecture_code === "13");
  const kanagawaBuildings = buildings.filter((b) => b.prefecture_code === "14");
  const osakaBuildings = buildings.filter((b) => b.prefecture_code === "27");
  const otherBuildings = buildings.filter(
    (b) => !["13", "14", "27"].includes(b.prefecture_code)
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

  const renderBuildingGroup = (title: string, groupList: OfficeBuilding[]) => {
    if (groupList.length === 0) return null;
    return (
      <div className="mb-10">
        <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <MapPin className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {title}
          </h2>
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            ({groupList.length}棟)
          </span>
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
      </div>
    );
  };

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
        <div className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 text-[#1B4F8A] dark:text-blue-300 text-xs font-semibold mb-3">
                <Building2 className="w-3.5 h-3.5" />
                <span>オフィスビル・ランドマークタワー企業名鑑</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                {locale === "en"
                  ? "Major Office Buildings & Landmark Towers in Japan"
                  : locale === "vi"
                  ? "Danh mục Doanh nghiệp theo Tòa nhà Văn phòng & Cao ốc Biểu tượng"
                  : "全国の主要オフィスビル・ランドマークタワー入居企業一覧"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {locale === "en"
                  ? "Browse verified headquarters, corporations, and tenant directories across Japan's most prominent office complexes."
                  : locale === "vi"
                  ? "Danh bạ chính thức các doanh nghiệp, trụ sở pháp nhân đặt văn phòng tại các tòa nhà cao ốc thương mại và trung tâm tài chính hàng đầu Nhật Bản."
                  : "六本木ヒルズ、恵比寿ガーデンプレイス、虎ノ門ヒルズ、グランフロント大阪など、日本中枢のビジネス拠点に入居する企業をビル単位で網羅。登記情報、売上高、被保険者数を一覧で比較できます。"}
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

        {/* Region Groups */}
        {renderBuildingGroup("東京都心エリア（港区・渋谷区・千代田区・豊島区）", tokyoBuildings)}
        {renderBuildingGroup("神奈川・横浜エリア", kanagawaBuildings)}
        {renderBuildingGroup("関西・大阪エリア", osakaBuildings)}
        {renderBuildingGroup("その他のエリア", otherBuildings)}
      </main>

      <Footer />
    </div>
  );
}

