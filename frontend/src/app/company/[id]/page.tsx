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
import { CompanyActions } from '@/components/CompanyActions';
import { UnlockCTA } from '@/components/UnlockCTA';
import { Footer } from '@/components/Footer';
import { CompanyFinancials } from '@/components/CompanyFinancials';
import { CompanySignalsTimeline } from '@/components/CompanySignalsTimeline';


export const revalidate = 600; // Cache profiles for 10 minutes, ISR enabled

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const companyId = resolvedParams.id;

  if (!/^\d{13}$/.test(companyId)) {
    return {
      title: '企業が見つかりません | Kigyou-list',
    };
  }

  const company = await getCompanyByNumber(companyId);
  if (!company) {
    return {
      title: '企業が見つかりません | Kigyou-list',
    };
  }

  return {
    title: `${company.company_name} - 企業基本情報・財務情報・連絡先 | Kigyou-list`,
    description: `${company.company_name}（法人番号：${company.corporate_number}）の会社概要、代表者名、資本金、従業員数、決算情報、連絡先（電話番号、FAX、メール）や最新 of 営業シグナルを掲載しています。`,
    alternates: {
      canonical: `/company/${companyId}`,
    },
  };
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const companyId = resolvedParams.id;

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
    ? `/industry/${industryCode}/location/${company.prefecture_code}`
    : `/search?prefecture=${company.prefecture_code}`;
  
  const categoryName = industryName 
    ? `${company.prefecture_name}の${industryName}企業一覧`
    : `${company.prefecture_name}の企業一覧`;

  // 5. Generate Schema Markup JSON-LD for Corporation
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "Corporation",
    "name": company.company_name,
    "taxID": company.corporate_number,
    "description": company.business_summary || `${company.company_name}の基本情報、電話番号、財務指標情報。`,
    "dateModified": toISOStringLocal(company.updated_at),
    "address": {
      "@type": "PostalAddress",
      "postalCode": company.postal_code || "",
      "addressRegion": company.prefecture_name || "",
      "addressLocality": company.city_name || "",
      "streetAddress": company.street_address || "",
      "addressCountry": "JP"
    },
    "telephone": company.phone_number || undefined,
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
        "name": "ホーム",
        "item": "https://kigyoulist.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "企業データ一覧",
        "item": "https://kigyoulist.com/directory"
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
        "name": company.company_name,
        "item": `https://kigyoulist.com/company/${company.corporate_number}`
      }
    ]
  };

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
            <Link href="/search" className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </Link>
            <Link href="/search" className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Kigyou<span className="text-secondary">-list</span>
            </Link>
          </div>

          <Link
            href="/search"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 dark:text-slate-300 dark:border-slate-800 dark:hover:border-slate-700 rounded-xl transition-all"
          >
            ← 企業検索に戻る
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
        {/* Visual Breadcrumbs */}
        <nav className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary transition-colors">ホーム</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <Link href="/directory" className="hover:text-primary transition-colors">企業データ一覧</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <Link href={categoryPath} className="hover:text-primary transition-colors">{categoryName}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200 truncate max-w-[240px]" aria-current="page">{company.company_name}</span>
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
                  {company.status}
                </span>
                {industryName && (
                  <Link 
                    href={`/industry/${industryCode}/location/${company.prefecture_code}`}
                    className="text-[10px] font-black tracking-wider uppercase text-slate-600 hover:text-primary bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-secondary px-2.5 py-0.5 rounded-full shadow-sm transition-colors"
                  >
                    {industryName}
                  </Link>
                )}
                {/* Data freshness trust signal — design system: accent gold (#F2A30F) */}
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#B07500] bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-200/70 dark:border-amber-900/40 shadow-sm">
                  <Clock className="w-3.5 h-3.5 text-[#F2A30F] animate-pulse" />
                  更新: {formatShortDate(company.updated_at)}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {company.company_name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-bold">
                <span className="font-mono">法人番号: {company.corporate_number}</span>
                <time
                  dateTime={toISOStringLocal(company.updated_at)}
                  className="flex items-center gap-1 text-slate-500 font-bold"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  最終更新日: {formatShortDate(company.updated_at)}
                </time>
              </div>
            </div>
          </div>

          <CompanyActions corporateNumber={company.corporate_number} />
        </section>

        {/* 2-Column Split Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 2 COLUMNS: Profile & Signals */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* 1. Basic Info Section */}
            <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                企業基本情報
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30">
                  <span className="text-slate-400 text-xs block mb-1">商号または名称</span>
                  <strong className="text-slate-850 dark:text-slate-100">{company.company_name}</strong>
                </div>
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30">
                  <span className="text-slate-400 text-xs block mb-1">フリガナ</span>
                  <span className="text-slate-800 dark:text-slate-200">{company.company_name_kana || '未登録'}</span>
                </div>
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30">
                  <span className="text-slate-400 text-xs block mb-1">登記住所</span>
                  <span className="text-slate-800 dark:text-slate-200">{company.full_address || '未登録'}</span>
                </div>
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30">
                  <span className="text-slate-400 text-xs block mb-1">代表者名</span>
                  <strong className="text-slate-850 dark:text-slate-100">{company.representative_name || '未登録'}</strong>
                </div>
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30">
                  <span className="text-slate-400 text-xs block mb-1">資本金</span>
                  <strong className="text-slate-850 dark:text-slate-100">
                    {company.capital_amount ? `${(company.capital_amount / 10000).toLocaleString()}万円` : '未登録'}
                  </strong>
                </div>
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30">
                  <span className="text-slate-400 text-xs block mb-1">従業員数</span>
                  <strong className="text-slate-850 dark:text-slate-100">
                    {company.employee_count ? `${company.employee_count}名` : '未登録'}
                  </strong>
                </div>
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30">
                  <span className="text-slate-400 text-xs block mb-1">設立年月日</span>
                  <span className="text-slate-800 dark:text-slate-200">{company.establishment_date || '未登録'}</span>
                </div>
                <div className="pb-3 border-b border-slate-50 dark:border-slate-800/30">
                  <span className="text-slate-400 text-xs block mb-1">事業種目 (Tags)</span>
                  <span className="text-slate-800 dark:text-slate-200">{company.jigyo_shumoku ? company.jigyo_shumoku.replace(' (AI確認済)', '') : '未登録'}</span>
                </div>
              </div>

            </section>

            {/* 2. Financial Chart Section */}
            {financials && financials.length > 0 && (
              <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  決算・財務状況推移 (5年間)
                </h2>

                <CompanyFinancials financials={financials} />
              </section>
            )}

            {/* 3. Timeline Intent Signals Section */}
            <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                営業シグナルタイムライン (Intent Data)
              </h2>

              {signals.length > 0 ? (
                <CompanySignalsTimeline signals={signals} />
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  営業シグナル（求人、補助金受領、入札など）は検出されませんでした。
                </div>
              )}
            </section>
          </div>

          {/* RIGHT 1 COLUMN: Contact Details & Internal Links */}
          <div className="flex flex-col gap-8">
            
            {/* Contact Details Panel */}
            <section id="contact" className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-6 shadow-sm sticky top-20">
              <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                企業連絡先情報
              </h2>

              <div className="flex flex-col gap-5 text-sm">
                
                {/* 1. Phone number (PUBLIC) */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">代表電話番号 (公開)</span>
                    <strong className="text-slate-800 dark:text-slate-100 text-base font-mono">
                      {company.phone_number || '未登録'}
                    </strong>
                  </div>
                </div>

                {/* 2. Website URL (PUBLIC) */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-slate-400 block mb-0.5">公式ウェブサイト (公開)</span>
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
                      <span className="text-slate-400 font-medium">なし</span>
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
                      FAX番号
                    </span>
                    <div data-nosnippet>
                      <UnlockCard type="inline" fallbackText="03-3456-7890 (サンプル)">
                        <span className="font-mono text-slate-800 dark:text-slate-100 font-semibold">
                          {company.fax_number || '未登録'}
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
                      メールアドレス
                    </span>
                    <div data-nosnippet>
                      <UnlockCard type="inline" requiredPlan="pro" fallbackText="contact@company.co.jp (サンプル)">
                        <span className="text-slate-800 dark:text-slate-100 font-semibold break-all">
                          {company.email_address || '未登録'}
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
                  同業他社の一覧 (同業界)
                </h3>
                {sameIndustry.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {sameIndustry.map(item => (
                      <Link 
                        key={item.corporate_number} 
                        href={`/company/${item.corporate_number}`}
                        className="text-xs font-medium text-slate-600 hover:text-primary dark:text-slate-400 dark:hover:text-secondary flex items-center justify-between group transition-colors"
                      >
                        <span className="truncate max-w-[85%]">{item.company_name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">他に対象企業はありません</span>
                )}
              </div>

              {/* Nearby Prefecture Links (近隣企業) */}
              <div>
                <h3 className="font-extrabold text-sm text-slate-850 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  近隣の企業 (同地域)
                </h3>
                {nearby.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {nearby.map(item => (
                      <Link 
                        key={item.corporate_number} 
                        href={`/company/${item.corporate_number}`}
                        className="text-xs font-medium text-slate-600 hover:text-primary dark:text-slate-400 dark:hover:text-secondary flex items-center justify-between group transition-colors"
                      >
                        <span className="truncate max-w-[85%]">{item.company_name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">近隣に対象企業はありません</span>
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
