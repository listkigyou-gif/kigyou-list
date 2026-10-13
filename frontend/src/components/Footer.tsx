"use client";

import React from "react";
import { LogoIcon } from "./LogoIcon";
import { useLanguage } from "@/context/LanguageContext";
import { LocaleLink } from "./LocaleLink";

const socialChannels = [
  {
    name: "X (Twitter)",
    handle: "@kigyoulist",
    href: "https://x.com/kigyoulist",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "Note.com",
    handle: "kigyoulist",
    href: "https://note.com/kigyoulist",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.5 2H4.5A2.5 2.5 0 002 4.5v15A2.5 2.5 0 004.5 22h15a2.5 2.5 0 002.5-2.5v-15A2.5 2.5 0 0019.5 2zm-4.7 14.8h-2.3l-4-6.6v6.6H6.2V7.2h2.3l4 6.6V7.2h2.3v9.6z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    handle: "userkigyoulist",
    href: "https://www.linkedin.com/in/userkigyoulist",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    handle: "kigyoulist",
    href: "https://www.facebook.com/kigyoulist",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95C18.05 21.45 22 17.19 22 12z" />
      </svg>
    ),
  },
  {
    name: "Qiita",
    handle: "@listkigyou",
    href: "https://qiita.com/listkigyou",
    icon: (
      <span className="text-[9px] font-black tracking-tighter leading-none">Qiita</span>
    ),
  },
  {
    name: "Zenn",
    handle: "@kigyoulist",
    href: "https://zenn.dev/kigyoulist",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.5 4h19a.5.5 0 0 1 .5.5v1.2a.5.5 0 0 1-.18.39L6.5 18.5H21a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H2.5a.5.5 0 0 1-.5-.5v-1.2a.5.5 0 0 1 .18-.39L17.5 5.5H3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5z"/>
      </svg>
    ),
  },
];

export const Footer: React.FC = () => {
  const { t, locale } = useLanguage();

  return (
    <footer data-nosnippet className="bg-white border-t border-slate-200 dark:bg-[#0D1117] dark:border-slate-800 py-10 transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-sm text-slate-500">
        {/* Top bar: Brand + Official Channels */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <LocaleLink href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#1B4F8A] flex items-center justify-center shadow-xs shrink-0">
                <LogoIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white tracking-tight">
                Kigyou<span className="text-[#1B4F8A] dark:text-blue-400">-list</span>
              </span>
            </LocaleLink>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {locale === "en"
                ? "Japan's Largest B2B Corporate Database"
                : locale === "vi"
                ? "Cơ sở dữ liệu 5 triệu doanh nghiệp Nhật Bản"
                : "国内最大級500万件の法人オープンデータ基盤"}
            </span>
          </div>

          {/* Social / Official Channels */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mr-1 hidden sm:inline">
              Official Channels:
            </span>
            <div className="flex items-center gap-1.5">
              {socialChannels.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${item.name} (${item.handle})`}
                  aria-label={`${item.name} - ${item.handle}`}
                  className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-[#1B4F8A] hover:border-[#1B4F8A] dark:hover:text-blue-400 dark:hover:border-blue-400/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all duration-150 shadow-2xs"
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Middle: Navigation Links */}
        <div className="flex flex-wrap justify-center md:justify-between items-center gap-x-4 gap-y-2.5 sm:gap-6 text-xs font-medium text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2.5 sm:gap-6">
            <LocaleLink href="/directory" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
              {t.footer.directory}
            </LocaleLink>
            <LocaleLink href="/compare" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
              {locale === "en" ? "Comparison" : locale === "vi" ? "So sánh dịch vụ" : "他社比較・選ばれる理由"}
            </LocaleLink>
            <LocaleLink href="/pricing" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
              {t.footer.pricing}
            </LocaleLink>
            <LocaleLink href="/form-marketing" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
              {t.header.formDm}
            </LocaleLink>
            <LocaleLink href="/developer" className="hover:text-[#1B4F8A] dark:hover:text-cyan-400 text-cyan-600 dark:text-cyan-400 font-bold transition-colors">
              {locale === "en" ? "Developers / API" : locale === "vi" ? "Dành cho AI / API" : "開発者・API / AI基盤"}
            </LocaleLink>
            <LocaleLink href="/terms" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
              {t.footer.terms}
            </LocaleLink>
            <LocaleLink href="/tokushoho" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
              {t.footer.tokushoho}
            </LocaleLink>
            <LocaleLink href="/privacy" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
              {t.footer.privacy}
            </LocaleLink>
            <LocaleLink href="/contact" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
              {t.footer.contact}
            </LocaleLink>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            &copy; 2022 - {new Date().getFullYear()} Kigyou-list. {t.footer.rights}
          </div>
        </div>
      </div>
    </footer>
  );
};
