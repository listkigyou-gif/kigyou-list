import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  Building2, MapPin, Phone, ArrowRight, ChevronRight,
  Briefcase, TrendingUp, BarChart3, ShieldCheck, Mail, CheckCircle2,
  HelpCircle, FileText, Award, DollarSign, Users, ExternalLink, Compass
} from 'lucide-react';
import {
  getPrefectureByCode, searchCompanies, getCitiesWithCounts
} from '@/lib/db';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getPrefectureName, getIndustryName } from '@/lib/locale-mapping';
import { PREFECTURES, getRegionForPrefecture, getNeighboringPrefectures } from '@/lib/hubUtils';

export const revalidate = 3600; // Cache 1 hour with ISR

interface PageProps {
  params: Promise<{
    prefectureCode: string;
    locale: string;
  }>;
}

// Helper to format capital amounts cleanly
function formatCapital(capital?: number | null, locale = 'ja'): string {
  if (!capital || capital <= 0) return '-';
  if (locale === 'ja') {
    if (capital >= 100_000_000) {
      const oku = capital / 100_000_000;
      return `${oku % 1 === 0 ? oku : oku.toFixed(1)}億円`;
    }
    const man = Math.round(capital / 10_000);
    return `${man.toLocaleString()}万円`;
  }
  return `¥${capital.toLocaleString()}`;
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
      : `${prefName}の企業一覧・法人データベース（${currentYear}年最新） | Kigyou-list`;

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

  // 1. Fetch top 30 featured active companies (lean payload, zero duplicate links)
  const { companies, totalCount } = await searchCompanies('', { prefecture_code: prefectureCode }, 30, 0);

  // 2. Fetch exact municipality distribution from city_counts table (cached)
  const cities = await getCitiesWithCounts(prefectureCode);

  // 3. Resolve Region and neighboring prefectures in the same economic silo
  const region = getRegionForPrefecture(prefectureCode);
  const neighboringPrefectures = getNeighboringPrefectures(prefectureCode);

  const prefName = getPrefectureName(pref.name, locale);
  const isEn = locale === 'en';
  const isVi = locale === 'vi';

  const currentPrefObj = PREFECTURES.find(p => p.code === prefectureCode);
  const topCities = cities.slice(0, 16);

  const keyIndustries = [
    { code: '39', name: '情報サービス業' },
    { code: '06', name: '総合工事業' },
    { code: '07', name: '職別工事業' },
    { code: '08', name: '設備工事業' },
    { code: '68', name: '不動産取引業' },
    { code: '69', name: '不動産賃貸業・管理業' },
    { code: '72', name: '専門サービス業' },
    { code: '91', name: '職業紹介・労働者派遣業' },
    { code: '44', name: '道路貨物運送業' },
    { code: '50', name: '各種商品卸売業' },
    { code: '55', name: 'その他の卸売業' },
    { code: '76', name: '飲食店' },
  ];

  const d = isVi ? {
    home: "Trang chủ",
    area: "Khu vực",
    title: `Danh sách doanh nghiệp tại ${prefName}`,
    desc: `Cơ sở dữ liệu B2B chính xác và toàn diện nhất tại khu vực ${prefName}. Hỗ trợ bộ lọc số điện thoại, email, quy mô nhân sự và tín hiệu ý định mua sắm (Intent signals).`,
    totalCompanies: "Tổng doanh nghiệp",
    municipalities: "Quận / Huyện / Thành phố",
    withHiring: "Đang tuyển dụng",
    withSubsidy: "Có trợ cấp / DX",
    browseList: `Doanh nghiệp tiêu biểu (Hiển thị ${companies.length} công ty)`,
    viewDetail: "Xem hồ sơ",
    otherAreas: `Khu vực lân cận (${region?.nameVi || 'Cùng vùng'})`
  } : isEn ? {
    home: "Home",
    area: "Regions",
    title: `${prefName} Company Directory & Sales Leads`,
    desc: `The definitive B2B enterprise dataset for ${prefName}, Japan. Search by industry, phone numbers, verified emails, employee counts, and hiring signals.`,
    totalCompanies: "Total Companies",
    municipalities: "Municipalities / Wards",
    withHiring: "Hiring Signal",
    withSubsidy: "Subsidies Received",
    browseList: `Top Companies (Showing ${companies.length})`,
    viewDetail: "View Profile",
    otherAreas: `Neighboring Prefectures (${region?.nameEn || 'Same Region'})`
  } : {
    home: "ホーム",
    area: "地域別企業一覧",
    title: `${pref.name}の企業一覧・法人データベース`,
    desc: `${pref.name}内で登記・活動中の法人データベースです。国税庁法人番号公表Web-API準拠の一次データに加え、電話番号、代表者名、資本金、従業員規模、求人採用動向、補助金受給歴などの購買シグナルをワンストップで照会できます。`,
    totalCompanies: "登録企業総数",
    municipalities: "収録市区町村数",
    withHiring: "求人採用中",
    withSubsidy: "助成金採択歴あり",
    browseList: `${pref.name}の注目企業リスト (厳選${companies.length}社)`,
    viewDetail: "詳細情報を見る",
    otherAreas: `近隣エリア・同地域（${region?.nameJa || ''}地方）の企業データベース`
  };

  // Structured FAQs for this Prefecture
  const currentYear = new Date().getFullYear();
  const faqs = [
    {
      q: `${pref.name}には現在何社の法人が登録・活動していますか？`,
      a: `${pref.name}内には国税庁公表の公式法人番号を持つ企業・事業所が合計${totalCount.toLocaleString()}社登記・活動しています。Kigyou-listでは国税庁法人番号公表Web-APIおよび公的オープンデータを毎週定期クローリングし、新設法人や本店移転を含む最新データを維持しています。`
    },
    {
      q: `${pref.name}の企業データにはどのような項目やシグナルが含まれますか？`,
      a: `企業名、法人番号、所在地（市区町村・町域・ビル名）、代表者名、設立年月、資本金、従業員規模などの基本情報に加え、適格請求書発行事業者（インボイス制度）の登録状況、直近の採用活動（求人シグナル）、国の補助金・助成金の採択実績、および公共入札（GEPS）落札実績などのB2B購買シグナルを網羅しています。`
    },
    {
      q: `${pref.name}内の市区町村別や特定業種での絞り込み検索は可能ですか？`,
      a: `はい、可能です。本ページに掲載の「市区町村別 法人数・事業所分布」から各自治体（区・市・町）を選択してワンクリックで該当エリアの企業を絞り込めるほか、標準産業分類（JSIC）に基づく業種コード体系、資本金規模、従業員数フィルターを組み合わせた高度な検索をご利用いただけます。`
    },
    {
      q: `${pref.name}の企業営業リストをCSV形式でダウンロードできますか？`,
      a: `はい、ダウンロード可能です。無料会員登録を行うだけで毎日20件（月最大600件、企業認証で1日50件/月1,500件）までのCSVダウンロードが可能です。Proプラン以上をご利用いただくと、お問い合わせフォームURLや企業メールアドレスを含む大量CSV一括エクスポート機能をご活用いただけます。`
    }
  ];

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

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
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
                <span>JIS CODE: {prefectureCode} ({region?.nameJa || '地域'})</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
                {d.title}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed mb-4">
                {d.desc}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                {pref.name}に拠点を置く上場企業から中堅・中小企業、スタートアップまで、法人番号・適格請求書発行事業者登録・所在地・代表者・資本金・従業員規模を網羅。新規開拓営業のターゲティングや与信調査、取引先デューデリジェンスの基礎データとして活用いただけます。
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
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
                    <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>{d.municipalities}</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {cities.length} 自治体
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
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4">
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

        {/* 1. Municipality / City Breakdown Section (Information Gain & Local Authority) */}
        {topCities.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
            <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
                  <span>{pref.name}の市区町村別 法人数・事業所分布（地域別内訳）</span>
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  全{cities.length}自治体中 上位{topCities.length}拠点を表示
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
                {pref.name}における企業集積は、主要都市圏や交通結節点、工業団地・商業集積地を中心に形成されています。以下はデータベースに収録されている自治体別の登記法人数ランキングです。各自治体名をクリックすると、該当市区町村の法人一覧へ絞り込み検索できます。
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {topCities.map((c) => {
                  const pct = totalCount > 0 ? ((c.count / totalCount) * 100).toFixed(1) : '0';
                  return (
                    <Link
                      key={c.cityName}
                      href={`/${locale}/search?prefecture_code=${prefectureCode}&city=${encodeURIComponent(c.cityName)}`}
                      className="p-3 rounded-xl bg-slate-50/80 hover:bg-blue-50/50 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200/80 hover:border-[#1B4F8A]/40 dark:border-slate-700/80 dark:hover:border-blue-500/50 transition-all flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 truncate">
                          {c.cityName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                          {c.count.toLocaleString()}社 ({pct}%)
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 shrink-0 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 2. Economic & Industrial Landscape Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <TrendingUp className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
              <span>{pref.name}の主要産業・業種別分布と経済動向</span>
            </h2>
            <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-3 mb-6">
              <p>
                {pref.name}の産業構造は、地域ごとの立地優位性を活かした製造業・卸売小売業・サービス業のほか、建設業や専門職種法人（士業・許認可事業者）など多岐にわたる産業基盤を有しています。Kigyou-listでは総務省の日本標準産業分類（JSIC）に準拠した119の産業分類コード体系を採用し、業界別の企業アプローチを可能にしています。
              </p>
              <p>
                新規開拓営業やパートナー企業選定においては、単一の企業名検索にとどまらず、適格請求書発行事業者（インボイス）の登録有無や、直近の求人採用公開状況、中小企業庁や自治体が管轄する補助金・助成金の採択動向といった「購買意欲シグナル（Intent Signals）」を掛け合わせることで、成約率の高いリードジェネレーションを実現できます。
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {keyIndustries.map((ind) => {
                const indLabel = getIndustryName(ind.name, locale);
                return (
                  <Link
                    key={ind.code}
                    href={`/${locale}/industry/${ind.code}/location/${prefectureCode}`}
                    className="px-3.5 py-2.5 rounded-lg bg-slate-50 hover:bg-blue-50/60 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200/80 hover:border-[#1B4F8A]/50 dark:border-slate-700/80 text-xs font-medium text-slate-700 hover:text-[#1B4F8A] dark:text-slate-300 dark:hover:text-blue-400 flex items-center justify-between gap-2 transition-colors group"
                  >
                    <span className="truncate">
                      {isEn ? `${indLabel} (${prefName})` : isVi ? `${indLabel} tại ${prefName}` : `${pref.name}の${ind.name}`}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. Featured Company List (Lean Payload: 30 Featured Cards with rich metrics & single semantic link) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
                <span>{d.browseList}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {pref.name}内で活動中の主要企業（法人番号・所在地・業種・資本金・シグナル公表企業）
              </p>
            </div>
            <Link
              href={`/${locale}/search?prefecture_code=${prefectureCode}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs sm:text-sm font-semibold shadow-2xs transition-colors shrink-0"
            >
              <span>{pref.name}の全{totalCount.toLocaleString()}社を詳細検索</span>
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
                      <div className="flex items-center gap-1.5 shrink-0">
                        {comp.has_hiring && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
                            求人中
                          </span>
                        )}
                        {comp.has_subsidy && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
                            助成金
                          </span>
                        )}
                        {comp.is_listed && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60">
                            上場
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{comp.full_address || `${comp.prefecture_name || ''} ${comp.city_name || ''}`}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {comp.industry_name && (
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{comp.industry_name}</span>
                          </div>
                        )}
                        {comp.capital_amount && comp.capital_amount > 0 && (
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>資本金: {formatCapital(comp.capital_amount, locale)}</span>
                          </div>
                        )}
                        {comp.employee_count && comp.employee_count > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>従業員: {comp.employee_count.toLocaleString()}名</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 dark:text-slate-500 font-mono">
                      法人番号: {comp.corporate_number}
                    </span>
                    <Link
                      href={`/${locale}/company/${comp.corporate_number}`}
                      className="font-semibold text-[#1B4F8A] hover:text-[#143D6C] dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      <span>{d.viewDetail}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom CTA to Full Search */}
          <div className="mt-8 text-center p-6 bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              {pref.name}内のすべての法人データベースを検索
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-4">
              資本金規模、従業員数、電話番号・メールアドレス・問い合わせフォームURLの有無、採用求人動向、補助金受給履歴など、全30以上の条件で絞り込み可能です。
            </p>
            <Link
              href={`/${locale}/search?prefecture_code=${prefectureCode}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <span>{pref.name}の企業データベースを詳細検索する ({totalCount.toLocaleString()}社)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* 4. Cross-linking: 5 Corporate Change & Intent Signal Hubs for this Prefecture */}
        {currentPrefObj && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
            <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
                <span>
                  {isVi
                    ? `Biến động pháp nhân & Tín hiệu kinh doanh tại ${prefName}`
                    : isEn
                      ? `${prefName} Corporate Changes & Business Signals`
                      : `${pref.name}の法人異動・最新シグナル動向`}
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  {
                    href: `/${locale}/new-companies/${currentPrefObj.slug}`,
                    label: isVi ? 'Pháp nhân mới thành lập' : isEn ? 'Newly Registered Companies' : '新設法人一覧',
                    sub: isVi ? `${prefName}` : isEn ? `in ${prefName}` : `${pref.name}の新設企業`,
                  },
                  {
                    href: `/${locale}/jobs/latest/${currentPrefObj.slug}`,
                    label: isVi ? 'Doanh nghiệp đang tuyển dụng' : isEn ? 'Actively Hiring Companies' : '求人・採用中企業',
                    sub: isVi ? `${prefName}` : isEn ? `in ${prefName}` : `${pref.name}の採用動向`,
                  },
                  {
                    href: `/${locale}/changes/relocation/${currentPrefObj.slug}`,
                    label: isVi ? 'Chuyển trụ sở & Địa chỉ' : isEn ? 'Headquarters Relocations' : '本店移転・住所変更',
                    sub: isVi ? `${prefName}` : isEn ? `in ${prefName}` : `${pref.name}の移転履歴`,
                  },
                  {
                    href: `/${locale}/changes/merger/${currentPrefObj.slug}`,
                    label: isVi ? 'Sáp nhập & Tái cấu trúc' : isEn ? 'Mergers & Reorganizations' : '合併・組織再編',
                    sub: isVi ? `${prefName}` : isEn ? `in ${prefName}` : `${pref.name}の再編情報`,
                  },
                  {
                    href: `/${locale}/status/bankruptcies/${currentPrefObj.slug}`,
                    label: isVi ? 'Giải thể & Đóng cửa' : isEn ? 'Closures & Dissolutions' : '倒産・閉鎖・解散',
                    sub: isVi ? `${prefName}` : isEn ? `in ${prefName}` : `${pref.name}の閉鎖情報`,
                  },
                ].map((hub) => (
                  <Link
                    key={hub.href}
                    href={hub.href}
                    className="p-3.5 rounded-xl bg-slate-50/80 hover:bg-blue-50/50 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200/80 hover:border-[#1B4F8A]/50 dark:border-slate-700/80 dark:hover:border-blue-500/50 transition-all flex items-center justify-between group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 truncate">
                        {hub.label}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {hub.sub}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 shrink-0 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 5. Regional Silo Section: Neighboring Prefectures in the Same Region (Hub-and-Spoke Silo) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
                <span>{d.otherAreas}</span>
              </h2>
              <Link
                href={`/${locale}/directory`}
                className="text-xs text-[#1B4F8A] hover:text-[#143D6C] dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 font-semibold transition-colors"
              >
                <span>日本全国47都道府県の全地域一覧を見る</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {neighboringPrefectures.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {neighboringPrefectures.map((np) => (
                  <Link
                    key={np.code}
                    href={`/${locale}/area/${np.code}`}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200/80 hover:border-[#1B4F8A]/40 dark:border-slate-700/80 text-xs font-semibold text-slate-700 hover:text-[#1B4F8A] dark:text-slate-300 dark:hover:text-blue-400 transition-colors flex items-center justify-between group"
                  >
                    <span className="truncate">{np.nameJa}の企業一覧</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <Link href={`/${locale}/directory`} className="text-[#1B4F8A] hover:underline font-semibold">
                  都道府県別企業ディレクトリ
                </Link>
                から全国47都道府県のデータベースをご参照ください。
              </p>
            )}
          </div>
        </section>

        {/* 6. Frequently Asked Questions (FAQ) Section (Rich Result & User Intent Satisfaction) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
              <span>{pref.name}の企業データベースに関するよくあるご質問（FAQ）</span>
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-start gap-2">
                    <span className="text-[#1B4F8A] dark:text-blue-400 font-extrabold shrink-0">Q.</span>
                    <span>{faq.q}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-5">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
