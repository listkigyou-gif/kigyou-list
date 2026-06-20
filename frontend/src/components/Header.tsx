"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { LogOut, LayoutDashboard, Menu, X, User } from "lucide-react";
import { LogoIcon } from "./LogoIcon";
import { useLanguage } from "@/context/LanguageContext";
import { LocaleLink } from "./LocaleLink";
import { usePathname, useRouter } from "next/navigation";

export const Header: React.FC = () => {
  const { isLoggedIn, user, logout, setAuthModalOpen } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);

  const { locale, t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileLangDropdownOpen, setMobileLangDropdownOpen] = useState(false);

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
    router.push(newPath);
  };

  const fetchHeaderQuota = useCallback(async () => {
    if (!isLoggedIn || !user?.email) return;
    try {
      const res = await fetch(`/api/export/quota-check?email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        setQuotaRemaining(data.quota.remaining);
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
    }

    const handleQuotaUpdate = () => {
      fetchHeaderQuota();
    };

    window.addEventListener("quotaUpdated", handleQuotaUpdate);
    return () => {
      window.removeEventListener("quotaUpdated", handleQuotaUpdate);
    };
  }, [isLoggedIn, user?.email, fetchHeaderQuota]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  return (
    <header data-nosnippet className="sticky top-0 z-40 backdrop-blur-md bg-white/95 border-b border-slate-200/80 dark:bg-[#0D1117]/95 dark:border-slate-800/80 transition-all shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <LocaleLink href="/" className="flex items-center gap-3 active:scale-98 transition-transform">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
            <LogoIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            Kigyou<span className="text-secondary">-list</span>
          </span>
        </LocaleLink>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold">
          <LocaleLink href="/search" className="text-slate-600 hover:text-primary dark:text-slate-350 dark:hover:text-secondary transition-colors">
            {t.header.search}
          </LocaleLink>
          <LocaleLink href="/directory" className="text-slate-600 hover:text-primary dark:text-slate-350 dark:hover:text-secondary transition-colors">
            {t.header.directory}
          </LocaleLink>
          <LocaleLink href="/pricing" className="text-slate-600 hover:text-primary dark:text-slate-350 dark:hover:text-secondary transition-colors">
            {t.header.pricing}
          </LocaleLink>
          <LocaleLink href="/blog" className="text-slate-600 hover:text-primary dark:text-slate-350 dark:hover:text-secondary transition-colors">
            {t.header.blog}
          </LocaleLink>
          {isLoggedIn && (
            <LocaleLink href="/dashboard" className="text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-secondary transition-colors flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" />
              {t.header.dashboard}
            </LocaleLink>
          )}
        </nav>

        {/* Auth & Lang Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {/* Language Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <span>{locale === "en" ? "🇺🇸 EN" : locale === "vi" ? "🇻🇳 VI" : "🇯🇵 JP"}</span>
              <span className="text-[9px] opacity-60">▼</span>
            </button>
            {langDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setLangDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-28 rounded-xl bg-white border border-slate-200 shadow-lg dark:bg-[#1C2128] dark:border-slate-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={() => changeLanguage("ja")}
                    className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-2 cursor-pointer ${
                      locale === "ja" ? "text-primary dark:text-secondary bg-primary/5 dark:bg-secondary/5" : "text-slate-700 dark:text-slate-350"
                    }`}
                  >
                    <span>🇯🇵</span> JP
                  </button>
                  <button
                    onClick={() => changeLanguage("en")}
                    className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-2 cursor-pointer ${
                      locale === "en" ? "text-primary dark:text-secondary bg-primary/5 dark:bg-secondary/5" : "text-slate-700 dark:text-slate-350"
                    }`}
                  >
                    <span>🇺🇸</span> EN
                  </button>
                  <button
                    onClick={() => changeLanguage("vi")}
                    className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-2 cursor-pointer ${
                      locale === "vi" ? "text-primary dark:text-secondary bg-primary/5 dark:bg-secondary/5" : "text-slate-700 dark:text-slate-350"
                    }`}
                  >
                    <span>🇻🇳</span> VI
                  </button>
                </div>
              </>
            )}
          </div>

          {!mounted ? (
            <div className="w-32 h-8 bg-slate-100 dark:bg-slate-850 rounded-xl animate-pulse" />
          ) : isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="w-5.5 h-5.5 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <User className="w-3 h-3" />
                </div>
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                  {t.header.welcome.replace("{name}", user?.name || "")}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                  user?.role === "pro" 
                    ? "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50" 
                    : user?.role === "business"
                    ? "bg-teal-100 text-teal-800 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900/50"
                    : user?.role === "enterprise"
                    ? "bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50"
                    : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                }`}>
                  {user?.role ? t.header[`role${user.role.charAt(0).toUpperCase() + user.role.slice(1) as "Pro" | "Business" | "Enterprise"}`] || user.role.toUpperCase() : t.header.roleFree}
                </span>
                {quotaRemaining !== null && (
                  <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/20 dark:border-emerald-900/40 px-1.5 py-0.5 rounded ml-1">
                    {t.header.quota.replace("{quota}", quotaRemaining.toLocaleString())}
                  </span>
                )}
              </div>
              <LocaleLink
                href="/dashboard"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md shadow-primary/10 transition-all"
              >
                {t.header.mypage}
              </LocaleLink>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all"
                title={t.header.logout}
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="text-xs font-black text-slate-600 hover:text-slate-900 dark:text-slate-350 dark:hover:text-white transition-colors"
              >
                {t.header.login}
              </button>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all scale-100 hover:scale-[1.02] active:scale-98"
              >
                {t.header.register}
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          {/* Mobile Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMobileLangDropdownOpen(!mobileLangDropdownOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 active:scale-95 transition-all shadow-sm cursor-pointer mr-1"
            >
              <span>{locale === "en" ? "🇺🇸 EN" : locale === "vi" ? "🇻🇳 VI" : "🇯🇵 JP"}</span>
              <span className="text-[7px] opacity-60">▼</span>
            </button>
            {mobileLangDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setMobileLangDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-28 rounded-xl bg-white border border-slate-200 shadow-lg dark:bg-[#1C2128] dark:border-slate-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={() => { changeLanguage("ja"); setMobileLangDropdownOpen(false); }}
                    className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-2 cursor-pointer ${
                      locale === "ja" ? "text-primary dark:text-secondary bg-primary/5 dark:bg-secondary/5" : "text-slate-700 dark:text-slate-350"
                    }`}
                  >
                    <span>🇯🇵</span> JP
                  </button>
                  <button
                    onClick={() => { changeLanguage("en"); setMobileLangDropdownOpen(false); }}
                    className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-2 cursor-pointer ${
                      locale === "en" ? "text-primary dark:text-secondary bg-primary/5 dark:bg-secondary/5" : "text-slate-700 dark:text-slate-350"
                    }`}
                  >
                    <span>🇺🇸</span> EN
                  </button>
                  <button
                    onClick={() => { changeLanguage("vi"); setMobileLangDropdownOpen(false); }}
                    className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-2 cursor-pointer ${
                      locale === "vi" ? "text-primary dark:text-secondary bg-primary/5 dark:bg-secondary/5" : "text-slate-700 dark:text-slate-350"
                    }`}
                  >
                    <span>🇻🇳</span> VI
                  </button>
                </div>
              </>
            )}
          </div>

          {mounted && isLoggedIn && (
            <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full dark:bg-slate-800 dark:text-slate-300">
              {user?.role ? user.role.toUpperCase() : "FREE"}
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
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-bold text-slate-600 hover:text-primary dark:text-slate-300 py-1"
          >
            {t.header.search}
          </LocaleLink>
          <LocaleLink 
            href="/directory" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-bold text-slate-600 hover:text-primary dark:text-slate-300 py-1"
          >
            {t.header.directory}
          </LocaleLink>
          <LocaleLink 
            href="/pricing" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-bold text-slate-600 hover:text-primary dark:text-slate-300 py-1"
          >
            {t.header.pricing}
          </LocaleLink>
          <LocaleLink 
            href="/blog" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-bold text-slate-600 hover:text-primary dark:text-slate-300 py-1"
          >
            {t.header.blog}
          </LocaleLink>
          {isLoggedIn && (
            <LocaleLink 
              href="/dashboard" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-slate-600 hover:text-primary dark:text-slate-300 py-1"
            >
              {t.header.abmShort}
            </LocaleLink>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
            {!mounted ? null : isLoggedIn ? (
              <>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-slate-800 dark:text-white block mb-0.5">{t.header.welcome.replace("{name}", user?.name || "")}</span>
                  <span>{user?.email}</span>
                </div>
                <LocaleLink
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm block"
                >
                  {t.header.mypage}
                </LocaleLink>
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 text-center text-xs font-bold text-slate-600 hover:text-slate-850 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-xl"
                >
                  {t.header.logout}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setAuthModalOpen(true); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 text-center text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl"
                >
                  {t.header.login}
                </button>
                <button
                  onClick={() => { setAuthModalOpen(true); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 text-center text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md"
                >
                  {t.header.register}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
