"use client";

import React from "react";
import { ShieldCheck, Sparkles, ArrowRight, Edit3 } from "lucide-react";

interface CompanyPRSectionProps {
  corporateNumber: string;
  isClaimed: boolean;
  prTitle?: string | null;
  prMessage?: string | null;
  locale: string;
}

export const CompanyPRSection: React.FC<CompanyPRSectionProps> = ({
  corporateNumber,
  isClaimed,
  prTitle,
  prMessage,
  locale,
}) => {
  const isEn = locale === "en";
  const isVi = locale === "vi";

  const handleOpenClaimModal = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-company-claim-modal"));
    }
  };

  // State 1: When official PR message has been published
  if (prMessage && prMessage.trim()) {
    return (
      <div className="mb-5 p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#1C2128]/50 border border-emerald-200/80 dark:border-emerald-900/60 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2.5 border-b border-emerald-200/60 dark:border-emerald-900/40">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {prTitle?.trim() || (isEn ? "Official Company Message" : isVi ? "Thông điệp chính thức từ Doanh nghiệp" : "企業公式メッセージ")}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {isEn ? "Official Company PR" : isVi ? "Doanh nghiệp chính thức" : "企業公式PR"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleOpenClaimModal}
            className="text-[11px] font-medium text-[#1B4F8A] hover:underline dark:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
            title={isEn ? "Edit official PR and info" : isVi ? "Chỉnh sửa thông điệp PR" : "公式PR・企業情報を編集"}
          >
            <Edit3 className="w-3 h-3" />
            <span>{isEn ? "Edit" : isVi ? "Chỉnh sửa" : "編集する"}</span>
          </button>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-normal">
          {prMessage}
        </p>
        <div className="mt-3 pt-2 text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <span>※ {isEn ? "This information is published and managed directly by the company representative." : isVi ? "Thông điệp này được đăng tải và quản trị trực tiếp bởi đại diện chính thức của doanh nghiệp." : "この情報は企業公式担当者によって直接発信・管理されています。"}</span>
        </div>
      </div>
    );
  }

  // When no official PR message exists, stay clean and do not inject placeholder marketing boxes
  return null;
};
