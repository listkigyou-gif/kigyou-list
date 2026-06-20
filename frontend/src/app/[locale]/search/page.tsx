import type { Metadata } from 'next';
import { 
  searchCompanies, getPrefecturesWithCounts, 
  getCitiesWithCounts, getIndustriesHierarchy, SearchFilters, getIndustryMap 
} from '@/lib/db';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SearchClientContainer } from '@/components/SearchClientContainer';
import { prefectureJaToEn, industryJaToEn, getPrefectureName, getIndustryName } from '@/lib/locale-mapping';

export const revalidate = 0; // Dynamic search page, do not cache static

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "ja";
  const isEn = locale === "en";
  const isVi = locale === "vi";
  return {
    title: isVi ? "Tìm kiếm doanh nghiệp | Kigyou-list" : isEn ? "Search Companies | Kigyou-list" : "企業データ検索 | Kigyou-list",
    description: isVi
      ? "Tìm kiếm doanh nghiệp Nhật Bản nâng cao trên Kigyou-list. Lọc công ty theo ngành nghề, khu vực, vốn điều lệ, số lượng nhân viên hoặc các tín hiệu kinh doanh mới nhất."
      : isEn 
      ? "Advanced company search on Kigyou-list. Filter Japanese companies by industry, location, capital, employee counts, or recent business signals."
      : "日本全国の企業データを高度な条件で検索。都道府県、市区町村、JSIC産業分類、資本金や従業員数、さらには採用や補助金などのシグナルで絞り込み可能です。",
    robots: {
      index: false,
      follow: true,
    },
    alternates: {
      canonical: `/${locale}/search`,
      languages: {
        ja: "/ja/search",
        en: "/en/search",
      }
    }
  };
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const searchParamsVal = await searchParams;

  // 1. Extract query params safely
  const keyword = typeof searchParamsVal.q === 'string' ? searchParamsVal.q : '';
  const prefCode = typeof searchParamsVal.prefecture === 'string' && /^\d{2}$/.test(searchParamsVal.prefecture) ? searchParamsVal.prefecture : undefined;
  const city = typeof searchParamsVal.city === 'string' ? searchParamsVal.city : undefined;
  const indCode = typeof searchParamsVal.industry === 'string' && (/^[A-Z]$/.test(searchParamsVal.industry) || /^\d{2}$/.test(searchParamsVal.industry)) ? searchParamsVal.industry : undefined;
  
  let minEmp: number | undefined;
  if (searchParamsVal.min_employees) {
    const val = parseInt(searchParamsVal.min_employees as string, 10);
    if (!isNaN(val) && val >= 0) minEmp = val;
  }
  let maxEmp: number | undefined;
  if (searchParamsVal.max_employees) {
    const val = parseInt(searchParamsVal.max_employees as string, 10);
    if (!isNaN(val) && val >= 0) maxEmp = val;
  }
  
  let minCap: number | undefined;
  if (searchParamsVal.min_capital) {
    const val = parseInt(searchParamsVal.min_capital as string, 10);
    if (!isNaN(val) && val >= 0) minCap = val;
  }
  let maxCap: number | undefined;
  if (searchParamsVal.max_capital) {
    const val = parseInt(searchParamsVal.max_capital as string, 10);
    if (!isNaN(val) && val >= 0) maxCap = val;
  }
  
  const hasHiring = searchParamsVal.hiring === 'true';
  const hasSubsidy = searchParamsVal.subsidy === 'true';
  const hasBidding = searchParamsVal.bidding === 'true';
  const hasFinancials = searchParamsVal.financials === 'true';
  
  let minEstYear: number | undefined;
  if (searchParamsVal.min_establishment_year) {
    const val = parseInt(searchParamsVal.min_establishment_year as string, 10);
    if (!isNaN(val) && val >= 1000 && val <= 2100) minEstYear = val;
  }
  let maxEstYear: number | undefined;
  if (searchParamsVal.max_establishment_year) {
    const val = parseInt(searchParamsVal.max_establishment_year as string, 10);
    if (!isNaN(val) && val >= 1000 && val <= 2100) maxEstYear = val;
  }
  const hasAward = searchParamsVal.award === 'true';
  const hasCertification = searchParamsVal.certification === 'true';
  const hasPatent = searchParamsVal.patent === 'true';

  let minSales: number | undefined;
  if (searchParamsVal.min_sales) {
    const val = parseInt(searchParamsVal.min_sales as string, 10);
    if (!isNaN(val) && val >= 0) minSales = val;
  }
  let maxSales: number | undefined;
  if (searchParamsVal.max_sales) {
    const val = parseInt(searchParamsVal.max_sales as string, 10);
    if (!isNaN(val) && val >= 0) maxSales = val;
  }

  const hasEmail = searchParamsVal.email === 'true';
  const hasPhone = searchParamsVal.phone === 'true';
  const hasWebsite = searchParamsVal.website === 'true';
  const hasFax = searchParamsVal.fax === 'true';

  const companyStatus = typeof searchParamsVal.status === 'string' && ["活動中", "閉鎖", "解散"].includes(searchParamsVal.status) ? searchParamsVal.status : undefined;

  let minOpIncome: number | undefined;
  if (searchParamsVal.min_operating_income) {
    const val = parseFloat(searchParamsVal.min_operating_income as string);
    if (!isNaN(val)) minOpIncome = val;
  }
  let maxOpIncome: number | undefined;
  if (searchParamsVal.max_operating_income) {
    const val = parseFloat(searchParamsVal.max_operating_income as string);
    if (!isNaN(val)) maxOpIncome = val;
  }
  let minOrdIncome: number | undefined;
  if (searchParamsVal.min_ordinary_income) {
    const val = parseFloat(searchParamsVal.min_ordinary_income as string);
    if (!isNaN(val)) minOrdIncome = val;
  }
  let maxOrdIncome: number | undefined;
  if (searchParamsVal.max_ordinary_income) {
    const val = parseFloat(searchParamsVal.max_ordinary_income as string);
    if (!isNaN(val)) maxOrdIncome = val;
  }
  let minNetIncome: number | undefined;
  if (searchParamsVal.min_net_income) {
    const val = parseFloat(searchParamsVal.min_net_income as string);
    if (!isNaN(val)) minNetIncome = val;
  }
  let maxNetIncome: number | undefined;
  if (searchParamsVal.max_net_income) {
    const val = parseFloat(searchParamsVal.max_net_income as string);
    if (!isNaN(val)) maxNetIncome = val;
  }

  let page = searchParamsVal.page ? parseInt(searchParamsVal.page as string, 10) : 1;
  if (isNaN(page) || page < 1) {
    page = 1;
  }
  const limit = 15;
  const offset = (page - 1) * limit;

  // Extract keyset cursor params
  let cursorEmp: number | undefined;
  if (searchParamsVal.cursor_emp) {
    const val = parseInt(searchParamsVal.cursor_emp as string, 10);
    if (!isNaN(val)) cursorEmp = val;
  }
  const cursorCorp = typeof searchParamsVal.cursor_corp === 'string' && /^\d{13}$/.test(searchParamsVal.cursor_corp) ? searchParamsVal.cursor_corp : undefined;

  // Assemble filter object
  const filters: SearchFilters = {
    prefecture_code: prefCode,
    city_name: city,
    industry_code: indCode,
    min_employees: minEmp,
    max_employees: maxEmp,
    min_capital: minCap,
    max_capital: maxCap,
    has_hiring: hasHiring,
    has_subsidy: hasSubsidy,
    has_bidding: hasBidding,
    has_award: hasAward,
    has_certification: hasCertification,
    has_patent: hasPatent,
    has_financials: hasFinancials,
    min_establishment_year: minEstYear,
    max_establishment_year: maxEstYear,
    min_sales: minSales,
    max_sales: maxSales,
    has_email: hasEmail,
    has_phone: hasPhone,
    has_website: hasWebsite,
    has_fax: hasFax,
    company_status: companyStatus,
    min_operating_income: minOpIncome,
    max_operating_income: maxOpIncome,
    min_ordinary_income: minOrdIncome,
    max_ordinary_income: maxOrdIncome,
    min_net_income: minNetIncome,
    max_net_income: maxNetIncome,
    cursor_emp: cursorEmp,
    cursor_corp: cursorCorp,
  };

  // 2. Fetch filters lists, companies search, and industry map in parallel
  const [
    prefecturesResult,
    industriesResult,
    citiesResult,
    searchResult,
    industryMapResult
  ] = await Promise.all([
    getPrefecturesWithCounts(),
    getIndustriesHierarchy(),
    prefCode ? getCitiesWithCounts(prefCode) : Promise.resolve([]),
    searchCompanies(keyword, filters, limit, offset),
    getIndustryMap()
  ]);

  const prefectures = JSON.parse(JSON.stringify(prefecturesResult));
  const industries = JSON.parse(JSON.stringify(industriesResult));
  const cities = JSON.parse(JSON.stringify(citiesResult));
  const companies = JSON.parse(JSON.stringify(searchResult.companies));
  const totalCount = searchResult.totalCount;
  const industryMap = { ...industryMapResult };

  // Translate prefectures & industries if locale is English
  if (locale === 'en' || locale === 'vi') {
    prefectures.forEach((pref: any) => {
      pref.name = getPrefectureName(pref.name, locale);
    });

    industries.forEach((major: any) => {
      major.name = getIndustryName(major.name, locale);
      if (major.children) {
        major.children.forEach((medium: any) => {
          medium.name = getIndustryName(medium.name, locale);
        });
      }
    });

    Object.keys(industryMap).forEach((code) => {
      const jaName = industryMap[code];
      industryMap[code] = getIndustryName(jaName, locale);
    });
  }

  // Create initialFilters prop object
  const initialFilters = {
    keyword,
    prefCode,
    city,
    indCode,
    minEmp,
    maxEmp,
    minCap,
    maxCap,
    hasHiring,
    hasSubsidy,
    hasBidding,
    hasFinancials,
    minEstYear,
    maxEstYear,
    hasAward,
    hasCertification,
    hasPatent,
    minSales,
    maxSales,
    hasEmail,
    hasPhone,
    hasWebsite,
    hasFax,
    companyStatus,
    minOpIncome,
    maxOpIncome,
    minOrdIncome,
    maxOrdIncome,
    minNetIncome,
    maxNetIncome,
    page
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      <Header />
      <SearchClientContainer
        initialCompanies={companies}
        initialTotalCount={totalCount}
        initialCities={cities}
        prefectures={prefectures}
        industries={industries}
        industryMap={industryMap}
        initialFilters={initialFilters}
      />
      <Footer />
    </div>
  );
}
