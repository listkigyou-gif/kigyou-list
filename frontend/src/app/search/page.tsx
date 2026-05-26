import { 
  searchCompanies, getPrefecturesWithCounts, 
  getCitiesWithCounts, getIndustriesHierarchy, SearchFilters, getIndustryMap 
} from '@/lib/db';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SearchClientContainer } from '@/components/SearchClientContainer';

export const revalidate = 0; // Dynamic search page, do not cache static

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // 1. Extract query params safely
  const keyword = typeof params.q === 'string' ? params.q : '';
  const prefCode = typeof params.prefecture === 'string' && /^\d{2}$/.test(params.prefecture) ? params.prefecture : undefined;
  const city = typeof params.city === 'string' ? params.city : undefined;
  const indCode = typeof params.industry === 'string' && (/^[A-Z]$/.test(params.industry) || /^\d{2}$/.test(params.industry)) ? params.industry : undefined;
  
  let minEmp: number | undefined;
  if (params.min_employees) {
    const val = parseInt(params.min_employees as string, 10);
    if (!isNaN(val) && val >= 0) minEmp = val;
  }
  let maxEmp: number | undefined;
  if (params.max_employees) {
    const val = parseInt(params.max_employees as string, 10);
    if (!isNaN(val) && val >= 0) maxEmp = val;
  }
  
  let minCap: number | undefined;
  if (params.min_capital) {
    const val = parseInt(params.min_capital as string, 10);
    if (!isNaN(val) && val >= 0) minCap = val;
  }
  let maxCap: number | undefined;
  if (params.max_capital) {
    const val = parseInt(params.max_capital as string, 10);
    if (!isNaN(val) && val >= 0) maxCap = val;
  }
  
  const hasHiring = params.hiring === 'true';
  const hasSubsidy = params.subsidy === 'true';
  const hasBidding = params.bidding === 'true';
  
  let minEstYear: number | undefined;
  if (params.min_establishment_year) {
    const val = parseInt(params.min_establishment_year as string, 10);
    if (!isNaN(val) && val >= 1000 && val <= 2100) minEstYear = val;
  }
  let maxEstYear: number | undefined;
  if (params.max_establishment_year) {
    const val = parseInt(params.max_establishment_year as string, 10);
    if (!isNaN(val) && val >= 1000 && val <= 2100) maxEstYear = val;
  }
  const hasAward = params.award === 'true';
  const hasCertification = params.certification === 'true';
  const hasPatent = params.patent === 'true';

  let minSales: number | undefined;
  if (params.min_sales) {
    const val = parseInt(params.min_sales as string, 10);
    if (!isNaN(val) && val >= 0) minSales = val;
  }
  let maxSales: number | undefined;
  if (params.max_sales) {
    const val = parseInt(params.max_sales as string, 10);
    if (!isNaN(val) && val >= 0) maxSales = val;
  }

  const hasEmail = params.email === 'true';
  const hasPhone = params.phone === 'true';
  const hasWebsite = params.website === 'true';
  const hasFax = params.fax === 'true';

  const companyStatus = typeof params.status === 'string' && ["活動中", "閉鎖", "解散"].includes(params.status) ? params.status : undefined;

  let minOpIncome: number | undefined;
  if (params.min_operating_income) {
    const val = parseFloat(params.min_operating_income as string);
    if (!isNaN(val)) minOpIncome = val;
  }
  let maxOpIncome: number | undefined;
  if (params.max_operating_income) {
    const val = parseFloat(params.max_operating_income as string);
    if (!isNaN(val)) maxOpIncome = val;
  }
  let minOrdIncome: number | undefined;
  if (params.min_ordinary_income) {
    const val = parseFloat(params.min_ordinary_income as string);
    if (!isNaN(val)) minOrdIncome = val;
  }
  let maxOrdIncome: number | undefined;
  if (params.max_ordinary_income) {
    const val = parseFloat(params.max_ordinary_income as string);
    if (!isNaN(val)) maxOrdIncome = val;
  }
  let minNetIncome: number | undefined;
  if (params.min_net_income) {
    const val = parseFloat(params.min_net_income as string);
    if (!isNaN(val)) minNetIncome = val;
  }
  let maxNetIncome: number | undefined;
  if (params.max_net_income) {
    const val = parseFloat(params.max_net_income as string);
    if (!isNaN(val)) maxNetIncome = val;
  }

  let page = params.page ? parseInt(params.page as string, 10) : 1;
  if (isNaN(page) || page < 1) {
    page = 1;
  }
  const limit = 15;
  const offset = (page - 1) * limit;

  // Extract keyset cursor params
  let cursorEmp: number | undefined;
  if (params.cursor_emp) {
    const val = parseInt(params.cursor_emp as string, 10);
    if (!isNaN(val)) cursorEmp = val;
  }
  const cursorCorp = typeof params.cursor_corp === 'string' && /^\d{13}$/.test(params.cursor_corp) ? params.cursor_corp : undefined;

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
  const industryMap = industryMapResult;

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
