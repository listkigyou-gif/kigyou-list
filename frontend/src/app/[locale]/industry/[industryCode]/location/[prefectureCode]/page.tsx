import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { 
  Building2, MapPin, Phone, ArrowRight, ChevronRight,
  Search, Briefcase, TrendingUp, AlertCircle, BarChart3 
} from 'lucide-react';
import { 
  getIndustryByCode, getPrefectureByCode, 
  getCategoryStats, searchCompanies, getSiblingIndustries 
} from '@/lib/db';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getTranslations } from '@/lib/i18n';
import { prefectureJaToEn, industryJaToEn, getPrefectureName, getIndustryName } from '@/lib/locale-mapping';

export const revalidate = 3600; // Cache categories for 1 hour, ISR enabled

interface PageProps {
  params: Promise<{
    industryCode: string;
    prefectureCode: string;
    locale: string;
  }>;
}

// 1. Dynamic SEO Metadata Generation
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const ind = await getIndustryByCode(resolvedParams.industryCode);
  const pref = await getPrefectureByCode(resolvedParams.prefectureCode);
  const locale = resolvedParams.locale || 'ja';

  if (!ind || !pref) {
    return {
      title: locale === 'en' ? 'Category Not Found | Kigyou-list' : locale === 'vi' ? 'Không tìm thấy danh mục | Kigyou-list' : 'カテゴリが見つかりません | Kigyou-list',
    };
  }

  const prefName = getPrefectureName(pref.name, locale);
  const industryMappedName = getIndustryName(ind.industry_name, locale);
  const isEn = locale === 'en';
  const isVi = locale === 'vi';

  return {
    title: isVi
      ? `Danh sách công ty ${industryMappedName} tại ${prefName} (Mới nhất 2026) | Kigyou-list`
      : isEn
      ? `${prefName} ${industryMappedName} Companies (2026 List) | Kigyou-list`
      : `${prefName}の${industryMappedName}企業一覧（2026年最新） | Kigyou-list`,
    description: isVi
      ? `Duyệt danh bạ các doanh nghiệp hoạt động trong lĩnh vực ${industryMappedName} tại ${prefName}, Nhật Bản. Chi tiết thông tin liên hệ, mã số thuế, số điện thoại, quy mô nhân sự, vốn điều lệ và các tín hiệu tuyển dụng.`
      : isEn
      ? `Browse ${prefName} ${industryMappedName} company list. Details include address, telephone, capital, employee counts, current hiring status, and historical subsidies.`
      : `${prefName}で稼働している${industryMappedName}の企業データベースです。企業名、電話番号、登記住所、資本金、従業員数、最新の採用活動、補助金受給履歴などの購買シグナルを網羅しています。`,
    keywords: isVi
      ? [`${prefName} ${industryMappedName}`, `danh sách công ty ${prefName}`, `danh bạ doanh nghiệp ${industryMappedName}`]
      : isEn
      ? [`${prefName} ${industryMappedName}`, `${prefName} company database`, `${industryMappedName} lead list`]
      : [`${prefName} ${industryMappedName}`, `${prefName} 企業リスト`, `${industryMappedName} 営業リスト`],
    alternates: {
      canonical: `/${locale}/industry/${resolvedParams.industryCode}/location/${resolvedParams.prefectureCode}`,
      languages: {
        ja: `/ja/industry/${resolvedParams.industryCode}/location/${resolvedParams.prefectureCode}`,
        en: `/en/industry/${resolvedParams.industryCode}/location/${resolvedParams.prefectureCode}`,
        vi: `/vi/industry/${resolvedParams.industryCode}/location/${resolvedParams.prefectureCode}`,
      }
    }
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { industryCode, prefectureCode } = resolvedParams;
  const locale = resolvedParams.locale || 'ja';

  const t = getTranslations(locale);

  // 2. Fetch Category details & Statistics
  const ind = await getIndustryByCode(industryCode);
  const pref = await getPrefectureByCode(prefectureCode);

  if (!ind || !pref) {
    return notFound();
  }

  const stats = await getCategoryStats(industryCode, prefectureCode);
  const { companies } = await searchCompanies('', { industry_code: industryCode, prefecture_code: prefectureCode }, 50, 0);

  // 3. Generate Cross-linking data for SEO Matrix
  const siblingIndustries = await getSiblingIndustries(prefectureCode, industryCode, 5);
  const popularPrefectures = [
    { code: '13', name: '東京都' },
    { code: '27', name: '大阪府' },
    { code: '23', name: '愛知県' },
    { code: '14', name: '神奈川県' },
    { code: '40', name: '福岡県' }
  ];

  const prefName = getPrefectureName(pref.name, locale);
  const industryMappedName = getIndustryName(ind.industry_name, locale);
  const isEn = locale === 'en';
  const isVi = locale === 'vi';

  // Format currency stats
  const formatCapital = (val: number) => {
    if (locale === 'en') {
      return `¥${(val / 100).toFixed(1)} Million JPY`;
    }
    if (locale === 'vi') {
      return `¥${(val / 100).toFixed(1)} triệu JPY`;
    }
    if (val >= 10000) return `${(val / 10000).toFixed(0)}億円`;
    return `${val.toLocaleString()}万円`;
  };

  const d = isVi ? {
    home: "Trang chủ",
    directory: "Danh mục",
    categoryLabel: "Phân loại chuyên sâu",
    introTitle: `Danh sách công ty ${industryMappedName} tại ${prefName}`,
    introDesc: `Danh sách toàn diện các doanh nghiệp đang hoạt động trong ngành ${industryMappedName} tại khu vực ${prefName}, Nhật Bản. Tra cứu nhanh số điện thoại, thông tin người đại diện, vốn điều lệ, quy mô nhân sự và các tín hiệu mua hàng B2B thực tế.`,
    activeCompanies: "Doanh nghiệp hoạt động",
    avgCapital: "Vốn điều lệ trung bình",
    coverageRate: "Tỷ lệ bao phủ DB",
    completeCoverage: "Hoàn toàn",
    companiesCount: `Danh sách doanh nghiệp (Hiển thị ${companies.length} công ty)`,
    sortByCapital: "Sắp xếp theo vốn điều lệ",
    viewProfile: "Xem chi tiết",
    otherIndustriesTitle: `Ngành nghề khác tại ${prefName} (Cùng khu vực)`,
    otherPrefecturesTitle: `Các tỉnh thành khác (Cùng ngành nghề)`,
    companySuffix: " doanh nghiệp",
    unregistered: "Chưa đăng ký",
    noRelatedCompanies: "Không tìm thấy ngành nghề liên quan nào khác tại tỉnh này.",
    noMatchingTitle: "Không tìm thấy doanh nghiệp phù hợp",
    noMatchingDesc: `Hiện tại chưa có dữ liệu mẫu cho ngành ${industryMappedName} tại ${prefName}. Vui lòng quay lại sau khi cơ sở dữ liệu được cập nhật.`
  } : isEn ? {
    home: "Home",
    directory: "Directory",
    categoryLabel: "Specialized Category",
    introTitle: `${industryMappedName} Companies in ${prefName}`,
    introDesc: `Comprehensive list of active companies operating within the ${industryMappedName} sector in ${prefName}. Access contact numbers, executive details, capital size, and real-time business buying intent signals in one place.`,
    activeCompanies: "Active Companies",
    avgCapital: "Average Capital",
    coverageRate: "Database Coverage",
    completeCoverage: "Complete",
    companiesCount: `Company List (Showing ${companies.length})`,
    sortByCapital: "Sorted by Capital",
    viewProfile: "View Profile",
    otherIndustriesTitle: `Other Industries in ${prefName} (Same Area)`,
    otherPrefecturesTitle: `Other Prefectures (Same Industry)`,
    companySuffix: " companies",
    unregistered: "Unregistered",
    noRelatedCompanies: "No other industries found in this prefecture.",
    noMatchingTitle: "No Matching Companies Found",
    noMatchingDesc: `No mock data is currently registered for the ${industryMappedName} industry in ${prefName}. Please wait for database updates.`
  } : {
    home: "ホーム",
    directory: "企業データ一覧",
    categoryLabel: "業種 × 地域 特設カテゴリ",
    introTitle: `${pref.name}の${ind.industry_name} 企業・営業リスト一覧`,
    introDesc: `${pref.name}内で活動中の${ind.industry_name}業界の企業データベースです。基本情報、代表者の連絡先、設立年月日に加え、最新の求人募集・助成金の獲得実績・公共入札などの購買シグナル（インテントデータ）をワンストップで確認・活用できます。`,
    activeCompanies: "稼働企業数",
    avgCapital: "平均資本金",
    coverageRate: "データベース網羅率",
    completeCoverage: "完全版",
    companiesCount: `企業リスト一覧 (${companies.length}件表示)`,
    sortByCapital: "資本金順にソート",
    viewProfile: "詳細プロフィール",
    otherIndustriesTitle: `${pref.name}の他の業種から探す (同地域)`,
    otherPrefecturesTitle: "他の主要都道府県から探す (同業種)",
    companySuffix: "社",
    unregistered: "未登録",
    noRelatedCompanies: "他のカテゴリ情報はありません",
    noMatchingTitle: "対象企業が見つかりませんでした",
    noMatchingDesc: `現在、${pref.name}の${ind.industry_name}に該当するテストデータは登録されていません。データアップデートをお待ちください。`
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": d.home,
        "item": `https://kigyoulist.com/${locale}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": d.directory,
        "item": `https://kigyoulist.com/${locale}/directory`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": `${prefName} ${industryMappedName}`,
        "item": `https://kigyoulist.com/${locale}/industry/${industryCode}/location/${prefectureCode}`
      }
    ]
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "numberOfItems": companies.length,
    "itemListElement": companies.map((comp, idx) => {
      const compName = locale === 'en' && comp.company_name_en ? comp.company_name_en : comp.company_name;
      return {
        "@type": "ListItem",
        "position": idx + 1,
        "url": `https://kigyoulist.com/${locale}/company/${comp.corporate_number}`,
        "item": {
          "@type": "Corporation",
          "name": compName,
          "taxID": comp.corporate_number,
          "address": {
            "@type": "PostalAddress",
            "addressRegion": locale === 'en' && comp.prefecture_name ? (prefectureJaToEn[comp.prefecture_name] || comp.prefecture_name) : (comp.prefecture_name || ""),
            "addressCountry": "JP"
          }
        }
      };
    })
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* Header */}
      <div data-nosnippet>
        <Header />
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
        {/* Visual Breadcrumbs */}
        <nav className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors">{d.home}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <Link href={`/${locale}/directory`} className="hover:text-primary transition-colors">{d.directory}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200 truncate" aria-current="page">
            {locale === 'vi' ? `${industryMappedName} tại ${prefName}` : locale === 'en' ? `${prefName} ${industryMappedName}` : `${prefName}の${industryMappedName}`}
          </span>
        </nav>

        {/* Dynamic SEO Header / Intro Banner */}
        <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-primary dark:text-secondary uppercase tracking-wider">
              <Briefcase className="w-4 h-4" />
              <span>{d.categoryLabel}</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {d.introTitle}
            </h1>

            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-4xl">
              {d.introDesc}
            </p>
          </div>

          {/* Aggregated Statistics Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{d.activeCompanies}</span>
                <strong className="text-lg font-black font-mono text-slate-800 dark:text-white">
                  {stats.count.toLocaleString()} <span className="text-xs font-medium font-sans text-slate-500">{d.companySuffix}</span>
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{d.avgCapital}</span>
                <strong className="text-lg font-black font-mono text-slate-800 dark:text-white">
                  {stats.avgCapital > 0 ? formatCapital(stats.avgCapital) : d.unregistered}
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{d.coverageRate}</span>
                <strong className="text-lg font-black font-mono text-slate-800 dark:text-white">
                  100% <span className="text-xs font-medium font-sans text-slate-500">{d.completeCoverage}</span>
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* Results List */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              {d.companiesCount}
            </h2>
            <span className="text-xs text-slate-400">{d.sortByCapital}</span>
          </div>

          {companies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {companies.map((comp) => {
                const compName = locale === 'en' && comp.company_name_en ? comp.company_name_en : comp.company_name;
                const compPrefName = getPrefectureName(comp.prefecture_name, locale);
                const localizedCompStatus = locale === 'en' 
                  ? (comp.status === '活動中' ? 'Active' : comp.status === '閉鎖' ? 'Closed' : comp.status === '解散' ? 'Dissolved' : comp.status)
                  : locale === 'vi'
                  ? (comp.status === '活動中' ? 'Đang hoạt động' : comp.status === '閉鎖' ? 'Đã đóng cửa' : comp.status === '解散' ? 'Đã giải thể' : comp.status)
                  : comp.status;

                return (
                  <div 
                    key={comp.corporate_number}
                    className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 hover:border-primary dark:hover:border-secondary rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div className="flex flex-col gap-3">
                      {/* Header: Status and Location */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shadow-sm ${
                          comp.status === '閉鎖' || comp.status === '解散'
                            ? 'text-rose-800 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-450 border-rose-200/20 dark:border-rose-900/30'
                            : 'text-emerald-800 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-450 border-emerald-250/20 dark:border-emerald-900/50'
                        }`}>
                          {localizedCompStatus}
                        </span>
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-300" />
                          {compPrefName}
                        </span>
                      </div>

                      {/* Company Name */}
                      <Link 
                        href={`/${locale}/company/${comp.corporate_number}`}
                        className="text-base font-extrabold text-slate-900 dark:text-white hover:text-primary dark:hover:text-secondary group-hover:underline tracking-tight transition-colors line-clamp-1 block"
                      >
                        {compName}
                      </Link>

                      {/* Standard details block */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 py-1 border-y border-slate-50 dark:border-slate-800/30">
                        <div>
                          <span className="text-slate-400 block text-[9px]">{t.company.capital}</span>
                          <strong className="text-slate-700 dark:text-slate-300 font-mono font-bold">
                            {comp.capital_amount ? (locale === 'en' ? `¥${(comp.capital_amount / 1000000).toLocaleString(undefined, {maximumFractionDigits: 2})}M JPY` : locale === 'vi' ? `¥${(comp.capital_amount / 1000000).toLocaleString(undefined, {maximumFractionDigits: 2})}tr JPY` : `${(comp.capital_amount / 10000).toLocaleString()}万円`) : d.unregistered}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">{t.company.employees}</span>
                          <strong className="text-slate-700 dark:text-slate-300 font-mono font-bold">
                            {comp.employee_count ? (locale === 'en' ? `${comp.employee_count.toLocaleString()} employees` : locale === 'vi' ? `${comp.employee_count.toLocaleString()} nhân viên` : `${comp.employee_count}名`) : d.unregistered}
                          </strong>
                        </div>
                      </div>

                      {/* Phone details */}
                      <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-semibold">{locale === 'en' ? 'Phone: ' : locale === 'vi' ? 'Điện thoại: ' : '代表電話: '}</span>
                        <span className="font-mono">{comp.phone_number || d.unregistered}</span>
                      </div>
                    </div>

                    {/* Call to action card detail link */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono block">
                        ID: {comp.corporate_number}
                      </span>
                      <Link 
                        href={`/${locale}/company/${comp.corporate_number}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:text-primary-hover dark:text-secondary dark:group-hover:text-secondary-hover transition-colors"
                      >
                        {d.viewProfile}
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <AlertCircle className="w-10 h-10 text-slate-300" />
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{d.noMatchingTitle}</h4>
                <p className="text-xs max-w-sm mx-auto leading-relaxed text-slate-500 dark:text-slate-400">
                  {d.noMatchingDesc}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* SEO Cross-linking Matrix Grid */}
        <section data-nosnippet className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6 pt-8 border-t border-slate-200 dark:border-slate-800">
          {/* 同地域・他業界 (Sibling industries in same prefecture) */}
          <div className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-black text-sm text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              {d.otherIndustriesTitle}
            </h3>
            {siblingIndustries.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {siblingIndustries.map(item => {
                  const itemIndustryName = getIndustryName(item.name, locale);
                  return (
                    <Link 
                      key={item.code} 
                      href={`/${locale}/industry/${item.code}/location/${prefectureCode}`}
                      className="text-xs font-semibold text-slate-600 hover:text-primary dark:text-slate-350 dark:hover:text-secondary flex items-center gap-1 transition-colors"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{locale === 'en' ? `${itemIndustryName} in ${prefName}` : locale === 'vi' ? `${itemIndustryName} tại ${prefName}` : `${prefName}の${itemIndustryName}`}</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <span className="text-xs text-slate-400">{d.noRelatedCompanies}</span>
            )}
          </div>

          {/* 同業界・他地域 (Same industry in popular prefectures) */}
          <div className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-black text-sm text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              {d.otherPrefecturesTitle}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {popularPrefectures.filter(p => p.code !== prefectureCode).map(p => {
                const pPrefName = getPrefectureName(p.name, locale);
                return (
                  <Link 
                    key={p.code} 
                    href={`/${locale}/industry/${industryCode}/location/${p.code}`}
                    className="text-xs font-semibold text-slate-600 hover:text-primary dark:text-slate-350 dark:hover:text-secondary flex items-center gap-1 transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{locale === 'en' ? `${industryMappedName} in ${pPrefName}` : locale === 'vi' ? `${industryMappedName} tại ${pPrefName}` : `${pPrefName}の${industryMappedName}`}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

      </main>
      <div data-nosnippet>
        <Footer />
      </div>
    </div>
  );
}
