"use client";

import React from "react";
import { LogoIcon } from "./LogoIcon";
import { useLanguage } from "@/context/LanguageContext";
import { LocaleLink } from "./LocaleLink";

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer data-nosnippet className="bg-white border-t border-slate-200 dark:bg-[#0D1117] dark:border-slate-800 py-10 transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
        <LocaleLink href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <LogoIcon className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white">Kigyou<span className="text-secondary">-list</span></span>
        </LocaleLink>

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2.5 sm:gap-6 text-xs font-semibold">
          <LocaleLink href="/directory" className="hover:text-primary dark:hover:text-secondary transition-colors">
            {t.footer.directory}
          </LocaleLink>
          <LocaleLink href="/pricing" className="hover:text-primary dark:hover:text-secondary transition-colors">
            {t.footer.pricing}
          </LocaleLink>
          <LocaleLink href="/blog" className="hover:text-primary dark:hover:text-secondary transition-colors">
            {t.footer.blog}
          </LocaleLink>
          <LocaleLink href="/terms" className="hover:text-primary dark:hover:text-secondary transition-colors">
            {t.footer.terms}
          </LocaleLink>
          <LocaleLink href="/tokushoho" className="hover:text-primary dark:hover:text-secondary transition-colors">
            {t.footer.tokushoho}
          </LocaleLink>
          <LocaleLink href="/privacy" className="hover:text-primary dark:hover:text-secondary transition-colors">
            {t.footer.privacy}
          </LocaleLink>
          <LocaleLink href="/contact" className="hover:text-primary dark:hover:text-secondary transition-colors">
            {t.footer.contact}
          </LocaleLink>
        </div>

        <div className="text-[11px]">
          &copy; 2022 - {new Date().getFullYear()} Kigyou-list. {t.footer.rights}
        </div>
      </div>
    </footer>
  );
};
