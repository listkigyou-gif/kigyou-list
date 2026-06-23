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
  getCompanySignals, getRelatedCompanies, getCompanyIndustries 
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

function formatJapaneseDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[0]}年${parts[1]}月${parts[2]}日`;
  }
  if (/^\d{4}$/.test(dateStr)) {
    return `${dateStr}年`;
  }
  return dateStr;
}

function formatVietnameseDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function generateDynamicSummary(
  company: any,
  locale: string,
  industryName: string | null,
  prefectureName: string | null,
  isOnPage: boolean = false
): string {
  const companyName = locale === 'en' && company.company_name_en ? company.company_name_en : company.company_name;
  
  // Format address: prefer full_address, fallback to combining components
  const fullAddress = company.full_address || 
    `${company.prefecture_name || ''}${company.city_name || ''}${company.street_address || ''}`;

  if (locale === 'en') {
    const isYearOnly = /^\d{4}$/.test(company.establishment_date || "");
    const datePrep = isYearOnly ? " in " : " on ";
    const datePart = company.establishment_date ? ` Registered${datePrep}${formatEnglishDate(company.establishment_date)},` : "";
    const addressPart = fullAddress ? ` located at ${fullAddress}` : "";
    const phonePart = company.phone_number ? ` Contact phone: ${company.phone_number}.` : "";
    if (isOnPage) {
      return `${companyName} is a corporation${addressPart} with corporate/tax ID ${company.corporate_number}.${datePart}${phonePart}`;
    }
    return `${companyName} is a corporation${addressPart} with corporate/tax ID ${company.corporate_number}.${datePart}${phonePart} This page displays the latest contact details (phone, FAX, email), financial profile, and corporate index history.`;
  } else if (locale === 'vi') {
    const isYearOnly = /^\d{4}$/.test(company.establishment_date || "");
    const datePrefix = isYearOnly ? " vào năm " : " ngày ";
    const datePart = company.establishment_date ? ` được thành lập${datePrefix}${formatVietnameseDate(company.establishment_date)},` : "";
    const addressPart = fullAddress ? ` tọa lạc tại địa chỉ ${fullAddress}` : "";
    const phonePart = company.phone_number ? ` Số điện thoại liên hệ: ${company.phone_number}.` : "";
    if (isOnPage) {
      return `${companyName} là doanh nghiệp${addressPart}, có mã số thuế/pháp nhân là ${company.corporate_number}. Doanh nghiệp${datePart}${phonePart}`;
    }
    return `${companyName} là doanh nghiệp${addressPart}, có mã số thuế/pháp nhân là ${company.corporate_number}. Doanh nghiệp${datePart}${phonePart} Cập nhật đầy đủ thông tin liên hệ (điện thoại, FAX, email) và biểu đồ tài chính mới nhất.`;
  } else {
    // Japanese locale (ja) - Mirroring G-Search dynamic format closely
    const kanaPart = company.company_name_kana ? `（${company.company_name_kana}）` : "";
    const addressPart = fullAddress ? `${fullAddress}に所在する` : "";
    const datePart = company.establishment_date ? `${formatJapaneseDate(company.establishment_date)}に法人番号が指定され、` : "";
    const phonePart = company.phone_number ? `電話番号:${company.phone_number}。` : "";
    
    if (isOnPage) {
      return `${companyName}${kanaPart}は、${addressPart}法人番号:${company.corporate_number}の法人です。${datePart}${phonePart}`;
    }
    return `${companyName}${kanaPart}は、${addressPart}法人番号:${company.corporate_number}の法人です。${datePart}${phonePart}最新の住所、電話番号、FAX、メールアドレスなどの連絡先情報や財務情報を掲載しています。`;
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

  const [company, industryDetailsList] = await Promise.all([
    getCompanyByNumber(companyId),
    getCompanyIndustries(companyId)
  ]);

  if (!company) {
    return {
      title: locale === 'en' ? 'Company Not Found | Kigyou-list' : locale === 'vi' ? 'Không tìm thấy doanh nghiệp | Kigyou-list' : '企業が見つかりません | Kigyou-list',
    };
  }

  const primaryIndustry = industryDetailsList[0] || null;
  const companyName = locale === 'en' && company.company_name_en ? company.company_name_en : company.company_name;
  const industryName = primaryIndustry ? primaryIndustry.industry_name : null;
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
  const [company, financials, signals, companyIndustries] = await Promise.all([
    getCompanyByNumber(companyId),
    getCompanyFinancials(companyId),
    getCompanySignals(companyId),
    getCompanyIndustries(companyId)
  ]);

  if (!company) {
    return notFound();
  }

  const t = getTranslations(locale);

  // 2. Resolve primary industry details
  const primaryIndustry = companyIndustries[0] || null;
  let industryCode: string | null = null;
  let industryName: string | null = null;
  if (primaryIndustry) {
    industryCode = primaryIndustry.industry_code;
    industryName = primaryIndustry.industry_name;
  }

  const majorIndustries = companyIndustries.filter(ind => ind.classification_level === '大分類');

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
  const onPageSummary = generateDynamicSummary(company, locale, industryName, company.prefecture_name, true);

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
      <main className="flex-1 min-w-0 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-5">
        
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
        <section className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 dark:from-[#1C2128] dark:to-[#171B21] dark:border-slate-800 rounded-3xl p-4 md:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow duration-300">
          <div className="flex flex-col md:flex-row gap-5 items-start">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shrink-0 shadow-md shadow-primary/10 border border-white/20">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border shadow-sm ${
                  company.status === '閉鎖' || company.status === '解散'
                    ? 'text-rose-800 bg-rose-100 dark:bg-rose-950/40 dark:text-rose-450 border-rose-250 dark:border-rose-900/40'
                    : 'text-emerald-800 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-450 border-emerald-250 dark:border-emerald-900/40'
                }`}>
                  {localizedStatus}
                </span>
                {majorIndustries.map((ind, idx) => (
                  <Link 
                    key={idx}
                    href={`/${locale}/industry/${ind.industry_code}/location/${company.prefecture_code}`}
                    className="text-[10px] font-medium text-slate-650 hover:text-primary bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-secondary px-2.5 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-colors"
                  >
                    {ind.industry_code}.{(t.majorIndustries as Record<string, string>)?.[ind.industry_code] || ind.industry_name}
                  </Link>
                ))}
                {/* Data freshness trust signal — design system: accent gold (#F2A30F) */}
                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[#B07500] bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-200/70 dark:border-amber-900/40 shadow-sm">
                  <Clock className="w-3.5 h-3.5 text-[#F2A30F] animate-pulse" />
                  {locale === 'en' ? 'Updated' : locale === 'vi' ? 'Cập nhật' : '更新'}: {formatShortDate(company.updated_at)}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold leading-snug text-slate-900 dark:text-white tracking-tight break-words">
                {companyName}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-medium">
                <span className="font-mono">
                  {t.company.corporateNumber.replace('{number}', company.corporate_number)}
                </span>
                <time
                  dateTime={toISOStringLocal(company.updated_at)}
                  className="flex items-center gap-1 font-medium"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
          
          {/* LEFT 2 COLUMNS: Profile, Financials, Signals */}
          <div className="lg:col-span-2 flex flex-col gap-5 lg:gap-6">
            
            {/* 1. Basic Info Section */}
            <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {t.company.basicInfo}
              </h2>

              {/* Dynamic Summary/Overview paragraph for SEO and users */}
              <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                <p className="text-xs sm:text-sm leading-relaxed text-slate-650 dark:text-slate-350 font-semibold">
                  {onPageSummary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium block mb-1">{t.company.companyName}</span>
                  <strong className="text-sm font-semibold text-slate-800 dark:text-slate-200">{companyName}</strong>
                </div>
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium block mb-1">{t.company.kana}</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{company.company_name_kana || t.company.unregistered}</span>
                </div>
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium block mb-1">{t.company.address}</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {company.full_address || t.company.unregistered}
                  </span>
                </div>
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium block mb-1">{t.company.representative}</span>
                  <strong className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {company.representative_name 
                      ? `${(locale === 'en' || locale === 'vi') && company.representative_position ? `${translatePosition(company.representative_position, locale)} ` : ""}${company.representative_name}`
                      : t.company.unregistered}
                  </strong>
                </div>
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium block mb-1">{t.company.capital}</span>
                  <strong className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {company.capital_amount ? (locale === 'en' ? `¥${(company.capital_amount / 1000000).toLocaleString(undefined, {maximumFractionDigits: 2})} Million JPY` : locale === 'vi' ? `¥${(company.capital_amount / 1000000).toLocaleString(undefined, {maximumFractionDigits: 2})} triệu JPY` : `${(company.capital_amount / 10000).toLocaleString()}万円`) : t.company.unregistered}
                  </strong>
                </div>
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium block mb-1">{t.company.employees}</span>
                  <strong className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {company.employee_count ? (locale === 'en' ? `${company.employee_count.toLocaleString()} employees` : locale === 'vi' ? `${company.employee_count.toLocaleString()} nhân viên` : `${company.employee_count}名`) : t.company.unregistered}
                  </strong>
                </div>
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium block mb-1">{t.company.establishmentDate}</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {locale === 'en' && company.establishment_date ? formatEnglishDate(company.establishment_date) : (company.establishment_date || t.company.unregistered)}
                  </span>
                </div>
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30 col-span-1 md:col-span-2">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium block mb-1">{t.company.tags}</span>
                  <div className="flex flex-wrap gap-1.5 mt-1 max-h-[120px] overflow-y-auto scrollbar-thin">
                    {(() => {
                      const mediumInds = companyIndustries.filter(ind => ind.classification_level === '中分類');
                      if (mediumInds.length > 0) {
                        return mediumInds.map((ind, idx) => (
                          <span 
                            key={idx} 
                            className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/65 transition-colors hover:bg-slate-200/60 dark:hover:bg-slate-750 shadow-xs"
                          >
                            {ind.industry_code}.{getIndustryName(ind.industry_name, locale)}
                          </span>
                        ));
                      }

                      const tags = company.jigyo_shumoku 
                        ? company.jigyo_shumoku.replace(' (AI確認済)', '').split(',')
                        : [];
                      return tags.length > 0 ? (
                        tags.map((tag, idx) => (
                          <span 
                            key={idx} 
                            className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/65 transition-colors hover:bg-slate-200/60 dark:hover:bg-slate-750 shadow-xs"
                          >
                            {getIndustryName(tag.trim(), locale)}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[11px] font-medium">{t.company.unregistered}</span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Financial Chart Section */}
            {financials && financials.length > 0 && (
              <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  {t.company.financialTrend}
                </h2>

                <CompanyFinancials financials={financials} />
              </section>
            )}

            {/* 3. Intent Signals Section */}
            <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
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
          <div className="flex flex-col gap-5 lg:gap-6">
            
            {/* Contact Details Panel */}
            <section id="contact" className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                {t.company.contactInfo}
              </h2>

              <div className="flex flex-col gap-4 text-sm">
                
                {/* 1. Phone number (PUBLIC) */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">{t.company.phonePublic}</span>
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
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">{t.company.websitePublic}</span>
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
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
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
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
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
            <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-4">

              {/* Same Industry Links (同業他社) */}
              <div>
                <h3 className="font-bold text-sm text-slate-850 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  {t.company.sameIndustry}
                </h3>
                {sameIndustry.length > 0 ? (
                  <div className="w-full">
                    {/* Column header */}
                    <div className="grid grid-cols-[1fr_auto] gap-x-2 px-1 pb-1.5 mb-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{locale === 'en' ? 'Company' : locale === 'vi' ? 'Công ty' : '企業名'}</span>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 text-right">{locale === 'en' ? 'Revenue' : locale === 'vi' ? 'Doanh thu' : '売上高'}</span>
                    </div>
                    {sameIndustry.map(item => {
                      const name = locale === 'en' && item.company_name_en ? item.company_name_en : item.company_name;
                      const sales = item.sales_amount;
                      const salesStr = sales
                        ? locale === 'en'
                          ? sales >= 1_000_000_000_000 ? `¥${(sales / 1_000_000_000_000).toFixed(1)}T`
                            : sales >= 1_000_000_000 ? `¥${(sales / 1_000_000_000).toFixed(1)}B`
                            : `¥${(sales / 1_000_000).toFixed(0)}M`
                          : locale === 'vi'
                          ? sales >= 1_000_000_000_000 ? `${(sales / 1_000_000_000_000).toFixed(1)}兆円`
                            : sales >= 100_000_000 ? `${(sales / 100_000_000).toFixed(0)}億円`
                            : `${(sales / 10_000).toFixed(0)}万円`
                          : sales >= 1_000_000_000_000 ? `${(sales / 1_000_000_000_000).toFixed(1)}兆円`
                            : sales >= 100_000_000 ? `${(sales / 100_000_000).toFixed(0)}億円`
                            : `${(sales / 10_000).toFixed(0)}万円`
                        : '—';
                      return (
                        <Link
                          key={item.corporate_number}
                          href={`/${locale}/company/${item.corporate_number}`}
                          className="grid grid-cols-[1fr_auto] gap-x-2 px-1 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-colors items-center"
                        >
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-primary dark:group-hover:text-secondary truncate min-w-0" title={name}>
                            {name}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">
                            {salesStr}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">{t.company.noRelatedSameIndustry}</span>
                )}
              </div>

              {/* Nearby Prefecture Links (近隣企業) */}
              <div>
                <h3 className="font-bold text-sm text-slate-850 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {t.company.nearby}
                </h3>
                {nearby.length > 0 ? (
                  <div className="w-full">
                    {/* Column header */}
                    <div className="grid grid-cols-[1fr_auto] gap-x-2 px-1 pb-1.5 mb-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{locale === 'en' ? 'Company' : locale === 'vi' ? 'Công ty' : '企業名'}</span>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 text-right">{locale === 'en' ? 'Revenue' : locale === 'vi' ? 'Doanh thu' : '売上高'}</span>
                    </div>
                    {nearby.map(item => {
                      const name = locale === 'en' && item.company_name_en ? item.company_name_en : item.company_name;
                      const sales = item.sales_amount;
                      const salesStr = sales
                        ? locale === 'en'
                          ? sales >= 1_000_000_000_000 ? `¥${(sales / 1_000_000_000_000).toFixed(1)}T`
                            : sales >= 1_000_000_000 ? `¥${(sales / 1_000_000_000).toFixed(1)}B`
                            : `¥${(sales / 1_000_000).toFixed(0)}M`
                          : locale === 'vi'
                          ? sales >= 1_000_000_000_000 ? `${(sales / 1_000_000_000_000).toFixed(1)}兆円`
                            : sales >= 100_000_000 ? `${(sales / 100_000_000).toFixed(0)}億円`
                            : `${(sales / 10_000).toFixed(0)}万円`
                          : sales >= 1_000_000_000_000 ? `${(sales / 1_000_000_000_000).toFixed(1)}兆円`
                            : sales >= 100_000_000 ? `${(sales / 100_000_000).toFixed(0)}億円`
                            : `${(sales / 10_000).toFixed(0)}万円`
                        : '—';
                      return (
                        <Link
                          key={item.corporate_number}
                          href={`/${locale}/company/${item.corporate_number}`}
                          className="grid grid-cols-[1fr_auto] gap-x-2 px-1 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-colors items-center"
                        >
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-primary dark:group-hover:text-secondary truncate min-w-0" title={name}>
                            {name}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">
                            {salesStr}
                          </span>
                        </Link>
                      );
                    })}
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
