"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Filter, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { industryJaToEn, getIndustryName } from "@/lib/locale-mapping";

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

interface SearchSidebarProps {
  prefectures: PrefectureOption[];
  industries: MajorIndustry[];
  // current active filter values (from URL params)
  prefCode?: string;
  city?: string;
  cities?: { cityName: string; count: number }[];
  indCode?: string;
  minEmp?: number;
  maxEmp?: number;
  minCap?: number;
  maxCap?: number;
  hasHiring: boolean;
  hasSubsidy: boolean;
  hasBidding: boolean;
  minEstYear?: number;
  maxEstYear?: number;
  hasAward: boolean;
  hasCertification: boolean;
  hasPatent: boolean;
  hasFinancials: boolean;
  minSales?: number;
  maxSales?: number;
  hasEmail: boolean;
  hasPhone: boolean;
  hasWebsite: boolean;
  hasFax: boolean;
  companyStatus?: string;
  minOpIncome?: number;
  maxOpIncome?: number;
  minOrdIncome?: number;
  maxOrdIncome?: number;
  minNetIncome?: number;
  maxNetIncome?: number;
  onFilterChange?: (updates: Record<string, any>) => void;
  className?: string;
  onCloseMobile?: () => void;
}

export const SearchSidebar: React.FC<SearchSidebarProps> = ({
  prefectures,
  industries,
  prefCode,
  city,
  cities,
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
  hasFinancials,
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
  onFilterChange,
  className,
  onCloseMobile,
}) => {
  const router = useRouter();
  const { isLoggedIn, user, setAuthModalOpen } = useAuth();
  const { locale, t } = useLanguage();
  const isProOrHigher = user && (user.role === 'pro' || user.role === 'business' || user.role === 'enterprise');

  const displayCapital = (val?: number) => {
    if (val === undefined || val === null) return "";
    return String((locale === 'en' || locale === 'vi') ? val / 100 : val);
  };
  const displaySales = (val?: number) => {
    if (val === undefined || val === null) return "";
    return String((locale === 'en' || locale === 'vi') ? val * 105 || val * 100 : val); // standard float multiplier
  };

  const processCapitalInput = (val: string) => {
    if (!val) return null;
    const num = parseFloat(val);
    if (isNaN(num)) return null;
    return String((locale === 'en' || locale === 'vi') ? Math.round(num * 100) : num);
  };

  const processSalesInput = (val: string) => {
    if (!val) return null;
    const num = parseFloat(val);
    if (isNaN(num)) return null;
    return String((locale === 'en' || locale === 'vi') ? (num / 100) : num);
  };

  // Build a new query string merging current params with overrides
  const buildUrl = (overrides: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams();

    // Start from current URL filter values (as strings)
    const current: Record<string, string | null | undefined> = {
      prefecture: prefCode,
      city: city,
      industry: indCode,
      min_employees: minEmp != null ? String(minEmp) : undefined,
      max_employees: maxEmp != null ? String(maxEmp) : undefined,
      min_capital: minCap != null ? String(minCap) : undefined,
      max_capital: maxCap != null ? String(maxCap) : undefined,
      hiring: hasHiring ? "true" : undefined,
      subsidy: hasSubsidy ? "true" : undefined,
      bidding: hasBidding ? "true" : undefined,
      min_establishment_year: minEstYear != null ? String(minEstYear) : undefined,
      max_establishment_year: maxEstYear != null ? String(maxEstYear) : undefined,
      award: hasAward ? "true" : undefined,
      certification: hasCertification ? "true" : undefined,
      patent: hasPatent ? "true" : undefined,
      financials: hasFinancials ? "true" : undefined,
      min_sales: minSales != null ? String(minSales) : undefined,
      max_sales: maxSales != null ? String(maxSales) : undefined,
      email: hasEmail ? "true" : undefined,
      phone: hasPhone ? "true" : undefined,
      website: hasWebsite ? "true" : undefined,
      fax: hasFax ? "true" : undefined,
      status: companyStatus,
      min_operating_income: minOpIncome != null ? String(minOpIncome) : undefined,
      max_operating_income: maxOpIncome != null ? String(maxOpIncome) : undefined,
      min_ordinary_income: minOrdIncome != null ? String(minOrdIncome) : undefined,
      max_ordinary_income: maxOrdIncome != null ? String(maxOrdIncome) : undefined,
      min_net_income: minNetIncome != null ? String(minNetIncome) : undefined,
      max_net_income: maxNetIncome != null ? String(maxNetIncome) : undefined,
    };

    const merged: Record<string, string | null | undefined> = {
      ...current,
      ...overrides,
      page: "1",
    };

    Object.entries(merged).forEach(([k, v]) => {
      if (v != null && v !== "" && v !== "false") {
        params.set(k, v);
      }
    });

    return `/search?${params.toString()}`;
  };

  const navigate = (overrides: Record<string, string | null | undefined>) => {
    if (onFilterChange) {
      const updates: Record<string, any> = {};
      Object.entries(overrides).forEach(([key, val]) => {
        if (key === "prefecture") updates.prefecture = val;
        else if (key === "city") updates.city = val;
        else if (key === "industry") updates.industry = val;
        else if (key === "min_employees") updates.min_employees = val;
        else if (key === "max_employees") updates.max_employees = val;
        else if (key === "min_capital") updates.min_capital = val;
        else if (key === "max_capital") updates.max_capital = val;
        else if (key === "hiring") updates.hiring = val === "true";
        else if (key === "subsidy") updates.subsidy = val === "true";
        else if (key === "bidding") updates.bidding = val === "true";
        else if (key === "min_establishment_year") updates.min_establishment_year = val;
        else if (key === "max_establishment_year") updates.max_establishment_year = val;
        else if (key === "award") updates.award = val === "true";
        else if (key === "certification") updates.certification = val === "true";
        else if (key === "patent") updates.patent = val === "true";
        else if (key === "financials") updates.financials = val === "true";
        else if (key === "min_sales") updates.min_sales = val;
        else if (key === "max_sales") updates.max_sales = val;
        else if (key === "email") updates.email = val === "true";
        else if (key === "phone") updates.phone = val === "true";
        else if (key === "website") updates.website = val === "true";
        else if (key === "fax") updates.fax = val === "true";
        else if (key === "status") updates.status = val;
        else if (key === "min_operating_income") updates.min_operating_income = val;
        else if (key === "max_operating_income") updates.max_operating_income = val;
        else if (key === "min_ordinary_income") updates.min_ordinary_income = val;
        else if (key === "max_ordinary_income") updates.max_ordinary_income = val;
        else if (key === "min_net_income") updates.min_net_income = val;
        else if (key === "max_net_income") updates.max_net_income = val;
      });
      onFilterChange(updates);
      if (onCloseMobile) {
        onCloseMobile();
      }
    } else {
      router.push(buildUrl(overrides));
    }
  };

  return (
    <aside className={className || "hidden lg:block w-76 shrink-0 bg-white border border-slate-200 dark:bg-[#1C2128] dark:border-slate-800 rounded-2xl p-5 sticky top-20 max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-thin"}>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <h2 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white">
          <Filter className="w-4 h-4 text-primary" />
          {t.search.title}
        </h2>
        {onFilterChange ? (
          <button
            type="button"
            onClick={() => onFilterChange({
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
              status: null,
              min_operating_income: null,
              max_operating_income: null,
              min_ordinary_income: null,
              max_ordinary_income: null,
              min_net_income: null,
              max_net_income: null,
            })}
            className="text-xs text-slate-400 hover:text-slate-650 dark:hover:text-white transition-colors"
          >
            {t.search.clear}
          </button>
        ) : (
          <Link
            href={locale === "ja" ? "/search" : `/${locale}/search`}
            className="text-xs text-slate-400 hover:text-slate-650 dark:hover:text-white transition-colors"
          >
            {t.search.clear}
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {/* Filter by Prefecture */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            {t.search.prefecture}
          </label>
          <select
            value={prefCode || ""}
            onChange={(e) => navigate({ prefecture: e.target.value || null, city: null })}
            className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
          >
            <option value="">{t.search.allPrefectures}</option>
            {prefectures.map((pref) => (
              <option key={pref.code} value={pref.code}>
                {(t.prefectures as Record<string, string>)?.[pref.name] || pref.name} ({pref.count.toLocaleString()}{locale === 'en' ? ' companies' : locale === 'vi' ? ' doanh nghiệp' : '社'})
              </option>
            ))}
          </select>
        </div>

        {/* Filter by City (市区町村) - Lọc phân cấp dưới Tỉnh */}
        {prefCode && cities && cities.length > 0 && (
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              {t.search.city}
            </label>
            <select
              value={city || ""}
              onChange={(e) => navigate({ city: e.target.value || null })}
              className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            >
              <option value="">{t.search.allCities}</option>
              {cities.map((c) => (
                <option key={c.cityName} value={c.cityName}>
                  {c.cityName} ({c.count.toLocaleString()}{locale === 'en' ? ' companies' : locale === 'vi' ? ' doanh nghiệp' : '社'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filter by Industry */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            {t.search.industry}
          </label>
          <select
            value={indCode || ""}
            onChange={(e) => navigate({ industry: e.target.value || null })}
            className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 font-sans"
          >
            <option value="">{t.search.allIndustries}</option>
            {industries.map((major) => (
              <React.Fragment key={major.code}>
                <option value={major.code} className="font-semibold text-slate-900 dark:text-white">
                  {major.code} {(t.majorIndustries as Record<string, string>)?.[major.code] || major.name} ({locale === 'en' ? 'Total' : locale === 'vi' ? 'Tổng cộng' : '計'} {major.totalCount.toLocaleString()}{locale === 'en' ? ' companies' : locale === 'vi' ? ' doanh nghiệp' : '社'})
                </option>
                {major.children.map((medium) => (
                  <option key={medium.code} value={medium.code} className="text-slate-700 dark:text-slate-300">
                    {"\u00A0\u00A0"}{medium.code} {getIndustryName(medium.name, locale)} ({medium.count.toLocaleString()}{locale === 'en' ? ' companies' : locale === 'vi' ? ' doanh nghiệp' : '社'})
                  </option>
                ))}
              </React.Fragment>
            ))}
          </select>
        </div>

        {/* Filter by Employee Count */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            {t.search.employees}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder={t.search.minEmployees}
              defaultValue={minEmp || ""}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value;
                  navigate({ min_employees: val || null });
                }
              }}
              onBlur={(e) => {
                const val = e.target.value;
                if (val !== (minEmp != null ? String(minEmp) : "")) {
                  navigate({ min_employees: val || null });
                }
              }}
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            />
            <input
              type="number"
              placeholder={t.search.maxEmployees}
              defaultValue={maxEmp || ""}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value;
                  navigate({ max_employees: val || null });
                }
              }}
              onBlur={(e) => {
                const val = e.target.value;
                if (val !== (maxEmp != null ? String(maxEmp) : "")) {
                  navigate({ max_employees: val || null });
                }
              }}
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        {/* Filter by Capital */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            {t.search.capital}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder={t.search.minCapital}
              defaultValue={displayCapital(minCap)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value;
                  navigate({ min_capital: processCapitalInput(val) });
                }
              }}
              onBlur={(e) => {
                const val = e.target.value;
                if (val !== displayCapital(minCap)) {
                  navigate({ min_capital: processCapitalInput(val) });
                }
              }}
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            />
            <input
              type="number"
              placeholder={t.search.maxCapital}
              defaultValue={displayCapital(maxCap)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value;
                  navigate({ max_capital: processCapitalInput(val) });
                }
              }}
              onBlur={(e) => {
                const val = e.target.value;
                if (val !== displayCapital(maxCap)) {
                  navigate({ max_capital: processCapitalInput(val) });
                }
              }}
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        {/* Filter by Sales */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            {t.search.sales}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder={t.search.minSales}
              defaultValue={displaySales(minSales)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value;
                  navigate({ min_sales: processSalesInput(val) });
                }
              }}
              onBlur={(e) => {
                const val = e.target.value;
                if (val !== displaySales(minSales)) {
                  navigate({ min_sales: processSalesInput(val) });
                }
              }}
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            />
            <input
              type="number"
              placeholder={t.search.maxSales}
              defaultValue={displaySales(maxSales)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value;
                  navigate({ max_sales: processSalesInput(val) });
                }
              }}
              onBlur={(e) => {
                const val = e.target.value;
                if (val !== displaySales(maxSales)) {
                  navigate({ max_sales: processSalesInput(val) });
                }
              }}
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        {/* Growth & Financial Indicators */}
        <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4">
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            {t.search.financials}
          </label>
          <div className="flex flex-col gap-4">


            {/* Operating Income */}
            <div>
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                {t.search.operatingIncome}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder={t.search.minSales}
                  defaultValue={displaySales(minOpIncome)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value;
                      navigate({ min_operating_income: processSalesInput(val) });
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value;
                    if (val !== displaySales(minOpIncome)) {
                      navigate({ min_operating_income: processSalesInput(val) });
                    }
                  }}
                  className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                />
                <input
                  type="number"
                  placeholder={t.search.maxSales}
                  defaultValue={displaySales(maxOpIncome)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value;
                      navigate({ max_operating_income: processSalesInput(val) });
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value;
                    if (val !== displaySales(maxOpIncome)) {
                      navigate({ max_operating_income: processSalesInput(val) });
                    }
                  }}
                  className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            {/* Ordinary Income */}
            <div>
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                {t.search.ordinaryIncome}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder={t.search.minSales}
                  defaultValue={displaySales(minOrdIncome)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value;
                      navigate({ min_ordinary_income: processSalesInput(val) });
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value;
                    if (val !== displaySales(minOrdIncome)) {
                      navigate({ min_ordinary_income: processSalesInput(val) });
                    }
                  }}
                  className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                />
                <input
                  type="number"
                  placeholder={t.search.maxSales}
                  defaultValue={displaySales(maxOrdIncome)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value;
                      navigate({ max_ordinary_income: processSalesInput(val) });
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value;
                    if (val !== displaySales(maxOrdIncome)) {
                      navigate({ max_ordinary_income: processSalesInput(val) });
                    }
                  }}
                  className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            {/* Net Income */}
            <div>
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                {t.search.netIncome}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder={t.search.minSales}
                  defaultValue={displaySales(minNetIncome)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value;
                      navigate({ min_net_income: processSalesInput(val) });
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value;
                    if (val !== displaySales(minNetIncome)) {
                      navigate({ min_net_income: processSalesInput(val) });
                    }
                  }}
                  className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                />
                <input
                  type="number"
                  placeholder={t.search.maxSales}
                  defaultValue={displaySales(maxNetIncome)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value;
                      navigate({ max_net_income: processSalesInput(val) });
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value;
                    if (val !== displaySales(maxNetIncome)) {
                      navigate({ max_net_income: processSalesInput(val) });
                    }
                  }}
                  className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filter by Establishment Year */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            {t.search.establishmentYear}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder={t.search.minEstablishmentYear}
              defaultValue={minEstYear || ""}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value;
                  navigate({ min_establishment_year: val || null });
                }
              }}
              onBlur={(e) => {
                const val = e.target.value;
                if (val !== (minEstYear != null ? String(minEstYear) : "")) {
                  navigate({ min_establishment_year: val || null });
                }
              }}
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            />
            <input
              type="number"
              placeholder={t.search.maxEstablishmentYear}
              defaultValue={maxEstYear || ""}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value;
                  navigate({ max_establishment_year: val || null });
                }
              }}
              onBlur={(e) => {
                const val = e.target.value;
                if (val !== (maxEstYear != null ? String(maxEstYear) : "")) {
                  navigate({ max_establishment_year: val || null });
                }
              }}
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        {/* Filter by Status */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            {t.search.status}
          </label>
          <select
            value={companyStatus || ""}
            onChange={(e) => navigate({ status: e.target.value || null })}
            className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
          >
            <option value="">{t.search.allStatuses}</option>
            <option value="活動中">{t.search.active}</option>
            <option value="閉鎖">{t.search.closed}</option>
          </select>
        </div>

        {/* Intent Signal Filters */}
        <div className="relative">
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            {t.search.signals}
          </label>
          <div className={`${!isLoggedIn ? "blur-[2.5px] pointer-events-none select-none opacity-60" : ""} flex flex-col gap-2`}>
            <label className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={hasHiring}
                disabled={!isLoggedIn}
                onChange={(e) => navigate({ hiring: e.target.checked ? "true" : null })}
                className="w-4 h-4 rounded text-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
              />
              <span>{t.search.hiring}</span>
            </label>
            <label className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={hasSubsidy}
                disabled={!isLoggedIn}
                onChange={(e) => navigate({ subsidy: e.target.checked ? "true" : null })}
                className="w-4 h-4 rounded text-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
              />
              <span>{t.search.subsidy}</span>
            </label>
            <label className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={hasBidding}
                disabled={!isLoggedIn}
                onChange={(e) => navigate({ bidding: e.target.checked ? "true" : null })}
                className="w-4 h-4 rounded text-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
              />
              <span>{t.search.bidding}</span>
            </label>
            <label className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={hasAward}
                disabled={!isLoggedIn}
                onChange={(e) => navigate({ award: e.target.checked ? "true" : null })}
                className="w-4 h-4 rounded text-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
              />
              <span className="flex items-center gap-1">{t.search.award}</span>
            </label>
            <label className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={hasCertification}
                disabled={!isLoggedIn}
                onChange={(e) => navigate({ certification: e.target.checked ? "true" : null })}
                className="w-4 h-4 rounded text-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
              />
              <span className="flex items-center gap-1">{t.search.certification}</span>
            </label>
            <label className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={hasPatent}
                disabled={!isLoggedIn}
                onChange={(e) => navigate({ patent: e.target.checked ? "true" : null })}
                className="w-4 h-4 rounded text-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
              />
              <span className="flex items-center gap-1">{t.search.patent}</span>
            </label>
            <label className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={hasFinancials}
                disabled={!isLoggedIn}
                onChange={(e) => navigate({ financials: e.target.checked ? "true" : null })}
                className="w-4 h-4 rounded text-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
              />
              <span className="flex items-center gap-1">{t.search.hasFinancials}</span>
            </label>
          </div>
          {!isLoggedIn && (
            <div 
              onClick={() => setAuthModalOpen(true)}
              className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center bg-transparent z-10"
              title={locale === 'en' ? "Click to register free" : locale === 'vi' ? "Nhấp để đăng ký miễn phí" : "クリックして無料会員登録"}
            >
              <div className="bg-amber-100/90 dark:bg-amber-950/90 border border-amber-250/50 dark:border-amber-900/50 rounded-xl px-2.5 py-1.5 flex items-center gap-1 shadow-sm text-[10px] font-black text-amber-800 dark:text-amber-300 hover:scale-105 transition-transform duration-200">
                <Lock className="w-3.5 h-3.5" />
                {locale === 'en' ? "Register Free to Unlock" : locale === 'vi' ? "Đăng ký miễn phí để mở khóa" : "無料登録で利用可能"}
              </div>
            </div>
          )}
        </div>

        {/* Contact Presence Filters */}
        <div className="relative">
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            {t.search.contactPresence}
          </label>
          <div className={`${!isProOrHigher ? "blur-[2.5px] pointer-events-none select-none opacity-60" : ""} flex flex-col gap-2`}>
            <label className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={hasEmail}
                disabled={!isProOrHigher}
                onChange={(e) => navigate({ email: e.target.checked ? "true" : null })}
                className="w-4 h-4 rounded text-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
              />
              <span>{t.search.emailLabel}</span>
            </label>
            <label className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={hasPhone}
                disabled={!isProOrHigher}
                onChange={(e) => navigate({ phone: e.target.checked ? "true" : null })}
                className="w-4 h-4 rounded text-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
              />
              <span>{t.search.phoneLabel}</span>
            </label>
            <label className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={hasWebsite}
                disabled={!isProOrHigher}
                onChange={(e) => navigate({ website: e.target.checked ? "true" : null })}
                className="w-4 h-4 rounded text-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
              />
              <span>{t.search.websiteLabel}</span>
            </label>
            <label className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={hasFax}
                disabled={!isProOrHigher}
                onChange={(e) => navigate({ fax: e.target.checked ? "true" : null })}
                className="w-4 h-4 rounded text-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
              />
              <span>{t.search.faxLabel}</span>
            </label>
          </div>
          {!isProOrHigher && (
            <div 
              onClick={() => {
                if (!isLoggedIn) {
                  setAuthModalOpen(true);
                } else {
                  router.push(locale === "ja" ? "/pricing" : `/${locale}/pricing`);
                }
              }}
              className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center bg-transparent z-10"
              title={isLoggedIn ? (locale === 'en' ? "Click to upgrade to PRO" : locale === 'vi' ? "Nhấp để nâng cấp lên PRO" : "クリックしてProにアップグレード") : (locale === 'en' ? "Click to register" : locale === 'vi' ? "Nhấp để đăng ký" : "クリックして会員登録")}
            >
              <div className="bg-amber-100/90 dark:bg-amber-950/90 border border-amber-250/50 dark:border-amber-900/50 rounded-xl px-2.5 py-1.5 flex items-center gap-1 shadow-sm text-[10px] font-black text-amber-800 dark:text-amber-300 hover:scale-105 transition-transform duration-200">
                <Lock className="w-3.5 h-3.5" />
                {locale === 'en' ? "PRO Plan Required" : locale === 'vi' ? "Yêu cầu tài khoản PRO" : "Proプランで利用可能"}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
