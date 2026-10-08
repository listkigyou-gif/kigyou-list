"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, Search, MapPin, X, Phone, Globe, Clock,
  ChevronLeft, ChevronRight, SlidersHorizontal, Lock, ExternalLink, MessageSquare, Send, Mail
} from "lucide-react";
import { formatShortDate } from "@/lib/dateUtils";
import { SearchSidebar } from "@/components/SearchSidebar";
import { ExportCSVButton } from "@/components/ExportCSVButton";
import { FormCampaignModal } from "@/components/FormCampaignModal";
import { FormOutreachRequirementModal, OutreachRequirementType } from "@/components/FormOutreachRequirementModal";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getIndustryName } from "@/lib/locale-mapping";
import { CopyTextButton } from "@/components/CopyTextButton";
import { CompanyLogo } from "@/components/CompanyLogo";

function formatJapaneseCurrency(amount: number | string | null | undefined, locale: string): string {
  if (!amount && amount !== 0) return "";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "";
  
  if (locale === 'en') {
    if (num >= 1_000_000_000_000) return `¥${(num / 1_000_000_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}T JPY`;
    if (num >= 1_000_000_000) return `¥${(num / 1_000_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}B JPY`;
    if (num >= 1_000_000) return `¥${(num / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M JPY`;
    return `¥${num.toLocaleString('en-US')} JPY`;
  }
  if (locale === 'vi') {
    if (num >= 1_000_000_000_000) return `${(num / 1_000_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} nghìn tỷ JPY`;
    if (num >= 100_000_000) return `${(num / 100_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} trăm triệu JPY`;
    if (num >= 10_000) return `${(num / 10_000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} vạn JPY`;
    return `¥${num.toLocaleString('vi-VN')} JPY`;
  }
  // Japanese
  if (num >= 1_000_000_000_000) {
    return `${(num / 1_000_000_000_000).toLocaleString('ja-JP', { maximumFractionDigits: 1 })}兆円`;
  }
  if (num >= 100_000_000) {
    return `${(num / 100_000_000).toLocaleString('ja-JP', { maximumFractionDigits: 1 })}億円`;
  }
  if (num >= 10_000) {
    return `${(num / 10_000).toLocaleString('ja-JP', { maximumFractionDigits: 0 })}万円`;
  }
  return `¥${num.toLocaleString('ja-JP')}`;
}

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
  has_financials?: boolean;
  logo_url?: string | null;
  contact_form_url?: string | null;
  has_contact_form?: boolean;
  has_email?: boolean;
  email_type?: string | null;
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
    hasContactForm?: boolean;
    emailType?: string;
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
    <div className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xs animate-skeleton">
      <div className="flex flex-row gap-3.5 sm:gap-4 items-start mb-3">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-250 dark:bg-slate-700 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-14 h-5 bg-slate-250 dark:bg-slate-700 rounded-full" />
              <div className="w-20 h-5 bg-slate-250 dark:bg-slate-700 rounded-full" />
              <div className="w-24 h-5 bg-slate-250 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-5 bg-slate-250 dark:bg-slate-700 rounded-full" />
              <div className="w-28 h-5 bg-slate-250 dark:bg-slate-700 rounded-full" />
            </div>
          </div>
          <div className="w-2/3 h-6 bg-slate-250 dark:bg-slate-700 rounded-md" />
        </div>
      </div>
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



export const SearchClientContainer: React.FC<SearchClientContainerProps> = ({
  initialCompanies,
  initialTotalCount,
  initialCities,
  prefectures,
  industries,
  initialFilters
}) => {
  const { locale, t } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const [formCredits, setFormCredits] = useState<number | null>(null);

  // 1. Local States
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount);
  const [cities, setCities] = useState(initialCities);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isFormCampaignModalOpen, setIsFormCampaignModalOpen] = useState(false);
  const [requirementModalType, setRequirementModalType] = useState<OutreachRequirementType | null>(null);

  const isProOrHigher = Boolean(user && (user.role === 'pro' || user.role === 'business' || user.role === 'enterprise' || user.role === 'admin'));

  const handleOpenFormCampaign = () => {
    if (!isProOrHigher) {
      setRequirementModalType("PRO_REQUIRED");
      return;
    }
    if (!hasContactForm) {
      setRequirementModalType("CONTACT_FORM_REQUIRED");
      return;
    }
    setIsFormCampaignModalOpen(true);
  };

  const handleApplyContactFilterAndProceed = () => {
    setRequirementModalType(null);
    handleFilterChange({ contact_form: true }, true);
    setIsFormCampaignModalOpen(true);
  };

  // Fetch user form outreach credits
  useEffect(() => {
    if (isLoggedIn) {
      fetch("/api/user/form-credits")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.credits && typeof data.credits.balance === "number") {
            setFormCredits(data.credits.balance);
          }
        })
        .catch((err) => console.error("Failed to load form credits:", err));
    } else {
      setFormCredits(null);
    }
  }, [isLoggedIn, isFormCampaignModalOpen]);
  
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
  const [hasContactForm, setHasContactForm] = useState(!!initialFilters.hasContactForm);
  const [emailType, setEmailType] = useState(initialFilters.emailType);
  const [companyStatus, setCompanyStatus] = useState(initialFilters.companyStatus);
  const [minOpIncome, setMinOpIncome] = useState(initialFilters.minOpIncome);
  const [maxOpIncome, setMaxOpIncome] = useState(initialFilters.maxOpIncome);
  const [minOrdIncome, setMinOrdIncome] = useState(initialFilters.minOrdIncome);
  const [maxOrdIncome, setMaxOrdIncome] = useState(initialFilters.maxOrdIncome);
  const [minNetIncome, setMinNetIncome] = useState(initialFilters.minNetIncome);
  const [maxNetIncome, setMaxNetIncome] = useState(initialFilters.maxNetIncome);
  const [page, setPage] = useState(initialFilters.page || 1);
  
  const resultsTopRef = useRef<HTMLDivElement>(null);
  const searchCacheRef = useRef<Map<string, { companies: Company[]; totalCount: number; cities?: any[] }>>(new Map());
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const limit = 15;
  const totalPages = Math.ceil(totalCount / limit);

  // Background next-page prefetcher for 0ms page turns
  const prefetchNextPage = (apiParams: URLSearchParams, currentPage: number, currentTotal: number) => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }
    const maxPages = Math.ceil(currentTotal / limit);
    if (currentPage >= maxPages) return;

    const nextParams = new URLSearchParams(apiParams);
    nextParams.set("offset", String(currentPage * limit));
    nextParams.set("limit", String(limit));
    const nextKey = nextParams.toString();

    if (searchCacheRef.current.has(nextKey)) return;

    prefetchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?${nextKey}`);
        if (res.ok) {
          const data = await res.json();
          searchCacheRef.current.set(nextKey, {
            companies: data.companies,
            totalCount: data.totalCount,
            cities: data.cities,
          });
        }
      } catch (e) {
        // Silently fail prefetch in background
      }
    }, 600);
  };

  // Seed the in-memory cache with the initial SSR results and prefetch next page
  useEffect(() => {
    const initialParams = new URLSearchParams();
    if (initialFilters.keyword) initialParams.set("q", initialFilters.keyword);
    if (initialFilters.prefCode) initialParams.set("prefecture", initialFilters.prefCode);
    if (initialFilters.city) initialParams.set("city", initialFilters.city);
    if (initialFilters.indCode) initialParams.set("industry", initialFilters.indCode);
    if (initialFilters.minEmp != null) initialParams.set("min_employees", String(initialFilters.minEmp));
    if (initialFilters.maxEmp != null) initialParams.set("max_employees", String(initialFilters.maxEmp));
    if (initialFilters.minCap != null) initialParams.set("min_capital", String(initialFilters.minCap));
    if (initialFilters.maxCap != null) initialParams.set("max_capital", String(initialFilters.maxCap));
    if (initialFilters.hasHiring) initialParams.set("hiring", "true");
    if (initialFilters.hasSubsidy) initialParams.set("subsidy", "true");
    if (initialFilters.hasBidding) initialParams.set("bidding", "true");
    if (initialFilters.minEstYear != null) initialParams.set("min_establishment_year", String(initialFilters.minEstYear));
    if (initialFilters.maxEstYear != null) initialParams.set("max_establishment_year", String(initialFilters.maxEstYear));
    if (initialFilters.hasAward) initialParams.set("award", "true");
    if (initialFilters.hasCertification) initialParams.set("certification", "true");
    if (initialFilters.hasPatent) initialParams.set("patent", "true");
    if (initialFilters.hasFinancials) initialParams.set("financials", "true");
    if (initialFilters.minSales != null) initialParams.set("min_sales", String(initialFilters.minSales));
    if (initialFilters.maxSales != null) initialParams.set("max_sales", String(initialFilters.maxSales));
    if (initialFilters.hasEmail) initialParams.set("email", "true");
    if (initialFilters.hasPhone) initialParams.set("phone", "true");
    if (initialFilters.hasWebsite) initialParams.set("website", "true");
    if (initialFilters.hasFax) initialParams.set("fax", "true");
    if (initialFilters.hasContactForm) initialParams.set("contact_form", "true");
    if (initialFilters.emailType) initialParams.set("email_type", initialFilters.emailType);
    if (initialFilters.companyStatus) initialParams.set("status", initialFilters.companyStatus);
    if (initialFilters.minOpIncome != null) initialParams.set("min_operating_income", String(initialFilters.minOpIncome));
    if (initialFilters.maxOpIncome != null) initialParams.set("max_operating_income", String(initialFilters.maxOpIncome));
    if (initialFilters.minOrdIncome != null) initialParams.set("min_ordinary_income", String(initialFilters.minOrdIncome));
    if (initialFilters.maxOrdIncome != null) initialParams.set("max_ordinary_income", String(initialFilters.maxOrdIncome));
    if (initialFilters.minNetIncome != null) initialParams.set("min_net_income", String(initialFilters.minNetIncome));
    if (initialFilters.maxNetIncome != null) initialParams.set("max_net_income", String(initialFilters.maxNetIncome));
    const initPage = initialFilters.page || 1;
    initialParams.set("offset", String((initPage - 1) * limit));
    initialParams.set("limit", String(limit));

    searchCacheRef.current.set(initialParams.toString(), {
      companies: initialCompanies,
      totalCount: initialTotalCount,
      cities: initialCities,
    });

    // Prefetch page 2 in background if more pages exist
    prefetchNextPage(initialParams, initPage, initialTotalCount);
  }, []);

  // 2. Fetch function that coordinates with current states and memory cache
  const executeSearch = async (overrides: Record<string, any> = {}) => {
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
    const newHasContactForm = overrides.hasContactForm !== undefined ? overrides.hasContactForm : hasContactForm;
    const newEmailType = overrides.emailType !== undefined ? overrides.emailType : emailType;
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
    if (newHasContactForm) apiParams.set("contact_form", "true");
    if (newEmailType) apiParams.set("email_type", newEmailType);
    if (newCompanyStatus) apiParams.set("status", newCompanyStatus);
    if (newMinOpIncome != null) apiParams.set("min_operating_income", String(newMinOpIncome));
    if (newMaxOpIncome != null) apiParams.set("max_operating_income", String(newMaxOpIncome));
    if (newMinOrdIncome != null) apiParams.set("min_ordinary_income", String(newMinOrdIncome));
    if (newMaxOrdIncome != null) apiParams.set("max_ordinary_income", String(newMaxOrdIncome));
    if (newMinNetIncome != null) apiParams.set("min_net_income", String(newMinNetIncome));
    if (newMaxNetIncome != null) apiParams.set("max_net_income", String(newMaxNetIncome));
    
    // Use standard offset pagination
    apiParams.set("offset", String(offset));
    apiParams.set("limit", String(limit));

    const cacheKey = apiParams.toString();

    // Check client-side in-memory cache first for INSTANT 0ms response
    if (searchCacheRef.current.has(cacheKey)) {
      const cached = searchCacheRef.current.get(cacheKey)!;
      setCompanies(cached.companies);
      setTotalCount(cached.totalCount);
      if (overrides.prefCode !== undefined) {
        setCities(cached.cities || []);
      }
      setIsLoading(false);

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
      if (newHasContactForm) browserParams.set("contact_form", "true");
      if (newEmailType) browserParams.set("email_type", newEmailType);
      if (newCompanyStatus) browserParams.set("status", newCompanyStatus);
      if (newMinOpIncome != null) browserParams.set("min_operating_income", String(newMinOpIncome));
      if (newMaxOpIncome != null) browserParams.set("max_operating_income", String(newMaxOpIncome));
      if (newMinOrdIncome != null) browserParams.set("min_ordinary_income", String(newMinOrdIncome));
      if (newMaxOrdIncome != null) browserParams.set("max_ordinary_income", String(newMaxOrdIncome));
      if (newMinNetIncome != null) browserParams.set("min_net_income", String(newMinNetIncome));
      if (newMaxNetIncome != null) browserParams.set("max_net_income", String(newMaxNetIncome));
      if (newPage > 1) browserParams.set("page", String(newPage));
      
      const newUrl = browserParams.toString() ? `/${locale}/search?${browserParams.toString()}` : `/${locale}/search`;
      window.history.replaceState(window.history.state, "", newUrl);

      if (resultsTopRef.current) {
        resultsTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      prefetchNextPage(apiParams, newPage, cached.totalCount);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/search?${cacheKey}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      
      // Store in LRU cache (limit to 50 items)
      searchCacheRef.current.set(cacheKey, {
        companies: data.companies,
        totalCount: data.totalCount,
        cities: data.cities,
      });
      if (searchCacheRef.current.size > 50) {
        const oldestKey = searchCacheRef.current.keys().next().value;
        if (oldestKey) searchCacheRef.current.delete(oldestKey);
      }

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
      if (newHasContactForm) browserParams.set("contact_form", "true");
      if (newEmailType) browserParams.set("email_type", newEmailType);
      if (newCompanyStatus) browserParams.set("status", newCompanyStatus);
      if (newMinOpIncome != null) browserParams.set("min_operating_income", String(newMinOpIncome));
      if (newMaxOpIncome != null) browserParams.set("max_operating_income", String(newMaxOpIncome));
      if (newMinOrdIncome != null) browserParams.set("min_ordinary_income", String(newMinOrdIncome));
      if (newMaxOrdIncome != null) browserParams.set("max_ordinary_income", String(newMaxOrdIncome));
      if (newMinNetIncome != null) browserParams.set("min_net_income", String(newMinNetIncome));
      if (newMaxNetIncome != null) browserParams.set("max_net_income", String(newMaxNetIncome));
      if (newPage > 1) browserParams.set("page", String(newPage));
      
      const newUrl = browserParams.toString() ? `/${locale}/search?${browserParams.toString()}` : `/${locale}/search`;
      window.history.replaceState(window.history.state, "", newUrl);

      // Scroll to search results on desktop/mobile
      if (resultsTopRef.current) {
        resultsTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      // Prefetch next page in background
      prefetchNextPage(apiParams, newPage, data.totalCount);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Callback handlers for Sidebar and inputs
  const handleFilterChange = async (updates: Record<string, any>, autoExecute: boolean = false) => {
    // Determine and update individual states
    
    if (updates.keyword !== undefined) {
      setKeyword(updates.keyword || "");
    }
    if (updates.prefecture !== undefined) {
      const newPref = updates.prefecture || undefined;
      setPrefCode(newPref);
      // Reset city filter when prefecture changes
      setCity(undefined);
      
      // Fetch cities dynamically without triggering a full search
      if (newPref) {
        try {
          const res = await fetch(`/api/metadata/cities?prefecture=${newPref}`);
          if (res.ok) {
            const data = await res.json();
            setCities(data);
          }
        } catch (e) {
          console.error("Error fetching cities", e);
        }
      } else {
        setCities([]);
      }
    }
    if (updates.city !== undefined) {
      setCity(updates.city || undefined);
    }
    if (updates.industry !== undefined) {
      setIndCode(updates.industry || undefined);
    }
    if (updates.min_employees !== undefined) {
      setMinEmp(updates.min_employees ? parseInt(updates.min_employees, 10) : undefined);
    }
    if (updates.max_employees !== undefined) {
      setMaxEmp(updates.max_employees ? parseInt(updates.max_employees, 10) : undefined);
    }
    if (updates.min_capital !== undefined) {
      setMinCap(updates.min_capital ? parseFloat(updates.min_capital) : undefined);
    }
    if (updates.max_capital !== undefined) {
      setMaxCap(updates.max_capital ? parseFloat(updates.max_capital) : undefined);
    }
    if (updates.hiring !== undefined) {
      setHasHiring(!!updates.hiring);
    }
    if (updates.subsidy !== undefined) {
      setHasSubsidy(!!updates.subsidy);
    }
    if (updates.bidding !== undefined) {
      setHasBidding(!!updates.bidding);
    }
    if (updates.min_establishment_year !== undefined) {
      setMinEstYear(updates.min_establishment_year ? parseInt(updates.min_establishment_year, 10) : undefined);
    }
    if (updates.max_establishment_year !== undefined) {
      setMaxEstYear(updates.max_establishment_year ? parseInt(updates.max_establishment_year, 10) : undefined);
    }
    if (updates.award !== undefined) {
      setHasAward(!!updates.award);
    }
    if (updates.certification !== undefined) {
      setHasCertification(!!updates.certification);
    }
    if (updates.patent !== undefined) {
      setHasPatent(!!updates.patent);
    }
    if (updates.financials !== undefined) {
      setHasFinancials(!!updates.financials);
    }
    if (updates.min_sales !== undefined) {
      setMinSales(updates.min_sales ? parseFloat(updates.min_sales) : undefined);
    }
    if (updates.max_sales !== undefined) {
      setMaxSales(updates.max_sales ? parseFloat(updates.max_sales) : undefined);
    }
    if (updates.email !== undefined) {
      setHasEmail(!!updates.email);
    }
    if (updates.phone !== undefined) {
      setHasPhone(!!updates.phone);
    }
    if (updates.website !== undefined) {
      setHasWebsite(!!updates.website);
    }
    if (updates.fax !== undefined) {
      setHasFax(!!updates.fax);
    }
    if (updates.contact_form !== undefined) {
      setHasContactForm(!!updates.contact_form);
    }
    if (updates.email_type !== undefined) {
      setEmailType(updates.email_type || undefined);
    }
    if (updates.status !== undefined) {
      setCompanyStatus(updates.status || undefined);
    }
    if (updates.min_operating_income !== undefined) {
      setMinOpIncome(updates.min_operating_income ? parseFloat(updates.min_operating_income) : undefined);
    }
    if (updates.max_operating_income !== undefined) {
      setMaxOpIncome(updates.max_operating_income ? parseFloat(updates.max_operating_income) : undefined);
    }
    if (updates.min_ordinary_income !== undefined) {
      setMinOrdIncome(updates.min_ordinary_income ? parseFloat(updates.min_ordinary_income) : undefined);
    }
    if (updates.max_ordinary_income !== undefined) {
      setMaxOrdIncome(updates.max_ordinary_income ? parseFloat(updates.max_ordinary_income) : undefined);
    }
    if (updates.min_net_income !== undefined) {
      setMinNetIncome(updates.min_net_income ? parseFloat(updates.min_net_income) : undefined);
    }
    if (updates.max_net_income !== undefined) {
      setMaxNetIncome(updates.max_net_income ? parseFloat(updates.max_net_income) : undefined);
    }

    // Always reset to page 1 on filter changes
    setPage(1);

    if (autoExecute) {
      const overrides: Record<string, any> = { page: 1, forceOffset: true };
      if (updates.keyword !== undefined) overrides.keyword = updates.keyword || "";
      if (updates.prefecture !== undefined) {
        overrides.prefCode = updates.prefecture || undefined;
        overrides.city = undefined;
      }
      if (updates.city !== undefined) overrides.city = updates.city || undefined;
      if (updates.industry !== undefined) overrides.indCode = updates.industry || undefined;
      if (updates.min_employees !== undefined) overrides.minEmp = updates.min_employees ? parseInt(updates.min_employees, 10) : undefined;
      if (updates.max_employees !== undefined) overrides.maxEmp = updates.max_employees ? parseInt(updates.max_employees, 10) : undefined;
      if (updates.min_capital !== undefined) overrides.minCap = updates.min_capital ? parseFloat(updates.min_capital) : undefined;
      if (updates.max_capital !== undefined) overrides.maxCap = updates.max_capital ? parseFloat(updates.max_capital) : undefined;
      if (updates.hiring !== undefined) overrides.hasHiring = !!updates.hiring;
      if (updates.subsidy !== undefined) overrides.hasSubsidy = !!updates.subsidy;
      if (updates.bidding !== undefined) overrides.hasBidding = !!updates.bidding;
      if (updates.min_establishment_year !== undefined) overrides.minEstYear = updates.min_establishment_year ? parseInt(updates.min_establishment_year, 10) : undefined;
      if (updates.max_establishment_year !== undefined) overrides.maxEstYear = updates.max_establishment_year ? parseInt(updates.max_establishment_year, 10) : undefined;
      if (updates.award !== undefined) overrides.hasAward = !!updates.award;
      if (updates.certification !== undefined) overrides.hasCertification = !!updates.certification;
      if (updates.patent !== undefined) overrides.hasPatent = !!updates.patent;
      if (updates.financials !== undefined) overrides.hasFinancials = !!updates.financials;
      if (updates.min_sales !== undefined) overrides.minSales = updates.min_sales ? parseFloat(updates.min_sales) : undefined;
      if (updates.max_sales !== undefined) overrides.maxSales = updates.max_sales ? parseFloat(updates.max_sales) : undefined;
      if (updates.email !== undefined) overrides.hasEmail = !!updates.email;
      if (updates.phone !== undefined) overrides.hasPhone = !!updates.phone;
      if (updates.website !== undefined) overrides.hasWebsite = !!updates.website;
      if (updates.fax !== undefined) overrides.hasFax = !!updates.fax;
      if (updates.contact_form !== undefined) overrides.hasContactForm = !!updates.contact_form;
      if (updates.email_type !== undefined) overrides.emailType = updates.email_type || undefined;
      if (updates.status !== undefined) overrides.companyStatus = updates.status || undefined;
      if (updates.min_operating_income !== undefined) overrides.minOpIncome = updates.min_operating_income ? parseFloat(updates.min_operating_income) : undefined;
      if (updates.max_operating_income !== undefined) overrides.maxOpIncome = updates.max_operating_income ? parseFloat(updates.max_operating_income) : undefined;
      if (updates.min_ordinary_income !== undefined) overrides.minOrdIncome = updates.min_ordinary_income ? parseFloat(updates.min_ordinary_income) : undefined;
      if (updates.max_ordinary_income !== undefined) overrides.maxOrdIncome = updates.max_ordinary_income ? parseFloat(updates.max_ordinary_income) : undefined;
      if (updates.min_net_income !== undefined) overrides.minNetIncome = updates.min_net_income ? parseFloat(updates.min_net_income) : undefined;
      if (updates.max_net_income !== undefined) overrides.maxNetIncome = updates.max_net_income ? parseFloat(updates.max_net_income) : undefined;

      executeSearch(overrides);
    }
  };

  const handleApplyFilters = () => {
    setPage(1);
    executeSearch({ page: 1, forceOffset: true });
    if (isMobileDrawerOpen) {
      setIsMobileDrawerOpen(false);
    }
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

  const getEmployeesChipText = () => {
    if (minEmp !== undefined && maxEmp !== undefined) {
      return t.search.employeesRange.replace('{min}', String(minEmp)).replace('{max}', String(maxEmp));
    }
    if (minEmp !== undefined) {
      return `${minEmp.toLocaleString()}${t.search.minEmployeesSuffix || '名以上'}`;
    }
    return `${maxEmp ? maxEmp.toLocaleString() : ''}${t.search.maxEmployeesSuffix || '名以下'}`;
  };

  const getCapitalChipText = () => {
    const displayMin = (locale === 'en' || locale === 'vi') && minCap !== undefined ? minCap / 100 : minCap;
    const displayMax = (locale === 'en' || locale === 'vi') && maxCap !== undefined ? maxCap / 100 : maxCap;
    if (displayMin !== undefined && displayMax !== undefined) {
      return t.search.capitalRange.replace('{min}', String(displayMin)).replace('{max}', String(displayMax));
    }
    if (displayMin !== undefined) {
      return `${displayMin.toLocaleString()}${t.search.minCapitalSuffix || '万円以上'}`;
    }
    return `${displayMax ? displayMax.toLocaleString() : ''}${t.search.maxCapitalSuffix || '万円以下'}`;
  };

  const getSalesChipText = (min: number | undefined, max: number | undefined, rangeKey: string, minSuffixKey: string, maxSuffixKey: string) => {
    const displayMin = (locale === 'en' || locale === 'vi') && min !== undefined ? min * 100 : min;
    const displayMax = (locale === 'en' || locale === 'vi') && max !== undefined ? max * 100 : max;
    const tRange = (t.search as any)[rangeKey];
    const tMinSuffix = (t.search as any)[minSuffixKey];
    const tMaxSuffix = (t.search as any)[maxSuffixKey];

    if (displayMin !== undefined && displayMax !== undefined) {
      return tRange.replace('{min}', String(displayMin)).replace('{max}', String(displayMax));
    }
    if (displayMin !== undefined) {
      return `${displayMin.toLocaleString()}${tMinSuffix}`;
    }
    return `${displayMax ? displayMax.toLocaleString() : ''}${tMaxSuffix}`;
  };

  const getEstYearChipText = () => {
    if (minEstYear !== undefined && maxEstYear !== undefined) {
      return t.search.estYearRange.replace('{min}', String(minEstYear)).replace('{max}', String(maxEstYear));
    }
    if (minEstYear !== undefined) {
      return `${minEstYear}${t.search.minEstYearSuffix || '年以上'}`;
    }
    return `${maxEstYear}${t.search.maxEstYearSuffix || '年以下'}`;
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
          <span className="font-extrabold text-sm text-slate-800 dark:text-white">{t.search.mobileFilterBtn}</span>
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
            hasContactForm={hasContactForm}
            emailType={emailType}
            companyStatus={companyStatus}
            minOpIncome={minOpIncome}
            maxOpIncome={maxOpIncome}
            minOrdIncome={minOrdIncome}
            maxOrdIncome={maxOrdIncome}
            minNetIncome={minNetIncome}
            maxNetIncome={maxNetIncome}
            onFilterChange={handleFilterChange}
            onApplyFilters={handleApplyFilters}
            onCloseMobile={() => setIsMobileDrawerOpen(false)}
          />
        </div>
      </div>

      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-24">
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
            hasContactForm={hasContactForm}
            emailType={emailType}
            companyStatus={companyStatus}
            minOpIncome={minOpIncome}
            maxOpIncome={maxOpIncome}
            minOrdIncome={minOrdIncome}
            maxOrdIncome={maxOrdIncome}
            minNetIncome={minNetIncome}
            maxNetIncome={maxNetIncome}
            onFilterChange={handleFilterChange}
            onApplyFilters={handleApplyFilters}
          />
        </div>
      </div>

      {/* Main Results Column */}
      <main ref={resultsTopRef} className="flex-1 min-w-0 flex flex-col gap-6 relative">
        {/* Top Search Input Bar */}
        <div className="bg-white border border-slate-200/90 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
              {t.search.mobileFilterBtn}
            </button>
            <form onSubmit={handleKeywordSearch} className="flex-1 relative flex items-center bg-slate-50 border border-slate-200/90 rounded-xl dark:bg-slate-800 dark:border-slate-700 focus-within:ring-2 focus-within:ring-[#1B4F8A]/20 focus-within:border-[#1B4F8A] transition-all">
              <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                name="q"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={locale === 'vi' ? "Tên công ty hoặc Mã số doanh nghiệp (13 số)" : locale === 'en' ? "Company Name or Corporate Number (13 digits)" : "企業名または法人番号（13桁）で検索"}
                className="flex-1 min-w-0 px-3 py-2.5 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white"
              />
              <button
                type="submit"
                className="px-5 py-2 mr-1 text-xs font-semibold text-white bg-[#1B4F8A] hover:bg-[#163e6d] rounded-lg shadow-xs transition-colors shrink-0"
              >
                {t.home.searchBtn}
              </button>
            </form>
          </div>

          {/* Active Filters Summary */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {keyword && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                {t.search.keywordLabel}: {keyword}
                <button type="button" onClick={() => handleFilterChange({ keyword: "" }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
              </span>
            )}
            {prefCode && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                {t.search.areaLabel}: {(() => {
                  const prefName = prefectures.find(p => p.code === prefCode)?.name || prefCode;
                  return (t.prefectures as Record<string, string>)?.[prefName] || prefName;
                })()}
                <button type="button" onClick={() => handleFilterChange({ prefecture: null }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
              </span>
            )}
            {city && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                {t.search.cityLabel}: {city}
                <button type="button" onClick={() => handleFilterChange({ city: null }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
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
              const displayIndustryName = (t.majorIndustries as Record<string, string>)?.[indCode] || selectedIndustryName;
              return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                  {t.search.industryLabel}: {displayIndustryName}
                  <button type="button" onClick={() => handleFilterChange({ industry: null }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
                </span>
              );
            })()}
            {(minEmp !== undefined || maxEmp !== undefined) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                {t.search.employees}: {getEmployeesChipText()}
                <button type="button" onClick={() => handleFilterChange({ min_employees: null, max_employees: null }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
              </span>
            )}
            {(minCap !== undefined || maxCap !== undefined) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                {t.search.capital}: {getCapitalChipText()}
                <button type="button" onClick={() => handleFilterChange({ min_capital: null, max_capital: null }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
              </span>
            )}
            {hasHiring && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                {t.search.hiring}
                <button type="button" onClick={() => handleFilterChange({ hiring: false }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
              </span>
            )}
            {hasSubsidy && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                {t.search.subsidy}
                <button type="button" onClick={() => handleFilterChange({ subsidy: false }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
              </span>
            )}
            {hasBidding && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                {t.search.bidding}
                <button type="button" onClick={() => handleFilterChange({ bidding: false }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
              </span>
            )}
            {(minEstYear !== undefined || maxEstYear !== undefined) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                {t.search.establishmentYear}: {getEstYearChipText()}
                <button type="button" onClick={() => handleFilterChange({ min_establishment_year: null, max_establishment_year: null }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
              </span>
            )}
            {hasAward && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                {t.search.award}
                <button type="button" onClick={() => handleFilterChange({ award: false }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
              </span>
            )}
            {hasCertification && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                {t.search.certification}
                <button type="button" onClick={() => handleFilterChange({ certification: false }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
              </span>
            )}
            {hasPatent && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                {t.search.patent}
                <button type="button" onClick={() => handleFilterChange({ patent: false }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
              </span>
            )}
            {hasFinancials && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                {t.search.hasFinancials}
                <button type="button" onClick={() => handleFilterChange({ financials: false }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
              </span>
            )}
            {(minSales !== undefined || maxSales !== undefined) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                {t.search.sales}: {getSalesChipText(minSales, maxSales, 'salesRange', 'minSalesSuffix', 'maxSalesSuffix')}
                <button type="button" onClick={() => handleFilterChange({ min_sales: null, max_sales: null }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
              </span>
            )}

            {(minOpIncome !== undefined || maxOpIncome !== undefined) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                {t.search.operatingIncome}: {getSalesChipText(minOpIncome, maxOpIncome, 'salesRange', 'minSalesSuffix', 'maxSalesSuffix')}
                <button type="button" onClick={() => handleFilterChange({ min_operating_income: null, max_operating_income: null }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
              </span>
            )}
            {(minOrdIncome !== undefined || maxOrdIncome !== undefined) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                {t.search.ordinaryIncome}: {getSalesChipText(minOrdIncome, maxOrdIncome, 'salesRange', 'minSalesSuffix', 'maxSalesSuffix')}
                <button type="button" onClick={() => handleFilterChange({ min_ordinary_income: null, max_ordinary_income: null }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
              </span>
            )}
            {(minNetIncome !== undefined || maxNetIncome !== undefined) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                {t.search.netIncome}: {getSalesChipText(minNetIncome, maxNetIncome, 'salesRange', 'minSalesSuffix', 'maxSalesSuffix')}
                <button type="button" onClick={() => handleFilterChange({ min_net_income: null, max_net_income: null }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
              </span>
            )}
            {hasEmail && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                {t.search.emailLabel}
                <button type="button" onClick={() => handleFilterChange({ email: false, email_type: null }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
              </span>
            )}
            {hasPhone && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                {t.search.phoneLabel}
                <button type="button" onClick={() => handleFilterChange({ phone: false }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
              </span>
            )}
            {hasWebsite && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                {t.search.websiteLabel}
                <button type="button" onClick={() => handleFilterChange({ website: false }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
              </span>
            )}
            {hasFax && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                {t.search.faxLabel}
                <button type="button" onClick={() => handleFilterChange({ fax: false }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
              </span>
            )}
            {hasContactForm && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800 text-xs font-semibold shadow-2xs">
                <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-black tracking-wide">FORM</span>
                <span>{locale === 'en' ? 'Contact Form' : locale === 'vi' ? 'Biểu mẫu liên hệ' : 'お問い合わせフォーム'}</span>
                <button type="button" onClick={() => handleFilterChange({ contact_form: false }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-emerald-700 dark:text-emerald-400 ml-0.5" /></button>
              </span>
            )}
            {emailType && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                {locale === 'en' ? 'Email:' : locale === 'vi' ? 'Loại Email:' : 'Email種別:'} {
                  emailType === 'RECRUIT' ? (locale === 'en' ? 'Recruiting' : locale === 'vi' ? 'Tuyển dụng' : '採用') :
                  emailType === 'PR' ? (locale === 'en' ? 'PR' : locale === 'vi' ? 'Truyền thông/PR' : '広報・PR') :
                  emailType === 'SALES' ? (locale === 'en' ? 'Sales' : locale === 'vi' ? 'Kinh doanh' : '営業') :
                  (locale === 'en' ? 'General' : locale === 'vi' ? 'Chung' : '代表・総合')
                }
                <button type="button" onClick={() => handleFilterChange({ email_type: null }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
              </span>
            )}
            {companyStatus && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium">
                {t.search.statusLabel}: {
                  companyStatus === '活動中' ? (locale === 'en' ? 'Active' : locale === 'vi' ? 'Đang hoạt động' : '活動中') :
                  companyStatus === '閉鎖' ? (locale === 'en' ? 'Closed' : locale === 'vi' ? 'Đã đóng cửa' : '閉鎖') :
                  companyStatus === '解散' ? (locale === 'en' ? 'Dissolved' : locale === 'vi' ? 'Đã giải thể' : '解散') :
                  companyStatus
                }
                <button type="button" onClick={() => handleFilterChange({ status: null }, true)} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-0.5" /></button>
              </span>
            )}
            {/* Clear All active chips button */}
            <button
              type="button"
              onClick={() => handleFilterChange({
                prefecture: null,
                city: null,
                industry: null,
                min_employees: null,
                max_employees: null,
                min_capital: null,
                max_capital: null,
                hiring: false,
                subsidy: false,
                bidding: false,
                min_establishment_year: null,
                max_establishment_year: null,
                award: false,
                certification: false,
                patent: false,
                financials: false,
                min_sales: null,
                max_sales: null,
                email: false,
                phone: false,
                website: false,
                fax: false,
                contact_form: false,
                email_type: null,
                status: null,
                min_operating_income: null,
                max_operating_income: null,
                min_ordinary_income: null,
                max_ordinary_income: null,
                min_net_income: null,
                max_net_income: null,
                keyword: "",
              }, true)}
              className="text-xs font-semibold text-slate-400 hover:text-[#1B4F8A] dark:hover:text-blue-400 ml-1 py-1 transition-colors cursor-pointer"
            >
              {t.search.clear}
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 bg-white border border-slate-200/90 dark:bg-[#161B22] dark:border-slate-800 p-3.5 sm:p-4 rounded-xl shadow-2xs">
          <span>
            {totalCount > 0 ? (
              t.search.companiesFound.replace("{count}", totalCount.toLocaleString())
            ) : (
              t.search.companiesFoundZero
            )}
          </span>
          <div className="flex flex-wrap items-start gap-3 sm:gap-4">
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
                has_contact_form: hasContactForm,
                email_type: emailType,
                company_status: companyStatus,
                min_operating_income: minOpIncome,
                max_operating_income: maxOpIncome,
                min_ordinary_income: minOrdIncome,
                max_ordinary_income: maxOrdIncome,
                min_net_income: minNetIncome,
                max_net_income: maxNetIncome
              }}
            />
            <div className="relative flex flex-col items-end">
              <button
                type="button"
                onClick={handleOpenFormCampaign}
                className={`px-3.5 py-2 text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-[0.98] ${
                  !isProOrHigher 
                    ? "text-slate-300 bg-slate-700 hover:bg-slate-650 border border-slate-600" 
                    : !hasContactForm
                    ? "text-white bg-[#1B4F8A] hover:bg-[#143D6C] border border-[#143D6C] ring-2 ring-amber-400/50"
                    : "text-white bg-[#1B4F8A] hover:bg-[#143D6C] border border-[#143D6C]"
                }`}
                title={
                  !isProOrHigher
                    ? (locale === 'ja' 
                        ? "【Proプラン以上限定】フォーム営業を利用するにはProプランへのアップグレードと「お問い合わせフォーム」絞り込みが必要です" 
                        : locale === 'vi' 
                        ? "【Yêu cầu gói PRO】Cần nâng cấp lên gói PRO và lọc 'Biểu mẫu liên hệ' để dùng tính năng này" 
                        : "【PRO Plan Required】Upgrade to PRO and filter by 'Contact Form' to use automated outreach")
                    : !hasContactForm
                    ? (locale === 'ja'
                        ? "【条件必須】「連絡先情報の有無 ＞ お問い合わせフォーム」の絞り込みが必要です"
                        : locale === 'vi'
                        ? "【Điều kiện bắt buộc】Vui lòng tích chọn bộ lọc 'Biểu mẫu liên hệ'"
                        : "【Required Filter】Please check 'Contact Form' under Contact Presence")
                    : (locale === 'ja' 
                        ? "抽出したこのターゲットリストへフォーム営業を自動配信（セルフ型）" 
                        : locale === 'vi' 
                        ? "Tự tạo chiến dịch gửi Form tự động theo danh sách đã lọc" 
                        : "Automated Form Outreach to this filtered list (Self-serve)")
                }
              >
                {!isProOrHigher ? (
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{locale === 'ja' ? 'この条件でフォーム営業 (自動配信)' : locale === 'vi' ? 'Gửi Form tự động (Self-serve)' : 'Automated Form Outreach'}</span>
                {!isProOrHigher ? (
                  <span className="text-[9px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.2 rounded uppercase flex items-center gap-0.5">
                    PRO
                  </span>
                ) : !hasContactForm ? (
                  <span className="text-[9px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.2 rounded uppercase">
                    {locale === 'ja' ? '要条件' : locale === 'vi' ? 'CẦN LỌC' : 'REQ'}
                  </span>
                ) : (
                  <span className="text-[9px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.2 rounded uppercase">NEW</span>
                )}
              </button>
              {isLoggedIn && formCredits !== null && (
                <span className="text-[10px] mt-1 text-slate-400 dark:text-slate-500">
                  {locale === 'ja' ? (
                    <>送信残高: <strong className="text-slate-600 dark:text-slate-300 font-bold">{formCredits.toLocaleString()}</strong> 件</>
                  ) : locale === 'vi' ? (
                    <>Hạn ngạch: <strong className="text-slate-600 dark:text-slate-300 font-bold">{formCredits.toLocaleString()}</strong> form</>
                  ) : (
                    <>Quota: <strong className="text-slate-600 dark:text-slate-300 font-bold">{formCredits.toLocaleString()}</strong> credits</>
                  )}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5 h-[34px]">
              <span className="hidden sm:inline border-l border-slate-200 dark:border-slate-800 h-4" />
              <span>{t.search.pageIndicator.replace("{page}", String(page)).replace("{totalPages}", String(totalPages || 1))}</span>
            </div>
          </div>
        </div>

        {/* Results Grid Cards */}
        <div className="flex flex-col gap-3 relative min-h-[300px]">
          {isLoading && companies.length > 0 && (
            <div className="sticky top-20 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden z-20 rounded-full mb-1">
              <div className="h-full bg-[#1B4F8A] dark:bg-blue-400 w-1/2 animate-pulse rounded-full" />
            </div>
          )}
          {isLoading && companies.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <SearchSkeletonCard key={i} />
            ))
          ) : companies.length > 0 ? (
            <div className={`flex flex-col gap-3 transition-opacity duration-150 ${isLoading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
              {companies.map((company) => (
              <div 
                key={company.corporate_number}
                className="bg-white border border-slate-200 dark:bg-[#161B22] dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xs hover:border-slate-350 dark:hover:border-slate-700 transition-all"
              >
                {/* 1. Header: Logo + (Tags, Meta, and Company Name) */}
                <div className="flex flex-row gap-3.5 sm:gap-4 items-start min-w-0 mb-3.5">
                  <CompanyLogo
                    websiteUrl={company.website_url}
                    logoUrl={company.logo_url}
                    companyName={company.company_name}
                    className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 mt-0.5"
                    size={128}
                  />

                  <div className="flex-1 min-w-0">
                    {/* Top Row: Status, Prefecture, Industry & Metadata */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                          company.status === '閉鎖' || company.status === '解散'
                            ? 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/80 dark:border-rose-900/60'
                            : 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900/60'
                        }`}>
                          {company.status === '活動中' ? t.search.active : company.status === '閉鎖' ? t.search.closed : company.status === '解散' ? t.search.dissolved : company.status}
                        </span>

                        {company.prefecture_name && (
                          <span className="text-slate-600 dark:text-slate-300 text-[11px] font-medium inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {(t.prefectures as Record<string, string>)?.[company.prefecture_name] || company.prefecture_name}
                          </span>
                        )}

                        {company.industries?.filter(ind => ind.classification_level === '大分類').map((ind, idx) => (
                          <span key={idx} className="text-[11px] font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                            {ind.industry_code}.{(t.majorIndustries as Record<string, string>)?.[ind.industry_code] || ind.industry_name}
                          </span>
                        ))}
                      </div>

                      {/* Right Meta: Updated Date & Corporate Number */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{locale === 'en' ? 'Updated' : locale === 'vi' ? 'Cập nhật' : '更新'}: {formatShortDate(company.updated_at)}</span>
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <div className="inline-flex items-center gap-1">
                          <span>{t.company.corporateNumber ? t.company.corporateNumber.replace('{number}', company.corporate_number) : company.corporate_number}</span>
                          <CopyTextButton text={company.corporate_number} className="!px-0.5 !py-0 hover:!bg-transparent text-slate-400 hover:text-slate-600" />
                        </div>
                      </div>
                    </div>

                    {/* Company Name */}
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors break-words leading-snug">
                      <Link href={`/${locale}/company/${company.corporate_number}`}>
                        {company.company_name_en && locale === 'en' ? company.company_name_en : company.company_name}
                      </Link>
                    </h3>
                  </div>
                </div>

                {/* 2. Unified Specification Panel (企業スペック表) */}
                <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-lg p-3 sm:px-4 sm:py-3 border border-slate-200/80 dark:border-slate-700/80 text-xs">
                  {/* 4 Core Data Points */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="min-w-0">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium block mb-0.5">
                        {locale === 'vi' ? 'Tên phiên âm' : locale === 'en' ? 'Furigana' : 'フリガナ'}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold text-xs truncate block">
                        {company.company_name_kana || t.company.unregistered}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium block mb-0.5">
                        {t.company.capital}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold text-xs truncate block">
                        {company.capital_amount ? formatJapaneseCurrency(company.capital_amount, locale) : t.company.unregistered}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium block mb-0.5">
                        {t.company.employees}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold text-xs truncate block">
                        {company.employee_count 
                          ? (locale === 'en' ? `${company.employee_count.toLocaleString('en-US')} employees` : locale === 'vi' ? `${company.employee_count.toLocaleString('vi-VN')} nhân viên` : `${company.employee_count.toLocaleString('ja-JP')}名`) 
                          : t.company.unregistered}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium block mb-0.5">
                        {t.search.establishmentYear}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold text-xs truncate block">
                        {company.establishment_date 
                          ? (locale === 'en' ? `Est. ${company.establishment_date.substring(0, 4)}` : locale === 'vi' ? `Năm ${company.establishment_date.substring(0, 4)}` : `${company.establishment_date.substring(0, 4)}年`) 
                          : t.company.unregistered}
                      </span>
                    </div>
                  </div>

                  {/* Tags (事業種目) Integrated within Spec Panel */}
                  <div className="pt-2.5 mt-2.5 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium shrink-0">
                      {t.company.tags}:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      {(() => {
                        const mediumInds = company.industries?.filter(ind => ind.classification_level === '中分類') || [];
                        if (mediumInds.length > 0) {
                          return mediumInds.map((ind, idx) => (
                            <span 
                              key={idx} 
                              className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                            >
                              {ind.industry_code}.{getIndustryName(ind.industry_name, locale)}
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
                              className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                            >
                              {getIndustryName(tag.trim(), locale)}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">{t.company.unregistered}</span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* 3. Footer: Contacts & Primary Action */}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{company.phone_number ? `TEL: ${company.phone_number}` : `TEL: ${t.company.unregistered}`}</span>
                    </span>

                    {company.website_url ? (
                      <a 
                        href={company.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-1 font-medium text-[#1B4F8A] hover:underline dark:text-blue-400 transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Website</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    ) : (
                      <span className="flex items-center gap-1.5 font-medium text-slate-400">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Website: {t.company.none}</span>
                      </span>
                    )}

                    {(company.has_contact_form || company.contact_form_url) && (
                      <span 
                        className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-md text-xs select-none"
                        title={locale === 'en' ? "Contact form available (Outreach supported)" : locale === 'vi' ? "Có form liên hệ (Hỗ trợ gửi form tiếp thị)" : "お問い合わせフォームあり（フォーム営業代行対応）"}
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>{locale === 'en' ? 'Form Available' : locale === 'vi' ? 'Có form' : 'フォームあり'}</span>
                      </span>
                    )}

                    {(company.has_email || company.email_address) && (
                      <span 
                        className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 px-2 py-0.5 rounded-md text-xs select-none"
                        title={locale === 'en' ? "Email address registered (Available in CSV export)" : locale === 'vi' ? "Có email liên hệ (Cung cấp trong file CSV)" : "メールアドレス登録あり（CSVエクスポートで提供）"}
                      >
                        <Mail className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                        <span>{locale === 'en' ? 'Email Available' : locale === 'vi' ? 'Có email' : 'メールあり'}</span>
                      </span>
                    )}
                  </div>

                  <Link 
                    href={`/${locale}/company/${company.corporate_number}`}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1B4F8A] hover:bg-[#163e6d] rounded-lg shadow-2xs transition-colors shrink-0"
                  >
                    <span>{locale === 'vi' ? 'Xem chi tiết' : locale === 'en' ? 'Company Details' : '詳細プロフィール'}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-blue-200" />
                  </Link>
                </div>
              </div>
            ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h4 className="font-bold text-slate-800 dark:text-white mb-2">{t.search.companiesFoundZero}</h4>
              <p className="text-xs">{locale === 'vi' ? 'Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm để tìm thấy thông tin bạn muốn.' : locale === 'en' ? 'Try adjusting your filters or search keyword to find what you are looking for.' : '絞り込み条件を緩和するか、別のキーワードでお試しください。'}</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 py-6">
            {page > 1 ? (
              <button 
                type="button"
                onClick={() => handlePageChange(page - 1)}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 flex items-center justify-center dark:bg-[#1C2128] dark:border-slate-800 dark:text-slate-300 dark:hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-100 border border-slate-200/50 flex items-center justify-center dark:bg-slate-800/30 dark:border-slate-800 opacity-50 cursor-not-allowed text-slate-400 dark:text-slate-600">
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
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs border transition-all ${
                    isCurrent 
                      ? 'bg-[#1B4F8A] border-[#1B4F8A] text-white shadow-xs' 
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
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 flex items-center justify-center dark:bg-[#1C2128] dark:border-slate-800 dark:text-slate-300 dark:hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-100 border border-slate-200/50 flex items-center justify-center dark:bg-slate-800/30 dark:border-slate-800 opacity-50 cursor-not-allowed text-slate-400 dark:text-slate-600">
                <ChevronRight className="w-4 h-4" />
              </div>
            )}
          </div>
        )}
      </main>

      <FormOutreachRequirementModal
        isOpen={requirementModalType !== null}
        type={requirementModalType}
        onClose={() => setRequirementModalType(null)}
        onApplyContactFilterAndProceed={handleApplyContactFilterAndProceed}
      />

      <FormCampaignModal
        isOpen={isFormCampaignModalOpen}
        onClose={() => setIsFormCampaignModalOpen(false)}
        totalCount={totalCount}
        currentFilters={{
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
          hasAward,
          hasCertification,
          hasPatent,
          hasFinancials,
          hasEmail,
          hasPhone,
          hasWebsite,
          hasFax,
          hasContactForm,
          emailType,
          companyStatus
        }}
      />
    </div>
  );
};
