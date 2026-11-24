import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { 
  Building2, MapPin, Phone, ArrowRight, ChevronRight,
  Search, Briefcase, TrendingUp, AlertCircle, BarChart3, HelpCircle
} from 'lucide-react';
import { 
  getIndustryByCode, getPrefectureByCode, 
  getCategoryStats, searchCompanies, getSiblingIndustries 
} from '@/lib/db';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getTranslations } from '@/lib/i18n';
import { prefectureJaToEn, getPrefectureName, getIndustryName } from '@/lib/locale-mapping';
import { getRegionalNeighbors } from '@/lib/hubUtils';

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
    return notFound();
  }

  const prefName = getPrefectureName(pref.name, locale);
  const industryMappedName = getIndustryName(ind.industry_name, locale);
  const isEn = locale === 'en';
  const isVi = locale === 'vi';

  const currentYear = new Date().getFullYear();
  const pageTitle = isVi
    ? `Danh sách công ty ${industryMappedName} tại ${prefName} (Mới nhất ${currentYear}) | Kigyou-list`
    : isEn
    ? `${prefName} ${industryMappedName} Companies (${currentYear} List) | Kigyou-list`
    : `${prefName}の${industryMappedName}企業一覧（${currentYear}年最新） | Kigyou-list`;

  const pageDesc = isVi
    ? `Duyệt danh bạ các doanh nghiệp hoạt động trong lĩnh vực ${industryMappedName} tại ${prefName}, Nhật Bản. Chi tiết thông tin liên hệ, mã số thuế, số điện thoại, quy mô nhân sự, vốn điều lệ và các tín hiệu tuyển dụng.`
    : isEn
    ? `Browse ${prefName} ${industryMappedName} company list. Details include address, telephone, capital, employee counts, current hiring status, and historical subsidies.`
    : `${prefName}で稼働している${industryMappedName}の企業データベースです。企業名、電話番号、登記住所、資本金、従業員数、最新の採用活動、補助金受給履歴などの購買シグナルを網羅しています。`;

  const ogLocale = isEn ? 'en_US' : isVi ? 'vi_VN' : 'ja_JP';

  return {
    title: pageTitle,
    description: pageDesc,
    keywords: isVi
      ? [`${prefName} ${industryMappedName}`, `danh sách công ty ${prefName}`, `danh bạ doanh nghiệp ${industryMappedName}`]
      : isEn
      ? [`${prefName} ${industryMappedName}`, `${prefName} company database`, `${industryMappedName} lead list`]
      : [`${prefName} ${industryMappedName}`, `${prefName} 企業リスト`, `${industryMappedName} 営業リスト`],
    alternates: {
      canonical: `https://kigyoulist.com/${locale}/industry/${resolvedParams.industryCode}/location/${resolvedParams.prefectureCode}`,
      languages: {
        ja: `https://kigyoulist.com/ja/industry/${resolvedParams.industryCode}/location/${resolvedParams.prefectureCode}`,
        'x-default': `https://kigyoulist.com/ja/industry/${resolvedParams.industryCode}/location/${resolvedParams.prefectureCode}`,
      }
    },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      url: `https://kigyoulist.com/${locale}/industry/${resolvedParams.industryCode}/location/${resolvedParams.prefectureCode}`,
      siteName: 'Kigyou-list',
      locale: ogLocale,
      type: 'website',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDesc,
      images: ['/og-image.png'],
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { industryCode, prefectureCode } = resolvedParams;
  const locale = resolvedParams.locale || 'ja';

  const t = getTranslations(locale);

  // 2. Fetch Category details & Statistics (30 representative companies instead of 100 to keep HTML < 300KB)
  const ind = await getIndustryByCode(industryCode);
  const pref = await getPrefectureByCode(prefectureCode);

  if (!ind || !pref) {
    return notFound();
  }

  const [stats, { companies }, siblingIndustries] = await Promise.all([
    getCategoryStats(industryCode, prefectureCode),
    searchCompanies('', { industry_code: industryCode, prefecture_code: prefectureCode }, 30, 0),
    getSiblingIndustries(prefectureCode, industryCode, 12),
  ]);
  const regionalNeighbors = getRegionalNeighbors(prefectureCode);

  const prefName = getPrefectureName(pref.name, locale);
  const industryMappedName = getIndustryName(ind.industry_name, locale);
  const isEn = locale === 'en';
  const isVi = locale === 'vi';
  const currentYear = new Date().getFullYear();

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

  const formattedAvgCap = stats.avgCapital > 0 ? formatCapital(stats.avgCapital) : (isVi ? 'Đang cập nhật' : isEn ? 'N/A' : '非公開');

  const d = isVi ? {
    home: "Trang chủ",
    directory: "Danh mục",
    categoryLabel: "Phân loại chuyên sâu",
    introTitle: `Danh sách công ty ${industryMappedName} tại ${prefName}`,
    introDesc: `Danh sách toàn diện ${stats.count.toLocaleString()} doanh nghiệp đang hoạt động trong ngành ${industryMappedName} (Mã JSIC: ${industryCode}) tại khu vực ${prefName}, Nhật Bản. Tra cứu nhanh số điện thoại, thông tin người đại diện, vốn điều lệ (trung bình ${formattedAvgCap}), quy mô nhân sự và các tín hiệu mua hàng B2B thực tế.`,
    activeCompanies: "Doanh nghiệp hoạt động",
    avgCapital: "Vốn điều lệ trung bình",
    coverageRate: "Tỷ lệ bao phủ DB",
    completeCoverage: "Hoàn toàn",
    companiesCount: `Danh sách doanh nghiệp tiêu biểu (Hiển thị ${companies.length} trên ${stats.count.toLocaleString()} công ty)`,
    sortByCapital: "Sắp xếp theo vốn điều lệ & báo cáo tài chính",
    otherIndustriesTitle: `Ngành nghề khác tại ${prefName} (Cùng khu vực)`,
    otherPrefecturesTitle: `Ngành ${industryMappedName} tại các tỉnh trọng điểm lân cận`,
    companySuffix: " doanh nghiệp",
    unregistered: "-",
    noRelatedCompanies: "Không tìm thấy ngành nghề liên quan nào khác tại tỉnh này.",
    noMatchingTitle: "Không tìm thấy doanh nghiệp phù hợp",
    noMatchingDesc: `Hiện tại chưa có dữ liệu mẫu cho ngành ${industryMappedName} tại ${prefName}. Vui lòng quay lại sau khi cơ sở dữ liệu được cập nhật.`
  } : isEn ? {
    home: "Home",
    directory: "Directory",
    categoryLabel: "Specialized Category",
    introTitle: `${industryMappedName} Companies in ${prefName}`,
    introDesc: `Comprehensive list of ${stats.count.toLocaleString()} active companies operating within the ${industryMappedName} sector (JSIC Code: ${industryCode}) in ${prefName}. Average registered capital is ${formattedAvgCap}. Access contact numbers, executive details, capital size, and real-time business buying intent signals in one place.`,
    activeCompanies: "Active Companies",
    avgCapital: "Average Capital",
    coverageRate: "Database Coverage",
    completeCoverage: "Complete",
    companiesCount: `Representative Company List (Showing ${companies.length} of ${stats.count.toLocaleString()})`,
    sortByCapital: "Sorted by Capital & Financial Disclosure",
    otherIndustriesTitle: `Other Industries in ${prefName} (Same Area)`,
    otherPrefecturesTitle: `${industryMappedName} in Neighboring & Major Prefectures`,
    companySuffix: " companies",
    unregistered: "-",
    noRelatedCompanies: "No other industries found in this prefecture.",
    noMatchingTitle: "No Matching Companies Found",
    noMatchingDesc: `No data is currently registered for the ${industryMappedName} industry in ${prefName}. Please wait for database updates.`
  } : {
    home: "ホーム",
    directory: "企業データ一覧",
    categoryLabel: `業種（JSIC ${industryCode}） × 地域（JIS ${prefectureCode}） 特設データベース`,
    introTitle: `${pref.name}の${ind.industry_name} 企業・営業リスト一覧（${currentYear}年最新）`,
    introDesc: `${pref.name}内で登記・活動中の「${ind.industry_name}（日本標準産業分類コード：${industryCode}）」に属する法人${stats.count.toLocaleString()}社を収録した業界別データベースです。${pref.name}における同業種の平均資本金は${formattedAvgCap}となっており、本店所在地、代表者名、直通電話番号に加え、最新の求人募集・公的許認可・決算推移などの購買シグナル（インテントデータ）をワンストップで確認・CSV抽出できます。`,
    activeCompanies: "収録・稼働企業数",
    avgCapital: "業界平均資本金",
    coverageRate: "データベース網羅率",
    completeCoverage: "完全版",
    companiesCount: `${pref.name}×${ind.industry_name}の主要企業一覧（全${stats.count.toLocaleString()}社中 上位${companies.length}社表示）`,
    sortByCapital: "財務開示・資本金規模順",
    otherIndustriesTitle: `${pref.name}の他の主要業種から探す（同地域クロス検索）`,
    otherPrefecturesTitle: `近隣および主要都道府県の${ind.industry_name}企業一覧`,
    companySuffix: "社",
    unregistered: "-",
    noRelatedCompanies: "他のカテゴリ情報はありません",
    noMatchingTitle: "対象企業が見つかりませんでした",
    noMatchingDesc: `現在、${pref.name}の${ind.industry_name}に該当する企業データは登録されていません。`
  };

  const faqs = isVi ? [
    {
      q: `Có bao nhiêu công ty ngành ${industryMappedName} tại ${prefName}?`,
      a: `Theo dữ liệu Quốc thuế NTA và phân loại ngành JSIC (mã ${industryCode}) trên Kigyou-list năm ${currentYear}, hiện có ${stats.count.toLocaleString()} pháp nhân thuộc lĩnh vực ${industryMappedName} đang đăng ký tại ${prefName}, với mức vốn điều lệ trung bình đạt ${formattedAvgCap}.`
    },
    {
      q: `Làm sao để tải danh sách CSV các công ty ${industryMappedName} tại ${prefName} có số điện thoại hoặc đang tuyển dụng?`,
      a: `Bạn có thể chuyển sang màn hình Tìm kiếm nâng cao của Kigyou-list với bộ lọc Tỉnh thành (${prefName}) và Ngành nghề (${industryMappedName}) để lọc thêm các tiêu chí như có số điện thoại, có form liên hệ, đang tuyển dụng và xuất toàn bộ ra file CSV.`
    }
  ] : isEn ? [
    {
      q: `How many ${industryMappedName} companies are registered in ${prefName}?`,
      a: `Based on NTA corporate registries and JSIC classification (code ${industryCode}) on Kigyou-list (${currentYear}), there are ${stats.count.toLocaleString()} active corporations in the ${industryMappedName} sector in ${prefName}, with an average registered capital of ${formattedAvgCap}.`
    },
    {
      q: `Can I export a B2B sales lead list of ${prefName} ${industryMappedName} companies to CSV?`,
      a: `Yes. You can open the Advanced Search filter pre-set to ${prefName} and ${industryMappedName}, apply additional filters such as verified phone numbers, contact forms, or active hiring signals, and export the structured dataset to CSV.`
    }
  ] : [
    {
      q: `${pref.name}の${ind.industry_name}には何社の企業が登録されていますか？`,
      a: `Kigyou-listの${currentYear}年最新データ（国税庁法人番号公表情報および日本標準産業分類JSICコード${industryCode}準拠）によると、${pref.name}内の${ind.industry_name}には計${stats.count.toLocaleString()}社の法人が収録されています。同セグメントの平均資本金は${formattedAvgCap}です。`
    },
    {
      q: `${pref.name}の${ind.industry_name}の営業リストを電話番号や採用シグナル付きでCSV出力できますか？`,
      a: `はい、可能です。詳細検索画面にてエリア「${pref.name}」×業種「${ind.industry_name}」を指定し、さらに「電話番号あり」「お問い合わせフォームあり」「求人募集中」「適格請求書（インボイス）登録済」などの条件を掛け合わせてCSV形式で一括ダウンロードいただけます。`
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
        "name": prefName,
        "item": `https://kigyoulist.com/${locale}/area/${prefectureCode}`
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

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${prefName} ${industryMappedName}`,
    "description": d.introDesc,
    "url": `https://kigyoulist.com/${locale}/industry/${industryCode}/location/${prefectureCode}`,
    "mainEntity": itemListSchema
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

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Header />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
        {/* Visual Breadcrumbs */}
        <nav className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors">{d.home}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <Link href={`/${locale}/area/${prefectureCode}`} className="hover:text-primary transition-colors">{prefName}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200 truncate" aria-current="page">
            {locale === 'vi' ? `${industryMappedName} tại ${prefName}` : locale === 'en' ? `${prefName} ${industryMappedName}` : `${prefName}の${industryMappedName}`}
          </span>
        </nav>

        {/* Dynamic SEO Header / Intro Banner */}
        <section className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider">
              <Briefcase className="w-4 h-4" />
              <span>{d.categoryLabel}</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {d.introTitle}
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-4xl">
              {d.introDesc}
            </p>
          </div>

          {/* Aggregated Statistics Table & Summary */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300">
                  <th className="py-2.5 px-3 font-bold">{isVi ? 'Chỉ số phân khúc ngành × khu vực' : isEn ? 'Segment Metric' : 'セグメント統計項目'}</th>
                  <th className="py-2.5 px-3 font-bold">{isVi ? 'Giá trị thống kê' : isEn ? 'Verified Value' : '集計データ'}</th>
                  <th className="py-2.5 px-3 font-bold hidden sm:table-cell">{isVi ? 'Mô tả & Nguồn chuẩn hóa' : isEn ? 'Standard & Source' : 'データ基準・出典'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{d.activeCompanies}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{stats.count.toLocaleString()} {d.companySuffix}</td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                    {isVi ? `Pháp nhân đăng ký tại ${prefName} thuộc mã ngành JSIC ${industryCode}` : isEn ? `Active entities in ${prefName} under JSIC ${industryCode}` : `国税庁法人番号公表×日本標準産業分類（JSIC ${industryCode}）`}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{d.avgCapital}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{formattedAvgCap}</td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                    {isVi ? 'Quy mô vốn điều lệ trung bình của các doanh nghiệp công bố vốn trong ngành' : isEn ? 'Mean registered capital across disclosing firms in this segment' : `${pref.name}内の${ind.industry_name}における平均資本金規模`}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{d.coverageRate}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-[#1B4F8A] dark:text-blue-400">100% ({d.completeCoverage})</td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                    {isVi ? 'Hỗ trợ lọc sâu theo số điện thoại, form liên hệ, giấy phép và xuất CSV' : isEn ? 'Supports filtering by phone, contact form, licenses, and CSV export' : '電話番号・フォーム有無・求人シグナル絞り込みおよびCSV出力対応'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Results List (H2 #1) */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
              <span>{d.companiesCount}</span>
            </h2>
            <Link
              href={`/${locale}/search?prefecture_code=${prefectureCode}&industry_code=${industryCode}`}
              className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>{isVi ? `Lọc toàn bộ ${stats.count.toLocaleString()} công ty` : isEn ? `Filter all ${stats.count.toLocaleString()} companies` : `全${stats.count.toLocaleString()}社を詳細検索で絞り込む`}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {companies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {companies.map((comp) => {
                const compName = locale === 'en' && comp.company_name_en ? comp.company_name_en : comp.company_name;
                const compPrefName = getPrefectureName(comp.prefecture_name, locale);
                const localizedCompStatus = locale === 'en' 
                  ? (comp.status === '活動中' ? 'Active' : comp.status === '閉鎖' ? 'Closed' : comp.status === '解散' ? 'Dissolved' : comp.status)
                  : locale === 'vi'
                  ? (comp.status === '活動中' ? 'Đang hoạt động' : comp.status === '閉鎖' ? 'Đã đóng cửa' : comp.status === '解散' ? 'Đã giải thể' : comp.status)
                  : comp.status;

                return (
                  <article 
                    key={comp.corporate_number}
                    className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 hover:border-[#1B4F8A] dark:hover:border-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border text-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60">
                          {localizedCompStatus}
                        </span>
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-300" />
                          {compPrefName} {comp.city_name || ''}
                        </span>
                      </div>

                      {/* Single Clean Link per Company Card */}
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 tracking-tight transition-colors line-clamp-1">
                        <Link href={`/${locale}/company/${comp.corporate_number}`}>
                          {compName}
                        </Link>
                      </h3>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 py-1.5 border-y border-slate-100 dark:border-slate-800/60">
                        <div>
                          <span className="text-slate-400 block text-[10px]">{t.company.capital}</span>
                          <strong className="text-slate-700 dark:text-slate-300 font-mono font-bold">
                            {comp.capital_amount ? (locale === 'en' ? `¥${(comp.capital_amount / 1000000).toLocaleString(undefined, {maximumFractionDigits: 2})}M JPY` : locale === 'vi' ? `¥${(comp.capital_amount / 1000000).toLocaleString(undefined, {maximumFractionDigits: 2})}tr JPY` : `${(comp.capital_amount / 10000).toLocaleString()}万円`) : d.unregistered}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">{t.company.employees}</span>
                          <strong className="text-slate-700 dark:text-slate-300 font-mono font-bold">
                            {comp.employee_count ? (locale === 'en' ? `${comp.employee_count.toLocaleString()} employees` : locale === 'vi' ? `${comp.employee_count.toLocaleString()} nhân viên` : `${comp.employee_count}名`) : d.unregistered}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-mono">
                        法人番号: {comp.corporate_number}
                      </span>
                      <span className="font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {comp.phone_number || d.unregistered}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="py-16 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <AlertCircle className="w-10 h-10 text-slate-300" />
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{d.noMatchingTitle}</h3>
                <p className="text-xs max-w-sm mx-auto leading-relaxed text-slate-500 dark:text-slate-400">
                  {d.noMatchingDesc}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* FAQ Section (H2 #2) */}
        <section className="bg-white border border-slate-200 dark:bg-[#161B22] dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
            <span>
              {isVi
                ? `Câu hỏi thường gặp về Doanh nghiệp ${industryMappedName} tại ${prefName}`
                : isEn
                ? `FAQ: ${industryMappedName} Companies in ${prefName}`
                : `${pref.name}の${ind.industry_name}に関するよくあるご質問（FAQ）`}
            </span>
          </h2>
          <div className="space-y-3.5">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                  Q{idx + 1}. {faq.q}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SEO Cross-linking Matrix Grid (H2 #3 & H2 #4 - Regional Silo instead of 46 prefectures) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          {/* 同地域・他業界 (Sibling industries in same prefecture) */}
          <div className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
              <span>{d.otherIndustriesTitle}</span>
            </h2>
            {siblingIndustries.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {siblingIndustries.map(item => {
                  const itemIndustryName = getIndustryName(item.name, locale);
                  return (
                    <Link 
                      key={item.code} 
                      href={`/${locale}/industry/${item.code}/location/${prefectureCode}`}
                      className="text-xs font-semibold text-slate-600 hover:text-[#1B4F8A] dark:text-slate-300 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
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

          {/* 同業界・近隣および主要地域 (Same industry in regional neighbors) */}
          <div className="bg-white border border-slate-200 dark:bg-[#161B22] dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
              <span>{d.otherPrefecturesTitle}</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {regionalNeighbors.map(p => {
                const pPrefName = getPrefectureName(p.nameJa, locale);
                return (
                  <Link 
                    key={p.code} 
                    href={`/${locale}/industry/${industryCode}/location/${p.code}`}
                    className="px-2.5 py-2 rounded-lg bg-slate-50 hover:bg-blue-50/60 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 hover:border-[#1B4F8A]/40 dark:border-slate-700/80 text-xs font-medium text-slate-700 hover:text-[#1B4F8A] dark:text-slate-300 dark:hover:text-blue-400 flex items-center justify-between gap-1 transition-colors truncate"
                  >
                    <span className="truncate">{locale === 'ja' ? `${pPrefName}の${ind.industry_name}` : pPrefName}</span>
                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
