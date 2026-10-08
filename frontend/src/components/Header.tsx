"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  User,
  Globe,
  ChevronDown,
  Check,
  FileSpreadsheet,
  SendHorizontal,
  CreditCard,
  Bookmark,
  Kanban,
  ShieldCheck,
  Building2,
  ArrowUpRight,
  Download
} from "lucide-react";
import { LogoIcon } from "./LogoIcon";
import { useLanguage } from "@/context/LanguageContext";
import { LocaleLink } from "./LocaleLink";
import { usePathname, useRouter } from "next/navigation";
import { isAdminEmail } from "@/lib/adminAuth";

export const Header: React.FC = () => {
  const { isLoggedIn, user, logout, setAuthModalOpen } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);
  const [formCreditsBalance, setFormCreditsBalance] = useState<number | null>(null);

  const { locale, t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileLangDropdownOpen, setMobileLangDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isUserAdmin = Boolean(user && (user.role === "admin" || isAdminEmail(user.email)));

  const changeLanguage = (newLocale: string) => {
    if (newLocale === locale) return;
    // Set cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    
    // Replace the current locale prefix in the URL path
    const segments = pathname.split("/");
    if (["ja", "en", "vi"].includes(segments[1])) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    const newPath = segments.join("/");
    setLangDropdownOpen(false);
    setMobileLangDropdownOpen(false);
    router.push(newPath);
  };

  const fetchHeaderQuota = useCallback(async () => {
    if (!isLoggedIn || !user?.email) return;
    try {
      const res = await fetch(`/api/export/quota-check?email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.quota) {
          setQuotaRemaining(data.quota.remaining);
          if (typeof data.quota.form_credits_balance === "number") {
            setFormCreditsBalance(data.quota.form_credits_balance);
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch header quota", e);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoggedIn && user?.email) {
      fetchHeaderQuota();
    } else {
      setQuotaRemaining(null);
      setFormCreditsBalance(null);
    }

    const handleQuotaUpdate = () => {
      fetchHeaderQuota();
    };

    window.addEventListener("quotaUpdated", handleQuotaUpdate);
    window.addEventListener("formCreditsUpdated", handleQuotaUpdate);
    return () => {
      window.removeEventListener("quotaUpdated", handleQuotaUpdate);
      window.removeEventListener("formCreditsUpdated", handleQuotaUpdate);
    };
  }, [isLoggedIn, user?.email, fetchHeaderQuota]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const currentLanguageLabel = locale === "en" ? "English" : locale === "vi" ? "Tiếng Việt" : "日本語";

  return (
    <header data-nosnippet className="sticky top-0 z-40 backdrop-blur-md bg-white/95 border-b border-slate-200/80 dark:bg-[#0D1117]/95 dark:border-slate-800/80 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <LocaleLink href="/" className="flex items-center gap-3 active:scale-98 transition-transform">
          <div className="w-9 h-9 rounded-xl bg-[#1B4F8A] flex items-center justify-center shadow-xs">
            <LogoIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            Kigyou<span className="text-[#1B4F8A] dark:text-blue-400">-list</span>
          </span>
        </LocaleLink>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold">
          <LocaleLink href="/search" prefetch={true} className="text-slate-600 hover:text-[#1B4F8A] dark:text-slate-350 dark:hover:text-blue-400 transition-colors">
            {t.header.search}
          </LocaleLink>
          <LocaleLink href="/directory" prefetch={true} className="text-slate-600 hover:text-[#1B4F8A] dark:text-slate-350 dark:hover:text-blue-400 transition-colors">
            {t.header.directory}
          </LocaleLink>
          <LocaleLink href="/pricing" prefetch={true} className="text-slate-600 hover:text-[#1B4F8A] dark:text-slate-350 dark:hover:text-blue-400 transition-colors">
            {t.header.pricing}
          </LocaleLink>
          <LocaleLink href="/form-marketing" prefetch={true} className="text-slate-600 hover:text-[#1B4F8A] dark:text-slate-350 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
            <span>{t.header.formDm}</span>
            <span className="text-[9px] bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider">NEW</span>
          </LocaleLink>
          {isLoggedIn && (
            <LocaleLink href="/dashboard" prefetch={true} className="text-slate-600 hover:text-[#1B4F8A] dark:text-slate-300 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" />
              {t.header.dashboard}
            </LocaleLink>
          )}
        </nav>

        {/* Auth & Lang Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language Switcher Dropdown (Standard Japanese B2B: Globe Icon + Formal Names, fixes Windows JP JP bug) */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              aria-label="Select language"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white hover:bg-slate-50/80 dark:bg-[#151B22] dark:hover:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all shadow-2xs cursor-pointer active:scale-97 group"
            >
              <Globe className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400 group-hover:rotate-12 transition-transform duration-200" />
              <span>{currentLanguageLabel}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${langDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {langDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setLangDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white border border-slate-200 shadow-xl dark:bg-[#1C2128] dark:border-slate-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-slate-100 dark:divide-slate-800/60">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {locale === "en" ? "Select Language" : locale === "vi" ? "Chọn ngôn ngữ" : "表示言語の選択"}
                  </div>
                  <div className="py-1">
                    {[
                      { code: "ja", label: "日本語", sub: "JA" },
                      { code: "en", label: "English", sub: "EN" },
                      { code: "vi", label: "Tiếng Việt", sub: "VI" }
                    ].map((item) => (
                      <button
                        key={item.code}
                        onClick={() => changeLanguage(item.code)}
                        className={`w-full px-3.5 py-2 text-left text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                          locale === item.code
                            ? "text-[#1B4F8A] font-bold bg-[#1B4F8A]/5 dark:text-blue-300 dark:bg-blue-950/40"
                            : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{item.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({item.sub})</span>
                        </div>
                        {locale === item.code && <Check className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {!mounted ? (
            <div className="w-32 h-8 bg-slate-100 dark:bg-slate-850 rounded-xl animate-pulse" />
          ) : isLoggedIn ? (
            /* User Profile & Account Dropdown (Upgraded for B2B Corporate Japan Standard) */
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-white hover:bg-slate-50/90 dark:bg-[#151B22] dark:hover:bg-slate-800/80 border border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 rounded-xl cursor-pointer transition-all active:scale-97 shadow-2xs group"
              >
                <div className="w-6 h-6 rounded-full bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-blue-950/60 dark:text-blue-300 border border-[#1B4F8A]/20 flex items-center justify-center font-black text-[11px] shrink-0">
                  {user?.name ? user.name.trim().charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                  {user?.name || "User"}{locale === "ja" ? " 様" : ""}
                </span>
                {isUserAdmin ? (
                  <span className="text-[9px] font-black bg-amber-500 text-white px-1.5 py-0.2 rounded-md shadow-2xs">ADMIN</span>
                ) : user?.role && user.role !== "free" ? (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-blue-50 text-[#1B4F8A] border border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                    {user.role}
                  </span>
                ) : null}
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${userDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl dark:bg-[#1C2128] dark:border-slate-800 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Header Info */}
                    <div className="px-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-full bg-[#1B4F8A] text-white flex items-center justify-center font-black text-sm shadow-xs">
                            {user?.name ? user.name.trim().charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                          </div>
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#1C2128]" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {user?.name || "User"}{locale === "ja" ? " 様" : ""}
                            </span>
                            {isUserAdmin && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 px-1.5 py-0.2 rounded-md shrink-0">
                                <ShieldCheck className="w-2.5 h-2.5 text-amber-600" /> ADMIN
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {user?.email || ""}
                          </span>
                        </div>
                      </div>

                      {/* Plan Badge & Status */}
                      <div className="flex items-center justify-between gap-1.5 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 text-[10px]">
                        <span className="text-slate-400 font-medium">
                          {locale === "en" ? "Subscription Plan" : locale === "vi" ? "Gói đăng ký" : "契約プラン"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md font-black uppercase text-[10px] tracking-wider ${
                          user?.role === "pro" 
                            ? "bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50" 
                            : user?.role === "business"
                            ? "bg-teal-100 text-teal-900 border border-teal-300 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900/50"
                            : user?.role === "enterprise"
                            ? "bg-purple-100 text-purple-900 border border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}>
                          {user?.role ? user.role.toUpperCase() : "FREE"} PLAN
                        </span>
                      </div>

                      {/* Resource Quotas Box (CSV + Form Marketing Credits) */}
                      <div className="mt-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-2.5">
                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                          <span>{locale === "en" ? "Resources & Balances" : locale === "vi" ? "Hạn ngạch & Số dư" : "利用枠・残高ステータス"}</span>
                          <LocaleLink
                            href="/pricing"
                            onClick={() => setUserDropdownOpen(false)}
                            className="text-[#1B4F8A] hover:underline dark:text-blue-400 flex items-center gap-0.5 text-[9px] font-bold capitalize"
                          >
                            <span>{locale === "en" ? "Upgrade" : locale === "vi" ? "Nâng cấp" : "増枠・変更"}</span>
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </LocaleLink>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {/* CSV Export Balance */}
                          <div className="bg-white dark:bg-[#151B22] p-2 rounded-lg border border-slate-200/60 dark:border-slate-800 flex flex-col">
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                              <Download className="w-3 h-3 text-blue-600" />
                              <span>{locale === "en" ? "CSV Export" : locale === "vi" ? "Xuất CSV" : "CSV出力枠"}</span>
                            </div>
                            <span className="text-xs font-black text-slate-900 dark:text-white mt-1">
                              {quotaRemaining !== null ? `${quotaRemaining.toLocaleString()}行` : "—"}
                            </span>
                          </div>

                          {/* Form DM Balance */}
                          <div className="bg-white dark:bg-[#151B22] p-2 rounded-lg border border-slate-200/60 dark:border-slate-800 flex flex-col">
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                              <SendHorizontal className="w-3 h-3 text-indigo-600" />
                              <span>{locale === "en" ? "Form DM" : locale === "vi" ? "Gửi Form DM" : "フォーム営業枠"}</span>
                            </div>
                            <span className="text-xs font-black text-slate-900 dark:text-white mt-1">
                              {formCreditsBalance !== null ? `${formCreditsBalance.toLocaleString()}件` : "0件"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Navigation Links */}
                    <div className="pt-2 px-2 flex flex-col gap-0.5 text-xs font-semibold">
                      {/* Admin console shortcut (Only shown for Admin users) */}
                      {isUserAdmin && (
                        <LocaleLink
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center justify-between px-3 py-2 text-amber-900 dark:text-amber-300 bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 rounded-xl transition-colors cursor-pointer border border-amber-200/80 dark:border-amber-800/60 font-bold mb-1 shadow-2xs"
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-600" />
                            <span>統括管理コンソール (Admin)</span>
                          </div>
                          <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
                        </LocaleLink>
                      )}

                      {/* Section 1: ABM Workspace */}
                      <div className="px-2 pt-1 pb-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {locale === "en" ? "ABM Workspace" : locale === "vi" ? "Không gian bán hàng ABM" : "ABM営業ワークスペース"}
                      </div>

                      <LocaleLink
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-500" />
                        <span>{t.header.mypage} ({locale === "en" ? "Overview" : locale === "vi" ? "Tổng quan" : "概要"})</span>
                      </LocaleLink>

                      <LocaleLink
                        href="/dashboard?tab=list"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Bookmark className="w-4 h-4 text-slate-500" />
                        <span>{locale === "en" ? "Saved Companies (MyList)" : locale === "vi" ? "Doanh nghiệp đã lưu (MyList)" : "保存企業リスト (MyList)"}</span>
                      </LocaleLink>

                      <LocaleLink
                        href="/dashboard?tab=kanban"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Kanban className="w-4 h-4 text-slate-500" />
                        <span>{locale === "en" ? "Sales Kanban Pipeline" : locale === "vi" ? "Bảng Kanban tiếp cận" : "かんばん営業管理ボード"}</span>
                      </LocaleLink>

                      <LocaleLink
                        href="/dashboard?tab=formCampaigns"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center justify-between px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <SendHorizontal className="w-4 h-4 text-indigo-500" />
                          <span>{locale === "en" ? "Form DM Outreach" : locale === "vi" ? "Chiến dịch gửi Form DM" : "フォーム営業・配信管理"}</span>
                        </div>
                        <span className="text-[9px] bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded-full uppercase">NEW</span>
                      </LocaleLink>

                      <LocaleLink
                        href="/dashboard?tab=exports"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                        <span>{locale === "en" ? "CSV Export History" : locale === "vi" ? "Lịch sử tải CSV" : "CSVダウンロード履歴"}</span>
                      </LocaleLink>

                      {/* Section 2: Account & Billing */}
                      <div className="px-2 pt-2 pb-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 dark:border-slate-800/60 mt-1">
                        {locale === "en" ? "Billing & Organization" : locale === "vi" ? "Hợp đồng & Thanh toán" : "契約・インボイス設定"}
                      </div>

                      <LocaleLink
                        href="/dashboard?tab=payments"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4 text-slate-500" />
                        <span>{locale === "en" ? "Billing & Tax Invoices" : locale === "vi" ? "Lịch sử mua & Hóa đơn Invoice" : "購入履歴・インボイス領収書"}</span>
                      </LocaleLink>

                      <LocaleLink
                        href="/dashboard?tab=companies"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Building2 className="w-4 h-4 text-slate-500" />
                        <span>{locale === "en" ? "Official Company Profile" : locale === "vi" ? "Quản lý chủ sở hữu công ty" : "企業公式オーナー管理"}</span>
                      </LocaleLink>

                      {/* Logout */}
                      <div className="border-t border-slate-100 dark:border-slate-800/60 pt-1 mt-1">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span>{t.header.logout}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-[#1B4F8A] hover:bg-[#163e6d] rounded-xl shadow-xs transition-colors"
            >
              {t.header.loginOrRegister}
            </button>
          )}
        </div>

        {/* Mobile Menu Button & Mobile Language Selector */}
        <div className="flex md:hidden items-center gap-2">
          {/* Mobile Language Selector Dropdown (Globe Icon + Clean ISO) */}
          <div className="relative">
            <button
              onClick={() => setMobileLangDropdownOpen(!mobileLangDropdownOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 active:scale-95 transition-all shadow-2xs cursor-pointer mr-1"
            >
              <Globe className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>{locale.toUpperCase()}</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </button>
            {mobileLangDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setMobileLangDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white border border-slate-200 shadow-xl dark:bg-[#1C2128] dark:border-slate-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {[
                    { code: "ja", label: "日本語 (JA)" },
                    { code: "en", label: "English (EN)" },
                    { code: "vi", label: "Tiếng Việt (VI)" }
                  ].map((item) => (
                    <button
                      key={item.code}
                      onClick={() => { changeLanguage(item.code); setMobileLangDropdownOpen(false); }}
                      className={`w-full px-3 py-2 text-left text-xs font-bold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between cursor-pointer ${
                        locale === item.code ? "text-[#1B4F8A] bg-[#1B4F8A]/5 dark:text-blue-300 dark:bg-blue-950/40" : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span>{item.label}</span>
                      {locale === item.code && <Check className="w-3 h-3 text-[#1B4F8A] dark:text-blue-400" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {mounted && isLoggedIn && (
            <span className="text-[10px] font-black bg-blue-50 text-[#1B4F8A] border border-blue-200/80 px-2 py-0.5 rounded-md dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
              {isUserAdmin ? "ADMIN" : user?.role ? user.role.toUpperCase() : "FREE"}
            </span>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-850"
          >
            {mobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1117] transition-all py-4 px-6 flex flex-col gap-4 shadow-inner">
          <LocaleLink 
            href="/search" 
            prefetch={true}
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-bold text-slate-600 hover:text-primary dark:text-slate-300 py-1"
          >
            {t.header.search}
          </LocaleLink>
          <LocaleLink 
            href="/directory" 
            prefetch={true}
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-bold text-slate-600 hover:text-primary dark:text-slate-300 py-1"
          >
            {t.header.directory}
          </LocaleLink>
          <LocaleLink 
            href="/pricing" 
            prefetch={true}
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-bold text-slate-600 hover:text-primary dark:text-slate-300 py-1"
          >
            {t.header.pricing}
          </LocaleLink>
          <LocaleLink 
            href="/form-marketing" 
            prefetch={true}
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-bold text-slate-600 hover:text-primary dark:text-slate-300 py-1 flex items-center justify-between"
          >
            <span>{t.header.formDm}</span>
            <span className="text-[9px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded-full uppercase">NEW</span>
          </LocaleLink>
          {isLoggedIn && (
            <LocaleLink 
              href="/dashboard" 
              prefetch={true}
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-slate-600 hover:text-primary dark:text-slate-300 py-1"
            >
              {t.header.abmShort}
            </LocaleLink>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
            {!mounted ? null : isLoggedIn ? (
              <>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                      {user?.name || "User"}{locale === "ja" ? " 様" : ""}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      user?.role === "pro" 
                        ? "bg-amber-100 text-amber-900 border border-amber-300" 
                        : "bg-slate-200 text-slate-800"
                    }`}>
                      {isUserAdmin ? "ADMIN" : user?.role ? user.role.toUpperCase() : "FREE"}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</span>
                  
                  {/* Quotas Summary */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700">
                      <span className="text-slate-400 block">CSV出力残枠</span>
                      <strong className="text-slate-900 dark:text-white font-bold">{quotaRemaining !== null ? `${quotaRemaining.toLocaleString()}行` : "—"}</strong>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700">
                      <span className="text-slate-400 block">フォーム営業枠</span>
                      <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{formCreditsBalance !== null ? `${formCreditsBalance.toLocaleString()}件` : "0件"}</strong>
                    </div>
                  </div>
                </div>

                {isUserAdmin && (
                  <LocaleLink
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 text-center text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-xl border border-amber-300 block shadow-2xs"
                  >
                    統括管理コンソール (Admin)
                  </LocaleLink>
                )}

                <LocaleLink
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#163e6d] rounded-xl shadow-xs block"
                >
                  {t.header.mypage} (ダッシュボード)
                </LocaleLink>
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 text-center text-xs font-bold text-slate-600 hover:text-slate-850 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-xl"
                >
                  {t.header.logout}
                </button>
              </>
            ) : (
              <button
                onClick={() => { setAuthModalOpen(true); setMobileMenuOpen(false); }}
                className="w-full py-2.5 text-center text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#163e6d] rounded-xl shadow-md"
              >
                {t.header.loginOrRegister}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
