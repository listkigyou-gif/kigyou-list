"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Filter, 
  Lock, 
  MapPin, 
  Send, 
  Building2, 
  Zap, 
  TrendingUp, 
  RotateCcw, 
  ChevronDown,
  Mail,
  Phone,
  Globe,
  Printer,
  Award,
  FileCheck2,
  Lightbulb,
  FileSpreadsheet,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getIndustryName } from "@/lib/locale-mapping";

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
  hasContactForm?: boolean;
  emailType?: string;
  companyStatus?: string;
  minOpIncome?: number;
  maxOpIncome?: number;
  minOrdIncome?: number;
  maxOrdIncome?: number;
  minNetIncome?: number;
  maxNetIncome?: number;
  onFilterChange?: (updates: Record<string, any>, autoExecute?: boolean) => void;
  onApplyFilters?: () => void;
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
  hasContactForm,
  emailType,
  companyStatus,
  minOpIncome,
  maxOpIncome,
  minOrdIncome,
  maxOrdIncome,
  minNetIncome,
  maxNetIncome,
  onFilterChange,
  onApplyFilters,
  className,
  onCloseMobile,
}) => {
  const router = useRouter();
  const { isLoggedIn, user, setAuthModalOpen } = useAuth();
  const { locale, t } = useLanguage();
  const isProOrHigher = Boolean(user && (user.role === 'pro' || user.role === 'business' || user.role === 'enterprise' || user.role === 'admin'));

  const hasActiveFin = Boolean(minSales || maxSales || minOpIncome || maxOpIncome || minOrdIncome || maxOrdIncome || minNetIncome || maxNetIncome);
  const [isFinOpen, setIsFinOpen] = useState(hasActiveFin);

  const activeCount = [
    prefCode, city, indCode, minEmp, maxEmp, minCap, maxCap,
    hasHiring, hasSubsidy, hasBidding, minEstYear, maxEstYear,
    hasAward, hasCertification, hasPatent, hasFinancials,
    minSales, maxSales, hasEmail, hasPhone, hasWebsite, hasFax,
    hasContactForm, emailType, companyStatus, minOpIncome, maxOpIncome,
    minOrdIncome, maxOrdIncome, minNetIncome, maxNetIncome
  ].filter(Boolean).length;

  const displayCapital = (val?: number) => {
    if (val === undefined || val === null) return "";
    return String((locale === 'en' || locale === 'vi') ? val / 100 : val);
  };
  const displaySales = (val?: number) => {
    if (val === undefined || val === null) return "";
    return String((locale === 'en' || locale === 'vi') ? (val * 100) : val);
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
      contact_form: hasContactForm ? "true" : undefined,
      email_type: emailType || undefined,
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

  const navigate = (overrides: Record<string, string | null | undefined>, autoExecute = false) => {
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
        else if (key === "contact_form") updates.contact_form = val === "true";
        else if (key === "email_type") updates.email_type = val;
        else if (key === "status") updates.status = val;
        else if (key === "min_operating_income") updates.min_operating_income = val;
        else if (key === "max_operating_income") updates.max_operating_income = val;
        else if (key === "min_ordinary_income") updates.min_ordinary_income = val;
        else if (key === "max_ordinary_income") updates.max_ordinary_income = val;
        else if (key === "min_net_income") updates.min_net_income = val;
        else if (key === "max_net_income") updates.max_net_income = val;
      });
      onFilterChange(updates, autoExecute);
      if (onCloseMobile) {
        onCloseMobile();
      }
    } else {
      router.push(buildUrl(overrides));
    }
  };

  const handleClearAll = () => {
    if (onFilterChange) {
      onFilterChange({
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
      }, true);
    } else {
      router.push(locale === "ja" ? "/search" : `/${locale}/search`);
    }
  };

  return (
    <aside className={className || "hidden lg:block w-76 shrink-0 bg-white border border-slate-200/90 dark:bg-[#161B22] dark:border-slate-800 rounded-2xl p-4 sticky top-20 max-h-[calc(100vh-6.5rem)] overflow-y-auto scrollbar-thin shadow-2xs"}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
          <h2 className="font-bold text-sm text-slate-900 dark:text-white">
            {t.search.title}
          </h2>
          {activeCount > 0 && (
            <span className="text-[10px] bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-blue-900/40 dark:text-blue-300 font-bold px-1.5 py-0.2 rounded-full border border-[#1B4F8A]/20">
              {activeCount}
            </span>
          )}
        </div>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs font-semibold text-slate-400 hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t.search.clear}</span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3.5">
        {/* ========================================================
            CARD 1: エリア・業種 (Location & Industry)
            ======================================================== */}
        <div className="bg-slate-50/70 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <MapPin className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
            <span>{locale === 'ja' ? 'エリア・業界' : locale === 'vi' ? 'Khu vực & Ngành nghề' : 'Location & Industry'}</span>
          </div>

          {/* Prefecture */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t.search.prefecture}
            </label>
            <select
              value={prefCode || ""}
              onChange={(e) => navigate({ prefecture: e.target.value || null, city: null })}
              className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
            >
              <option value="">{t.search.allPrefectures}</option>
              {prefectures.map((pref) => (
                <option key={pref.code} value={pref.code}>
                  {(t.prefectures as Record<string, string>)?.[pref.name] || pref.name} ({pref.count.toLocaleString()}{locale === 'en' ? ' companies' : locale === 'vi' ? ' doanh nghiệp' : '社'})
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t.search.city}
            </label>
            <select
              value={city || ""}
              onChange={(e) => navigate({ city: e.target.value || null })}
              disabled={!prefCode}
              className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-900 transition-colors shadow-2xs"
            >
              <option value="">{t.search.allCities}</option>
              {prefCode && cities && cities.map((c) => (
                <option key={c.cityName} value={c.cityName}>
                  {c.cityName} ({c.count.toLocaleString()}{locale === 'en' ? ' companies' : locale === 'vi' ? ' doanh nghiệp' : '社'})
                </option>
              ))}
            </select>
          </div>

          {/* Industry */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t.search.industry}
            </label>
            <select
              value={indCode || ""}
              onChange={(e) => navigate({ industry: e.target.value || null })}
              className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
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
        </div>

        {/* ========================================================
            CARD 2: 連絡先・アプローチ手段 (Contact Channels & Form Outreach)
            ======================================================== */}
        <div className="bg-slate-50/70 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2.5 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Send className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>{locale === 'ja' ? '連絡先・営業手段' : locale === 'vi' ? 'Kênh liên hệ & Gửi Form' : 'Outreach & Contact'}</span>
            </div>
            {!isProOrHigher && (
              <span className="text-[10px] bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5 border border-amber-300 dark:border-amber-700">
                <Lock className="w-2.5 h-2.5" /> PRO
              </span>
            )}
          </div>

          <div className={`${!isProOrHigher ? "blur-[2.5px] pointer-events-none select-none opacity-60" : ""} flex flex-col gap-2`}>
            {/* Highlighted Flagship: お問い合わせフォーム */}
            <label className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
              hasContactForm 
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200 shadow-2xs ring-1 ring-emerald-400/40' 
                : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
            }`}>
              <input
                type="checkbox"
                checked={!!hasContactForm}
                disabled={!isProOrHigher}
                onChange={(e) => navigate({ contact_form: e.target.checked ? "true" : null })}
                className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
              />
              <div className="flex-1 flex items-center justify-between gap-1 flex-wrap">
                <span className="text-xs font-semibold">
                  {locale === 'en' ? 'Contact Form' : locale === 'vi' ? 'Biểu mẫu liên hệ' : 'お問い合わせフォーム'}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-black tracking-wide">
                    FORM
                  </span>
                  <span className="text-[9px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-1 py-0.2 rounded font-medium">
                    {locale === 'ja' ? '自動営業' : locale === 'vi' ? 'Tự động' : 'Outreach'}
                  </span>
                </div>
              </div>
            </label>

            {/* Email Address with Type selector */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 flex flex-col gap-1.5">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={hasEmail}
                  disabled={!isProOrHigher}
                  onChange={(e) => navigate({ 
                    email: e.target.checked ? "true" : null,
                    email_type: e.target.checked ? emailType : null 
                  })}
                  className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800"
                />
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.search.emailLabel}</span>
                </span>
              </label>

              {hasEmail && (
                <div className="pl-6 pt-1 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-700/60 mt-1">
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {locale === 'en' ? 'Type:' : locale === 'vi' ? 'Loại:' : '種別:'}
                  </span>
                  <select
                    value={emailType || ""}
                    disabled={!isProOrHigher}
                    onChange={(e) => navigate({ email_type: e.target.value || null })}
                    className="w-full text-[10px] font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700"
                  >
                    <option value="">{locale === 'en' ? 'All Types' : locale === 'vi' ? 'Tất cả loại' : '全種別'}</option>
                    <option value="GENERAL">{locale === 'en' ? 'General / Info' : locale === 'vi' ? 'Chung / Đại diện' : '代表・総合'}</option>
                    <option value="SALES">{locale === 'en' ? 'Sales' : locale === 'vi' ? 'Kinh doanh' : '営業'}</option>
                    <option value="RECRUIT">{locale === 'en' ? 'Recruiting' : locale === 'vi' ? 'Tuyển dụng' : '採用'}</option>
                    <option value="PR">{locale === 'en' ? 'PR / Media' : locale === 'vi' ? 'Truyền thông/PR' : '広報・PR'}</option>
                  </select>
                </div>
              )}
            </div>

            {/* Other Channels */}
            <div className="grid grid-cols-1 gap-1.5 pt-0.5">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors p-1 rounded">
                <input
                  type="checkbox"
                  checked={hasPhone}
                  disabled={!isProOrHigher}
                  onChange={(e) => navigate({ phone: e.target.checked ? "true" : null })}
                  className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.search.phoneLabel}</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors p-1 rounded">
                <input
                  type="checkbox"
                  checked={hasWebsite}
                  disabled={!isProOrHigher}
                  onChange={(e) => navigate({ website: e.target.checked ? "true" : null })}
                  className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800"
                />
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.search.websiteLabel}</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors p-1 rounded">
                <input
                  type="checkbox"
                  checked={hasFax}
                  disabled={!isProOrHigher}
                  onChange={(e) => navigate({ fax: e.target.checked ? "true" : null })}
                  className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800"
                />
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.search.faxLabel}</span>
              </label>
            </div>
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
              title={isLoggedIn ? (locale === 'en' ? "Upgrade to PRO" : locale === 'vi' ? "Nâng cấp lên PRO" : "Proプランにアップグレード") : (locale === 'en' ? "Register Free" : locale === 'vi' ? "Đăng ký miễn phí" : "無料登録")}
            >
              <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-xs text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 transition-colors">
                <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                {locale === 'en' ? "PRO Plan Required" : locale === 'vi' ? "Yêu cầu tài khoản PRO" : "Proプランで利用可能"}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            CARD 3: 営業活動シグナル (Sales Intent Signals)
            ======================================================== */}
        <div className="bg-slate-50/70 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{locale === 'ja' ? '営業活動シグナル' : locale === 'vi' ? 'Tín hiệu kinh doanh' : 'Sales Intent Signals'}</span>
            </div>
            {!isLoggedIn && (
              <span className="text-[10px] bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" /> FREE
              </span>
            )}
          </div>

          <div className={`${!isLoggedIn ? "blur-[2.5px] pointer-events-none select-none opacity-60" : ""} flex flex-col gap-2 pt-0.5`}>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors p-1 rounded">
              <input
                type="checkbox"
                checked={hasHiring}
                disabled={!isLoggedIn}
                onChange={(e) => navigate({ hiring: e.target.checked ? "true" : null })}
                className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800"
              />
              <span>{t.search.hiring}</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors p-1 rounded">
              <input
                type="checkbox"
                checked={hasSubsidy}
                disabled={!isLoggedIn}
                onChange={(e) => navigate({ subsidy: e.target.checked ? "true" : null })}
                className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800"
              />
              <span>{t.search.subsidy}</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors p-1 rounded">
              <input
                type="checkbox"
                checked={hasBidding}
                disabled={!isLoggedIn}
                onChange={(e) => navigate({ bidding: e.target.checked ? "true" : null })}
                className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800"
              />
              <span>{t.search.bidding}</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors p-1 rounded">
              <input
                type="checkbox"
                checked={hasAward}
                disabled={!isLoggedIn}
                onChange={(e) => navigate({ award: e.target.checked ? "true" : null })}
                className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800"
              />
              <span>{t.search.award}</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors p-1 rounded">
              <input
                type="checkbox"
                checked={hasCertification}
                disabled={!isLoggedIn}
                onChange={(e) => navigate({ certification: e.target.checked ? "true" : null })}
                className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800"
              />
              <span>{t.search.certification}</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors p-1 rounded">
              <input
                type="checkbox"
                checked={hasPatent}
                disabled={!isLoggedIn}
                onChange={(e) => navigate({ patent: e.target.checked ? "true" : null })}
                className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800"
              />
              <span>{t.search.patent}</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors p-1 rounded">
              <input
                type="checkbox"
                checked={hasFinancials}
                disabled={!isLoggedIn}
                onChange={(e) => navigate({ financials: e.target.checked ? "true" : null })}
                className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800"
              />
              <span>{t.search.hasFinancials}</span>
            </label>
          </div>

          {!isLoggedIn && (
            <div 
              onClick={() => setAuthModalOpen(true)}
              className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center bg-transparent z-10"
              title={locale === 'en' ? "Register free to unlock" : locale === 'vi' ? "Đăng ký miễn phí để mở khóa" : "無料登録で利用可能"}
            >
              <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-xs text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 transition-colors">
                <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                {locale === 'en' ? "Register Free to Unlock" : locale === 'vi' ? "Đăng ký miễn phí để mở khóa" : "無料登録で利用可能"}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            CARD 4: 企業規模・ステータス (Scale & Status)
            ======================================================== */}
        <div className="bg-slate-50/70 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Building2 className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
            <span>{locale === 'ja' ? '企業規模・ステータス' : locale === 'vi' ? 'Quy mô & Trạng thái' : 'Scale & Status'}</span>
          </div>

          {/* Capital */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t.search.capital}
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                key={`minCap_${minCap ?? ''}`}
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
                className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-2xs"
              />
              <input
                key={`maxCap_${maxCap ?? ''}`}
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
                className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-2xs"
              />
            </div>
          </div>

          {/* Employees */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t.search.employees}
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                key={`minEmp_${minEmp ?? ''}`}
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
                className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-2xs"
              />
              <input
                key={`maxEmp_${maxEmp ?? ''}`}
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
                className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-2xs"
              />
            </div>
          </div>

          {/* Establishment Year */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t.search.establishmentYear}
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                key={`minEstYear_${minEstYear ?? ''}`}
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
                className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-2xs"
              />
              <input
                key={`maxEstYear_${maxEstYear ?? ''}`}
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
                className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-2xs"
              />
            </div>
          </div>

          {/* Company Status (now correctly including 解散) */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t.search.status}
            </label>
            <select
              value={companyStatus || ""}
              onChange={(e) => navigate({ status: e.target.value || null })}
              className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
            >
              <option value="">{t.search.allStatuses}</option>
              <option value="活動中">{t.search.active}</option>
              <option value="閉鎖">{t.search.closed}</option>
              <option value="解散">{t.search.dissolved}</option>
            </select>
          </div>
        </div>

        {/* ========================================================
            CARD 5: 財務指標・業績 (Financial Performance)
            ======================================================== */}
        <div className="bg-slate-50/70 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2.5">
          <div 
            className="flex items-center justify-between cursor-pointer select-none"
            onClick={() => setIsFinOpen(!isFinOpen)}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <TrendingUp className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>{locale === 'ja' ? '財務指標・業績' : locale === 'vi' ? 'Chỉ số tài chính' : 'Financial Performance'}</span>
            </div>
            <div className="flex items-center gap-1">
              {hasActiveFin && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A] dark:bg-blue-400" />
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isFinOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {isFinOpen && (
            <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              {/* Sales */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t.search.sales}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    key={`minSales_${minSales ?? ''}`}
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
                    className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-2xs"
                  />
                  <input
                    key={`maxSales_${maxSales ?? ''}`}
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
                    className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-2xs"
                  />
                </div>
              </div>

              {/* Operating Income */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t.search.operatingIncome}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    key={`minOpIncome_${minOpIncome ?? ''}`}
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
                    className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-2xs"
                  />
                  <input
                    key={`maxOpIncome_${maxOpIncome ?? ''}`}
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
                    className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-2xs"
                  />
                </div>
              </div>

              {/* Ordinary Income */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t.search.ordinaryIncome}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    key={`minOrdIncome_${minOrdIncome ?? ''}`}
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
                    className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-2xs"
                  />
                  <input
                    key={`maxOrdIncome_${maxOrdIncome ?? ''}`}
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
                    className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-2xs"
                  />
                </div>
              </div>

              {/* Net Income */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t.search.netIncome}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    key={`minNetIncome_${minNetIncome ?? ''}`}
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
                    className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-2xs"
                  />
                  <input
                    key={`maxNetIncome_${maxNetIncome ?? ''}`}
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
                    className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-2xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Optional Sticky Apply Button */}
      {onApplyFilters && (
        <div className="sticky bottom-0 left-0 right-0 pt-3 mt-3 bg-white/95 dark:bg-[#161B22]/95 backdrop-blur-xs border-t border-slate-200 dark:border-slate-800 z-20">
          <button
            type="button"
            onClick={onApplyFilters}
            className="w-full py-2.5 px-4 bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{locale === 'en' ? 'Apply Filters' : locale === 'vi' ? 'Áp dụng bộ lọc' : 'この条件で検索する'}</span>
          </button>
        </div>
      )}
    </aside>
  );
};
