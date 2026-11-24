import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { 
  Building2, MapPin, ArrowRight, ChevronRight,
  Briefcase, BarChart3, ShieldCheck, CheckCircle2, HelpCircle, Landmark, FileSpreadsheet
} from 'lucide-react';
import { 
  getPrefectureByCode, searchCompanies, getPrefectureAreaInsights
} from '@/lib/db';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getPrefectureName, getIndustryName } from '@/lib/locale-mapping';
import { PREFECTURES, getRegionalNeighbors } from '@/lib/hubUtils';

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
    ? `Cơ sở dữ liệu toàn diện các doanh nghiệp đang hoạt động tại ${prefName}, Nhật Bản. Thống kê phân bổ theo quận/huyện, mã số thuế NTA, giấy phép hành nghề, vốn điều lệ và tín hiệu tuyển dụng B2B.`
    : isEn
    ? `Comprehensive database of active businesses in ${prefName}, Japan. Municipality distribution tables, NTA corporate numbers, official licenses, capital scale, and buying intent signals.`
    : `${prefName}内に本社・拠点を置く企業の総合データベースです。市区町村別の法人分布統計、会社名、法人番号、電話番号、資本金、許認可・適格請求書（インボイス）登録および採用シグナルを網羅。`;

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

  // Fetch top 30 representative companies + real PostgreSQL regional insights in parallel
  const [{ companies, totalCount }, insights] = await Promise.all([
    searchCompanies('', { prefecture_code: prefectureCode }, 30, 0),
    getPrefectureAreaInsights(prefectureCode),
  ]);

  const effectiveTotal = insights.totalCompanies || totalCount;
  const prefName = getPrefectureName(pref.name, locale);
  const isEn = locale === 'en';
  const isVi = locale === 'vi';
  const currentYear = new Date().getFullYear();

  const currentPrefObj = PREFECTURES.find(p => p.code === prefectureCode);
  const regionalNeighbors = getRegionalNeighbors(prefectureCode);
  const regionLabel = currentPrefObj
    ? (isVi ? currentPrefObj.regionVi : isEn ? currentPrefObj.regionEn : currentPrefObj.regionJa)
    : (isVi ? 'Khu vực lân cận' : isEn ? 'Neighboring Region' : '近隣エリア');

  const top3CitiesNames = insights.topCities.slice(0, 3).map(c => c.cityName).join('・');
  const top1City = insights.topCities[0];

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

  const formatCapital = (val: number | null) => {
    if (!val || val <= 0) return isVi ? 'Đang cập nhật' : isEn ? 'N/A' : '非公開';
    const man = Math.round(val / 10000);
    if (isEn) return `¥${(val / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
    if (isVi) return `¥${(val / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}Tr`;
    if (man >= 10000) return `${(man / 10000).toLocaleString('ja-JP', { maximumFractionDigits: 1 })}億円`;
    return `${man.toLocaleString('ja-JP')}万円`;
  };

  const faqs = isVi ? [
    {
      q: `Có bao nhiêu doanh nghiệp đang đăng ký hoạt động tại ${prefName}?`,
      a: `Theo cơ sở dữ liệu Quốc thuế Nhật Bản (NTA) được đồng bộ trên Kigyou-list năm ${currentYear}, hiện có ${effectiveTotal.toLocaleString()} pháp nhân đang đăng ký tại ${prefName} (đứng thứ ${insights.nationalRank}/47 toàn quốc, chiếm ${insights.nationalSharePct}% tổng số doanh nghiệp Nhật Bản). Các khu vực tập trung nhiều doanh nghiệp nhất gồm ${top3CitiesNames || prefName}.`
    },
    {
      q: `Làm thế nào để lọc danh sách công ty tại ${prefName} theo ngành nghề, giấy phép hoặc tín hiệu tuyển dụng?`,
      a: `Tại ${prefName}, Kigyou-list đã xác thực ${insights.licenseCount.toLocaleString()} doanh nghiệp có giấy phép hành nghề công (trong đó có ${insights.constructionLicCount.toLocaleString()} công ty xây dựng), ${insights.hiringCount.toLocaleString()} doanh nghiệp đang tích cực tuyển dụng và ${insights.listedCount.toLocaleString()} doanh nghiệp niêm yết. Bạn có thể bấm vào từng quận/huyện hoặc mở Bộ lọc Tìm kiếm nâng cao để xuất danh sách CSV.`
    },
    {
      q: `Dữ liệu doanh nghiệp tại ${prefName} có hỗ trợ kiểm tra mã số Invoice (T-Number) và xuất file CSV không?`,
      a: `Có. Toàn bộ ${effectiveTotal.toLocaleString()} doanh nghiệp tại ${prefName} đều được đối chiếu mã số pháp nhân 13 chữ số, trạng thái đăng ký Hóa đơn đủ điều kiện (適格請求書発行事業者), địa chỉ trụ sở, vốn điều lệ và thông tin liên hệ để phục vụ thẩm định tín dụng và tạo danh sách B2B Sales.`
    }
  ] : isEn ? [
    {
      q: `How many active corporations are registered in ${prefName}?`,
      a: `According to official National Tax Agency (NTA) corporate registries synced on Kigyou-list (${currentYear}), ${prefName} hosts ${effectiveTotal.toLocaleString()} registered legal entities (ranked #${insights.nationalRank} among 47 prefectures, accounting for ${insights.nationalSharePct}% of Japan's corporate base across ${insights.totalCitiesCount} municipalities, led by ${top3CitiesNames || prefName}).`
    },
    {
      q: `How can I filter ${prefName} companies by industry, licenses, or active hiring signals?`,
      a: `In ${prefName}, Kigyou-list tracks ${insights.licenseCount.toLocaleString()} licensed businesses (including ${insights.constructionLicCount.toLocaleString()} licensed construction contractors), ${insights.hiringCount.toLocaleString()} actively hiring firms, and ${insights.listedCount.toLocaleString()} listed corporations. You can drill down by municipality or export filtered CSV lists.`
    },
    {
      q: `Can I export ${prefName} B2B lead lists with Invoice T-Numbers and executive contacts to CSV?`,
      a: `Yes. Every corporate record in ${prefName} is matched with its official 13-digit NTA corporate number, Qualified Invoice Issuer status, capital scale, employee count, and contact channels for B2B outreach and credit verification.`
    }
  ] : [
    {
      q: `${pref.name}には現在何社の法人・企業が登記されていますか？`,
      a: `国税庁法人番号公表データおよびKigyou-listの${currentYear}年最新集計によると、${pref.name}には${effectiveTotal.toLocaleString()}社の法人が登記・収録されています。これは全国47都道府県で第${insights.nationalRank}位（全国シェア${insights.nationalSharePct}%）の規模であり、県内${insights.totalCitiesCount}市区町村のうち${top3CitiesNames || pref.name}などに多くの企業が集積しています。`
    },
    {
      q: `${pref.name}の企業を市区町村別や業種別・許認可保有で絞り込むにはどうすればよいですか？`,
      a: `${pref.name}内では、公的許認可保有企業が${insights.licenseCount.toLocaleString()}社（うち建設業許可${insights.constructionLicCount.toLocaleString()}社・宅建業免許${insights.realEstateLicCount.toLocaleString()}社）、現在求人募集中のアクティブ企業が${insights.hiringCount.toLocaleString()}社、上場企業が${insights.listedCount.toLocaleString()}社収録されています。本ページの市区町村ランキング表や業種リンク、または詳細検索画面から条件を指定して一覧表示・CSV抽出が可能です。`
    },
    {
      q: `${pref.name}の営業リストをCSVでダウンロードしたり、インボイス登録番号を確認することは可能ですか？`,
      a: `はい、可能です。Kigyou-listでは${pref.name}の全収録企業について13桁の法人番号、本店所在地、代表者名、資本金、従業員規模、適格請求書発行事業者（インボイスT番号）登録状況、および決算・採用シグナルを統合しており、無料会員登録のみで毎日CSV出力や与信チェックにご活用いただけます。`
    }
  ];

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": isVi ? "Trang chủ" : isEn ? "Home" : "ホーム",
        "item": `https://kigyoulist.com/${locale}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": isVi ? "Danh mục khu vực" : isEn ? "Regional Directory" : "地域別企業一覧",
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

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": isVi
      ? `Cơ sở dữ liệu doanh nghiệp tỉnh ${prefName} (${currentYear})`
      : isEn
      ? `${prefName} Corporate Intelligence Dataset (${currentYear})`
      : `${pref.name}の法人・企業インテリジェンスデータベース（${currentYear}年最新）`,
    "description": isVi
      ? `Tập dữ liệu ${effectiveTotal.toLocaleString()} pháp nhân đăng ký tại ${prefName} (${regionLabel}), bao gồm thống kê ${insights.totalCitiesCount} quận/huyện, giấy phép hành nghề và tín hiệu tuyển dụng B2B.`
      : isEn
      ? `Official corporate dataset covering ${effectiveTotal.toLocaleString()} registered legal entities across ${insights.totalCitiesCount} municipalities in ${prefName}, Japan.`
      : `国税庁法人番号公表データおよび公的オープンデータを統合した${pref.name}（${regionLabel}）の法人データベース。県内${insights.totalCitiesCount}市区町村・計${effectiveTotal.toLocaleString()}社の企業概要、許認可、採用動向を収録。`,
    "url": `https://kigyoulist.com/${locale}/area/${prefectureCode}`,
    "isAccessibleForFree": true,
    "creator": {
      "@type": "Organization",
      "name": "Kigyou-list (TQC株式会社)",
      "url": "https://kigyoulist.com/ja"
    },
    "spatialCoverage": {
      "@type": "Place",
      "name": prefName
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": isVi ? `Doanh nghiệp tiêu biểu tại ${prefName}` : isEn ? `Representative Corporations in ${prefName}` : `${pref.name}の主要企業一覧`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
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
              <Link href={`/${locale}`} className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                {isVi ? 'Trang chủ' : isEn ? 'Home' : 'ホーム'}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link href={`/${locale}/directory`} className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                {isVi ? 'Danh mục khu vực' : isEn ? 'Regional Directory' : '地域別企業一覧'}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-900 dark:text-slate-200 font-semibold">{prefName}</span>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="bg-white dark:bg-[#161B22] border-b border-slate-200/90 dark:border-slate-800 py-10 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800 text-[#1B4F8A] dark:text-blue-300 text-xs font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                  <span>JIS CODE: {prefectureCode} ({regionLabel})</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                  <span>{isVi ? `Hạng #${insights.nationalRank}/47 Toàn quốc (${insights.nationalSharePct}%)` : isEn ? `National Rank #${insights.nationalRank}/47 (${insights.nationalSharePct}% Share)` : `全国第${insights.nationalRank}位（全国シェア ${insights.nationalSharePct}%）`}</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
                {isVi
                  ? `Danh sách doanh nghiệp & Cơ sở dữ liệu pháp nhân tại ${prefName}`
                  : isEn
                  ? `${prefName} Company Directory & Corporate Intelligence Database`
                  : `${pref.name}の企業一覧・法人データベース（${currentYear}年最新）`}
              </h1>

              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed mb-3">
                {isVi
                  ? `Báo cáo tổng hợp và danh bạ ${effectiveTotal.toLocaleString()} doanh nghiệp đang đăng ký hoạt động tại ${prefName} (${regionLabel}), chiếm ${insights.nationalSharePct}% tổng số pháp nhân toàn Nhật Bản. Dữ liệu bao phủ toàn bộ ${insights.totalCitiesCount} quận/huyện/thành phố trực thuộc${top1City ? `, dẫn đầu là ${top1City.cityName} với ${top1City.count.toLocaleString()} doanh nghiệp (${top1City.sharePct}%)` : ''}.`
                  : isEn
                  ? `Official corporate directory and regional market intelligence covering ${effectiveTotal.toLocaleString()} registered legal entities in ${prefName} (${regionLabel}), representing ${insights.nationalSharePct}% of Japan's national corporate registry across ${insights.totalCitiesCount} municipalities${top1City ? `, led by ${top1City.cityName} with ${top1City.count.toLocaleString()} companies (${top1City.sharePct}%)` : ''}.`
                  : `${pref.name}（${regionLabel}）内で登記・活動中の法人${effectiveTotal.toLocaleString()}社を網羅した地域別企業インテリジェンスデータベースです。全国47都道府県で第${insights.nationalRank}位（全国シェア${insights.nationalSharePct}%）の法人集積規模を持ち、県内${insights.totalCitiesCount}市区町村${top1City ? `（最多は${top1City.cityName}の${top1City.count.toLocaleString()}社・県内構成比${top1City.sharePct}%）` : ''}の企業概要・代表者・資本金・許認可・採用シグナルを一元収録しています。`}
              </p>

              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                {isVi
                  ? `Hệ thống tích hợp trực tiếp dữ liệu Quốc thuế NTA, giấy phép hành nghề (${insights.licenseCount.toLocaleString()} công ty được cấp phép, bao gồm ${insights.constructionLicCount.toLocaleString()} nhà thầu xây dựng) và ${insights.hiringCount.toLocaleString()} doanh nghiệp đang tuyển dụng, giúp đội ngũ Sales B2B và bộ phận thẩm định tín dụng trích xuất danh sách khách hàng tiềm năng chính xác theo từng địa bàn.`
                  : isEn
                  ? `Integrated directly with National Tax Agency (NTA) registries, statutory license databases (${insights.licenseCount.toLocaleString()} licensed entities including ${insights.constructionLicCount.toLocaleString()} construction contractors), and ${insights.hiringCount.toLocaleString()} actively hiring companies to support high-precision B2B prospecting and credit due diligence.`
                  : `国税庁の法人番号公表データに加え、公的許認可保有企業${insights.licenseCount.toLocaleString()}社（建設業許可${insights.constructionLicCount.toLocaleString()}社・宅建業免許${insights.realEstateLicCount.toLocaleString()}社等）、積極採用中の求人企業${insights.hiringCount.toLocaleString()}社、上場企業${insights.listedCount.toLocaleString()}社の最新シグナルを統合。地域密着のB2B新規開拓リスト作成から取引先の与信・コンプライアンス確認までワンストップで対応します。`}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                    <Building2 className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                    <span>{isVi ? 'Tổng số pháp nhân' : isEn ? 'Registered Entities' : '登録法人総数'}</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {effectiveTotal.toLocaleString()}<span className="text-xs font-normal text-slate-500 ml-1">{isVi ? 'cty' : isEn ? '' : '社'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                    <Landmark className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                    <span>{isVi ? 'Giấy phép công' : isEn ? 'Licensed Firms' : '公的許認可保有'}</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-[#1B4F8A] dark:text-blue-400 tabular-nums">
                    {insights.licenseCount.toLocaleString()}<span className="text-xs font-normal text-slate-500 ml-1">{isVi ? 'cty' : isEn ? '' : '社'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                    <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{isVi ? 'Đang tuyển dụng' : isEn ? 'Actively Hiring' : '求人採用アクティブ'}</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {insights.hiringCount.toLocaleString()}<span className="text-xs font-normal text-slate-500 ml-1">{isVi ? 'cty' : isEn ? '' : '社'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                    <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>{isVi ? 'Quận/Huyện/TP' : isEn ? 'Municipalities' : '収録市区町村数'}</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    {insights.totalCitiesCount.toLocaleString()}<span className="text-xs font-normal text-slate-500 ml-1">{isVi ? 'đơn vị' : isEn ? 'areas' : '自治体'}</span>
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
                  <span>{locale === 'ja' ? '市区町村・許認可・採用シグナル統合' : locale === 'vi' ? 'Tích hợp thống kê Quận/Huyện & Giấy phép' : 'Municipality & License Signals Integrated'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{locale === 'ja' ? 'CSV一括ダウンロード対応' : locale === 'vi' ? 'Hỗ trợ xuất file CSV' : 'CSV Export Ready'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1 (H2 #1): Regional Market Overview & Municipality Distribution Table */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
                  <span>
                    {isVi
                      ? `Thống kê phân bổ doanh nghiệp theo Quận/Huyện/Thành phố tại ${prefName}`
                      : isEn
                      ? `${prefName} Corporate Distribution by Municipality (Top ${insights.topCities.length})`
                      : `${pref.name}の市区町村別 法人分布・企業数ランキング（上位${insights.topCities.length}自治体）`}
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {isVi
                    ? `Bảng phân tích tỷ trọng doanh nghiệp tại các quận/huyện trọng điểm thuộc ${prefName}. Bấm vào từng địa phương để lọc danh sách doanh nghiệp đóng trụ sở tại khu vực đó.`
                    : isEn
                    ? `Breakdown of registered corporate headquarters across major municipalities in ${prefName}. Click any municipality to filter local companies.`
                    : `${pref.name}内の全${insights.totalCitiesCount}市区町村における法人登記数の集計データです。${top3CitiesNames ? `特に${top3CitiesNames}に本社機能や主要拠点が集中しており、` : ''}各自治体名をクリックすると該当エリアの企業リストを絞り込み検索できます。`}
                </p>
              </div>
              <Link
                href={`/${locale}/search?prefecture_code=${prefectureCode}`}
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                <span>{isVi ? 'Lọc theo Quận/Huyện' : isEn ? 'Filter by City' : '市区町村で詳細検索'}</span>
              </Link>
            </div>

            {insights.topCities.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300">
                      <th className="py-2.5 px-3 font-bold w-16">{isVi ? 'Hạng' : isEn ? 'Rank' : '順位'}</th>
                      <th className="py-2.5 px-3 font-bold">{isVi ? 'Quận / Huyện / Thành phố' : isEn ? 'Municipality' : '市区町村名'}</th>
                      <th className="py-2.5 px-3 font-bold text-right">{isVi ? 'Số lượng pháp nhân' : isEn ? 'Registered Companies' : '登録法人数'}</th>
                      <th className="py-2.5 px-3 font-bold text-right">{isVi ? `Tỷ trọng tại ${prefName}` : isEn ? 'Prefecture Share' : '県内構成比'}</th>
                      <th className="py-2.5 px-3 font-bold text-right hidden sm:table-cell">{isVi ? 'Tra cứu' : isEn ? 'Directory' : 'リスト抽出'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {insights.topCities.map((city, idx) => (
                      <tr key={city.cityName} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-500 dark:text-slate-400">
                          #{idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                          {city.cityName}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          {city.count.toLocaleString()} {isVi ? 'cty' : isEn ? '' : '社'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#1B4F8A] dark:text-blue-400 font-semibold">
                          {city.sharePct}%
                        </td>
                        <td className="py-2.5 px-3 text-right hidden sm:table-cell">
                          <Link
                            href={`/${locale}/search?prefecture_code=${prefectureCode}&city_name=${encodeURIComponent(city.cityName)}`}
                            className="text-xs font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                          >
                            <span>{isVi ? 'Xem danh sách' : isEn ? 'View List' : `${city.cityName}の企業一覧`}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 2 (H2 #2): B2B Signals, Licenses & Corporate Governance Breakdown */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
              <span>
                {isVi
                  ? `Phân tích Tín hiệu Kinh doanh, Giấy phép Hành nghề & Biến động Pháp nhân tại ${prefName}`
                  : isEn
                  ? `${prefName} B2B Intent Signals, Statutory Licenses & Corporate Changes`
                  : `${pref.name}の営業シグナル・許認可保有・法人異動統計サマリー`}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
              {isVi
                ? `Bên cạnh hồ sơ đăng ký cơ bản, Kigyou-list phân loại doanh nghiệp tại ${prefName} theo các tín hiệu mua hàng B2B (Intent Signals) và giấy phép chuyên ngành, giúp xác định nhanh nhóm doanh nghiệp có quy mô nhân sự thực tế và ngân sách đầu tư cao.`
                : isEn
                ? `Beyond basic registration profiles, Kigyou-list segments ${prefName} corporations by verified B2B buying signals, administrative licenses, and registry updates to pinpoint active enterprises.`
                : `${pref.name}での法人営業・新規開拓や取引先審査において重要となる「許認可保有」「求人採用中」「上場・適格請求書（インボイス）登録」「新設・移転動向」のカテゴリ別データ内訳です。`}
            </p>

            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300">
                    <th className="py-2.5 px-3 font-bold">{isVi ? 'Nhóm dữ liệu / Tín hiệu B2B' : isEn ? 'Signal / License Category' : 'データ分類・シグナル項目'}</th>
                    <th className="py-2.5 px-3 font-bold text-right">{isVi ? `Số công ty tại ${prefName}` : isEn ? 'Companies' : `${pref.name}の該当社数`}</th>
                    <th className="py-2.5 px-3 font-bold">{isVi ? 'Nguồn xác thực & Ứng dụng B2B' : isEn ? 'Verification Source & B2B Use Case' : '公的データ出典・主なB2B活用用途'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {isVi ? 'Tổng pháp nhân đăng ký (NTA)' : isEn ? 'Total Registered Legal Entities' : '国税庁 法人番号指定・登記法人総数'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {effectiveTotal.toLocaleString()} {isVi ? 'cty' : isEn ? '' : '社'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                      {isVi ? 'Cục Quốc thuế Nhật Bản (NTA) — Tra cứu mã số thuế 13 số & địa chỉ trụ sở chính' : isEn ? 'National Tax Agency (NTA) — 13-digit corporate ID & headquarters verification' : '国税庁法人番号公表サイト準拠 — 取引先与信確認・全件網羅マスターデータ'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {isVi ? 'Doanh nghiệp có Giấy phép Hành nghề công' : isEn ? 'Statutory Licensed Businesses' : '公的許認可・国家資格登録法人'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#1B4F8A] dark:text-blue-400">
                      {insights.licenseCount.toLocaleString()} {isVi ? 'cty' : isEn ? '' : '社'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                      {isVi ? `Bộ Đất đai MLIT & Bộ Lao động MHLW (Xây dựng: ${insights.constructionLicCount.toLocaleString()} cty, BĐS: ${insights.realEstateLicCount.toLocaleString()} cty)` : isEn ? `MLIT & MHLW Registries (Construction: ${insights.constructionLicCount.toLocaleString()}, Real Estate: ${insights.realEstateLicCount.toLocaleString()})` : `国交省・厚労省等（建設業許可 ${insights.constructionLicCount.toLocaleString()}社 / 宅建業免許 ${insights.realEstateLicCount.toLocaleString()}社 等）`}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {isVi ? 'Doanh nghiệp đang tích cực tuyển dụng' : isEn ? 'Actively Hiring Companies' : '求人募集中・積極採用シグナル企業'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {insights.hiringCount.toLocaleString()} {isVi ? 'cty' : isEn ? '' : '社'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                      {isVi ? 'Trang tuyển dụng chính thức & Nguồn tuyển dụng công khai — Tệp khách hàng đang mở rộng quy mô' : isEn ? 'Official career pages & public job postings — High-intent HR & SaaS sales targets' : '公式採用ページ・公開求人情報 — 人材紹介・HRTech・SaaS導入意欲の高い成長企業'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {isVi ? 'Doanh nghiệp Niêm yết & Tập đoàn công bố BCTC' : isEn ? 'Listed Corporations & EDINET Filers' : '上場企業・有価証券報告書開示法人'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                      {insights.listedCount.toLocaleString()} {isVi ? 'cty' : isEn ? '' : '社'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                      {isVi ? 'Sàn chứng khoán & Cơ quan Dịch vụ Tài chính FSA EDINET — Phân tích doanh thu, lợi nhuận, thu nhập' : isEn ? 'Stock Exchanges & FSA EDINET — Audited financial statements & average salary analysis' : '金融庁EDINET・証券取引所 — 売上高・経常利益・平均年間給与・被保険者数の財務分析'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5 Signal & Corporate Change Hubs for this Prefecture */}
            {currentPrefObj && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  {
                    href: `/${locale}/new-companies/${currentPrefObj.slug}`,
                    label: isVi ? 'Pháp nhân mới thành lập' : isEn ? 'Newly Registered Companies' : `${pref.name}の新設法人一覧`,
                    sub: isVi ? `Mới đăng ký tại ${prefName}` : isEn ? `New entities in ${prefName}` : '最新の設立登記・法人番号指定',
                  },
                  {
                    href: `/${locale}/jobs/latest/${currentPrefObj.slug}`,
                    label: isVi ? 'Doanh nghiệp đang tuyển dụng' : isEn ? 'Actively Hiring Companies' : `${pref.name}の求人・採用中企業`,
                    sub: isVi ? `${insights.hiringCount.toLocaleString()} công ty tại ${prefName}` : isEn ? `${insights.hiringCount.toLocaleString()} active in ${prefName}` : `採用シグナル ${insights.hiringCount.toLocaleString()}社`,
                  },
                  {
                    href: `/${locale}/changes/relocation/${currentPrefObj.slug}`,
                    label: isVi ? 'Chuyển trụ sở & Địa chỉ' : isEn ? 'Headquarters Relocations' : `${pref.name}の本店移転・住所変更`,
                    sub: isVi ? `Biến động địa chỉ ${prefName}` : isEn ? `Address changes in ${prefName}` : 'オフィス移転・拠点新設履歴',
                  },
                  {
                    href: `/${locale}/changes/merger/${currentPrefObj.slug}`,
                    label: isVi ? 'Sáp nhập & Tái cấu trúc' : isEn ? 'Mergers & Reorganizations' : `${pref.name}の合併・組織再編`,
                    sub: isVi ? `M&A tại ${prefName}` : isEn ? `M&A events in ${prefName}` : '吸収合併・事業承継データ',
                  },
                  {
                    href: `/${locale}/status/bankruptcies/${currentPrefObj.slug}`,
                    label: isVi ? 'Giải thể & Đóng cửa' : isEn ? 'Closures & Dissolutions' : `${pref.name}の倒産・閉鎖・解散`,
                    sub: isVi ? `Kiểm tra rủi ro tại ${prefName}` : isEn ? `Credit risk in ${prefName}` : '与信管理・登記閉鎖モニタリング',
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
            )}
          </div>
        </section>

        {/* SECTION 3 (H2 #3): Representative Company List (30 Companies, Single Clean Link per Card) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
                <span>
                  {isVi
                    ? `Danh sách doanh nghiệp tiêu biểu tại ${prefName} (Hiển thị ${companies.length} trên ${effectiveTotal.toLocaleString()} công ty)`
                    : isEn
                    ? `Representative Corporations in ${prefName} (Showing ${companies.length} of ${effectiveTotal.toLocaleString()})`
                    : `${pref.name}の主要・注目企業一覧（全${effectiveTotal.toLocaleString()}社中 上位${companies.length}社表示）`}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isVi
                  ? `Sắp xếp theo quy mô vốn điều lệ và mức độ hoàn thiện hồ sơ tài chính tại ${prefName}.`
                  : isEn
                  ? `Ordered by capital scale and verified financial disclosures in ${prefName}.`
                  : `財務データ開示および資本金規模に基づき、${pref.name}内の代表的な法人を抽出しています。`}
              </p>
            </div>
            <Link 
              href={`/${locale}/search?prefecture_code=${prefectureCode}`}
              className="text-xs sm:text-sm text-[#1B4F8A] hover:text-[#143D6C] dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 font-semibold transition-colors"
            >
              <span>{isVi ? `Tìm kiếm toàn bộ ${effectiveTotal.toLocaleString()} công ty` : isEn ? `Search all ${effectiveTotal.toLocaleString()} companies` : `${pref.name}の全${effectiveTotal.toLocaleString()}社を条件検索`}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companies.map((comp) => {
              const name = locale === 'en' && comp.company_name_en ? comp.company_name_en : comp.company_name;
              const primaryInd = comp.industries && comp.industries.length > 0 ? comp.industries[0].industry_name : null;
              return (
                <article 
                  key={comp.corporate_number}
                  className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 hover:border-[#1B4F8A]/40 dark:hover:border-blue-700/60 rounded-xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        <Link href={`/${locale}/company/${comp.corporate_number}`}>
                          {name}
                        </Link>
                      </h3>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono shrink-0 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        ID: {comp.corporate_number}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 mb-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{comp.full_address || `${comp.prefecture_name || ''} ${comp.city_name || ''}`}</span>
                      </div>
                      {primaryInd && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="truncate">{getIndustryName(primaryInd, locale)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                      <span>
                        <strong className="text-slate-400 dark:text-slate-500 font-normal mr-1">{isVi ? 'Vốn:' : isEn ? 'Capital:' : '資本金:'}</strong>
                        <span className="font-mono font-semibold">{formatCapital(comp.capital_amount)}</span>
                      </span>
                      {comp.employee_count && comp.employee_count > 0 ? (
                        <span>
                          <strong className="text-slate-400 dark:text-slate-500 font-normal mr-1">{isVi ? 'Nhân sự:' : isEn ? 'Staff:' : '従業員:'}</strong>
                          <span className="font-mono font-semibold">{comp.employee_count.toLocaleString()}{isVi ? '' : isEn ? '' : '名'}</span>
                        </span>
                      ) : null}
                    </div>
                    {comp.representative_name && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                        {isVi ? 'ĐD:' : isEn ? 'Rep:' : '代表:'} {comp.representative_name}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* SECTION 4 (H2 #4): Key Industries in this Prefecture (主要業種×地域データベース) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
              {isVi
                ? `Danh bạ Doanh nghiệp theo Ngành nghề trọng điểm (JSIC) tại ${prefName}`
                : isEn
                ? `Major Industries in ${prefName} (JSIC Sector Directories)`
                : `${pref.name}の主要業種別 企業リスト・産業分類データベース`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
              {isVi
                ? `Phân loại doanh nghiệp tại ${prefName} theo hệ thống Phân loại Ngành Công nghiệp Tiêu chuẩn Nhật Bản (JSIC). Chọn ngành nghề để xem thống kê vốn điều lệ trung bình và danh sách công ty chuyên ngành.`
                : isEn
                ? `Explore ${prefName} enterprises segmented by Japan Standard Industrial Classification (JSIC) divisions, including IT, construction, real estate, manufacturing, and professional services.`
                : `総務省の日本標準産業分類（JSIC）に基づき、${pref.name}内の企業を主要12業種別に分類しています。IT・情報サービス、建設・施工、不動産取引、人材派遣、卸売など業種別の営業リスト作成にご活用ください。`}
            </p>
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

        {/* SECTION 5 (H2 #5): FAQ Section (Schema.org FAQPage) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xs">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
              <span>
                {isVi
                  ? `Câu hỏi thường gặp về Cơ sở dữ liệu Doanh nghiệp tại ${prefName}`
                  : isEn
                  ? `Frequently Asked Questions: ${prefName} Corporate Directory`
                  : `${pref.name}の企業データベース・営業リストに関するよくあるご質問（FAQ）`}
              </span>
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-800"
                >
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-2">
                    Q{idx + 1}. {faq.q}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6 (H2 #6): Regional Neighbor Prefectures Silo (replaces 46-prefecture link farm) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {isVi
                    ? `Cơ sở dữ liệu doanh nghiệp tại ${regionLabel} & Các tỉnh trọng điểm lân cận`
                    : isEn
                    ? `Corporate Directories in ${regionLabel} & Neighboring Economic Hubs`
                    : `${regionLabel}および主要経済圏の企業データベース`}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isVi
                    ? `Tra cứu chéo danh bạ doanh nghiệp các tỉnh cùng vùng kinh tế với ${prefName}.`
                    : isEn
                    ? `Cross-reference regional company registries connected to ${prefName}.`
                    : `${pref.name}と経済的結びつきの強い${regionLabel}および全国の主要ビジネス都市の法人一覧へ移動できます。`}
                </p>
              </div>
              <Link
                href={`/${locale}/directory`}
                className="text-xs font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                <span>{isVi ? 'Xem toàn bộ 47 tỉnh thành' : isEn ? 'View All 47 Prefectures' : '全国47都道府県一覧を見る'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {regionalNeighbors.map(op => (
                <Link
                  key={op.code}
                  href={`/${locale}/area/${op.code}`}
                  className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-blue-50/60 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 hover:border-[#1B4F8A]/40 dark:border-slate-700/80 text-xs font-medium text-slate-700 hover:text-[#1B4F8A] dark:text-slate-300 dark:hover:text-blue-400 transition-colors truncate"
                >
                  {isEn
                    ? `${getPrefectureName(op.nameJa, locale)} Companies`
                    : isVi
                    ? `Công ty tại ${getPrefectureName(op.nameJa, locale)}`
                    : `${getPrefectureName(op.nameJa, locale)}の企業一覧`}
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
