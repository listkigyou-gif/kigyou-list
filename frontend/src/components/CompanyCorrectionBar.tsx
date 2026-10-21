"use client";

import React from "react";
import { FileEdit, ShieldAlert, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface CompanyCorrectionBarProps {
  corporateNumber: string;
  companyName: string;
}

export const CompanyCorrectionBar: React.FC<CompanyCorrectionBarProps> = ({
  corporateNumber,
  companyName
}) => {
  const { locale } = useLanguage();
  const isJa = locale === "ja";
  const isVi = locale === "vi";

  const handleOpenCorrection = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-company-correction-modal"));
    }
  };

  return (
    <div className="mt-4 pt-3.5 border-t border-slate-150 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50/60 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
      <div className="flex items-start sm:items-center gap-2 text-slate-600 dark:text-slate-400">
        <FileEdit className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400 shrink-0 mt-0.5 sm:mt-0" />
        <span className="leading-snug">
          {isJa 
            ? "掲載情報の誤り修正・最新情報の追加、または掲載停止の申請はこちら" 
            : isVi 
            ? "Yêu cầu chỉnh sửa thông tin bị sai, bổ sung dữ liệu mới hoặc gỡ bỏ thông tin" 
            : "Request information correction, add latest data, or request delisting"}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleOpenCorrection}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1B4F8A] bg-white hover:bg-blue-50/60 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-750 border border-[#1B4F8A]/30 dark:border-blue-700/50 rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <span>{isJa ? "掲載情報の修正・追加を申請" : isVi ? "Yêu cầu sửa / Bổ sung" : "Suggest Correction"}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
