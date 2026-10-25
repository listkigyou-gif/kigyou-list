"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  RotateCcw, 
  ChevronDown,
  ChevronUp,
  Lock,
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
  isListed?: boolean;
  hasTokuteiLic?: boolean;
  hasShigyoLic?: boolean;
  hasRealEstateLic?: boolean;
  hasKobutsuLic?: boolean;
  hasConstructionLic?: boolean;
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
  isListed,
  hasTokuteiLic,
  hasShigyoLic,
  hasRealEstateLic,
  hasKobutsuLic,
  hasConstructionLic,
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

  // Collapsible Accordion states
  const [openArea, setOpenArea] = useState(true);
  const [openChannels, setOpenChannels] = useState(true);
  const [openScale, setOpenScale] = useState(true);
  const [openSignals, setOpenSignals] = useState(true);
  const [openLicenses, setOpenLicenses] = useState(true);

  const activeCount = [
    prefCode, city, indCode, minEmp, maxEmp, minCap, maxCap,
    hasHiring, hasSubsidy, hasBidding, minEstYear, maxEstYear,
    hasAward, hasCertification, hasPatent, hasFinancials, isListed,
    hasTokuteiLic, hasShigyoLic, hasRealEstateLic, hasKobutsuLic, hasConstructionLic,
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

  const handleKeyDownEnter = (e: React.KeyboardEvent<HTMLInputElement>, updates: Record<string, string | null | undefined>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      navigate(updates, true);
    }
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
        else if (key === "is_listed") updates.is_listed = val === "true";
        else if (key === "tokutei_lic") updates.tokutei_lic = val === "true";
        else if (key === "shigyo_lic") updates.shigyo_lic = val === "true";
        else if (key === "real_estate_lic") updates.real_estate_lic = val === "true";
        else if (key === "kobutsu_lic") updates.kobutsu_lic = val === "true";
        else if (key === "construction_lic") updates.construction_lic = val === "true";
        else if (key === "min_sales") updates.min_sales = val;
        else if (key === "max_sales") updates.max_sales = val;
        else if (key === "email") updates.email = val === "true";
        else if (key === "phone") updates.phone = val === "true";
        else if (key === "website") updates.website = val === "true";
        else if (key === "fax") updates.fax = val === "true";
        else if (key === "contact_form") updates.contact_form = val === "true";
        else if (key === "email_type") updates.email_type = val;
        else if (key === "status") updates.company_status = val;
        else if (key === "min_operating_income") updates.min_operating_income = val;
        else if (key === "max_operating_income") updates.max_operating_income = val;
        else if (key === "min_ordinary_income") updates.min_ordinary_income = val;
        else if (key === "max_ordinary_income") updates.max_ordinary_income = val;
        else if (key === "min_net_income") updates.min_net_income = val;
        else if (key === "max_net_income") updates.max_net_income = val;
      });
      onFilterChange(updates, autoExecute);
    } else {
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
        is_listed: isListed ? "true" : undefined,
        tokutei_lic: hasTokuteiLic ? "true" : undefined,
        shigyo_lic: hasShigyoLic ? "true" : undefined,
        real_estate_lic: hasRealEstateLic ? "true" : undefined,
        kobutsu_lic: hasKobutsuLic ? "true" : undefined,
        construction_lic: hasConstructionLic ? "true" : undefined,
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

      const merged = { ...current, ...overrides, page: "1" };
      Object.entries(merged).forEach(([k, v]) => {
        if (v != null && v !== "" && v !== "false") params.set(k, v);
      });
      router.push(`/search?${params.toString()}`);
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
        is_listed: false,
        tokutei_lic: false,
        shigyo_lic: false,
        real_estate_lic: false,
        kobutsu_lic: false,
        construction_lic: false,
        min_sales: null,
        max_sales: null,
        email: false,
        phone: false,
        website: false,
        fax: false,
        contact_form: false,
        email_type: null,
        company_status: null,
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
    <aside 
      aria-label="絞り込み検索"
      className={className || "hidden lg:block w-76 shrink-0 bg-white border border-slate-200/90 dark:bg-[#161B22] dark:border-slate-800 rounded-xl p-4 sticky top-20 max-h-[calc(100vh-6.5rem)] overflow-y-auto scrollbar-thin shadow-2xs text-xs"}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
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
            className="text-xs font-medium text-slate-400 hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t.search.clear}</span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">

        {/* ========================================================
            GROUP 1: 地域・業界 (Area & Industry)
            ======================================================== */}
        <div className="border border-slate-200/80 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
          <button
            type="button"
            onClick={() => setOpenArea(!openArea)}
            className="w-full flex items-center justify-between p-3 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <span>{locale === 'ja' ? '地域・業界' : locale === 'vi' ? 'Khu vực & Ngành nghề' : 'Area & Industry'}</span>
            {openArea ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openArea && (
            <div className="p-3 pt-0 flex flex-col gap-2.5">
              {/* Prefecture */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t.search.prefecture}
                </label>
                <select
                  value={prefCode || ""}
                  onChange={(e) => navigate({ prefecture: e.target.value || null, city: null }, true)}
                  className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <option value="">{t.search.allPrefectures}</option>
                  {prefectures.map((pref) => (
                    <option key={pref.code} value={pref.code}>
                      {(t.prefectures as Record<string, string>)?.[pref.name] || pref.name} ({pref.count.toLocaleString('ja-JP')}社)
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
                  onChange={(e) => navigate({ city: e.target.value || null }, true)}
                  disabled={!prefCode}
                  className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900 cursor-pointer"
                >
                  <option value="">{t.search.allCities}</option>
                  {prefCode && cities && cities.map((c) => (
                    <option key={c.cityName} value={c.cityName}>
                      {c.cityName} ({c.count.toLocaleString('ja-JP')}社)
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
                  onChange={(e) => navigate({ industry: e.target.value || null }, true)}
                  className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <option value="">{t.search.allIndustries}</option>
                  {industries.map((major) => (
                    <React.Fragment key={major.code}>
                      <option value={major.code} className="font-semibold text-slate-900 dark:text-white">
                        {major.code} {(t.majorIndustries as Record<string, string>)?.[major.code] || major.name} (計 {major.totalCount.toLocaleString('ja-JP')}社)
                      </option>
                      {major.children.map((medium) => (
                        <option key={medium.code} value={medium.code} className="text-slate-700 dark:text-slate-300">
                          {"\u00A0\u00A0"}{medium.code} {getIndustryName(medium.name, locale)} ({medium.count.toLocaleString('ja-JP')}社)
                        </option>
                      ))}
                    </React.Fragment>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            GROUP 2: アプローチ手段・連絡先 (B2B Channels)
            ======================================================== */}
        <div className="border border-slate-200/80 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
          <button
            type="button"
            onClick={() => setOpenChannels(!openChannels)}
            className="w-full flex items-center justify-between p-3 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <span>{locale === 'ja' ? 'アプローチ手段・連絡先' : locale === 'vi' ? 'Kênh liên hệ & Gửi Form' : 'Contact Channels'}</span>
            {openChannels ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openChannels && (
            <div className="p-3 pt-0 flex flex-col gap-2">
              {/* Contact Form */}
              <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white py-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!hasContactForm}
                    onChange={(e) => navigate({ contact_form: e.target.checked ? "true" : null }, true)}
                    className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                  />
                  <span>{locale === 'en' ? 'Contact Form' : locale === 'vi' ? 'Biểu mẫu liên hệ' : 'お問い合わせフォームあり'}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  (235,290社)
                </span>
              </label>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white py-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={hasEmail}
                      onChange={(e) => navigate({ 
                        email: e.target.checked ? "true" : null,
                        email_type: e.target.checked ? emailType : null 
                      }, true)}
                      className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                    />
                    <span>{t.search.emailLabel}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    (176,505社)
                  </span>
                </label>

                {hasEmail && (
                  <div className="pl-6 pb-1">
                    <select
                      value={emailType || ""}
                      onChange={(e) => navigate({ email_type: e.target.value || null }, true)}
                      className="w-full text-[11px] text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <option value="">{locale === 'en' ? 'All Types' : locale === 'vi' ? 'Tất cả loại' : '全種別'}</option>
                      <option value="GENERAL">{locale === 'en' ? 'General / Info' : locale === 'vi' ? 'Đại diện / Chung' : '代表・総合'}</option>
                      <option value="SALES">{locale === 'en' ? 'Sales' : locale === 'vi' ? 'Kinh doanh' : '営業'}</option>
                      <option value="RECRUIT">{locale === 'en' ? 'Recruiting' : locale === 'vi' ? 'Tuyển dụng' : '採用'}</option>
                      <option value="PR">{locale === 'en' ? 'PR / Media' : locale === 'vi' ? 'Truyền thông' : '広報・PR'}</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Phone */}
              <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white py-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasPhone}
                    onChange={(e) => navigate({ phone: e.target.checked ? "true" : null }, true)}
                    className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                  />
                  <span>{t.search.phoneLabel}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  (1,758,775社)
                </span>
              </label>

              {/* Website */}
              <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white py-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasWebsite}
                    onChange={(e) => navigate({ website: e.target.checked ? "true" : null }, true)}
                    className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                  />
                  <span>{t.search.websiteLabel}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  (539,749社)
                </span>
              </label>

              {/* Fax */}
              <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white py-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasFax}
                    onChange={(e) => navigate({ fax: e.target.checked ? "true" : null }, true)}
                    className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                  />
                  <span>{t.search.faxLabel}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  (301,404社)
                </span>
              </label>
            </div>
          )}
        </div>

        {/* ========================================================
            GROUP 3: 企業規模・財務情報 (FSA EDINET & Scale)
            ======================================================== */}
        <div className="border border-slate-200/80 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
          <button
            type="button"
            onClick={() => setOpenScale(!openScale)}
            className="w-full flex items-center justify-between p-3 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <span>{locale === 'ja' ? '企業規模・財務情報 (EDINET)' : locale === 'vi' ? 'Quy mô & Tài chính EDINET' : 'Scale & Financials'}</span>
            {openScale ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openScale && (
            <div className="p-3 pt-0 flex flex-col gap-2.5">
              {/* Listed Companies (上場企業) */}
              <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white py-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!isListed}
                    onChange={(e) => navigate({ is_listed: e.target.checked ? "true" : null }, true)}
                    className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                  />
                  <span>
                    {locale === 'ja' ? '上場企業のみ' : locale === 'vi' ? 'Chỉ DN niêm yết' : 'Listed Companies Only'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  (4,852社)
                </span>
              </label>

              {/* FSA EDINET Financial Report Presence */}
              <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white py-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasFinancials}
                    onChange={(e) => navigate({ financials: e.target.checked ? "true" : null }, true)}
                    className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                  />
                  <span>{t.search.hasFinancials}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  (17,427社)
                </span>
              </label>

              {/* Capital Inputs & Presets */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t.search.capital} ({locale === 'ja' ? '万円' : '10K JPY'})
                </label>
                <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                  <input
                    type="number"
                    placeholder={t.search.minCapital}
                    defaultValue={displayCapital(minCap)}
                    onBlur={(e) => navigate({ min_capital: processCapitalInput(e.target.value) })}
                    onKeyDown={(e) => handleKeyDownEnter(e, { min_capital: processCapitalInput(e.currentTarget.value) })}
                    className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                  />
                  <input
                    type="number"
                    placeholder={t.search.maxCapital}
                    defaultValue={displayCapital(maxCap)}
                    onBlur={(e) => navigate({ max_capital: processCapitalInput(e.target.value) })}
                    onKeyDown={(e) => handleKeyDownEnter(e, { max_capital: processCapitalInput(e.currentTarget.value) })}
                    className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: '1,000万+', value: 1000 },
                    { label: '5,000万+', value: 5000 },
                    { label: '1億+', value: 10000 },
                  ].map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => navigate({ min_capital: minCap === p.value ? null : String(p.value), max_capital: null })}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded border transition-colors ${
                        minCap === p.value
                          ? "bg-[#1B4F8A] text-white border-[#1B4F8A]"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Employees Inputs & Presets */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t.search.employees} ({locale === 'ja' ? '名' : 'people'})
                </label>
                <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                  <input
                    type="number"
                    placeholder={t.search.minEmployees}
                    defaultValue={minEmp != null ? String(minEmp) : ""}
                    onBlur={(e) => navigate({ min_employees: e.target.value || null })}
                    onKeyDown={(e) => handleKeyDownEnter(e, { min_employees: e.currentTarget.value || null })}
                    className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                  />
                  <input
                    type="number"
                    placeholder={t.search.maxEmployees}
                    defaultValue={maxEmp != null ? String(maxEmp) : ""}
                    onBlur={(e) => navigate({ max_employees: e.target.value || null })}
                    onKeyDown={(e) => handleKeyDownEnter(e, { max_employees: e.currentTarget.value || null })}
                    className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: '10名+', value: 10 },
                    { label: '50名+', value: 50 },
                    { label: '100名+', value: 100 },
                  ].map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => navigate({ min_employees: minEmp === p.value ? null : String(p.value), max_employees: null })}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded border transition-colors ${
                        minEmp === p.value
                          ? "bg-[#1B4F8A] text-white border-[#1B4F8A]"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Establishment Year */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t.search.establishmentYear}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    placeholder="YYYY"
                    defaultValue={minEstYear != null ? String(minEstYear) : ""}
                    onBlur={(e) => navigate({ min_establishment_year: e.target.value || null })}
                    onKeyDown={(e) => handleKeyDownEnter(e, { min_establishment_year: e.currentTarget.value || null })}
                    className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                  />
                  <input
                    type="number"
                    placeholder="YYYY"
                    defaultValue={maxEstYear != null ? String(maxEstYear) : ""}
                    onBlur={(e) => navigate({ max_establishment_year: e.target.value || null })}
                    onKeyDown={(e) => handleKeyDownEnter(e, { max_establishment_year: e.currentTarget.value || null })}
                    className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            GROUP 4: 公的信用・ビジネスシグナル (Trust & GEPS Signals)
            ======================================================== */}
        <div className="border border-slate-200/80 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
          <button
            type="button"
            onClick={() => setOpenSignals(!openSignals)}
            className="w-full flex items-center justify-between p-3 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <span>{locale === 'ja' ? '公的信用・シグナル' : locale === 'vi' ? 'Tín nhiệm & Tín hiệu kinh doanh' : 'Trust & Signals'}</span>
            {openSignals ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openSignals && (
            <div className="p-3 pt-0 flex flex-col gap-2">
              {/* Bidding (GEPS) */}
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white py-1">
                <input
                  type="checkbox"
                  checked={hasBidding}
                  onChange={(e) => navigate({ bidding: e.target.checked ? "true" : null }, true)}
                  className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                />
                <span>{locale === 'ja' ? '官公庁入札・落札実績あり (GEPS)' : locale === 'vi' ? 'Trúng thầu cơ quan chính phủ (GEPS)' : 'Public Procurement & Bids (GEPS)'}</span>
              </label>

              {/* Subsidy */}
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white py-1">
                <input
                  type="checkbox"
                  checked={hasSubsidy}
                  onChange={(e) => navigate({ subsidy: e.target.checked ? "true" : null }, true)}
                  className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                />
                <span>{locale === 'ja' ? '国・自治体の補助金受給履歴あり' : locale === 'vi' ? 'Có lịch sử nhận trợ cấp chính phủ' : 'Subsidies & Grants History'}</span>
              </label>

              {/* Hiring (HelloWork) */}
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white py-1">
                <input
                  type="checkbox"
                  checked={hasHiring}
                  onChange={(e) => navigate({ hiring: e.target.checked ? "true" : null }, true)}
                  className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                />
                <span>{locale === 'ja' ? '求人募集中・採用シグナルあり' : locale === 'vi' ? 'Đang tuyển dụng / Có tin tuyển dụng' : 'Actively Hiring Signals'}</span>
              </label>

              {/* Award */}
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white py-1">
                <input
                  type="checkbox"
                  checked={hasAward}
                  onChange={(e) => navigate({ award: e.target.checked ? "true" : null }, true)}
                  className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                />
                <span>{t.search.award}</span>
              </label>

              {/* Certification */}
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white py-1">
                <input
                  type="checkbox"
                  checked={hasCertification}
                  onChange={(e) => navigate({ certification: e.target.checked ? "true" : null }, true)}
                  className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                />
                <span>{t.search.certification}</span>
              </label>
            </div>
          )}
        </div>

        {/* ========================================================
            GROUP 5: 公的許認可・士業専門職 (Licenses & Accreditations)
            ======================================================== */}
        <div className="border border-slate-200/80 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
          <button
            type="button"
            onClick={() => setOpenLicenses(!openLicenses)}
            className="w-full flex items-center justify-between p-3 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <span>{locale === 'ja' ? '公的許認可・士業専門職' : locale === 'vi' ? 'Giấy phép công & Văn phòng chuyên môn' : 'Licenses & Professional Corps'}</span>
            {openLicenses ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openLicenses && (
            <div className="p-3 pt-0 flex flex-col gap-2">
              {/* Tokutei Gino Support Organization */}
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white py-1">
                <input
                  type="checkbox"
                  checked={hasTokuteiLic}
                  onChange={(e) => navigate({ tokutei_lic: e.target.checked ? "true" : null }, true)}
                  className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                />
                <span className="flex items-center justify-between flex-1">
                  <span>{locale === 'ja' ? '登録支援機関 (出入国在留管理庁)' : locale === 'vi' ? 'Cơ quan hỗ trợ kỹ năng đặc định (ISA)' : 'Registered Support Org (ISA)'}</span>
                  <span className="text-[10px] text-slate-650 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">7,762社</span>
                </span>
              </label>

              {/* Statutory Professional Corporations */}
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white py-1">
                <input
                  type="checkbox"
                  checked={hasShigyoLic}
                  onChange={(e) => navigate({ shigyo_lic: e.target.checked ? "true" : null }, true)}
                  className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                />
                <span className="flex items-center justify-between flex-1">
                  <span>{locale === 'ja' ? '士業専門職法人 (税理士・会計・法務)' : locale === 'vi' ? 'Pháp nhân chuyên môn (Kế toán, Thuế, Luật)' : 'Statutory Professional Corps'}</span>
                  <span className="text-[10px] text-slate-650 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">635社</span>
                </span>
              </label>

              {/* Real Estate Takken */}
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white py-1">
                <input
                  type="checkbox"
                  checked={hasRealEstateLic}
                  onChange={(e) => navigate({ real_estate_lic: e.target.checked ? "true" : null }, true)}
                  className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                />
                <span className="flex items-center justify-between flex-1">
                  <span>{locale === 'ja' ? '宅地建物取引業 (不動産・国交省)' : locale === 'vi' ? 'Môi giới BĐS (MLIT)' : 'Real Estate Brokerage (MLIT)'}</span>
                  <span className="text-[10px] text-slate-650 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">26,035社</span>
                </span>
              </label>

              {/* Kobutsu Dealer */}
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white py-1">
                <input
                  type="checkbox"
                  checked={hasKobutsuLic}
                  onChange={(e) => navigate({ kobutsu_lic: e.target.checked ? "true" : null }, true)}
                  className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                />
                <span className="flex items-center justify-between flex-1">
                  <span>{locale === 'ja' ? '古物商許可 (公安委員会)' : locale === 'vi' ? 'Kinh doanh đồ cũ / Cầm đồ' : 'Secondhand Dealer License'}</span>
                  <span className="text-[10px] text-slate-650 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">9,074社</span>
                </span>
              </label>

              {/* Construction */}
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white py-1">
                <input
                  type="checkbox"
                  checked={hasConstructionLic}
                  onChange={(e) => navigate({ construction_lic: e.target.checked ? "true" : null }, true)}
                  className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                />
                <span className="flex items-center justify-between flex-1">
                  <span>{locale === 'ja' ? '建設業許可 (国土交通省)' : locale === 'vi' ? 'Giấy phép xây dựng (MLIT)' : 'Construction License (MLIT)'}</span>
                  <span className="text-[10px] text-slate-650 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">411,599社</span>
                </span>
              </label>
            </div>
          )}
        </div>

      </div>

      {/* Sticky Bottom Apply Button */}
      {onApplyFilters && (
        <div className="sticky bottom-0 left-0 right-0 pt-3 pb-1 mt-3 bg-white/95 dark:bg-[#161B22]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 z-30 shadow-xs">
          <button
            type="button"
            onClick={() => {
              onApplyFilters();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full py-2.5 px-4 text-white text-xs font-semibold rounded-lg bg-[#1B4F8A] hover:bg-[#153e6d] shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <span>
              {activeCount > 0 
                ? (locale === 'ja' ? `この条件で検索する (${activeCount}件)` : `Apply Filters (${activeCount})`)
                : (locale === 'ja' ? 'この条件で検索する' : 'Apply Filters')}
            </span>
          </button>
        </div>
      )}
    </aside>
  );
};
