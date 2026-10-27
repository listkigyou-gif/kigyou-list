import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { 
  Building2, ShieldCheck, ArrowRight, Award, FileCheck2, 
  Users, MapPin, Phone, Globe, ChevronRight, CheckCircle2, 
  HelpCircle, Scale, Landmark, Sparkles, Filter, ExternalLink, Languages
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ExportCSVButton } from '@/components/ExportCSVButton';
import { 
  LICENSE_HUBS, JAPAN_PREFECTURES, 
  getLicenseHubStats, getLicenseHubCompanies 
} from '@/lib/licenseHubs';
import { getPrefectureName } from '@/lib/locale-mapping';

export const revalidate = 3600; // Cache 1 hour with ISR

interface PageProps {
  params: Promise<{
    slug: string;
    pref?: string[];
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const { slug, locale = 'ja' } = resolved;
  const prefCode = resolved.pref && resolved.pref.length > 0 ? resolved.pref[0] : undefined;

  const config = LICENSE_HUBS[slug];
  if (!config) {
    return { title: 'Not Found | Kigyou-list' };
  }

  const isEn = locale === 'en';
  const isVi = locale === 'vi';
  const lang = locale as 'ja' | 'en' | 'vi';
  const currentYear = new Date().getFullYear();

  const prefObj = prefCode ? JAPAN_PREFECTURES.find(p => p.code === prefCode) : undefined;
  const prefName = prefObj ? getPrefectureName(prefObj.name, locale) : undefined;

  const pageTitle = prefName
    ? isVi
      ? `Danh sách ${config.shortName[lang] || config.shortName.ja} tại ${prefName} (${currentYear} Mới nhất) | Kigyou-list`
      : isEn
      ? `${prefName} ${config.shortName[lang] || config.shortName.ja} Directory (${currentYear} List) | Kigyou-list`
      : `${prefName}の${config.shortName.ja}一覧・企業データベース（${currentYear}年最新） | Kigyou-list`
    : isVi
    ? `Danh bạ ${config.title[lang] || config.title.ja} (${currentYear}) | Kigyou-list`
    : isEn
    ? `${config.title[lang] || config.title.ja} (${currentYear}) | Kigyou-list`
    : `${config.title.ja}（${currentYear}年最新） | Kigyou-list`;

  const pageDesc = prefName
    ? isVi
      ? `Tra cứu toàn bộ các doanh nghiệp có giấy phép ${config.shortName[lang] || config.shortName.ja} tại ${prefName}, Nhật Bản. Thông tin liên hệ trực tiếp, số điện thoại, người đại diện và mã số doanh nghiệp NTA 13 chữ số. Tải danh sách file CSV tiện lợi.`
      : isEn
      ? `Comprehensive directory of licensed ${config.shortName[lang] || config.shortName.ja} operating in ${prefName}, Japan. Find verified contact numbers, representative executives, and corporate numbers. Export clean CSV lists.`
      : `${prefName}内に所在する正規の${config.shortName.ja}保有企業一覧です。法人番号、直通電話番号、代表者名、許認可番号を網羅。CSVダウンロード機能付き。`
    : isVi
    ? `${config.description[lang] || config.description.ja} Cơ sở dữ liệu toàn quốc được cập nhật mới nhất năm ${currentYear}.`
    : isEn
    ? `${config.description[lang] || config.description.ja} Nationwide verified registry updated for ${currentYear}.`
    : `${config.description.ja} 全国の許認可取得企業を網羅した${currentYear}年最新データベース。`;

  const canonicalPath = prefCode 
    ? `/${locale}/license/${slug}/${prefCode}` 
    : `/${locale}/license/${slug}`;

  return {
    title: pageTitle,
    description: pageDesc,
    alternates: {
      canonical: `https://kigyoulist.com${canonicalPath}`,
      languages: {
        'ja': `https://kigyoulist.com/ja/license/${slug}${prefCode ? `/${prefCode}` : ''}`,
        'en': `https://kigyoulist.com/en/license/${slug}${prefCode ? `/${prefCode}` : ''}`,
        'vi': `https://kigyoulist.com/vi/license/${slug}${prefCode ? `/${prefCode}` : ''}`,
      }
    },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      url: `https://kigyoulist.com${canonicalPath}`,
      siteName: 'Kigyou-list',
      locale: isEn ? 'en_US' : isVi ? 'vi_VN' : 'ja_JP',
      type: 'website'
    }
  };
}

export default async function LicenseHubPage({ params }: PageProps) {
  const resolved = await params;
  const { slug, locale = 'ja' } = resolved;
  const prefCode = resolved.pref && resolved.pref.length > 0 ? resolved.pref[0] : undefined;

  const config = LICENSE_HUBS[slug];
  if (!config) {
    return notFound();
  }

  const isEn = locale === 'en';
  const isVi = locale === 'vi';
  const lang = locale as 'ja' | 'en' | 'vi';

  const prefObj = prefCode ? JAPAN_PREFECTURES.find(p => p.code === prefCode) : undefined;
  if (prefCode && !prefObj) {
    return notFound();
  }

  const prefName = prefObj ? getPrefectureName(prefObj.name, locale) : undefined;

  // 1. Fetch Stats & Companies
  const [stats, companyResult] = await Promise.all([
    getLicenseHubStats(slug, prefCode),
    getLicenseHubCompanies(slug, prefCode, 50, 0)
  ]);

  const { totalCount, nationalCount, prefCounts } = stats;
  const { companies } = companyResult;

  const currentYear = new Date().getFullYear();

  // Translations
  const d = {
    home: isVi ? 'Trang chủ' : isEn ? 'Home' : 'ホーム',
    licenses: isVi ? 'Giấy phép công' : isEn ? 'Licenses' : '公的許認可ハブ',
    nationalList: isVi ? 'Toàn quốc' : isEn ? 'Nationwide' : '全国一覧',
    overviewStats: isVi ? 'Thống kê tổng quan' : isEn ? 'Overview Statistics' : '登録統計サマリー',
    totalCorpsInPref: isVi ? `Tổng số tại ${prefName || 'Toàn quốc'}` : isEn ? `Total in ${prefName || 'Nationwide'}` : `${prefName || '全国'}の登録社数`,
    nationalTotal: isVi ? 'Tổng số toàn quốc' : isEn ? 'Nationwide Total' : '全国累計社数',
    corps: isVi ? 'doanh nghiệp' : isEn ? 'companies' : '社',
    shareOfNational: isVi ? 'Tỷ trọng toàn quốc' : isEn ? 'Share of National' : '全国シェア',
    prefectureSelectorTitle: isVi ? 'Chọn Tỉnh / Thành Phố Để Tra Cứu Chi Tiết' : isEn ? 'Select Prefecture to View Local Directory' : '都道府県別で絞り込む',
    viewAllPrefectures: isVi ? 'Xem toàn quốc' : isEn ? 'View All Nationwide' : '全国すべて表示',
    ctaHeading: prefName
      ? isVi ? `Tải file CSV danh sách ${config.shortName[lang] || config.shortName.ja} tại ${prefName}` : isEn ? `Export ${prefName} ${config.shortName[lang] || config.shortName.ja} CSV List` : `${prefName}の${config.shortName.ja}リスト CSVダウンロード`
      : isVi ? `Tải file CSV danh sách ${config.shortName[lang] || config.shortName.ja} toàn quốc` : isEn ? `Export Nationwide ${config.shortName[lang] || config.shortName.ja} CSV List` : `全国${config.shortName.ja}リスト CSVダウンロード`,
    ctaDesc: isVi
      ? `Xuất dữ liệu sạch đầy đủ mã số thuế NTA, người đại diện, số điện thoại trực tiếp và địa chỉ trụ sở.`
      : isEn
      ? `Export clean corporate records including NTA corporate numbers, executive names, verified phone numbers, and addresses.`
      : `国税庁法人番号、直通電話番号、代表者名、所在地、許認可番号を完全網羅した正規リストを出力します。`,
    tableTitle: prefName
      ? isVi ? `Danh bạ ${config.shortName[lang] || config.shortName.ja} tại ${prefName}` : isEn ? `${prefName} ${config.shortName[lang] || config.shortName.ja} Directory` : `${prefName}の${config.shortName.ja}一覧`
      : isVi ? `Danh bạ ${config.shortName[lang] || config.shortName.ja} toàn quốc` : isEn ? `Nationwide ${config.shortName[lang] || config.shortName.ja} Directory` : `全国の${config.shortName.ja}一覧`,
    faqTitle: isVi ? 'Câu Hỏi Thường Gặp & Căn Cứ Pháp Lý' : isEn ? 'Frequently Asked Questions & Statutory Framework' : 'よくある質問・制度と法的位置づけ',
    phone: isVi ? 'Điện thoại' : isEn ? 'Phone' : '電話番号',
    rep: isVi ? 'Đại diện' : isEn ? 'Representative' : '代表者',
    address: isVi ? 'Địa chỉ' : isEn ? 'Address' : '所在地',
    licNumber: isVi ? 'Mã giấy phép' : isEn ? 'License No.' : '許認可番号',
    languages: isVi ? 'Ngôn ngữ hỗ trợ' : isEn ? 'Supported Languages' : '対応可能言語',
    viewDetail: isVi ? 'Xem chi tiết' : isEn ? 'View Profile' : '企業詳細を見る'
  };

  // Structured Data Schemas
  const breadcrumbsSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': d.home,
        'item': `https://kigyoulist.com/${locale}`
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': d.licenses,
        'item': `https://kigyoulist.com/${locale}/licenses`
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': config.shortName[lang] || config.shortName.ja,
        'item': `https://kigyoulist.com/${locale}/license/${slug}`
      },
      ...(prefObj ? [{
        '@type': 'ListItem',
        'position': 4,
        'name': prefName,
        'item': `https://kigyoulist.com/${locale}/license/${slug}/${prefCode}`
      }] : [])
    ]
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': config.faqs.map(f => ({
      '@type': 'Question',
      'name': f.question[lang] || f.question.ja,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': f.answer[lang] || f.answer.ja
      }
    }))
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': d.tableTitle,
    'numberOfItems': companies.length,
    'itemListElement': companies.slice(0, 30).map((c, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'url': `https://kigyoulist.com/${locale}/company/${c.corporate_number}`,
      'name': c.company_name
    }))
  };

  const exportFilters: any = {
    [config.filterKey]: true,
    ...(prefCode ? { prefecture_code: prefCode } : {})
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Header />

      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-6">
          <Link href={`/${locale}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {d.home}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href={`/${locale}/licenses`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {d.licenses}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          {prefObj ? (
            <>
              <Link href={`/${locale}/license/${slug}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {config.shortName[lang] || config.shortName.ja}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-800 dark:text-slate-200 font-semibold">{prefName}</span>
            </>
          ) : (
            <span className="text-slate-800 dark:text-slate-200 font-semibold">
              {config.shortName[lang] || config.shortName.ja}
            </span>
          )}
        </nav>

        {/* Hero Section */}
        <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xs mb-8 relative overflow-hidden">
          <div className="max-w-4xl relative z-10">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3.5">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.badgeBg}`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{config.badge[lang] || config.badge.ja}</span>
              </span>

              {prefName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{prefName}</span>
                </span>
              )}
            </div>

            {/* H1 Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              {prefName 
                ? (isVi ? `Danh sách ${config.shortName[lang] || config.shortName.ja} tại ${prefName}` : isEn ? `${prefName} ${config.shortName[lang] || config.shortName.ja} Directory` : `${prefName}の${config.shortName.ja}一覧データベース`)
                : (config.title[lang] || config.title.ja)}
            </h1>

            {/* Legal Authority & Act */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-slate-400" />
                <span><strong>{locale === 'ja' ? '所管機関' : 'Authority'}:</strong> {config.authority[lang] || config.authority.ja}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-slate-400" />
                <span><strong>{locale === 'ja' ? '根拠法令' : 'Act'}:</strong> {config.statutoryAct[lang] || config.statutoryAct.ja}</span>
              </div>
            </div>

            {/* Description */}
            <p className="mt-4 text-sm text-slate-650 dark:text-slate-350 leading-relaxed">
              {config.description[lang] || config.description.ja}
            </p>
          </div>

          {/* Real-time KPI Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="bg-slate-50/80 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                {d.totalCorpsInPref}
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {totalCount.toLocaleString()} <span className="text-xs font-normal text-slate-500">{d.corps}</span>
              </span>
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                {d.nationalTotal}
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {nationalCount.toLocaleString()} <span className="text-xs font-normal text-slate-500">{d.corps}</span>
              </span>
            </div>

            {prefName && nationalCount > 0 && (
              <div className="bg-slate-50/80 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                  {d.shareOfNational}
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                  {((totalCount / nationalCount) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* FREEMIUM GROWTH CTA BAR (Bước 2: Nút Tải CSV Thông Minh) */}
        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50/80 dark:from-[#131D2E] dark:via-[#161B22] dark:to-[#161B22] border-2 border-blue-200/80 dark:border-blue-900/60 rounded-2xl p-5 sm:p-6 shadow-xs mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {d.ctaHeading}
              </h3>
            </div>
            <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed">
              {d.ctaDesc}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3 w-full md:w-auto">
            <ExportCSVButton 
              totalCount={totalCount}
              keyword=""
              filters={exportFilters}
            />
          </div>
        </div>

        {/* 47 PREFECTURES QUICK SELECTOR GRID (Spider-Web SEO Mesh) */}
        <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs mb-10">
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {d.prefectureSelectorTitle}
              </h2>
            </div>

            {prefCode && (
              <Link 
                href={`/${locale}/license/${slug}`}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {d.viewAllPrefectures} →
              </Link>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${locale}/license/${slug}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !prefCode 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {d.nationalList} ({nationalCount.toLocaleString()})
            </Link>

            {prefCounts.map((p) => {
              const isActive = prefCode === p.code;
              const pName = getPrefectureName(p.name, locale);

              return (
                <Link
                  key={p.code}
                  href={`/${locale}/license/${slug}/${p.code}`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{pName}</span>
                  <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${
                    isActive ? 'bg-blue-700 text-white' : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {p.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* COMPANY DIRECTORY LIST */}
        <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs mb-12">
          <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {d.tableTitle}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                {locale === 'ja' ? `現在 ${totalCount.toLocaleString()} 件中 1〜${companies.length} 件を表示中` : `Showing 1–${companies.length} of ${totalCount.toLocaleString()} companies`}
              </span>
            </div>

            <Link
              href={`/${locale}/search?${config.filterKey === 'has_tokutei_lic' ? 'tokutei_lic=true' : config.filterKey === 'has_shigyo_lic' ? 'shigyo_lic=true' : config.filterKey === 'has_real_estate_lic' ? 'real_estate_lic=true' : config.filterKey === 'has_construction_lic' ? 'construction_lic=true' : config.filterKey === 'has_kobutsu_lic' ? 'kobutsu_lic=true' : 'license=true'}${prefCode ? `&prefecture=${prefCode}` : ''}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{locale === 'ja' ? '詳細条件で絞り込む' : locale === 'vi' ? 'Mở trong bộ lọc tìm kiếm' : 'Filter in Search'}</span>
            </Link>
          </div>

          {companies.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              {locale === 'ja' ? '該当する企業が見つかりませんでした。' : 'No companies found for this criteria.'}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {companies.map((c) => {
                const lic = c.license_detail;
                const rawLangs = lic?.specialties?.supported_languages;
                const supportedLangs: string[] = Array.isArray(rawLangs)
                  ? rawLangs
                  : typeof rawLangs === 'string'
                  ? rawLangs.split(/[・,、\s]+/).map((s: string) => s.trim()).filter(Boolean)
                  : [];
                const statutoryAct = typeof lic?.specialties?.statutory_act === 'string' ? lic.specialties.statutory_act : undefined;

                return (
                  <div key={c.corporate_number} className="py-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 px-2 rounded-xl transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        {/* Company Name & Link */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link 
                            href={`/${locale}/company/${c.corporate_number}`}
                            className="text-base font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {c.company_name}
                          </Link>

                          {/* License Number Badge */}
                          {lic?.license_number && (
                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                              {lic.license_number}
                            </span>
                          )}

                          {/* Invoice Badge */}
                          {c.has_invoice && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                              インボイス済
                            </span>
                          )}
                        </div>

                        {/* Metadata row */}
                        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-550 dark:text-slate-400">
                          {c.full_address && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-xs">{c.full_address}</span>
                            </div>
                          )}

                          {c.phone_number && (
                            <div className="flex items-center gap-1 font-mono">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <a href={`tel:${c.phone_number}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                                {c.phone_number}
                              </a>
                            </div>
                          )}

                          {c.representative_name && (
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{c.representative_name}</span>
                            </div>
                          )}
                        </div>

                        {/* Supported Languages tags (for Tokutei Gino) */}
                        {supportedLangs.length > 0 && (
                          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Languages className="w-3 h-3" />
                              <span>{d.languages}:</span>
                            </span>
                            {supportedLangs.map((langName) => (
                              <span 
                                key={langName}
                                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800"
                              >
                                {langName}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Statutory Act for Shigyo */}
                        {statutoryAct && (
                          <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-400">
                            <span>準拠法: {statutoryAct}</span>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <Link
                          href={`/${locale}/company/${c.corporate_number}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                        >
                          <span>{d.viewDetail}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FAQ ACCORDION SECTION (Schema.org FAQPage) */}
        <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs mb-10">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {d.faqTitle}
            </h2>
          </div>

          <div className="space-y-4">
            {config.faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="bg-slate-50/80 dark:bg-slate-900/40 p-4 sm:p-5 rounded-xl border border-slate-200/60 dark:border-slate-800"
              >
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 font-mono">Q.</span>
                  <span>{faq.question[lang] || faq.question.ja}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-650 dark:text-slate-350 leading-relaxed pl-5">
                  {faq.answer[lang] || faq.answer.ja}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
