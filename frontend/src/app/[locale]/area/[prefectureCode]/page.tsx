import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { 
  Building2, MapPin, Phone, ArrowRight, ChevronRight,
  Briefcase, TrendingUp, BarChart3, ShieldCheck, Mail
} from 'lucide-react';
import { 
  getPrefectureByCode, searchCompanies 
} from '@/lib/db';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getPrefectureName } from '@/lib/locale-mapping';

export const revalidate = 3600; // Cache 1 hour with ISR

interface PageProps {
  params: Promise<{
    prefectureCode: string;
    locale: string;
  }>;
}

// 1. Dynamic SEO Metadata Generation for Local Area
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const pref = await getPrefectureByCode(resolvedParams.prefectureCode);
  const locale = resolvedParams.locale || 'ja';

  if (!pref) {
    return notFound();
  }

  const prefName = getPrefectureName(pref.name, locale);
  const isEn = locale === 'en';
  const isVi = locale === 'vi';

  const currentYear = new Date().getFullYear();
  const pageTitle = isVi
    ? `Danh sách công ty tại ${prefName} (Cập nhật ${currentYear}) | Kigyou-list`
    : isEn
    ? `${prefName} Company Directory & Business Database (${currentYear}) | Kigyou-list`
    : `${prefName}の企業一覧・営業リストデータベース（${currentYear}年最新） | Kigyou-list`;

  const pageDesc = isVi
    ? `Cơ sở dữ liệu toàn diện các doanh nghiệp đang hoạt động tại ${prefName}, Nhật Bản. Tra cứu thông tin liên hệ, mã số thuế pháp nhân, vốn điều lệ, quy mô nhân sự và tín hiệu mua hàng B2B.`
    : isEn
    ? `Comprehensive database of active businesses in ${prefName}, Japan. Find corporate numbers, contact addresses, phone numbers, executive names, capital, and buying intent signals.`
    : `${prefName}内に本社・拠点を置く企業の総合データベースです。会社名、法人番号、電話番号、所在地、資本金、従業員数、および最新の採用活動や補助金受給履歴などの購買シグナルを網羅。`;

  return {
    title: pageTitle,
    description: pageDesc,
    alternates: {
      canonical: `https://kigyoulist.com/${locale}/area/${resolvedParams.prefectureCode}`,
      languages: {
        'ja': `https://kigyoulist.com/ja/area/${resolvedParams.prefectureCode}`,
        'en': `https://kigyoulist.com/en/area/${resolvedParams.prefectureCode}`,
        'vi': `https://kigyoulist.com/vi/area/${resolvedParams.prefectureCode}`,
      }
    },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      url: `https://kigyoulist.com/${locale}/area/${resolvedParams.prefectureCode}`,
      siteName: 'Kigyou-list',
      locale: isEn ? 'en_US' : isVi ? 'vi_VN' : 'ja_JP',
      type: 'website',
    }
  };
}

export default async function PrefectureAreaPage({ params }: PageProps) {
  const { prefectureCode, locale } = await params;
  const pref = await getPrefectureByCode(prefectureCode);

  if (!pref) {
    return notFound();
  }

  // Get top 50 active companies in this prefecture
  const { companies, totalCount } = await searchCompanies('', { prefecture_code: prefectureCode }, 50, 0);

  const prefName = getPrefectureName(pref.name, locale);
  const isEn = locale === 'en';
  const isVi = locale === 'vi';

  const otherPrefectures = [
    { code: '13', name: '東京都' },
    { code: '27', name: '大阪府' },
    { code: '23', name: '愛知県' },
    { code: '14', name: '神奈川県' },
    { code: '40', name: '福岡県' },
    { code: '01', name: '北海道' },
    { code: '28', name: '兵庫県' },
    { code: '11', name: '埼玉県' }
  ].filter(p => p.code !== prefectureCode);

  const d = isVi ? {
    home: "Trang chủ",
    area: "Khu vực",
    title: `Danh sách doanh nghiệp tại ${prefName}`,
    desc: `Cơ sở dữ liệu B2B chính xác và toàn diện nhất tại khu vực ${prefName}. Hỗ trợ bộ lọc số điện thoại, email, quy mô nhân sự và tín hiệu ý định mua sắm (Intent signals).`,
    totalCompanies: "Tổng doanh nghiệp",
    withHiring: "Đang tuyển dụng",
    withSubsidy: "Có trợ cấp/DX",
    browseList: `Doanh nghiệp tiêu biểu (Hiển thị ${companies.length} công ty)`,
    viewDetail: "Xem hồ sơ",
    otherAreas: "Khám phá các tỉnh thành trọng điểm khác"
  } : isEn ? {
    home: "Home",
    area: "Regions",
    title: `${prefName} Company Directory & Sales Leads`,
    desc: `The definitive B2B enterprise dataset for ${prefName}, Japan. Search by industry, phone numbers, verified emails, employee counts, and hiring signals.`,
    totalCompanies: "Total Companies",
    withHiring: "Hiring Signal",
    withSubsidy: "Subsidies Received",
    browseList: `Top Companies (Showing ${companies.length})`,
    viewDetail: "View Profile",
    otherAreas: "Explore Other Major Prefectures"
  } : {
    home: "ホーム",
    area: "地域別企業一覧",
    title: `${pref.name}の企業一覧・法人データベース`,
    desc: `${pref.name}内で登記・活動中の法人データベースです。電話番号、代表者名、資本金、従業員規模に加え、求人動向や補助金採択などのシグナルデータをワンストップで確認できます。`,
    totalCompanies: "登録企業総数",
    withHiring: "求人採用中",
    withSubsidy: "助成金採択歴あり",
    browseList: `${pref.name}の注目企業リスト (${companies.length}件表示)`,
    viewDetail: "詳細情報を見る",
    otherAreas: "他エリアの企業データベースを見る"
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
        "name": d.area,
        "item": `https://kigyoulist.com/${locale}/directory`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": prefName,
        "item": `https://kigyoulist.com/${locale}/area/${prefectureCode}`
      }
    ]
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "numberOfItems": companies.length,
    "itemListElement": companies.map((comp, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "url": `https://kigyoulist.com/${locale}/company/${comp.corporate_number}`,
      "name": locale === 'en' && comp.company_name_en ? comp.company_name_en : comp.company_name
    }))
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0D1117] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <Header />

      <main className="flex-1 pb-16">
        {/* Breadcrumb */}
        <nav className="bg-white dark:bg-[#161B22] border-b border-slate-200/90 dark:border-slate-800" aria-label="Breadcrumb">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 space-x-2">
              <Link href={`/${locale}`} className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">{d.home}</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link href={`/${locale}/directory`} className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">{d.area}</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-900 dark:text-slate-200 font-semibold">{prefName}</span>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="bg-white dark:bg-[#161B22] border-b border-slate-200/90 dark:border-slate-800 py-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800 text-[#1B4F8A] dark:text-blue-300 text-xs font-semibold mb-4">
                <MapPin className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                <span>JIS CODE: {prefectureCode}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
                {d.title}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
                {d.desc}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                    <Building2 className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                    <span>{d.totalCompanies}</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {totalCount.toLocaleString()}+
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                    <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{d.withHiring}</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    アクティブ
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                    <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>{d.withSubsidy}</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
                    シグナル対応
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-6 flex flex-wrap items-center gap-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{locale === 'ja' ? '国税庁法人番号 100% 照合済' : locale === 'vi' ? 'Khớp 100% Mã số thuế NTA' : '100% NTA Corporate Number Match'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{locale === 'ja' ? '週次クローリングによる高鮮度データ' : locale === 'vi' ? 'Cập nhật định kỳ liên tục' : 'Weekly Refreshed Dataset'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{locale === 'ja' ? 'CSV一括ダウンロード対応' : locale === 'vi' ? 'Hỗ trợ xuất file CSV' : 'CSV Export Ready'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Company List */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
              <span>{d.browseList}</span>
            </h2>
            <Link 
              href={`/${locale}/search?prefecture_code=${prefectureCode}`}
              className="text-xs sm:text-sm text-[#1B4F8A] hover:text-[#143D6C] dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 font-semibold transition-colors"
            >
              <span>高度な条件で絞り込み</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companies.map((comp) => {
              const name = locale === 'en' && comp.company_name_en ? comp.company_name_en : comp.company_name;
              return (
                <div 
                  key={comp.corporate_number}
                  className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 hover:border-[#1B4F8A]/40 dark:hover:border-blue-700/60 rounded-xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link 
                        href={`/${locale}/company/${comp.corporate_number}`}
                        className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors line-clamp-1"
                      >
                        {name}
                      </Link>
                      {comp.has_hiring && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 shrink-0">
                          求人中
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{comp.full_address || `${comp.prefecture_name || ''} ${comp.city_name || ''}`}</span>
                      </div>
                      {comp.industry_name && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="truncate">{comp.industry_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                      法人番号: {comp.corporate_number}
                    </span>
                    <Link
                      href={`/${locale}/company/${comp.corporate_number}`}
                      className="text-xs font-semibold text-[#1B4F8A] hover:text-[#143D6C] dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      <span>{d.viewDetail}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Cross-linking Mesh Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
          <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              {d.otherAreas}
            </h3>
            <div className="flex flex-wrap gap-2">
              {otherPrefectures.map(op => (
                <Link
                  key={op.code}
                  href={`/${locale}/area/${op.code}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 text-xs font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
                >
                  {getPrefectureName(op.name, locale)}の企業一覧
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
