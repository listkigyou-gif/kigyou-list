"use client";

import React from "react";
import Link from "next/link";
import { Send, Download, Sparkles, Building2, ArrowRight } from "lucide-react";
import { trackFormMarketingClick, trackCsvDownloadClick } from "@/lib/gtag";

interface CompanyConversionBarProps {
  corporateNumber: string;
  companyName: string;
  prefectureName?: string | null;
  industryName?: string | null;
  locale: string;
}

export const CompanyConversionBar: React.FC<CompanyConversionBarProps> = ({
  corporateNumber,
  companyName,
  prefectureName,
  industryName,
  locale,
}) => {
  const isJa = locale === "ja";
  const isVi = locale === "vi";

  const targetCategory = industryName && prefectureName
    ? `${prefectureName} × ${industryName}`
    : prefectureName || industryName || (isJa ? "同業種" : isVi ? "cùng ngành" : "same industry");

  return (
    <div className="bg-gradient-to-r from-[#1B4F8A]/5 via-indigo-50/50 to-blue-50/40 dark:from-blue-950/20 dark:via-slate-900/40 dark:to-slate-800/20 border border-blue-200/80 dark:border-blue-900/40 rounded-xl p-4 sm:p-4.5 shadow-2xs">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Left Side: Value Proposition */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#1B4F8A] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider">
                {isJa ? "B2B営業・アプローチ支援" : isVi ? "Giải pháp tiếp cận B2B" : "B2B Sales & Outreach"}
              </span>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full">
                {targetCategory}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              {isJa 
                ? `${companyName}へのアプローチ、または関連企業リストの取得が可能です`
                : isVi 
                ? `Tiếp cận doanh nghiệp ${companyName} hoặc tải danh sách công ty tương tự`
                : `Outreach to ${companyName} or acquire targeted lookalike company datasets`}
            </p>
          </div>
        </div>

        {/* Right Side: Dual High-Intent CTAs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
          {/* CTA 1: Form DM Marketing */}
          <Link
            href={`/${locale}/form-marketing?target=${corporateNumber}`}
            onClick={() => trackFormMarketingClick("company_detail_bar", corporateNumber)}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold shadow-xs transition-all active:scale-[0.98] whitespace-nowrap cursor-pointer group"
          >
            <Send className="w-3.5 h-3.5 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
            <span>
              {isJa ? "この企業に問い合わせ代行" : isVi ? "Gửi chào hàng tự động" : "Form Outreach"}
            </span>
            <ArrowRight className="w-3 h-3 text-blue-200/80" />
          </Link>

          {/* CTA 2: CSV Dataset Download */}
          <Link
            href={`/${locale}/pricing`}
            onClick={() => trackCsvDownloadClick("company_detail_bar")}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700 text-xs font-bold shadow-2xs transition-all active:scale-[0.98] whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>
              {isJa ? "同業・地域リスト一括CSV" : isVi ? "Tải CSV danh sách cùng ngành" : "Download Lookalikes CSV"}
            </span>
          </Link>
        </div>

      </div>
    </div>
  );
};
