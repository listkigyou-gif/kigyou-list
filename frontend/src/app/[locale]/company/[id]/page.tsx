import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  Building2, MapPin, Phone, Globe, Mail, Printer, Calendar, 
  Briefcase, FileText, ChevronRight, BarChart3, Clock, Share2, ExternalLink, ShieldCheck, MessageSquare
} from 'lucide-react';
import { formatShortDate, toISOStringLocal } from '@/lib/dateUtils';
import { 
  getCompanyByNumber, getCompanyFinancials, 
  getCompanySignals, getRelatedCompanies, getCompanyIndustries 
} from '@/lib/db';
import { Header } from '@/components/Header';
import { UnlockCard } from '@/components/UnlockCard';
import { ObfuscatedPhone } from '@/components/ObfuscatedPhone';
import { CompanyActions } from '@/components/CompanyActions';
import { UnlockCTA } from '@/components/UnlockCTA';
import { Footer } from '@/components/Footer';
import { CompanyFinancials } from '@/components/CompanyFinancials';
import { CompanySignalsTimeline } from '@/components/CompanySignalsTimeline';
import { CopyTextButton } from '@/components/CopyTextButton';
import { getTranslations } from '@/lib/i18n';
import { CompanyLogo } from '@/components/CompanyLogo';
import { translatePosition, formatEnglishDate, getPrefectureName, getIndustryName } from '@/lib/locale-mapping';

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

function formatJapaneseCurrency(amount: number | string | null, locale: string): string {
  if (amount === null || amount === undefined || amount === "") return "";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "";
  
  if (locale === 'en') {
    if (num >= 1_000_000_000_000) return `¥${(num / 1_000_000_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}T JPY`;
    if (num >= 1_000_000_000) return `¥${(num / 1_000_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}B JPY`;
    if (num >= 1_000_000) return `¥${(num / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M JPY`;
    return `¥${num.toLocaleString()} JPY`;
  }
  if (locale === 'vi') {
    if (num >= 1_000_000_000_000) return `${(num / 1_000_000_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })} nghìn tỷ JPY`;
    if (num >= 100_000_000) return `${(num / 100_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })} trăm triệu JPY`;
    if (num >= 10_000) return `${(num / 10_000).toLocaleString(undefined, { maximumFractionDigits: 0 })} vạn JPY`;
    return `¥${num.toLocaleString()} JPY`;
  }
  // Japanese
  if (num >= 1_000_000_000_000) {
    return `${(num / 1_000_000_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}兆円`;
  }
  if (num >= 100_000_000) {
    return `${(num / 100_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}億円`;
  }
  if (num >= 10_000) {
    return `${(num / 10_000).toLocaleString(undefined, { maximumFractionDigits: 0 })}万円`;
  }
  return `¥${num.toLocaleString()}`;
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

  // 3. Fetch related companies in parallel with above (no data dependency yet resolved)
  // NOTE: We start this fetch immediately after resolving the industry code from companyIndustries
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

  let snsMap: Record<string, string> = {};
  if (company.sns_links) {
    try {
      snsMap = typeof company.sns_links === 'string' ? JSON.parse(company.sns_links) : company.sns_links;
    } catch {
      snsMap = {};
    }
  }
  const hasSns = Object.keys(snsMap).length > 0;
  const snsUrlList = Object.values(snsMap).filter(Boolean);

  // 5. Generate Schema Markup JSON-LD for Corporation
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "Corporation",
    "name": companyName,
    "legalName": company.company_name,
    "taxID": company.corporate_number,
    "identifier": company.corporate_number,
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
    "foundingDate": company.establishment_date || undefined,
    ...(snsUrlList.length > 0 ? { "sameAs": snsUrlList } : {})
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

      {/* Global Standard Header */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 min-w-0 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex flex-col gap-5">
        
        {/* Visual Breadcrumbs */}
        <nav className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
          <Link href={`/${locale}`} className="hover:text-primary dark:hover:text-slate-200 transition-colors shrink-0">
            {locale === 'en' ? 'Home' : 'ホーム'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
          <Link href={`/${locale}/directory`} className="hover:text-primary dark:hover:text-slate-200 transition-colors shrink-0">
            {t.footer.directory}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
          <Link href={categoryPath} className="hover:text-primary dark:hover:text-slate-200 transition-colors truncate max-w-[140px] sm:max-w-xs shrink-0" title={categoryName}>{categoryName}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[140px] sm:max-w-[240px]" aria-current="page" title={companyName}>{companyName}</span>
        </nav>

        {/* Company Title Banner (Enterprise Trust Card) */}
        <section className="bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex flex-row gap-4 sm:gap-5 items-start min-w-0">
            {/* Crisp Corporate Badge with Dynamic Logo & Fallback */}
            <CompanyLogo
              websiteUrl={company.website_url}
              logoUrl={company.logo_url}
              companyName={companyName}
            />
            
            <div className="flex flex-col gap-2 min-w-0">
              {/* Trust Badges Row */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                  company.status === '閉鎖' || company.status === '解散'
                    ? 'text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/70 dark:border-rose-900/40'
                    : 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-900/40'
                }`}>
                  {localizedStatus}
                </span>

                {company.is_claimed && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {locale === 'en' ? 'Verified Business' : locale === 'vi' ? 'Chính chủ đã xác minh' : '公式認証企業'}
                  </span>
                )}

                {majorIndustries.map((ind, idx) => (
                  <Link 
                    key={idx}
                    href={`/${locale}/industry/${ind.industry_code}/location/${company.prefecture_code}`}
                    className="text-[11px] font-medium text-slate-650 hover:text-primary bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white px-2.5 py-0.5 rounded-full border border-slate-200/70 dark:border-slate-700/70 transition-colors"
                  >
                    {ind.industry_code}.{(t.majorIndustries as Record<string, string>)?.[ind.industry_code] || ind.industry_name}
                  </Link>
                ))}

                <span className="inline-flex items-center text-[11px] font-medium text-slate-650 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-200/70 dark:border-slate-700/70 font-mono">
                  {t.company.corporateNumber.replace('{number}', company.corporate_number)}
                </span>
                
                {/* Data freshness trust badge */}
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-650 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200/70 dark:border-slate-700/70 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  {locale === 'en' ? 'Updated' : locale === 'vi' ? 'Cập nhật' : '更新'}: {formatShortDate(company.updated_at)}
                </span>
              </div>

              {/* Main Heading H1 */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-slate-900 dark:text-white tracking-tight break-words">
                  {companyName}
                </h1>
              </div>
            </div>
          </div>

          <CompanyActions 
            corporateNumber={company.corporate_number} 
            companyName={companyName} 
            websiteUrl={company.website_url} 
            phone={company.phone_number}
            email={company.email_address}
            fax={company.fax_number}
            representativeName={company.representative_name}
            prTitle={company.pr_title}
            prMessage={company.pr_message}
            isClaimed={Boolean(company.is_claimed)}
            claimedAt={company.claimed_at}
          />
        </section>

        {/* 2-Column Split Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
          
          {/* LEFT 2 COLUMNS: Profile, Financials, Signals */}
          <div className="lg:col-span-2 flex flex-col gap-5 lg:gap-6">
            
            {/* 1. Basic Info Section */}
            <section className="bg-white border border-slate-200/80 dark:bg-[#161B22] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-150 dark:border-slate-800">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {t.company.basicInfo}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span>No. {company.corporate_number}</span>
                  <CopyTextButton text={company.corporate_number} />
                </div>
              </div>

              {/* Official Verified Company PR Message */}
              {company.is_claimed && company.pr_message && (
                <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-850">
                  <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{company.pr_title || (locale === 'en' ? 'Official Representative Message' : locale === 'vi' ? 'Thông điệp chính thức từ Doanh nghiệp' : '企業公式メッセージ')}</span>
                    {company.claimed_by_name && (
                      <span className="text-[10px] text-emerald-700/70 dark:text-emerald-400 font-normal">（{company.claimed_by_name}）</span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {company.pr_message}
                  </p>
                </div>
              )}

              {/* Dynamic Summary/Overview paragraph for SEO and users */}
              <div className="mb-5 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800/70">
                <p className="text-xs sm:text-sm leading-relaxed text-slate-650 dark:text-slate-300">
                  {onPageSummary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5 text-sm">

                <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">{t.company.kana}</span>
                  <span className="text-sm font-semibold text-slate-850 dark:text-slate-200">{company.company_name_kana || t.company.unregistered}</span>
                </div>

                <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">{t.company.establishmentDate}</span>
                  <span className="text-sm font-semibold font-mono text-slate-850 dark:text-slate-200">
                    {locale === 'en' && company.establishment_date ? formatEnglishDate(company.establishment_date) : (company.establishment_date || t.company.unregistered)}
                  </span>
                </div>

                <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">{t.company.address}</span>
                    {company.full_address && (
                      <CopyTextButton text={company.full_address} label="住所をコピー" />
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    {company.postal_code && (
                      <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                        〒{company.postal_code}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-slate-850 dark:text-slate-200">
                      {company.full_address || t.company.unregistered}
                    </span>
                  </div>
                </div>
                
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">{t.company.representative}</span>
                  <strong className="text-sm font-semibold text-slate-850 dark:text-slate-200">
                    {company.representative_name 
                      ? `${(locale === 'en' || locale === 'vi') && company.representative_position ? `${translatePosition(company.representative_position, locale)} ` : ""}${company.representative_name}`
                      : t.company.unregistered}
                  </strong>
                </div>

                <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">{t.company.employees}</span>
                  <strong className="text-sm font-bold font-mono text-slate-850 dark:text-slate-200">
                    {company.employee_count ? (locale === 'en' ? `${company.employee_count.toLocaleString()} employees` : locale === 'vi' ? `${company.employee_count.toLocaleString()} nhân viên` : `${company.employee_count.toLocaleString()}名`) : t.company.unregistered}
                  </strong>
                </div>
                
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">{t.company.capital}</span>
                  <strong className="text-sm font-bold font-mono text-slate-850 dark:text-slate-200">
                    {company.capital_amount ? formatJapaneseCurrency(company.capital_amount, locale) : t.company.unregistered}
                  </strong>
                </div>

                <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">
                    {locale === 'en' ? 'Corporate Number' : locale === 'vi' ? 'Mã số doanh nghiệp' : '法人番号'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold font-mono text-slate-850 dark:text-slate-200">
                      {company.corporate_number}
                    </span>
                    <CopyTextButton text={company.corporate_number} />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 pt-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1.5">{t.company.tags}</span>
                  <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto scrollbar-thin">
                    {(() => {
                      const mediumInds = companyIndustries.filter(ind => ind.classification_level === '中分類');
                      if (mediumInds.length > 0) {
                        return mediumInds.map((ind, idx) => (
                          <span 
                            key={idx} 
                            className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/70 transition-colors hover:bg-slate-200/70 dark:hover:bg-slate-750"
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
                            className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/70 transition-colors hover:bg-slate-200/70 dark:hover:bg-slate-750"
                          >
                            {getIndustryName(tag.trim(), locale)}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs font-medium">{t.company.unregistered}</span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Financial Chart Section */}
            {financials && financials.length > 0 && (
              <section className="bg-white border border-slate-200/80 dark:bg-[#161B22] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pb-3.5 mb-4 border-b border-slate-150 dark:border-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  {t.company.financialTrend}
                </h2>

                <CompanyFinancials financials={financials} />
              </section>
            )}

            {/* 3. Intent Signals Section */}
            <section className="bg-white border border-slate-200/80 dark:bg-[#161B22] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pb-3.5 mb-4 border-b border-slate-150 dark:border-slate-800 flex items-center gap-2">
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
            <section id="contact" className="bg-white border border-slate-200/80 dark:bg-[#161B22] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pb-3.5 mb-4 border-b border-slate-150 dark:border-slate-800 flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                {t.company.contactInfo}
              </h2>

              <div className="flex flex-col gap-4 text-sm">
                
                {/* 1. Phone number (PUBLIC) */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-primary dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">{t.company.phonePublic}</span>
                    <div className="flex items-center gap-2">
                      {company.phone_number ? (
                        <>
                          <ObfuscatedPhone encodedPhone={btoa(company.phone_number)} />
                          <CopyTextButton text={company.phone_number} />
                        </>
                      ) : (
                        <strong className="text-slate-850 dark:text-slate-100 text-sm font-mono">{t.company.unregistered}</strong>
                      )}
                    </div>
                  </div>
                </div>

                {/* Honeypot trap link for scrapers (invisible to actual users) */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
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
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-900/40 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">{t.company.websitePublic}</span>
                    {company.website_url ? (
                      <a 
                        href={company.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium break-all dark:text-teal-400 inline-flex items-center gap-1 text-xs sm:text-sm"
                      >
                        <span>{company.website_url}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60" />
                      </a>
                    ) : (
                      <span className="text-slate-400 text-xs font-medium">{t.company.none}</span>
                    )}
                  </div>
                </div>

                {/* 2b. SNS Social Media Profiles */}
                {hasSns && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center shrink-0">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
                        {locale === 'en' ? 'Social Media / SNS' : locale === 'vi' ? 'Mạng xã hội (SNS)' : '公式SNSアカウント'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {snsMap.twitter && (
                          <a 
                            href={snsMap.twitter} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors shadow-xs"
                            title="X (Twitter)"
                          >
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            <span>X</span>
                          </a>
                        )}
                        {snsMap.facebook && (
                          <a 
                            href={snsMap.facebook} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-[#1877F2] text-white hover:bg-[#166fe5] transition-colors shadow-xs"
                            title="Facebook"
                          >
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            <span>Facebook</span>
                          </a>
                        )}
                        {snsMap.wantedly && (
                          <a 
                            href={snsMap.wantedly} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-[#00A4BB] text-white hover:bg-[#008fA4] transition-colors shadow-xs"
                            title="Wantedly"
                          >
                            <span className="font-bold text-[11px]">W</span>
                            <span>Wantedly</span>
                          </a>
                        )}
                        {snsMap.note && (
                          <a 
                            href={snsMap.note} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-[#2cb696] text-white hover:bg-[#259b80] transition-colors shadow-xs"
                            title="note"
                          >
                            <span className="font-bold text-[11px]">n</span>
                            <span>note</span>
                          </a>
                        )}
                        {snsMap.linkedin && (
                          <a 
                            href={snsMap.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-[#0A66C2] text-white hover:bg-[#095196] transition-colors shadow-xs"
                            title="LinkedIn"
                          >
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
                            <span>LinkedIn</span>
                          </a>
                        )}
                        {snsMap.line && (
                          <a 
                            href={snsMap.line} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-[#06C755] text-white hover:bg-[#05b04c] transition-colors shadow-xs"
                            title="LINE"
                          >
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.019 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.589-3.843 2.589-5.992z"/></svg>
                            <span>LINE</span>
                          </a>
                        )}
                        {snsMap.youtube && (
                          <a 
                            href={snsMap.youtube} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-[#FF0000] text-white hover:bg-[#cc0000] transition-colors shadow-xs"
                            title="YouTube"
                          >
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                            <span>YouTube</span>
                          </a>
                        )}
                        {snsMap.instagram && (
                          <a 
                            href={snsMap.instagram} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-pink-600 text-white hover:bg-pink-700 transition-colors shadow-xs"
                            title="Instagram"
                          >
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                            <span>Instagram</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. FAX number (BLURRED) */}
                <div className="flex items-start gap-3 relative">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-center shrink-0">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                      {t.company.fax}
                    </span>
                    <div data-nosnippet>
                      <UnlockCard type="inline" fallbackText={locale === 'en' ? "03-3456-7890 (Sample)" : "03-3456-7890 (サンプル)"}>
                        <span className="font-mono text-slate-850 dark:text-slate-100 font-semibold">
                          {company.fax_number || t.company.unregistered}
                        </span>
                      </UnlockCard>
                    </div>
                  </div>
                </div>

                {/* 4. Email address (BLURRED) */}
                <div className="flex items-start gap-3 relative">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-0.5">
                      <span>{t.company.email}</span>
                      {company.email_type && company.email_type !== 'GENERAL' && (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800">
                          {company.email_type === 'RECRUIT' ? (locale === 'en' ? 'Recruiting' : locale === 'vi' ? 'Tuyển dụng' : '採用窓口') :
                           company.email_type === 'PR' ? (locale === 'en' ? 'PR / Media' : locale === 'vi' ? 'Truyền thông' : '広報窓口') :
                           company.email_type === 'SALES' ? (locale === 'en' ? 'Sales' : locale === 'vi' ? 'Kinh doanh' : '営業窓口') :
                           company.email_type}
                        </span>
                      )}
                    </span>
                    <div data-nosnippet>
                      <UnlockCard type="inline" requiredPlan="pro" fallbackText={locale === 'en' ? "contact@company.co.jp (Sample)" : "contact@company.co.jp (サンプル)"}>
                        <span className="text-slate-850 dark:text-slate-100 font-semibold break-all">
                          {company.email_address || t.company.unregistered}
                        </span>
                      </UnlockCard>
                    </div>
                  </div>
                </div>

                {/* 5. Contact Form URL */}
                {company.contact_form_url && (
                  <div className="flex items-start gap-3 relative">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                        {locale === 'en' ? 'Contact Form' : locale === 'vi' ? 'Biểu mẫu liên hệ' : 'お問い合わせフォーム'}
                      </span>
                      <a 
                        href={company.contact_form_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors text-sm break-all"
                      >
                        <span>{locale === 'en' ? 'Open Contact Form' : locale === 'vi' ? 'Mở biểu mẫu liên hệ' : 'お問い合わせフォームを開く'}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Free Registration Call to Action */}
                <div data-nosnippet>
                  <UnlockCTA />
                </div>
              </div>
            </section>

            {/* SEO internal linking matrix (Related & Nearby Companies) */}
            <section className="bg-white border border-slate-200/80 dark:bg-[#161B22] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-6">

              {/* Same Industry Links (同業他社) */}
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-850 dark:text-white mb-3 pb-2 border-b border-slate-150 dark:border-slate-800 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  {t.company.sameIndustry}
                </h3>
                {sameIndustry.length > 0 ? (
                  <div className="w-full">
                    {/* Column header */}
                    <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 px-2 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      <span>{locale === 'en' ? 'Company' : locale === 'vi' ? 'Công ty' : '企業名'}</span>
                      <span className="text-right w-16 sm:w-20">{locale === 'en' ? 'Revenue' : locale === 'vi' ? 'Doanh thu' : '売上高'}</span>
                      <span className="text-right w-16 sm:w-20">{locale === 'en' ? 'Ord. Profit' : locale === 'vi' ? 'Lợi nhuận' : '経常利益'}</span>
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
                      const ordInc = item.ordinary_income;
                      const ordIncStr = ordInc
                        ? locale === 'en'
                          ? ordInc >= 1_000_000_000_000 ? `¥${(ordInc / 1_000_000_000_000).toFixed(1)}T`
                            : ordInc >= 1_000_000_000 ? `¥${(ordInc / 1_000_000_000).toFixed(1)}B`
                            : `¥${(ordInc / 1_000_000).toFixed(0)}M`
                          : locale === 'vi'
                          ? ordInc >= 1_000_000_000_000 ? `${(ordInc / 1_000_000_000_000).toFixed(1)}兆円`
                            : ordInc >= 100_000_000 ? `${(ordInc / 100_000_000).toFixed(0)}億円`
                            : `${(ordInc / 10_000).toFixed(0)}万円`
                          : ordInc >= 1_000_000_000_000 ? `${(ordInc / 1_000_000_000_000).toFixed(1)}兆円`
                            : ordInc >= 100_000_000 ? `${(ordInc / 100_000_000).toFixed(0)}億円`
                            : `${(ordInc / 10_000).toFixed(0)}万円`
                        : '—';
                      return (
                        <Link
                          key={item.corporate_number}
                          href={`/${locale}/company/${item.corporate_number}`}
                          className="grid grid-cols-[1fr_auto_auto] gap-x-2 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 group transition-colors items-center"
                        >
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-primary dark:group-hover:text-secondary truncate min-w-0" title={name}>
                            {name}
                          </span>
                          <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right w-16 sm:w-20">
                            {salesStr}
                          </span>
                          <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right w-16 sm:w-20">
                            {ordIncStr}
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
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-850 dark:text-white mb-3 pb-2 border-b border-slate-150 dark:border-slate-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {t.company.nearby}
                </h3>
                {nearby.length > 0 ? (
                  <div className="w-full">
                    {/* Column header */}
                    <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 px-2 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      <span>{locale === 'en' ? 'Company' : locale === 'vi' ? 'Công ty' : '企業名'}</span>
                      <span className="text-right w-16 sm:w-20">{locale === 'en' ? 'Revenue' : locale === 'vi' ? 'Doanh thu' : '売上高'}</span>
                      <span className="text-right w-16 sm:w-20">{locale === 'en' ? 'Ord. Profit' : locale === 'vi' ? 'Lợi nhuận' : '経常利益'}</span>
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
                      const ordInc = item.ordinary_income;
                      const ordIncStr = ordInc
                        ? locale === 'en'
                          ? ordInc >= 1_000_000_000_000 ? `¥${(ordInc / 1_000_000_000_000).toFixed(1)}T`
                            : ordInc >= 1_000_000_000 ? `¥${(ordInc / 1_000_000_000).toFixed(1)}B`
                            : `¥${(ordInc / 1_000_000).toFixed(0)}M`
                          : locale === 'vi'
                          ? ordInc >= 1_000_000_000_000 ? `${(ordInc / 1_000_000_000_000).toFixed(1)}兆円`
                            : ordInc >= 100_000_000 ? `${(ordInc / 100_000_000).toFixed(0)}億円`
                            : `${(ordInc / 10_000).toFixed(0)}万円`
                          : ordInc >= 1_000_000_000_000 ? `${(ordInc / 1_000_000_000_000).toFixed(1)}兆円`
                            : ordInc >= 100_000_000 ? `${(ordInc / 100_000_000).toFixed(0)}億円`
                            : `${(ordInc / 10_000).toFixed(0)}万円`
                        : '—';
                      return (
                        <Link
                          key={item.corporate_number}
                          href={`/${locale}/company/${item.corporate_number}`}
                          className="grid grid-cols-[1fr_auto_auto] gap-x-2 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 group transition-colors items-center"
                        >
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-primary dark:group-hover:text-secondary truncate min-w-0" title={name}>
                            {name}
                          </span>
                          <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right w-16 sm:w-20">
                            {salesStr}
                          </span>
                          <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right w-16 sm:w-20">
                            {ordIncStr}
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
