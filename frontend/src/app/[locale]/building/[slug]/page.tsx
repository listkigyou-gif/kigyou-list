import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  getOfficeBuildingBySlug, 
  getCompaniesByBuildingSlug,
  OfficeBuilding,
  Company
} from "@/lib/db";
import { 
  Building2, MapPin, ChevronRight, Phone, ShieldCheck, 
  Users, Coins, Briefcase, ExternalLink, Calendar, Layers, ArrowLeft
} from "lucide-react";
import { formatJapaneseCurrency } from "@/lib/currency";
import { Metadata } from "next";

export const revalidate = 3600; // 1-hour ISR cache

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "ja";
  const slug = resolvedParams.slug;
  const building = await getOfficeBuildingBySlug(slug);

  if (!building) {
    return notFound();
  }

  const currentYear = new Date().getFullYear();
  const tenantCountStr = building.tenant_company_count > 0 ? `（${building.tenant_company_count}社）` : "";

  const title = locale === "en"
    ? `${building.building_name} Tenant Companies & Directory (${currentYear}) | Kigyou-list`
    : locale === "vi"
    ? `Danh sách doanh nghiệp tại ${building.building_name} (${building.tenant_company_count} công ty) | Kigyou-list`
    : `【${currentYear}年最新】${building.building_name}の入居企業・テナント一覧${tenantCountStr} | Kigyou-list`;

  const description = locale === "en"
    ? `Directory of registered companies, headquarters, and offices located in ${building.building_name} (${building.street_address}). View revenue, corporate numbers, and executives.`
    : locale === "vi"
    ? `Danh bạ các doanh nghiệp và trụ sở chính đặt tại ${building.building_name} (${building.street_address}). Tra cứu mã số thuế, doanh thu, nhân sự và thông tin liên hệ.`
    : building.description || `${building.building_name}（${building.street_address}）に入居する本社・支店・登記企業の最新一覧。売上高、被保険者数、役員名、公式電話番号を網羅。`;

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/building/${slug}`,
      languages: {
        ja: `/ja/building/${slug}`,
        en: `/en/building/${slug}`,
        vi: `/vi/building/${slug}`,
        "x-default": `/ja/building/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `https://kigyoulist.com/${locale}/building/${slug}`,
      siteName: "Kigyou-list",
      locale: locale === "en" ? "en_US" : locale === "vi" ? "vi_VN" : "ja_JP",
      type: "website",
    },
  };
}

export default async function OfficeBuildingDetailPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const locale = resolvedParams.locale || "ja";
  const slug = resolvedParams.slug;
  const page = Math.max(1, parseInt(resolvedSearchParams.page || "1", 10));
  const pageSize = 24;

  const building = await getOfficeBuildingBySlug(slug);
  if (!building) {
    return notFound();
  }

  const { companies, total } = await getCompaniesByBuildingSlug(slug, page, pageSize);
  const totalPages = Math.ceil(total / pageSize);

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
        "name": locale === "en" ? "Office Buildings" : "主要オフィスビル一覧",
        "item": `https://kigyoulist.com/${locale}/building`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": building.building_name,
        "item": `https://kigyoulist.com/${locale}/building/${slug}`,
      },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${building.building_name} 入居企業一覧`,
    "description": building.description,
    "numberOfItems": total,
    "itemListElement": companies.map((c, idx) => ({
      "@type": "ListItem",
      "position": (page - 1) * pageSize + idx + 1,
      "name": c.company_name,
      "url": `https://kigyoulist.com/${locale}/company/${c.corporate_number}`,
    })),
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6 flex-wrap">
          <Link href={`/${locale}`} className="hover:text-[#1B4F8A] transition-colors">
            {locale === "en" ? "Home" : "ホーム"}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/${locale}/building`} className="hover:text-[#1B4F8A] transition-colors">
            {locale === "en" ? "Major Office Buildings" : "主要オフィスビル一覧"}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 dark:text-white font-medium truncate max-w-xs sm:max-w-md">
            {building.building_name}
          </span>
        </nav>

        {/* Building Hero Card */}
        <div className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-150 dark:border-slate-800">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-[#1B4F8A] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 px-2.5 py-0.5 rounded">
                  {building.city_name}
                </span>
                {building.total_floors && (
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    地上{building.total_floors}階建
                  </span>
                )}
                {building.postal_code && (
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    〒{building.postal_code}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-1.5">
                {building.building_name}
              </h1>
              {building.building_name_en && (
                <p className="text-xs text-slate-400 font-mono mb-3">
                  {building.building_name_en}
                </p>
              )}

              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <MapPin className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400 shrink-0" />
                <span>{building.street_address}</span>
              </div>
            </div>

            {/* Tenant count ribbon */}
            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {locale === "en" ? "Registered Tenants" : locale === "vi" ? "Số DN đặt trụ sở" : "入居企業数"}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#1B4F8A] dark:text-blue-400">
                  {total.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {locale === "en" ? "companies" : locale === "vi" ? "công ty" : "社"}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
            {building.description}
          </p>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {locale === "en" ? "Tenant Company List" : locale === "vi" ? "Danh sách doanh nghiệp trực thuộc" : "入居企業一覧"}
            </h2>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
              ({total.toLocaleString()}社)
            </span>
          </div>

          {totalPages > 1 && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              ページ {page} / {totalPages}
            </span>
          )}
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {companies.map((company) => {
            const hasInsured = company.insured_employee_count !== null && company.insured_employee_count !== undefined && company.insured_employee_count > 0;
            return (
              <Link
                key={company.corporate_number}
                href={`/${locale}/company/${company.corporate_number}`}
                className="p-5 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 hover:border-[#1B4F8A] dark:hover:border-blue-500 transition-all shadow-2xs hover:shadow-xs group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      法人番号: {company.corporate_number}
                    </span>
                    {company.has_invoice && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-1.5 py-0.5 rounded">
                        適格請求書
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">
                    {company.company_name}
                  </h3>

                  {company.representative_name && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5 truncate">
                      代表: {company.representative_position || "代表者"} {company.representative_name}
                    </p>
                  )}

                  {/* 3 Key Metrics Ribbon */}
                  <div className="grid grid-cols-3 gap-2 py-2 px-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 mb-3 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block">資本金</span>
                      <span className="text-xs font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {formatJapaneseCurrency(company.capital_amount, locale, true) || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        {hasInsured ? "被保険者" : "従業員"}
                      </span>
                      <span className="text-xs font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {hasInsured 
                          ? `${company.insured_employee_count}名`
                          : company.employee_count 
                          ? `${company.employee_count}名` 
                          : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">売上高</span>
                      <span className="text-xs font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {formatJapaneseCurrency(company.sales_amount, locale) || "-"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {company.full_address || company.street_address}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-3">
                  <span className="truncate max-w-[140px]">
                    {company.phone_number ? `TEL: ${company.phone_number}` : (company.prefecture_name || "")}
                  </span>
                  <span className="text-[#1B4F8A] dark:text-blue-400 font-medium inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>詳細を見る</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4">
            {page > 1 && (
              <Link
                href={`/${locale}/building/${slug}?page=${page - 1}`}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                前へ
              </Link>
            )}

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = i + 1;
                const isCurrent = p === page;
                return (
                  <Link
                    key={p}
                    href={`/${locale}/building/${slug}?page=${p}`}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-semibold transition-colors ${
                      isCurrent
                        ? "bg-[#1B4F8A] text-white"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </Link>
                );
              })}
            </div>

            {page < totalPages && (
              <Link
                href={`/${locale}/building/${slug}?page=${page + 1}`}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                次へ
              </Link>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

