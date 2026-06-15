"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { 
  Building2, Search, MapPin, X, Phone, Globe, Clock,
  ChevronLeft, ChevronRight, SlidersHorizontal, Lock, ExternalLink
} from "lucide-react";
import { formatShortDate } from "@/lib/dateUtils";
import { SearchSidebar } from "@/components/SearchSidebar";
import { ExportCSVButton } from "@/components/ExportCSVButton";
import { useAuth } from "@/context/AuthContext";

interface Company {
  corporate_number: string;
  company_name: string;
  company_name_kana: string | null;
  company_name_en: string | null;
  postal_code: string | null;
  prefecture_code: string | null;
  prefecture_name: string | null;
  city_name: string | null;
  street_address: string | null;
  full_address: string | null;
  representative_name: string | null;
  representative_position: string | null;
  establishment_date: string | null;
  capital_amount: number | null;
  employee_count: number | null;
  sales_amount: number | null;
  phone_number: string | null;
  fax_number: string | null;
  website_url: string | null;
  email_address: string | null;
  business_summary: string | null;
  jigyo_shumoku: string | null;
  branch_phone_numbers: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  industries?: {
    industry_code: string;
    industry_name: string;
    classification_level: string;
  }[];
}

interface PrefectureOption {
  code: string;
  name: string;
  count: number;
}

interface MediumIndustry {
  code: string;
  name: string;
  count: number;
}

interface MajorIndustry {
  code: string;
  name: string;
  totalCount: number;
  children: MediumIndustry[];
}

interface SearchClientContainerProps {
  initialCompanies: Company[];
  initialTotalCount: number;
  initialCities: { cityName: string; count: number }[];
  prefectures: PrefectureOption[];
  industries: MajorIndustry[];
  industryMap: Record<string, string>;
  
  // initial filter state from SSR params
  initialFilters: {
    keyword?: string;
    prefCode?: string;
    city?: string;
    indCode?: string;
    minEmp?: number;
    maxEmp?: number;
    minCap?: number;
    maxCap?: number;
    hasHiring?: boolean;
    hasSubsidy?: boolean;
    hasBidding?: boolean;
    minEstYear?: number;
    maxEstYear?: number;
    hasAward?: boolean;
    hasCertification?: boolean;
    hasPatent?: boolean;
    hasFinancials?: boolean;
    minSales?: number;
    maxSales?: number;
    hasEmail?: boolean;
    hasPhone?: boolean;
    hasWebsite?: boolean;
    hasFax?: boolean;
    companyStatus?: string;
    minOpIncome?: number;
    maxOpIncome?: number;
    minOrdIncome?: number;
    maxOrdIncome?: number;
    minNetIncome?: number;
    maxNetIncome?: number;
    page?: number;
  };
}

const SearchSkeletonCard: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800/80 rounded-2xl p-6 shadow-sm animate-skeleton">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-12 h-5 bg-slate-250 dark:bg-slate-700 rounded-md" />
          <div className="w-16 h-4 bg-slate-250 dark:bg-slate-700 rounded-md" />
        </div>
        <div className="w-24 h-4 bg-slate-250 dark:bg-slate-700 rounded-md" />
      </div>
      <div className="w-2/3 h-6 bg-slate-250 dark:bg-slate-700 rounded-md mb-4" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 py-4 border-t border-b border-slate-100 dark:border-slate-800/50">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-slate-50/50 dark:bg-[#1e2430]/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/30 h-16 flex flex-col justify-between">
            <div className="w-12 h-3 bg-slate-250 dark:bg-slate-700 rounded-sm" />
            <div className="w-16 h-4 bg-slate-300 dark:bg-slate-650/80 rounded-sm animate-pulse" />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-1">
        <div className="flex flex-wrap gap-4 w-2/3">
          <div className="w-24 h-4 bg-slate-250 dark:bg-slate-700 rounded-sm" />
          <div className="w-20 h-4 bg-slate-250 dark:bg-slate-700 rounded-sm" />
          <div className="w-28 h-4 bg-slate-250 dark:bg-slate-700 rounded-sm" />
        </div>
        <div className="w-28 h-7 bg-slate-250 dark:bg-slate-700 rounded-xl" />
      </div>
    </div>
  );
};

// ContactTeaserBadge — replaces inline FAX/Email on list cards to prevent bulk copying
const ContactTeaserBadge: React.FC<{ corporateNumber: string }> = ({ corporateNumber }) => {
  const { isLoggedIn, setAuthModalOpen } = useAuth();

  if (!isLoggedIn) {
    return (
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAuthModalOpen(true); }}
        className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 text-[10px] font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:border-amber-300 transition-all duration-200 cursor-pointer select-none"
        title="無料会員登録でFAX・メールアドレスを閲覧できます"
      >
        <Lock className="w-3 h-3 shrink-0 group-hover:rotate-6 transition-transform duration-200" />
        連絡先 (FAX・メール) を見る
      </button>
    );
  }

  return (
    <Link
      href={`/company/${corporateNumber}#contact`}
      className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-teal-200 bg-teal-50 dark:bg-teal-950/30 dark:border-teal-900/50 text-teal-700 dark:text-teal-400 text-[10px] font-bold hover:bg-teal-100 dark:hover:bg-teal-900/40 hover:border-teal-300 transition-all duration-200"
      title="詳細ページで連絡先情報 (FAX・メール) を確認できます"
      onClick={(e) => e.stopPropagation()}
    >
      <ExternalLink className="w-3 h-3 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
      連絡先 (FAX・メール) を確認 →
    </Link>
  );
};

export const SearchClientContainer: React.FC<SearchClientContainerProps> = ({
  initialCompanies,
  initialTotalCount,
  initialCities,
  prefectures,
  industries,
  initialFilters
}) => {
  // 1. Local States
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount);
  const [cities, setCities] = useState(initialCities);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  
  // Individual filter states
  const [keyword, setKeyword] = useState(initialFilters.keyword || "");
  const [prefCode, setPrefCode] = useState(initialFilters.prefCode);
  const [city, setCity] = useState(initialFilters.city);
  const [indCode, setIndCode] = useState(initialFilters.indCode);
  const [minEmp, setMinEmp] = useState(initialFilters.minEmp);
  const [maxEmp, setMaxEmp] = useState(initialFilters.maxEmp);
  const [minCap, setMinCap] = useState(initialFilters.minCap);
  const [maxCap, setMaxCap] = useState(initialFilters.maxCap);
  const [hasHiring, setHasHiring] = useState(!!initialFilters.hasHiring);
  const [hasSubsidy, setHasSubsidy] = useState(!!initialFilters.hasSubsidy);
  const [hasBidding, setHasBidding] = useState(!!initialFilters.hasBidding);
  const [minEstYear, setMinEstYear] = useState(initialFilters.minEstYear);
  const [maxEstYear, setMaxEstYear] = useState(initialFilters.maxEstYear);
  const [hasAward, setHasAward] = useState(!!initialFilters.hasAward);
  const [hasCertification, setHasCertification] = useState(!!initialFilters.hasCertification);
  const [hasPatent, setHasPatent] = useState(!!initialFilters.hasPatent);
  const [hasFinancials, setHasFinancials] = useState(!!initialFilters.hasFinancials);
  const [minSales, setMinSales] = useState(initialFilters.minSales);
  const [maxSales, setMaxSales] = useState(initialFilters.maxSales);
  const [hasEmail, setHasEmail] = useState(!!initialFilters.hasEmail);
  const [hasPhone, setHasPhone] = useState(!!initialFilters.hasPhone);
  const [hasWebsite, setHasWebsite] = useState(!!initialFilters.hasWebsite);
  const [hasFax, setHasFax] = useState(!!initialFilters.hasFax);
  const [companyStatus, setCompanyStatus] = useState(initialFilters.companyStatus);
  const [minOpIncome, setMinOpIncome] = useState(initialFilters.minOpIncome);
  const [maxOpIncome, setMaxOpIncome] = useState(initialFilters.maxOpIncome);
  const [minOrdIncome, setMinOrdIncome] = useState(initialFilters.minOrdIncome);
  const [maxOrdIncome, setMaxOrdIncome] = useState(initialFilters.maxOrdIncome);
  const [minNetIncome, setMinNetIncome] = useState(initialFilters.minNetIncome);
  const [maxNetIncome, setMaxNetIncome] = useState(initialFilters.maxNetIncome);
  const [page, setPage] = useState(initialFilters.page || 1);
  
  const resultsTopRef = useRef<HTMLDivElement>(null);

  const limit = 15;
  const totalPages = Math.ceil(totalCount / limit);

  // 2. Fetch function that coordinates with current states
  const executeSearch = async (overrides: Record<string, any> = {}) => {
    setIsLoading(true);
    
    // Resolve what the values would be after applying overrides
    const newKeyword = overrides.keyword !== undefined ? overrides.keyword : keyword;
    const newPrefCode = overrides.prefCode !== undefined ? overrides.prefCode : prefCode;
    const newCity = overrides.city !== undefined ? overrides.city : city;
    const newIndCode = overrides.indCode !== undefined ? overrides.indCode : indCode;
    const newMinEmp = overrides.minEmp !== undefined ? overrides.minEmp : minEmp;
    const newMaxEmp = overrides.maxEmp !== undefined ? overrides.maxEmp : maxEmp;
    const newMinCap = overrides.minCap !== undefined ? overrides.minCap : minCap;
    const newMaxCap = overrides.maxCap !== undefined ? overrides.maxCap : maxCap;
    const newHasHiring = overrides.hasHiring !== undefined ? overrides.hasHiring : hasHiring;
    const newHasSubsidy = overrides.hasSubsidy !== undefined ? overrides.hasSubsidy : hasSubsidy;
    const newHasBidding = overrides.hasBidding !== undefined ? overrides.hasBidding : hasBidding;
    const newMinEstYear = overrides.minEstYear !== undefined ? overrides.minEstYear : minEstYear;
    const newMaxEstYear = overrides.maxEstYear !== undefined ? overrides.maxEstYear : maxEstYear;
    const newHasAward = overrides.hasAward !== undefined ? overrides.hasAward : hasAward;
    const newHasCertification = overrides.hasCertification !== undefined ? overrides.hasCertification : hasCertification;
    const newHasPatent = overrides.hasPatent !== undefined ? overrides.hasPatent : hasPatent;
    const newHasFinancials = overrides.hasFinancials !== undefined ? overrides.hasFinancials : hasFinancials;
    const newMinSales = overrides.minSales !== undefined ? overrides.minSales : minSales;
    const newMaxSales = overrides.maxSales !== undefined ? overrides.maxSales : maxSales;
    const newHasEmail = overrides.hasEmail !== undefined ? overrides.hasEmail : hasEmail;
    const newHasPhone = overrides.hasPhone !== undefined ? overrides.hasPhone : hasPhone;
    const newHasWebsite = overrides.hasWebsite !== undefined ? overrides.hasWebsite : hasWebsite;
    const newHasFax = overrides.hasFax !== undefined ? overrides.hasFax : hasFax;
    const newCompanyStatus = overrides.companyStatus !== undefined ? overrides.companyStatus : companyStatus;
    const newMinOpIncome = overrides.minOpIncome !== undefined ? overrides.minOpIncome : minOpIncome;
    const newMaxOpIncome = overrides.maxOpIncome !== undefined ? overrides.maxOpIncome : maxOpIncome;
    const newMinOrdIncome = overrides.minOrdIncome !== undefined ? overrides.minOrdIncome : minOrdIncome;
    const newMaxOrdIncome = overrides.maxOrdIncome !== undefined ? overrides.maxOrdIncome : maxOrdIncome;
    const newMinNetIncome = overrides.minNetIncome !== undefined ? overrides.minNetIncome : minNetIncome;
    const newMaxNetIncome = overrides.maxNetIncome !== undefined ? overrides.maxNetIncome : maxNetIncome;
    const newPage = overrides.page !== undefined ? overrides.page : page;

    const offset = (newPage - 1) * limit;

    // Build API query URL
    const apiParams = new URLSearchParams();
    if (newKeyword) apiParams.set("q", newKeyword);
    if (newPrefCode) apiParams.set("prefecture", newPrefCode);
    if (newCity) apiParams.set("city", newCity);
    if (newIndCode) apiParams.set("industry", newIndCode);
    if (newMinEmp != null) apiParams.set("min_employees", String(newMinEmp));
    if (newMaxEmp != null) apiParams.set("max_employees", String(newMaxEmp));
    if (newMinCap != null) apiParams.set("min_capital", String(newMinCap));
    if (newMaxCap != null) apiParams.set("max_capital", String(newMaxCap));
    if (newHasHiring) apiParams.set("hiring", "true");
    if (newHasSubsidy) apiParams.set("subsidy", "true");
    if (newHasBidding) apiParams.set("bidding", "true");
    if (newMinEstYear != null) apiParams.set("min_establishment_year", String(newMinEstYear));
    if (newMaxEstYear != null) apiParams.set("max_establishment_year", String(newMaxEstYear));
    if (newHasAward) apiParams.set("award", "true");
    if (newHasCertification) apiParams.set("certification", "true");
    if (newHasPatent) apiParams.set("patent", "true");
    if (newHasFinancials) apiParams.set("financials", "true");
    if (newMinSales != null) apiParams.set("min_sales", String(newMinSales));
    if (newMaxSales != null) apiParams.set("max_sales", String(newMaxSales));
    if (newHasEmail) apiParams.set("email", "true");
    if (newHasPhone) apiParams.set("phone", "true");
    if (newHasWebsite) apiParams.set("website", "true");
    if (newHasFax) apiParams.set("fax", "true");
    if (newCompanyStatus) apiParams.set("status", newCompanyStatus);
    if (newMinOpIncome != null) apiParams.set("min_operating_income", String(newMinOpIncome));
    if (newMaxOpIncome != null) apiParams.set("max_operating_income", String(newMaxOpIncome));
    if (newMinOrdIncome != null) apiParams.set("min_ordinary_income", String(newMinOrdIncome));
    if (newMaxOrdIncome != null) apiParams.set("max_ordinary_income", String(newMaxOrdIncome));
    if (newMinNetIncome != null) apiParams.set("min_net_income", String(newMinNetIncome));
    if (newMaxNetIncome != null) apiParams.set("max_net_income", String(newMaxNetIncome));
    
    // Keyset pagination support
    if (newPage > 1 && companies.length > 0 && newPage === page + 1 && !overrides.forceOffset) {
      const lastCompany = companies[companies.length - 1];
      if (lastCompany.employee_count !== null) {
        apiParams.set("cursor_emp", String(lastCompany.employee_count));
      } else {
        apiParams.set("cursor_emp", "0");
      }
      apiParams.set("cursor_corp", lastCompany.corporate_number);
    } else {
      apiParams.set("offset", String(offset));
    }
    apiParams.set("limit", String(limit));

    try {
      const res = await fetch(`/api/search?${apiParams.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      
      setCompanies(data.companies);
      setTotalCount(data.totalCount);
      
      // Update cities list if prefecture is updated
      if (overrides.prefCode !== undefined) {
        setCities(data.cities || []);
      }

      // Update URL in browser address bar (without reloading page)
      const browserParams = new URLSearchParams();
      if (newKeyword) browserParams.set("q", newKeyword);
      if (newPrefCode) browserParams.set("prefecture", newPrefCode);
      if (newCity) browserParams.set("city", newCity);
      if (newIndCode) browserParams.set("industry", newIndCode);
      if (newMinEmp != null) browserParams.set("min_employees", String(newMinEmp));
      if (newMaxEmp != null) browserParams.set("max_employees", String(newMaxEmp));
      if (newMinCap != null) browserParams.set("min_capital", String(newMinCap));
      if (newMaxCap != null) browserParams.set("max_capital", String(newMaxCap));
      if (newHasHiring) browserParams.set("hiring", "true");
      if (newHasSubsidy) browserParams.set("subsidy", "true");
      if (newHasBidding) browserParams.set("bidding", "true");
      if (newMinEstYear != null) browserParams.set("min_establishment_year", String(newMinEstYear));
      if (newMaxEstYear != null) browserParams.set("max_establishment_year", String(newMaxEstYear));
      if (newHasAward) browserParams.set("award", "true");
      if (newHasCertification) browserParams.set("certification", "true");
      if (newHasPatent) browserParams.set("patent", "true");
      if (newHasFinancials) browserParams.set("financials", "true");
      if (newMinSales != null) browserParams.set("min_sales", String(newMinSales));
      if (newMaxSales != null) browserParams.set("max_sales", String(newMaxSales));
      if (newHasEmail) browserParams.set("email", "true");
      if (newHasPhone) browserParams.set("phone", "true");
      if (newHasWebsite) browserParams.set("website", "true");
      if (newHasFax) browserParams.set("fax", "true");
      if (newCompanyStatus) browserParams.set("status", newCompanyStatus);
      if (newMinOpIncome != null) browserParams.set("min_operating_income", String(newMinOpIncome));
      if (newMaxOpIncome != null) browserParams.set("max_operating_income", String(newMaxOpIncome));
      if (newMinOrdIncome != null) browserParams.set("min_ordinary_income", String(newMinOrdIncome));
      if (newMaxOrdIncome != null) browserParams.set("max_ordinary_income", String(newMaxOrdIncome));
      if (newMinNetIncome != null) browserParams.set("min_net_income", String(newMinNetIncome));
      if (newMaxNetIncome != null) browserParams.set("max_net_income", String(newMaxNetIncome));
      if (newPage > 1) browserParams.set("page", String(newPage));
      
      const newUrl = browserParams.toString() ? `/search?${browserParams.toString()}` : "/search";
      window.history.replaceState(window.history.state, "", newUrl);

      // Scroll to search results on desktop/mobile
      if (resultsTopRef.current) {
        resultsTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Callback handlers for Sidebar and inputs
  const handleFilterChange = (updates: Record<string, any>) => {
    // Determine and update individual states
    const resolvedUpdates: Record<string, any> = {};
    
    if (updates.keyword !== undefined) {
      setKeyword(updates.keyword || "");
      resolvedUpdates.keyword = updates.keyword || "";
    }
    if (updates.prefecture !== undefined) {
      setPrefCode(updates.prefecture || undefined);
      resolvedUpdates.prefCode = updates.prefecture || null;
      // Reset city filter when prefecture changes
      setCity(undefined);
      resolvedUpdates.city = null;
    }
    if (updates.city !== undefined) {
      setCity(updates.city || undefined);
      resolvedUpdates.city = updates.city || null;
    }
    if (updates.industry !== undefined) {
      setIndCode(updates.industry || undefined);
      resolvedUpdates.indCode = updates.industry || null;
    }
    if (updates.min_employees !== undefined) {
      const val = updates.min_employees ? parseInt(updates.min_employees, 10) : undefined;
      setMinEmp(val);
      resolvedUpdates.minEmp = val || null;
    }
    if (updates.max_employees !== undefined) {
      const val = updates.max_employees ? parseInt(updates.max_employees, 10) : undefined;
      setMaxEmp(val);
      resolvedUpdates.maxEmp = val || null;
    }
    if (updates.min_capital !== undefined) {
      const val = updates.min_capital ? parseInt(updates.min_capital, 10) : undefined;
      setMinCap(val);
      resolvedUpdates.minCap = val || null;
    }
    if (updates.max_capital !== undefined) {
      const val = updates.max_capital ? parseInt(updates.max_capital, 10) : undefined;
      setMaxCap(val);
      resolvedUpdates.maxCap = val || null;
    }
    if (updates.hiring !== undefined) {
      const val = !!updates.hiring;
      setHasHiring(val);
      resolvedUpdates.hasHiring = val;
    }
    if (updates.subsidy !== undefined) {
      const val = !!updates.subsidy;
      setHasSubsidy(val);
      resolvedUpdates.hasSubsidy = val;
    }
    if (updates.bidding !== undefined) {
      const val = !!updates.bidding;
      setHasBidding(val);
      resolvedUpdates.hasBidding = val;
    }
    if (updates.min_establishment_year !== undefined) {
      const val = updates.min_establishment_year ? parseInt(updates.min_establishment_year, 10) : undefined;
      setMinEstYear(val);
      resolvedUpdates.minEstYear = val || null;
    }
    if (updates.max_establishment_year !== undefined) {
      const val = updates.max_establishment_year ? parseInt(updates.max_establishment_year, 10) : undefined;
      setMaxEstYear(val);
      resolvedUpdates.maxEstYear = val || null;
    }
    if (updates.award !== undefined) {
      const val = !!updates.award;
      setHasAward(val);
      resolvedUpdates.hasAward = val;
    }
    if (updates.certification !== undefined) {
      const val = !!updates.certification;
      setHasCertification(val);
      resolvedUpdates.hasCertification = val;
    }
    if (updates.patent !== undefined) {
      const val = !!updates.patent;
      setHasPatent(val);
      resolvedUpdates.hasPatent = val;
    }
    if (updates.financials !== undefined) {
      const val = !!updates.financials;
      setHasFinancials(val);
      resolvedUpdates.hasFinancials = val;
    }
    if (updates.min_sales !== undefined) {
      const val = updates.min_sales ? parseInt(updates.min_sales, 10) : undefined;
      setMinSales(val);
      resolvedUpdates.minSales = val || null;
    }
    if (updates.max_sales !== undefined) {
      const val = updates.max_sales ? parseInt(updates.max_sales, 10) : undefined;
      setMaxSales(val);
      resolvedUpdates.maxSales = val || null;
    }
    if (updates.email !== undefined) {
      const val = !!updates.email;
      setHasEmail(val);
      resolvedUpdates.hasEmail = val;
    }
    if (updates.phone !== undefined) {
      const val = !!updates.phone;
      setHasPhone(val);
      resolvedUpdates.hasPhone = val;
    }
    if (updates.website !== undefined) {
      const val = !!updates.website;
      setHasWebsite(val);
      resolvedUpdates.hasWebsite = val;
    }
    if (updates.fax !== undefined) {
      const val = !!updates.fax;
      setHasFax(val);
      resolvedUpdates.hasFax = val;
    }
    if (updates.status !== undefined) {
      setCompanyStatus(updates.status || undefined);
      resolvedUpdates.companyStatus = updates.status || null;
    }
    if (updates.min_operating_income !== undefined) {
      const val = updates.min_operating_income ? parseFloat(updates.min_operating_income) : undefined;
      setMinOpIncome(val);
      resolvedUpdates.minOpIncome = val || null;
    }
    if (updates.max_operating_income !== undefined) {
      const val = updates.max_operating_income ? parseFloat(updates.max_operating_income) : undefined;
      setMaxOpIncome(val);
      resolvedUpdates.maxOpIncome = val || null;
    }
    if (updates.min_ordinary_income !== undefined) {
      const val = updates.min_ordinary_income ? parseFloat(updates.min_ordinary_income) : undefined;
      setMinOrdIncome(val);
      resolvedUpdates.minOrdIncome = val || null;
    }
    if (updates.max_ordinary_income !== undefined) {
      const val = updates.max_ordinary_income ? parseFloat(updates.max_ordinary_income) : undefined;
      setMaxOrdIncome(val);
      resolvedUpdates.maxOrdIncome = val || null;
    }
    if (updates.min_net_income !== undefined) {
      const val = updates.min_net_income ? parseFloat(updates.min_net_income) : undefined;
      setMinNetIncome(val);
      resolvedUpdates.minNetIncome = val || null;
    }
    if (updates.max_net_income !== undefined) {
      const val = updates.max_net_income ? parseFloat(updates.max_net_income) : undefined;
      setMaxNetIncome(val);
      resolvedUpdates.maxNetIncome = val || null;
    }

    // Always reset to page 1 on filter changes
    setPage(1);
    resolvedUpdates.page = 1;
    resolvedUpdates.forceOffset = true;

    executeSearch(resolvedUpdates);
  };

  const handleKeywordSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const qValue = (formData.get("q") as string) || "";
    setKeyword(qValue);
    setPage(1);
    executeSearch({ keyword: qValue, page: 1, forceOffset: true });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    executeSearch({ page: newPage });
  };

  // 4. Skeleton Loader Overlay and Render Layout
  return (
    <div className="flex-1 max-w-8xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
      {/* Mobile Drawer Backdrop */}
      {isMobileDrawerOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300 animate-fade-in"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer Panel */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-76 max-w-[calc(100vw-3rem)] bg-white dark:bg-[#1C2128] p-6 shadow-2xl drawer-transition flex flex-col ${
          isMobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <span className="font-extrabold text-sm text-slate-800 dark:text-white">条件で絞り込む</span>
          <button 
            type="button" 
            onClick={() => setIsMobileDrawerOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
          <SearchSidebar
            className="w-full bg-transparent p-0 border-none max-h-none shadow-none overflow-y-visible"
            prefectures={prefectures}
            industries={industries}
            cities={cities}
            prefCode={prefCode}
            city={city}
            indCode={indCode}
            minEmp={minEmp}
            maxEmp={maxEmp}
            minCap={minCap}
            maxCap={maxCap}
            hasHiring={hasHiring}
            hasSubsidy={hasSubsidy}
            hasBidding={hasBidding}
            minEstYear={minEstYear}
            maxEstYear={maxEstYear}
            hasAward={hasAward}
            hasCertification={hasCertification}
            hasPatent={hasPatent}
            hasFinancials={hasFinancials}
            minSales={minSales}
            maxSales={maxSales}
            hasEmail={hasEmail}
            hasPhone={hasPhone}
            hasWebsite={hasWebsite}
            hasFax={hasFax}
            companyStatus={companyStatus}
            minOpIncome={minOpIncome}
            maxOpIncome={maxOpIncome}
            minOrdIncome={minOrdIncome}
            maxOrdIncome={maxOrdIncome}
            minNetIncome={minNetIncome}
            maxNetIncome={maxNetIncome}
            onFilterChange={handleFilterChange}
            onCloseMobile={() => setIsMobileDrawerOpen(false)}
          />
        </div>
      </div>

      {/* Sidebar Filters */}
      <SearchSidebar
        prefectures={prefectures}
        industries={industries}
        cities={cities}
        prefCode={prefCode}
        city={city}
        indCode={indCode}
        minEmp={minEmp}
        maxEmp={maxEmp}
        minCap={minCap}
        maxCap={maxCap}
        hasHiring={hasHiring}
        hasSubsidy={hasSubsidy}
        hasBidding={hasBidding}
        minEstYear={minEstYear}
        maxEstYear={maxEstYear}
        hasAward={hasAward}
        hasCertification={hasCertification}
        hasPatent={hasPatent}
        hasFinancials={hasFinancials}
        minSales={minSales}
        maxSales={maxSales}
        hasEmail={hasEmail}
        hasPhone={hasPhone}
        hasWebsite={hasWebsite}
        hasFax={hasFax}
        companyStatus={companyStatus}
        minOpIncome={minOpIncome}
        maxOpIncome={maxOpIncome}
        minOrdIncome={minOrdIncome}
        maxOrdIncome={maxOrdIncome}
        minNetIncome={minNetIncome}
        maxNetIncome={maxNetIncome}
        onFilterChange={handleFilterChange}
      />

      {/* Main Results Column */}
      <main ref={resultsTopRef} className="flex-1 flex flex-col gap-6 relative">

        {/* Top Search Input Bar */}
        <div className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="lg:hidden flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all active:scale-95 shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 text-primary dark:text-secondary" />
            条件で絞り込む
          </button>
          <form onSubmit={handleKeywordSearch} className="flex-1 relative flex items-center bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-700">
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              name="q"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="企業名、業界、住所などで再検索..."
              className="w-full px-3 py-3 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white"
            />
            <button
              type="submit"
              className="px-5 py-2 mr-1 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-sm transition-colors"
            >
              検索
            </button>
          </form>

          {/* Active Filters Summary */}
          <div className="flex flex-wrap gap-1.5 mt-3 text-xs">
            {keyword && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                キーワード: {keyword}
                <button type="button" onClick={() => handleFilterChange({ keyword: "" })}><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-1" /></button>
              </span>
            )}
            {prefCode && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                エリア: {prefectures.find(p => p.code === prefCode)?.name || prefCode}
                <button type="button" onClick={() => handleFilterChange({ prefecture: null })}><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-1" /></button>
              </span>
            )}
            {city && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                市区町村: {city}
                <button type="button" onClick={() => handleFilterChange({ city: null })}><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-1" /></button>
              </span>
            )}
            {indCode && (() => {
              let selectedIndustryName = indCode;
              for (const major of industries) {
                if (major.code === indCode) {
                  selectedIndustryName = major.name;
                  break;
                }
                const child = major.children.find((c: any) => c.code === indCode);
                if (child) {
                  selectedIndustryName = child.name;
                  break;
                }
              }
              return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  業界: {selectedIndustryName}
                  <button type="button" onClick={() => handleFilterChange({ industry: null })}><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-1" /></button>
                </span>
              );
            })()}
            {(minEmp !== undefined || maxEmp !== undefined) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                従業員数: {minEmp !== undefined && maxEmp !== undefined ? `${minEmp}〜${maxEmp}名` : minEmp !== undefined ? `${minEmp}名以上` : `${maxEmp}名以下`}
                <button type="button" onClick={() => handleFilterChange({ min_employees: null, max_employees: null })}><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-1" /></button>
              </span>
            )}
            {(minCap !== undefined || maxCap !== undefined) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                資本金: {minCap !== undefined && maxCap !== undefined ? `${minCap}〜${maxCap}万円` : minCap !== undefined ? `${minCap}万円以上` : `${maxCap}万円以下`}
                <button type="button" onClick={() => handleFilterChange({ min_capital: null, max_capital: null })}><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-1" /></button>
              </span>
            )}
            {hasHiring && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50">
                求人活動あり
                <button type="button" onClick={() => handleFilterChange({ hiring: false })}><X className="w-3 h-3 text-amber-400 hover:text-amber-600 ml-1" /></button>
              </span>
            )}
            {hasSubsidy && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50">
                補助金受給あり
                <button type="button" onClick={() => handleFilterChange({ subsidy: false })}><X className="w-3 h-3 text-amber-400 hover:text-amber-600 ml-1" /></button>
              </span>
            )}
            {hasBidding && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50">
                入札落札実績あり
                <button type="button" onClick={() => handleFilterChange({ bidding: false })}><X className="w-3 h-3 text-amber-400 hover:text-amber-600 ml-1" /></button>
              </span>
            )}
            {(minEstYear !== undefined || maxEstYear !== undefined) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                設立年: {minEstYear !== undefined && maxEstYear !== undefined ? `${minEstYear}〜${maxEstYear}年` : minEstYear !== undefined ? `${minEstYear}年以上` : `${maxEstYear}年以下`}
                <button type="button" onClick={() => handleFilterChange({ min_establishment_year: null, max_establishment_year: null })}><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-1" /></button>
              </span>
            )}
            {hasAward && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50">
                表彰あり
                <button type="button" onClick={() => handleFilterChange({ award: false })}><X className="w-3 h-3 text-amber-400 hover:text-amber-600 ml-1" /></button>
              </span>
            )}
            {hasCertification && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50">
                届出認定あり
                <button type="button" onClick={() => handleFilterChange({ certification: false })}><X className="w-3 h-3 text-amber-400 hover:text-amber-600 ml-1" /></button>
              </span>
            )}
            {hasPatent && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50">
                特許・商標あり
                <button type="button" onClick={() => handleFilterChange({ patent: false })}><X className="w-3 h-3 text-amber-400 hover:text-amber-600 ml-1" /></button>
              </span>
            )}
            {hasFinancials && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50">
                決算・財務情報あり
                <button type="button" onClick={() => handleFilterChange({ financials: false })}><X className="w-3 h-3 text-amber-400 hover:text-amber-600 ml-1" /></button>
              </span>
            )}
            {(minSales !== undefined || maxSales !== undefined) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                売上高: {minSales !== undefined && maxSales !== undefined ? `${minSales}〜${maxSales}億円` : minSales !== undefined ? `${minSales}億円以上` : `${maxSales}億円以下`}
                <button type="button" onClick={() => handleFilterChange({ min_sales: null, max_sales: null })}><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-1" /></button>
              </span>
            )}

            {(minOpIncome !== undefined || maxOpIncome !== undefined) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                営業利益: {minOpIncome !== undefined && maxOpIncome !== undefined ? `${minOpIncome}〜${maxOpIncome}億円` : minOpIncome !== undefined ? `${minOpIncome}億円以上` : `${maxOpIncome}億円以下`}
                <button type="button" onClick={() => handleFilterChange({ min_operating_income: null, max_operating_income: null })}><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-1" /></button>
              </span>
            )}
            {(minOrdIncome !== undefined || maxOrdIncome !== undefined) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                経常利益: {minOrdIncome !== undefined && maxOrdIncome !== undefined ? `${minOrdIncome}〜${maxOrdIncome}億円` : minOrdIncome !== undefined ? `${minOrdIncome}億円以上` : `${maxOrdIncome}億円以下`}
                <button type="button" onClick={() => handleFilterChange({ min_ordinary_income: null, max_ordinary_income: null })}><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-1" /></button>
              </span>
            )}
            {(minNetIncome !== undefined || maxNetIncome !== undefined) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                当期純利益: {minNetIncome !== undefined && maxNetIncome !== undefined ? `${minNetIncome}〜${maxNetIncome}億円` : minNetIncome !== undefined ? `${minNetIncome}億円以上` : `${maxNetIncome}億円以下`}
                <button type="button" onClick={() => handleFilterChange({ min_net_income: null, max_net_income: null })}><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-1" /></button>
              </span>
            )}
            {hasEmail && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Emailあり
                <button type="button" onClick={() => handleFilterChange({ email: false })}><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-1" /></button>
              </span>
            )}
            {hasPhone && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                電話番号あり
                <button type="button" onClick={() => handleFilterChange({ phone: false })}><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-1" /></button>
              </span>
            )}
            {hasWebsite && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Websiteあり
                <button type="button" onClick={() => handleFilterChange({ website: false })}><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-1" /></button>
              </span>
            )}
            {hasFax && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                FAXあり
                <button type="button" onClick={() => handleFilterChange({ fax: false })}><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-1" /></button>
              </span>
            )}
            {companyStatus && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                ステータス: {companyStatus}
                <button type="button" onClick={() => handleFilterChange({ status: null })}><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-1" /></button>
              </span>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 bg-white border border-slate-200/60 dark:bg-[#1C2128] dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <span>
            検索結果: <strong className="text-slate-900 dark:text-white text-sm font-black">{totalCount.toLocaleString()}</strong> 件の企業が見つかりました
          </span>
          <div className="flex items-center gap-4">
            <ExportCSVButton 
              totalCount={totalCount}
              keyword={keyword}
              filters={{
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
                max_net_income: maxNetIncome
              }}
            />
            <span className="hidden sm:inline border-l border-slate-200 dark:border-slate-800 h-4" />
            <span>ページ {page} / {totalPages || 1}</span>
          </div>
        </div>

        {/* Results Grid Cards */}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <SearchSkeletonCard key={i} />
            ))
          ) : companies.length > 0 ? (
            companies.map((company) => (
              <div 
                key={company.corporate_number}
                className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800/80 rounded-2xl p-6 shadow-sm hover:scale-[1.005] hover:-translate-y-1 hover:shadow-xl hover:border-primary/30 dark:hover:border-secondary/30 transition-all duration-300 ease-out"
              >
                {/* Top info and badge */}
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shadow-sm ${
                      company.status === '閉鎖' || company.status === '解散'
                        ? 'text-rose-800 bg-rose-100 dark:bg-rose-950/30 dark:text-rose-450 border-rose-200/50 dark:border-rose-900/50'
                        : 'text-emerald-800 bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/50'
                    }`}>
                      {company.status}
                    </span>
                    {company.prefecture_name && (
                      <span className="text-slate-400 text-xs font-medium flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {company.prefecture_name}
                      </span>
                    )}
                    {company.industries?.filter(ind => ind.classification_level === '大分類').map((ind, idx) => (
                      <span key={idx} className="text-[10px] font-black tracking-wider uppercase text-slate-650 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2.5 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-xs">
                        {ind.industry_code}.{ind.industry_name}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Data freshness trust signal */}
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#B07500] bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-900/40">
                      <Clock className="w-3.5 h-3.5" />
                      {formatShortDate(company.updated_at)}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 font-mono">
                      法人番号: {company.corporate_number}
                    </span>
                  </div>
                </div>

                {/* Company Name */}
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white hover:text-primary dark:hover:text-secondary mb-3 transition-colors">
                  <Link href={`/company/${company.corporate_number}`}>
                    {company.company_name}
                  </Link>
                </h3>



                {/* Matrix Details */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 py-4 border-t border-b border-slate-100 dark:border-slate-850 text-xs">
                  <div className="bg-slate-50/50 dark:bg-[#1e2430]/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850/60 flex flex-col justify-between transition-colors hover:bg-slate-50 dark:hover:bg-[#1e2430]/60">
                    <span className="block text-slate-400 dark:text-slate-500 mb-1 font-medium">資本金</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-extrabold text-sm">
                      {company.capital_amount ? `${(company.capital_amount / 10000).toLocaleString()}万円` : '未登録'}
                    </strong>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-[#1e2430]/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850/60 flex flex-col justify-between transition-colors hover:bg-slate-50 dark:hover:bg-[#1e2430]/60">
                    <span className="block text-slate-400 dark:text-slate-500 mb-1 font-medium">従業員数</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-extrabold text-sm">
                      {company.employee_count ? `${company.employee_count.toLocaleString()}名` : '未登録'}
                    </strong>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-[#1e2430]/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850/60 flex flex-col justify-between transition-colors hover:bg-slate-50 dark:hover:bg-[#1e2430]/60">
                    <span className="block text-slate-400 dark:text-slate-500 mb-1 font-medium">設立年度</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-extrabold text-sm">
                      {company.establishment_date ? `${company.establishment_date.substring(0, 4)}年` : '未登録'}
                    </strong>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-[#1e2430]/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850/60 flex flex-col justify-between transition-colors hover:bg-slate-50 dark:hover:bg-[#1e2430]/60">
                    <span className="block text-slate-400 dark:text-slate-500 mb-1 font-medium">事業種目 (Tags)</span>
                    <div className="flex flex-wrap gap-1 mt-1 max-h-[48px] overflow-y-auto scrollbar-thin">
                      {(() => {
                        const mediumInds = company.industries?.filter(ind => ind.classification_level === '中分類') || [];
                        if (mediumInds.length > 0) {
                          return mediumInds.map((ind, idx) => (
                            <span 
                              key={idx} 
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/60 transition-colors hover:bg-slate-200/60 dark:hover:bg-slate-700/80"
                            >
                              {ind.industry_code}.{ind.industry_name}
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
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/60 transition-colors hover:bg-slate-200/60 dark:hover:bg-slate-700/80"
                            >
                              {tag.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs font-semibold">未登録</span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Contact details */}
                <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-1">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      TEL: {company.phone_number || '未登録'}
                    </span>
                    {company.website_url ? (
                      <a 
                        href={company.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-1.5 text-primary hover:text-primary-hover dark:text-secondary dark:hover:text-secondary-hover transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        Website
                      </a>
                    ) : (
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Globe className="w-3.5 h-3.5" />
                        Website: なし
                      </span>
                    )}

                    {/* Contact Teaser — FAX/Email only shown on detail page */}
                    <ContactTeaserBadge corporateNumber={company.corporate_number} />
                  </div>

                  <Link 
                    href={`/company/${company.corporate_number}`}
                    className="px-4 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 dark:text-slate-300 dark:border-slate-800 dark:hover:border-slate-700 rounded-xl transition-all"
                  >
                    詳細プロフィール →
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h4 className="font-bold text-slate-800 dark:text-white mb-2">該当する企業が見つかりませんでした</h4>
              <p className="text-xs">絞り込み条件uを緩和するか, 別のキーワードでお試しください。</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 py-6">
            {page > 1 ? (
              <button 
                type="button"
                onClick={() => handlePageChange(page - 1)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 flex items-center justify-center dark:bg-[#1C2128] dark:border-slate-800 dark:text-slate-300 dark:hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/50 flex items-center justify-center dark:bg-slate-800/30 dark:border-slate-800 opacity-50 cursor-not-allowed text-slate-400 dark:text-slate-600">
                <ChevronLeft className="w-4 h-4" />
              </div>
            )}

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = page;
              if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              if (pageNum < 1 || pageNum > totalPages) return null;

              const isCurrent = pageNum === page;
              return (
                <button
                  type="button"
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border transition-all ${
                    isCurrent 
                      ? 'bg-primary border-primary text-white shadow-md shadow-primary/10' 
                      : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 dark:bg-[#1C2128] dark:border-slate-800 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {page < totalPages ? (
              <button 
                type="button"
                onClick={() => handlePageChange(page + 1)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 flex items-center justify-center dark:bg-[#1C2128] dark:border-slate-800 dark:text-slate-300 dark:hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/50 flex items-center justify-center dark:bg-slate-800/30 dark:border-slate-800 opacity-50 cursor-not-allowed text-slate-400 dark:text-slate-600">
                <ChevronRight className="w-4 h-4" />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
