import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  Building2, MapPin, Phone, Globe, Mail, Printer, Calendar, 
  Briefcase, FileText, ChevronRight, BarChart3, Clock
} from 'lucide-react';
import { formatShortDate, toISOStringLocal } from '@/lib/dateUtils';
import { 
  getCompanyByNumber, getCompanyFinancials, 
  getCompanySignals, getRelatedCompanies, getCompanyIndustry 
} from '@/lib/db';
import { UnlockCard } from '@/components/UnlockCard';
import { ObfuscatedPhone } from '@/components/ObfuscatedPhone';
import { CompanyActions } from '@/components/CompanyActions';
import { UnlockCTA } from '@/components/UnlockCTA';
import { Footer } from '@/components/Footer';
import { CompanyFinancials } from '@/components/CompanyFinancials';
import { CompanySignalsTimeline } from '@/components/CompanySignalsTimeline';
import { getTranslations } from '@/lib/i18n';
import { prefectureJaToEn, industryJaToEn, translatePosition, formatEnglishAddress, formatEnglishDate, getPrefectureName, getIndustryName } from '@/lib/locale-mapping';

export const revalidate = 600; // Cache profiles for 10 minutes, ISR enabled

function generateDynamicSummary(
  company: any,
  locale: string,
  industryName: string | null,
  prefectureName: string | null
): string {
  // Bypassed company.business_summary to keep SEO description clean and professional
  // if (company.business_summary) {
  //   return company.business_summary;
  // }
  const companyName = locale === 'en' && company.company_name_en ? company.company_name_en : company.company_name;
  const prefName = getPrefectureName(prefectureName, locale);
  const industryMappedName = getIndustryName(industryName, locale);

  if (locale === 'en') {
    const industryPart = industryMappedName ? ` in the field of ${industryMappedName}` : "";
    const locationPart = prefName ? ` in ${prefName}` : "";
    return `${companyName} is a company operating${industryPart}${locationPart}. This page displays the detailed corporate profile, tax ID, address map, and contact information (phone, FAX, email) in the latest version.`;
  } else if (locale === 'vi') {
    const industryPart = industryMappedName ? ` trong lĩnh vực ${industryMappedName}` : "";
    const locationPart = prefName ? ` tại ${prefName}` : "";
    return `${companyName} là doanh nghiệp hoạt động${industryPart}${locationPart}. Trang này hiển thị hồ sơ chi tiết, mã số thuế, bản đồ địa chỉ và thông tin liên hệ (điện thoại, FAX, email) mới nhất của công ty.`;
  } else {
    const industryPart = industryMappedName ? `${industryMappedName}の分野` : "ビジネス";
    const locationPart = prefName ? `${prefName}` : "日本";
    return `${companyName}は、${locationPart}で${industryPart}で活動している企業です。当ページでは、法` + "人" + `の基本情報、法人番号、地図、連絡先情報（電話番号、FAX、メールアドレス）などの詳細情報を最新版で掲載しています。`;
  }
}

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const companyId = resolvedParams.id;
  const locale = resolvedParams.locale || 'ja';

  if (!/^\d{13}$/.test(companyId)) {
    return {
      title: locale === 'en' ? 'Company Not Found | Kigyou-list' : locale === 'vi' ? 'Không tìm thấy doanh nghiệp | Kigyou-list' : '企業が見つかりません | Kigyou-list',
    };
  }

  const [company, industryDetails] = await Promise.all([
    getCompanyByNumber(companyId),
    getCompanyIndustry(companyId)
  ]);

  if (!company) {
    return {
      title: locale === 'en' ? 'Company Not Found | Kigyou-list' : locale === 'vi' ? 'Không tìm thấy doanh nghiệp | Kigyou-list' : '企業が見つかりません | Kigyou-list',
    };
  }

  const companyName = locale === 'en' && company.company_name_en ? company.company_name_en : company.company_name;
  const industryName = industryDetails ? industryDetails.industry_name : null;
  const summary = generateDynamicSummary(company, locale, industryName, company.prefecture_name);

  if (locale === 'en') {
    return {
      title: `${companyName} - Company Profile, Financials, Contact | Kigyou-list`,
      description: summary,
      alternates: {
        canonical: `/en/company/${companyId}`,
        languages: {
          ja: `/ja/company/${companyId}`,
          en: `/en/company/${companyId}`,
          vi: `/vi/company/${companyId}`,
        }
      },
    };
  } else if (locale === 'vi') {
    return {
      title: `${companyName} - Thông tin doanh nghiệp, tài chính, liên hệ | Kigyou-list`,
      description: summary,
      alternates: {
        canonical: `/vi/company/${companyId}`,
        languages: {
          ja: `/ja/company/${companyId}`,
          en: `/en/company/${companyId}`,
          vi: `/vi/company/${companyId}`,
        }
      },
    };
  } else {
    return {
      title: `${companyName} - 企業基本情報・財務情報・連絡先 | Kigyou-list`,
      description: summary,
      alternates: {
        canonical: `/ja/company/${companyId}`,
        languages: {
          ja: `/ja/company/${companyId}`,
          en: `/en/company/${companyId}`,
          vi: `/vi/company/${companyId}`,
        }
      },
    };
  }
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const companyId = resolvedParams.id;
  const locale = resolvedParams.locale || 'ja';

  if (!/^\d{13}$/.test(companyId)) {
    return notFound();
  }

  // 1. Fetch Company details, financials, signals, and industry details in parallel
  const [company, financials, signals, industryDetails] = await Promise.all([
    getCompanyByNumber(companyId),
    getCompanyFinancials(companyId),
    getCompanySignals(companyId),
    getCompanyIndustry(companyId)
  ]);

  if (!company) {
    return notFound();
  }

  const t = getTranslations(locale);

  // 2. Resolve primary industry details
  let industryCode: string | null = null;
  let industryName: string | null = null;
  if (industryDetails) {
    industryCode = industryDetails.industry_code;
    industryName = industryDetails.industry_name;
  }

  // 3. Fetch related companies for internal linking matrix (SEO) (using prefecture_code for indexed fast search)
  const { sameIndustry, nearby } = await getRelatedCompanies(
    companyId, 
    industryCode ? [industryCode] : [], 
    company.prefecture_code
  );

  // Find a representative industry for the breadcrumb
  const categoryPath = industryCode 
    ? `/${locale}/industry/${industryCode}/location/${company.prefecture_code}`
    : `/${locale}/search?prefecture=${company.prefecture_code}`;

  const prefName = getPrefectureName(company.prefecture_name, locale);
  const industryMappedName = getIndustryName(industryName, locale);

  const categoryName = industryMappedName
    ? (locale === 'en' ? `${prefName} ${industryMappedName} Companies` : locale === 'vi' ? `Danh sách doanh nghiệp ${industryMappedName} tại ${prefName}` : `${prefName}の${industryMappedName}企業一覧`)
    : (locale === 'en' ? `${prefName} Companies` : locale === 'vi' ? `Danh sách doanh nghiệp tại ${prefName}` : `${prefName}の企業一覧`);

  const companyName = locale === 'en' && company.company_name_en ? company.company_name_en : company.company_name;
  const summary = generateDynamicSummary(company, locale, industryName, company.prefecture_name);

  // 5. Generate Schema Markup JSON-LD for Corporation
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "Corporation",
    "name": companyName,
    "taxID": company.corporate_number,
    "description": summary,
    "dateModified": toISOStringLocal(company.updated_at),
    "address": {
      "@type": "PostalAddress",
      "postalCode": company.postal_code || "",
      "addressRegion": prefName || "",
      "addressLocality": company.city_name || "",
      "streetAddress": company.street_address || "",
      "addressCountry": "JP"
    },
    "telephone": company.phone_number || undefined,
    "faxNumber": company.fax_number || undefined,
    "email": company.email_address || undefined,
    "url": company.website_url || undefined,
    "foundingDate": company.establishment_date || undefined
  };

  // 6. Generate BreadcrumbList JSON-LD
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": locale === 'en' ? "Home" : "ホーム",
        "item": `https://kigyoulist.com/${locale}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": t.footer.directory,
        "item": `https://kigyoulist.com/${locale}/directory`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": categoryName,
        "item": `https://kigyoulist.com${categoryPath}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": companyName,
        "item": `https://kigyoulist.com/${locale}/company/${company.corporate_number}`
      }
    ]
  };

  const localizedStatus = locale === 'en' 
    ? (company.status === '活動中' ? 'Active' : company.status === '閉鎖' ? 'Closed' : company.status === '解散' ? 'Dissolved' : company.status)
    : company.status;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 dark:bg-[#0D1117] dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/${locale}/search`} className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </Link>
            <Link href={`/${locale}/search`} className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Kigyou<span className="text-secondary">-list</span>
            </Link>
          </div>

          <Link
            href={`/${locale}/search`}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 dark:text-slate-300 dark:border-slate-800 dark:hover:border-slate-700 rounded-xl transition-all whitespace-nowrap"
          >
            <span className="hidden sm:inline">{t.company.backToSearch}</span>
            <span className="sm:hidden">{locale === 'en' ? '← Search' : '← 戻る'}</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 min-w-0 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
        {/* Visual Breadcrumbs */}
        <nav className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors shrink-0">
            {locale === 'en' ? 'Home' : 'ホーム'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <Link href={`/${locale}/directory`} className="hover:text-primary transition-colors shrink-0">
            {t.footer.directory}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <Link href={categoryPath} className="hover:text-primary transition-colors truncate max-w-[120px] sm:max-w-xs shrink-0" title={categoryName}>{categoryName}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200 truncate max-w-[120px] sm:max-w-[240px]" aria-current="page" title={companyName}>{companyName}</span>
        </nav>

        {/* Company Title Banner */}
        <section className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 dark:from-[#1C2128] dark:to-[#171B21] dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex flex-col md:flex-row gap-5 items-start">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shrink-0 shadow-md shadow-primary/10 border border-white/20">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full border shadow-sm ${
                  company.status === '閉鎖' || company.status === '解散'
                    ? 'text-rose-800 bg-rose-100 dark:bg-rose-950/40 dark:text-rose-450 border-rose-250 dark:border-rose-900/40'
                    : 'text-emerald-800 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-450 border-emerald-250 dark:border-emerald-900/40'
                }`}>
                  {localizedStatus}
                </span>
                {industryMappedName && (
                  <Link 
                    href={`/${locale}/industry/${industryCode}/location/${company.prefecture_code}`}
                    className="text-[10px] font-black tracking-wider uppercase text-slate-600 hover:text-primary bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-secondary px-2.5 py-0.5 rounded-full shadow-sm transition-colors"
                  >
                    {industryMappedName}
                  </Link>
                )}
                {/* Data freshness trust signal — design system: accent gold (#F2A30F) */}
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#B07500] bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-200/70 dark:border-amber-900/40 shadow-sm">
                  <Clock className="w-3.5 h-3.5 text-[#F2A30F] animate-pulse" />
                  {locale === 'en' ? 'Updated' : locale === 'vi' ? 'Cập nhật' : '更新'}: {formatShortDate(company.updated_at)}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight break-words">
                {companyName}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-bold">
                <span className="font-mono">
                  {t.company.corporateNumber.replace('{number}', company.corporate_number)}
                </span>
                <time
                  dateTime={toISOStringLocal(company.updated_at)}
                  className="flex items-center gap-1 text-slate-500 font-bold"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {t.company.updatedAt.replace('{date}', formatShortDate(company.updated_at))}
                </time>
              </div>
            </div>
          </div>

          <CompanyActions corporateNumber={company.corporate_number} />
        </section>

        {/* 2-Column Split Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 2 COLUMNS: Profile, Financials, Signals */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* 1. Basic Info Section */}
            <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {t.company.basicInfo}
              </h2>

              {/* Dynamic Summary/Overview paragraph for SEO and users - Hidden for now as requested by user */}
              {/*
              <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-350 font-semibold">
                  {summary}
                </p>
              </div>
              */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30">
                  <span className="text-slate-400 text-xs block mb-1">{t.company.companyName}</span>
                  <strong className="text-slate-850 dark:text-slate-100">{companyName}</strong>
                </div>
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30">
                  <span className="text-slate-400 text-xs block mb-1">{t.company.kana}</span>
                  <span className="text-slate-800 dark:text-slate-200">{company.company_name_kana || t.company.unregistered}</span>
                </div>
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30">
                  <span className="text-slate-400 text-xs block mb-1">{t.company.address}</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {company.full_address || t.company.unregistered}
                  </span>
                </div>
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30">
                  <span className="text-slate-400 text-xs block mb-1">{t.company.representative}</span>
                  <strong className="text-slate-850 dark:text-slate-100">
                    {company.representative_name 
                      ? `${(locale === 'en' || locale === 'vi') && company.representative_position ? `${translatePosition(company.representative_position, locale)} ` : ""}${company.representative_name}`
                      : t.company.unregistered}
                  </strong>
                </div>
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30">
                  <span className="text-slate-400 text-xs block mb-1">{t.company.capital}</span>
                  <strong className="text-slate-850 dark:text-slate-100">
                    {company.capital_amount ? (locale === 'en' ? `¥${(company.capital_amount / 1000000).toLocaleString(undefined, {maximumFractionDigits: 2})} Million JPY` : locale === 'vi' ? `¥${(company.capital_amount / 1000000).toLocaleString(undefined, {maximumFractionDigits: 2})} triệu JPY` : `${(company.capital_amount / 10000).toLocaleString()}万円`) : t.company.unregistered}
                  </strong>
                </div>
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30">
                  <span className="text-slate-400 text-xs block mb-1">{t.company.employees}</span>
                  <strong className="text-slate-850 dark:text-slate-100">
                    {company.employee_count ? (locale === 'en' ? `${company.employee_count.toLocaleString()} employees` : locale === 'vi' ? `${company.employee_count.toLocaleString()} nhân viên` : `${company.employee_count}名`) : t.company.unregistered}
                  </strong>
                </div>
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30">
                  <span className="text-slate-400 text-xs block mb-1">{t.company.establishmentDate}</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {locale === 'en' && company.establishment_date ? formatEnglishDate(company.establishment_date) : (company.establishment_date || t.company.unregistered)}
                  </span>
                </div>
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30">
                  <span className="text-slate-400 text-xs block mb-1">{t.company.tags}</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {company.jigyo_shumoku
                      ? company.jigyo_shumoku
                          .replace(' (AI確認済)', '')
                          .split(',')
                          .map((tag) => {
                            const cleanTag = tag.trim();
                            return getIndustryName(cleanTag, locale);
                          })
                          .join(', ')
                      : t.company.unregistered}
                  </span>
                </div>
              </div>
            </section>

            {/* 2. Financial Chart Section */}
            {financials && financials.length > 0 && (
              <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  {t.company.financialTrend}
                </h2>

                <CompanyFinancials financials={financials} />
              </section>
            )}

            {/* 3. Intent Signals Section */}
            <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                {t.company.signalTimeline}
              </h2>

              {signals.length > 0 ? (
                <CompanySignalsTimeline signals={signals} />
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  {t.company.noSignals}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT 1 COLUMN: Contact Details & Internal Links */}
          <div className="flex flex-col gap-8">
            
            {/* Contact Details Panel */}
            <section id="contact" className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                {t.company.contactInfo}
              </h2>

              <div className="flex flex-col gap-5 text-sm">
                
                {/* 1. Phone number (PUBLIC) */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">{t.company.phonePublic}</span>
                    {company.phone_number ? (
                      <ObfuscatedPhone encodedPhone={btoa(company.phone_number)} />
                    ) : (
                      <strong className="text-slate-800 dark:text-slate-100 text-base font-mono">{t.company.unregistered}</strong>
                    )}
                  </div>
                </div>

                {/* Honeypot trap link for scrapers (invisible to actual users) */}
                <a 
                  href="/api/sys-check" 
                  style={{ display: 'none' }} 
                  tabIndex={-1} 
                  aria-hidden="true"
                  data-nosnippet
                >
                  {t.company.legalIntegrityLink || "システム整合性の検証リンク (System Health Verification)"}
                </a>

                {/* 2. Website URL (PUBLIC) */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-slate-400 block mb-0.5">{t.company.websitePublic}</span>
                    {company.website_url ? (
                      <a 
                        href={company.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium break-all dark:text-secondary block"
                      >
                        {company.website_url}
                      </a>
                    ) : (
                      <span className="text-slate-400 font-medium">{t.company.none}</span>
                    )}
                  </div>
                </div>

                {/* 3. FAX number (BLURRED) */}
                <div className="flex items-start gap-3 relative">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">
                      {t.company.fax}
                    </span>
                    <div data-nosnippet>
                      <UnlockCard type="inline" fallbackText={locale === 'en' ? "03-3456-7890 (Sample)" : "03-3456-7890 (サンプル)"}>
                        <span className="font-mono text-slate-800 dark:text-slate-100 font-semibold">
                          {company.fax_number || t.company.unregistered}
                        </span>
                      </UnlockCard>
                    </div>
                  </div>
                </div>

                {/* 4. Email address (BLURRED) */}
                <div className="flex items-start gap-3 relative">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">
                      {t.company.email}
                    </span>
                    <div data-nosnippet>
                      <UnlockCard type="inline" requiredPlan="pro" fallbackText={locale === 'en' ? "contact@company.co.jp (Sample)" : "contact@company.co.jp (サンプル)"}>
                        <span className="text-slate-800 dark:text-slate-100 font-semibold break-all">
                          {company.email_address || t.company.unregistered}
                        </span>
                      </UnlockCard>
                    </div>
                  </div>
                </div>

                {/* Free Registration Call to Action */}
                <div data-nosnippet>
                  <UnlockCTA />
                </div>
              </div>
            </section>

            {/* SEO internal linking matrix */}
            <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
              
              {/* Same Industry Links (同業他社) */}
              <div>
                <h3 className="font-extrabold text-sm text-slate-850 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  {t.company.sameIndustry}
                </h3>
                {sameIndustry.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {sameIndustry.map(item => (
                      <Link 
                        key={item.corporate_number} 
                        href={`/${locale}/company/${item.corporate_number}`}
                        className="text-xs font-medium text-slate-600 hover:text-primary dark:text-slate-400 dark:hover:text-secondary flex items-center justify-between group transition-colors"
                      >
                        <span className="truncate max-w-[85%]">
                          {locale === 'en' && item.company_name_en ? item.company_name_en : item.company_name}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">{t.company.noRelatedSameIndustry}</span>
                )}
              </div>

              {/* Nearby Prefecture Links (近隣企業) */}
              <div>
                <h3 className="font-extrabold text-sm text-slate-850 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {t.company.nearby}
                </h3>
                {nearby.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {nearby.map(item => (
                      <Link 
                        key={item.corporate_number} 
                        href={`/${locale}/company/${item.corporate_number}`}
                        className="text-xs font-medium text-slate-600 hover:text-primary dark:text-slate-400 dark:hover:text-secondary flex items-center justify-between group transition-colors"
                      >
                        <span className="truncate max-w-[85%]">
                          {locale === 'en' && item.company_name_en ? item.company_name_en : item.company_name}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">{t.company.noRelatedNearby}</span>
                )}
              </div>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
